package com.gramconnect.repository;

import com.gramconnect.entity.Complaint;
import com.gramconnect.entity.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findAllByOrderByCreatedAtDesc();
    List<Complaint> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Complaint> findByWorkerIdOrderByCreatedAtDesc(Long workerId);
    List<Complaint> findByStatusOrderByCreatedAtDesc(ComplaintStatus status);

    long countByStatus(ComplaintStatus status);
    long countByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, ComplaintStatus status);
    long countByWorkerId(Long workerId);
    long countByWorkerIdAndStatus(Long workerId, ComplaintStatus status);
}