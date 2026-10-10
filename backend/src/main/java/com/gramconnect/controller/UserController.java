package com.gramconnect.controller;

import com.gramconnect.controller.AuthController.UserProfileDto;
import com.gramconnect.entity.Complaint;
import com.gramconnect.entity.ComplaintStatus;
import com.gramconnect.entity.User;
import com.gramconnect.entity.UserRole;
import com.gramconnect.repository.ComplaintRepository;
import com.gramconnect.repository.UserRepository;
import com.gramconnect.security.CustomUserDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, ComplaintRepository complaintRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.complaintRepository = complaintRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails.getUser();
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserProfileDto> listUsers() {
        return userRepository.findByRoleOrderByCreatedAtDesc(UserRole.VILLAGER)
                .stream()
                .map(UserProfileDto::fromUser)
                .toList();
    }

    @GetMapping("/workers")
    public List<WorkerWithWorkloadDto> listWorkers() {
        // Returns active workers along with their active workload count
        return userRepository.findByRoleOrderByCreatedAtDesc(UserRole.WORKER)
                .stream()
                .map(w -> {
                    long activeCount = complaintRepository.countByWorkerIdAndStatus(w.getId(), ComplaintStatus.ASSIGNED)
                            + complaintRepository.countByWorkerIdAndStatus(w.getId(), ComplaintStatus.IN_PROGRESS)
                            + complaintRepository.countByWorkerIdAndStatus(w.getId(), ComplaintStatus.AWAITING_VERIFICATION);
                    long totalCount = complaintRepository.countByWorkerId(w.getId());
                    return new WorkerWithWorkloadDto(
                            w.getId(),
                            w.getName(),
                            w.getEmail(),
                            w.getPhone(),
                            w.getVillage(),
                            w.getRole().name(),
                            w.isActive(),
                            activeCount,
                            totalCount
                    );
                })
                .toList();
    }

    @GetMapping("/workers/{id}/assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'WORKER')")
    public List<Complaint> getWorkerAssignmentsById(@PathVariable Long id) {
        User currentUser = getAuthenticatedUser();
        if (currentUser.getRole() == UserRole.WORKER && !currentUser.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return complaintRepository.findByWorkerIdOrderByCreatedAtDesc(id);
    }

    @GetMapping("/worker/assignments")
    @PreAuthorize("hasAnyRole('WORKER', 'ADMIN')")
    public List<Complaint> getCurrentWorkerAssignments() {
        User currentUser = getAuthenticatedUser();
        return complaintRepository.findByWorkerIdOrderByCreatedAtDesc(currentUser.getId());
    }

    @PostMapping("/workers")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public UserProfileDto createWorker(@Valid @RequestBody CreateWorkerRequest request) {
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already registered.");
        }

        User worker = new User(
                request.name().trim(),
                email,
                passwordEncoder.encode(request.password()),
                request.phone() != null ? request.phone().trim() : null,
                request.village() != null ? request.village().trim() : null,
                UserRole.WORKER
        );

        User saved = userRepository.save(worker);
        return UserProfileDto.fromUser(saved);
    }

    @PatchMapping("/workers/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public UserProfileDto toggleWorkerStatus(@PathVariable Long id, @RequestBody ToggleStatusRequest request) {
        User worker = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker not found"));

        if (worker.getRole() != UserRole.WORKER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a worker");
        }

        worker.setActive(request.active());
        User updated = userRepository.save(worker);
        return UserProfileDto.fromUser(updated);
    }

    public record WorkerWithWorkloadDto(
            Long id,
            String name,
            String email,
            String phone,
            String village,
            String role,
            boolean active,
            long activeTasks,
            long totalTasks
    ) {}

    public record CreateWorkerRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            String phone,
            String village
    ) {}

    public record ToggleStatusRequest(
            boolean active
    ) {}
}
