package com.gramconnect.controller;

import com.gramconnect.entity.User;
import com.gramconnect.entity.UserRole;
import com.gramconnect.repository.UserRepository;
import com.gramconnect.security.CustomUserDetails;
import com.gramconnect.security.JwtUtils;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An account with this email already exists.");
        }

        // Public registration always assigns VILLAGER role for security
        User user = new User(
                request.name().trim(),
                email,
                passwordEncoder.encode(request.password()),
                request.phone() != null ? request.phone().trim() : null,
                request.village() != null ? request.village().trim() : null,
                UserRole.VILLAGER
        );

        User savedUser = userRepository.save(user);
        String token = jwtUtils.generateToken(savedUser);

        return new AuthResponse(token, UserProfileDto.fromUser(savedUser));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        String email = request.email().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account is inactive. Please contact the administrator.");
        }

        // Validate portal role isolation if specified
        if (request.requiredRole() != null && !request.requiredRole().isBlank()) {
            String expected = request.requiredRole().trim().toUpperCase();
            if (!user.getRole().name().equals(expected)) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Role mismatch: This account is registered as " + user.getRole().name() +
                        ". Please use the " + user.getRole().name() + " login portal."
                );
            }
        }

        String token = jwtUtils.generateToken(user);
        return new AuthResponse(token, UserProfileDto.fromUser(user));
    }

    @GetMapping("/me")
    public UserProfileDto getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        User user = userDetails.getUser();
        return UserProfileDto.fromUser(user);
    }

    // DTOs
    public record RegisterRequest(
            @NotBlank(message = "Name is required") @Size(max = 100) String name,
            @NotBlank(message = "Email is required") @Email(message = "Invalid email format") String email,
            @NotBlank(message = "Password is required") @Size(min = 6, message = "Password must be at least 6 characters") String password,
            String phone,
            String village
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required") String email,
            @NotBlank(message = "Password is required") String password,
            String requiredRole
    ) {}

    public record UserProfileDto(
            Long id,
            String name,
            String email,
            String phone,
            String village,
            String role,
            boolean active
    ) {
        public static UserProfileDto fromUser(User user) {
            return new UserProfileDto(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getPhone(),
                    user.getVillage(),
                    user.getRole().name(),
                    user.isActive()
            );
        }
    }

    public record AuthResponse(
            String token,
            UserProfileDto user
    ) {}
}
