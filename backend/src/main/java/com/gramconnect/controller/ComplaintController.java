package com.gramconnect.controller;

import com.gramconnect.entity.*;
import com.gramconnect.repository.ComplaintHistoryRepository;
import com.gramconnect.repository.ComplaintRepository;
import com.gramconnect.repository.UserRepository;
import com.gramconnect.repository.WorkReportRepository;
import com.gramconnect.security.CustomUserDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@Validated
public class ComplaintController {

    private final ComplaintRepository repository;
    private final UserRepository userRepository;
    private final WorkReportRepository workReportRepository;
    private final ComplaintHistoryRepository historyRepository;

    public ComplaintController(
            ComplaintRepository repository,
            UserRepository userRepository,
            WorkReportRepository workReportRepository,
            ComplaintHistoryRepository historyRepository
    ) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.workReportRepository = workReportRepository;
        this.historyRepository = historyRepository;
    }

    private User getAuthenticatedUserOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails.getUser();
        }
        return null;
    }

    private User getAuthenticatedUser() {
        User user = getAuthenticatedUserOrNull();
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return user;
    }

    // 1. List complaints (Admin sees all; Worker sees assigned; Villager sees theirs)
    @GetMapping
    public List<Complaint> list(@RequestParam(required = false, defaultValue = "false") boolean all) {
        User currentUser = getAuthenticatedUserOrNull();

        if (currentUser == null || all || currentUser.getRole() == UserRole.ADMIN) {
            return repository.findAllByOrderByCreatedAtDesc();
        }

        if (currentUser.getRole() == UserRole.WORKER) {
            return repository.findByWorkerIdOrderByCreatedAtDesc(currentUser.getId());
        }

        // VILLAGER role sees only their complaints
        return repository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
    }

    // 2. Villager gets their own complaints explicitly
    @GetMapping("/mine")
    public List<Complaint> getMyComplaints() {
        User currentUser = getAuthenticatedUser();
        return repository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
    }

    // 3. Overall / Scoped Statistics
    @GetMapping("/stats")
    public Map<String, Object> getStats(@RequestParam(required = false, defaultValue = "false") boolean global) {
        User currentUser = getAuthenticatedUserOrNull();
        Map<String, Object> stats = new LinkedHashMap<>();

        if (currentUser == null || global || currentUser.getRole() == UserRole.ADMIN) {
            long total = repository.count();
            long pending = repository.countByStatus(ComplaintStatus.PENDING);
            long assigned = repository.countByStatus(ComplaintStatus.ASSIGNED);
            long inProgress = repository.countByStatus(ComplaintStatus.IN_PROGRESS);
            long awaitingVerification = repository.countByStatus(ComplaintStatus.AWAITING_VERIFICATION);
            long resolved = repository.countByStatus(ComplaintStatus.RESOLVED);
            long closed = repository.countByStatus(ComplaintStatus.CLOSED);

            stats.put("total", total);
            stats.put("pending", pending);
            stats.put("assigned", assigned);
            stats.put("inProgress", inProgress);
            stats.put("awaitingVerification", awaitingVerification);
            stats.put("resolved", resolved);
            stats.put("closed", closed);
            return stats;
        }

        if (currentUser.getRole() == UserRole.WORKER) {
            Long workerId = currentUser.getId();
            long total = repository.countByWorkerId(workerId);
            long assigned = repository.countByWorkerIdAndStatus(workerId, ComplaintStatus.ASSIGNED);
            long inProgress = repository.countByWorkerIdAndStatus(workerId, ComplaintStatus.IN_PROGRESS);
            long awaitingVerification = repository.countByWorkerIdAndStatus(workerId, ComplaintStatus.AWAITING_VERIFICATION);
            long resolved = repository.countByWorkerIdAndStatus(workerId, ComplaintStatus.RESOLVED);
            long closed = repository.countByWorkerIdAndStatus(workerId, ComplaintStatus.CLOSED);

            stats.put("total", total);
            stats.put("pending", 0);
            stats.put("assigned", assigned);
            stats.put("inProgress", inProgress);
            stats.put("awaitingVerification", awaitingVerification);
            stats.put("resolved", resolved);
            stats.put("closed", closed);
            return stats;
        }

        // Villager
        Long userId = currentUser.getId();
        long total = repository.countByUserId(userId);
        long pending = repository.countByUserIdAndStatus(userId, ComplaintStatus.PENDING);
        long assigned = repository.countByUserIdAndStatus(userId, ComplaintStatus.ASSIGNED);
        long inProgress = repository.countByUserIdAndStatus(userId, ComplaintStatus.IN_PROGRESS);
        long awaitingVerification = repository.countByUserIdAndStatus(userId, ComplaintStatus.AWAITING_VERIFICATION);
        long resolved = repository.countByUserIdAndStatus(userId, ComplaintStatus.RESOLVED);
        long closed = repository.countByUserIdAndStatus(userId, ComplaintStatus.CLOSED);

        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("assigned", assigned);
        stats.put("inProgress", inProgress);
        stats.put("awaitingVerification", awaitingVerification);
        stats.put("resolved", resolved);
        stats.put("closed", closed);
        return stats;
    }

    // 4. Get complaint by ID
    @GetMapping("/{id}")
    public Complaint get(@PathVariable Long id) {
        Complaint complaint = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Complaint with ID " + id + " not found"
                ));

        User currentUser = getAuthenticatedUserOrNull();
        if (currentUser != null) {
            if (currentUser.getRole() == UserRole.WORKER) {
                if (complaint.getWorker() == null || !complaint.getWorker().getId().equals(currentUser.getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: task not assigned to you");
                }
            } else if (currentUser.getRole() == UserRole.VILLAGER) {
                if (complaint.getUser() != null && !complaint.getUser().getId().equals(currentUser.getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: you cannot view another villager's private complaint");
                }
            }
        }

        return complaint;
    }

    // 5. Create a new complaint (Villager)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Complaint create(@Valid @RequestBody CreateComplaintRequest request) {
        ComplaintPriority priority = ComplaintPriority.fromString(request.priority());
        Complaint complaint = new Complaint(
                request.title().trim(),
                request.description().trim(),
                request.category().trim(),
                request.location() != null ? request.location().trim() : null,
                priority
        );

        User currentUser = getAuthenticatedUserOrNull();
        if (currentUser != null) {
            complaint.setUser(currentUser);
        }

        Complaint saved = repository.save(complaint);

        // Record history entry
        String submitterName = currentUser != null ? currentUser.getName() : "Resident";
        historyRepository.save(new ComplaintHistory(
                saved,
                null,
                ComplaintStatus.PENDING.name(),
                currentUser != null ? currentUser.getId() : null,
                submitterName,
                "Complaint filed by " + submitterName + " with priority " + saved.getPriority()
        ));

        return saved;
    }

    // 6. Assign or Reassign worker (Admin) - Supports both POST and PATCH
    @RequestMapping(value = "/{id}/assign", method = {RequestMethod.POST, RequestMethod.PATCH})
    public Complaint assignWorker(@PathVariable Long id, @Valid @RequestBody AssignWorkerRequest request) {
        User admin = getAuthenticatedUser();
        if (admin.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators can assign complaints");
        }

        Complaint complaint = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found"));

        User worker = userRepository.findById(request.workerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worker not found"));

        if (worker.getRole() != UserRole.WORKER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected user is not a worker");
        }

        String previousStatus = complaint.getStatus().name();
        complaint.setWorker(worker);
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        complaint.setAssignedAt(LocalDateTime.now());
        if (request.instructions() != null && !request.instructions().isBlank()) {
            complaint.setAdminInstructions(request.instructions().trim());
        }
        if (request.deadline() != null) {
            complaint.setDeadline(request.deadline());
        }

        Complaint saved = repository.save(complaint);

        // Record history
        String remarks = "Assigned to worker " + worker.getName() + " by Admin (" + admin.getName() + ").";
        if (request.instructions() != null && !request.instructions().isBlank()) {
            remarks += " Instructions: " + request.instructions().trim();
        }
        historyRepository.save(new ComplaintHistory(
                saved,
                previousStatus,
                ComplaintStatus.ASSIGNED.name(),
                admin.getId(),
                admin.getName(),
                remarks
        ));

        return saved;
    }

    // 7. Worker records progress update
    @PostMapping("/{id}/progress")
    public WorkReport addProgress(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User worker = getAuthenticatedUser();
        if (worker.getRole() != UserRole.WORKER && worker.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the assigned worker or admin can post progress updates");
        }

        Complaint complaint = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (worker.getRole() == UserRole.WORKER) {
            if (complaint.getWorker() == null || !complaint.getWorker().getId().equals(worker.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: task not assigned to you");
            }
        }

        String notes = body.get("notes");
        if (notes == null || notes.isBlank()) {
            notes = body.get("workDescription");
        }
        if (notes == null || notes.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Progress notes are required");
        }

        String previousStatus = complaint.getStatus().name();
        // If still in ASSIGNED, advance to IN_PROGRESS
        if (complaint.getStatus() == ComplaintStatus.ASSIGNED) {
            complaint.setStatus(ComplaintStatus.IN_PROGRESS);
            repository.save(complaint);
        }

        WorkReport report = new WorkReport(
                complaint,
                complaint.getWorker() != null ? complaint.getWorker() : worker,
                "PROGRESS",
                notes.trim(),
                body.get("materialsUsed"),
                body.get("remarks"),
                body.get("proofDetails")
        );
        report.setReviewDecision("APPROVED");
        WorkReport savedReport = workReportRepository.save(report);

        // Record history
        historyRepository.save(new ComplaintHistory(
                complaint,
                previousStatus,
                complaint.getStatus().name(),
                worker.getId(),
                worker.getName(),
                "Progress update: " + notes.trim()
        ));

        return savedReport;
    }

    // 8. Worker submits Final Completion Report -> Status becomes AWAITING_VERIFICATION
    @PostMapping("/{id}/completion-report")
    public WorkReport submitCompletionReport(
            @PathVariable Long id,
            @Valid @RequestBody CompletionReportRequest request
    ) {
        User worker = getAuthenticatedUser();
        if (worker.getRole() != UserRole.WORKER && worker.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the assigned worker can submit completion reports");
        }

        Complaint complaint = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found"));

        if (worker.getRole() == UserRole.WORKER) {
            if (complaint.getWorker() == null || !complaint.getWorker().getId().equals(worker.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: task not assigned to you");
            }
        }

        String previousStatus = complaint.getStatus().name();

        // Save work report
        WorkReport report = new WorkReport(
                complaint,
                complaint.getWorker() != null ? complaint.getWorker() : worker,
                "COMPLETION",
                request.workDescription().trim(),
                request.materialsUsed() != null ? request.materialsUsed().trim() : null,
                request.remarks() != null ? request.remarks().trim() : null,
                request.proofDetails() != null ? request.proofDetails().trim() : null
        );
        report.setReviewDecision("PENDING");
        WorkReport savedReport = workReportRepository.save(report);

        // Transition complaint status to AWAITING_VERIFICATION
        complaint.setStatus(ComplaintStatus.AWAITING_VERIFICATION);
        complaint.setResolutionNotes(request.workDescription().trim());
        repository.save(complaint);

        // Record history
        String historyRemarks = "Work completion report submitted by " + worker.getName() + ". Sent to Admin for verification.";
        historyRepository.save(new ComplaintHistory(
                complaint,
                previousStatus,
                ComplaintStatus.AWAITING_VERIFICATION.name(),
                worker.getId(),
                worker.getName(),
                historyRemarks
        ));

        return savedReport;
    }

    // 9. Update complaint status
    @PatchMapping("/{id}/status")
    public Complaint updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request
    ) {
        Complaint complaint = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Complaint with ID " + id + " not found"
                ));

        User currentUser = getAuthenticatedUser();
        if (currentUser.getRole() == UserRole.WORKER) {
            if (complaint.getWorker() == null || !complaint.getWorker().getId().equals(currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update tasks assigned to your account.");
            }
        }

        ComplaintStatus newStatus;
        try {
            String normalizedStatus = request.status().trim().toUpperCase().replace(" ", "_");
            newStatus = ComplaintStatus.valueOf(normalizedStatus);
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid complaint status: " + request.status());
        }

        String previousStatus = complaint.getStatus().name();
        complaint.setStatus(newStatus);

        if (request.resolutionNotes() != null && !request.resolutionNotes().isBlank()) {
            complaint.setResolutionNotes(request.resolutionNotes().trim());
        }

        if (newStatus == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(LocalDateTime.now());
        }

        Complaint saved = repository.save(complaint);

        // Record history
        String remarks = "Status transitioned to " + newStatus.name();
        if (request.resolutionNotes() != null && !request.resolutionNotes().isBlank()) {
            remarks += ". Notes: " + request.resolutionNotes().trim();
        }
        historyRepository.save(new ComplaintHistory(
                saved,
                previousStatus,
                newStatus.name(),
                currentUser.getId(),
                currentUser.getName(),
                remarks
        ));

        return saved;
    }

    // 10. Admin closes complaint after successful verification
    @PatchMapping("/{id}/close")
    public Complaint closeComplaint(@PathVariable Long id) {
        User admin = getAuthenticatedUser();
        if (admin.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can close complaints");
        }

        Complaint complaint = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found"));

        String previousStatus = complaint.getStatus().name();
        complaint.setStatus(ComplaintStatus.CLOSED);
        Complaint saved = repository.save(complaint);

        // Record history
        historyRepository.save(new ComplaintHistory(
                saved,
                previousStatus,
                ComplaintStatus.CLOSED.name(),
                admin.getId(),
                admin.getName(),
                "Complaint closed and finalized by Admin (" + admin.getName() + ")."
        ));

        return saved;
    }

    // 11. Get history timeline for a complaint
    @GetMapping("/{id}/history")
    public List<ComplaintHistory> getHistory(@PathVariable Long id) {
        return historyRepository.findByComplaintIdOrderByCreatedAtAsc(id);
    }

    // 12. Get work reports for a complaint
    @GetMapping("/{id}/reports")
    public List<WorkReport> getReports(@PathVariable Long id) {
        return workReportRepository.findByComplaintIdOrderBySubmittedAtDesc(id);
    }

    // Request DTOs
    public record CreateComplaintRequest(
            @NotBlank(message = "Title is required") @Size(max = 120) String title,
            @NotBlank(message = "Description is required") @Size(max = 2000) String description,
            @NotBlank(message = "Category is required") @Size(max = 60) String category,
            @Size(max = 200) String location,
            String priority
    ) {}

    public record AssignWorkerRequest(
            @NotNull(message = "Worker ID is required") Long workerId,
            String instructions,
            LocalDateTime deadline
    ) {}

    public record UpdateStatusRequest(
            @NotBlank(message = "Status is required") String status,
            String resolutionNotes
    ) {}

    public record CompletionReportRequest(
            @NotBlank(message = "Work description is required") @Size(max = 2000) String workDescription,
            @Size(max = 1000) String materialsUsed,
            @Size(max = 2000) String remarks,
            @Size(max = 2000) String proofDetails
    ) {}
}
