package com.gramconnect.config;

import com.gramconnect.entity.User;
import com.gramconnect.entity.UserRole;
import com.gramconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@gramconnect.gov.in}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // 1. Seed Initial Administrator if none exists
        if (userRepository.countByRole(UserRole.ADMIN) == 0) {
            User admin = new User(
                "Panchayat Administrator",
                adminEmail,
                passwordEncoder.encode(adminPassword),
                "9000000001",
                "Central Panchayat Office",
                UserRole.ADMIN
            );
            userRepository.save(admin);
            System.out.println(">>> Initial Administrator created: " + adminEmail);
        }

        // 2. Seed Demo Worker if none exists
        if (userRepository.countByRole(UserRole.WORKER) == 0) {
            User worker = new User(
                "Ramesh Kumar (Field Technician)",
                "worker@gramconnect.gov.in",
                passwordEncoder.encode("Worker@123"),
                "9876543210",
                "East Colony, Janagaon",
                UserRole.WORKER
            );
            userRepository.save(worker);
            System.out.println(">>> Demo Worker account created: worker@gramconnect.gov.in");
        }

        // 3. Seed Demo Villager if none exists
        if (userRepository.countByRole(UserRole.VILLAGER) == 0) {
            User villager = new User(
                "Suresh Patel (Resident)",
                "villager@gramconnect.gov.in",
                passwordEncoder.encode("User@123"),
                "9876543211",
                "Janagaon",
                UserRole.VILLAGER
            );
            userRepository.save(villager);
            System.out.println(">>> Demo Villager account created: villager@gramconnect.gov.in");
        }
    }
}
