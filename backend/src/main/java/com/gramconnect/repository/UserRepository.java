package com.gramconnect.repository;

import com.gramconnect.entity.User;
import com.gramconnect.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRoleOrderByCreatedAtDesc(UserRole role);
    List<User> findByRoleAndActiveTrueOrderByNameAsc(UserRole role);
    long countByRole(UserRole role);
}
