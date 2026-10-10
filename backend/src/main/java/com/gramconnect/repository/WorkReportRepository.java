package com.gramconnect.repository;

import com.gramconnect.entity.WorkReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkReportRepository extends JpaRepository<WorkReport, Long> {

    List<WorkReport> findByComplaintIdOrderBySubmittedAtDesc(Long complaintId);

    List<WorkReport> findByReviewDecisionOrderBySubmittedAtDesc(String reviewDecision);

    List<WorkReport> findByWorkerIdOrderBySubmittedAtDesc(Long workerId);

    long countByReviewDecision(String reviewDecision);
}
