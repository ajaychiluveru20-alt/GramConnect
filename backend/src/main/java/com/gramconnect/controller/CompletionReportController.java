package com.gramconnect.controller;

import com.gramconnect.entity.*;
import com.gramconnect.repository.ComplaintHistoryRepository;
import com.gramconnect.repository.ComplaintRepository;
import com.gramconnect.repository.WorkReportRepository;
import com.gramconnect.security.CustomUserDetails;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CompletionReportController {

    private final WorkReportRepository workReportRepository;
    private final ComplaintRepository complaintRepository;
    private final ComplaintHistoryRepository historyRepository;

    public CompletionReportController(
            WorkReportRepository workReportRepository,
            ComplaintRepository complaintRepository,
            ComplaintHistoryRepository historyRepository
    ) {
        this.workReportRepository = workReportRepository;
        this.complaintRepository = complaintRepository;
        this.historyRepository = historyRepository;
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails.getUser();
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    // 1. Admin gets all completion reports (optionally filtered by decision, e.g., PENDING)
    @GetMapping("/admin/completion-reports")
    public List<WorkReport> getCompletionReports(@RequestParam(required = false) String decision) {
        User user = getAuthenticatedUser();
        if (user.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can review completion reports");
        }

        if (decision != null && !decision.isBlank()) {
            return workReportRepository.findByReviewDecisionOrderBySubmittedAtDesc(decision.trim().toUpperCase());
        }
        return workReportRepository.findAll();
    }

    // 2. Admin approves a completion report -> Complaint becomes RESOLVED
    @PostMapping("/completion-reports/{id}/approve")
    public WorkReport approveReport(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        User admin = getAuthenticatedUser();
        if (admin.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can approve completion reports");
        }

        WorkReport report = workReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Work report #" + id + " not found"));

        Complaint complaint = report.getComplaint();
        String previousStatus = complaint.getStatus().name();

        report.setReviewDecision("APPROVED");
        report.setReviewedAt(LocalDateTime.now());
        if (body != null && body.containsKey("adminComments") && !body.get("adminComments").isBlank()) {
            report.setAdminComments(body.get("adminComments").trim());
        }
        WorkReport savedReport = workReportRepository.save(report);

        // Transition complaint to RESOLVED
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolvedAt(LocalDateTime.now());
        complaint.setResolutionNotes(report.getWorkDescription());
        complaintRepository.save(complaint);

        // Record history
        String remarks = "Work completion report approved by Admin (" + admin.getName() + "). Task resolved successfully.";
        historyRepository.save(new ComplaintHistory(
                complaint,
                previousStatus,
                ComplaintStatus.RESOLVED.name(),
                admin.getId(),
                admin.getName(),
                remarks
        ));

        return savedReport;
    }

    // 3. Admin rejects a completion report -> Complaint returns to IN_PROGRESS
    @PostMapping("/completion-reports/{id}/reject")
    public WorkReport rejectReport(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User admin = getAuthenticatedUser();
        if (admin.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can reject completion reports");
        }

        String reason = body != null ? body.get("adminComments") : null;
        if (reason == null || reason.isBlank()) {
            reason = body != null ? body.get("reason") : null;
        }
        if (reason == null || reason.isBlank()) {
            reason = body != null ? body.get("comments") : null;
        }
        if (reason == null || reason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection reason / admin comments are required");
        }

        WorkReport report = workReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Work report #" + id + " not found"));

        Complaint complaint = report.getComplaint();
        String previousStatus = complaint.getStatus().name();

        report.setReviewDecision("REJECTED");
        report.setAdminComments(reason.trim());
        report.setReviewedAt(LocalDateTime.now());
        WorkReport savedReport = workReportRepository.save(report);

        // Return complaint to IN_PROGRESS so the worker can correct and resubmit
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        complaintRepository.save(complaint);

        // Record history
        String historyRemarks = "Completion report rejected by Admin (" + admin.getName() + "). Reason: " + reason.trim() + ". Task returned to IN_PROGRESS.";
        historyRepository.save(new ComplaintHistory(
                complaint,
                previousStatus,
                ComplaintStatus.IN_PROGRESS.name(),
                admin.getId(),
                admin.getName(),
                historyRemarks
        ));

        return savedReport;
    }

    // 4. Admin Dashboard Stats
    @GetMapping("/admin/dashboard/stats")
    public Map<String, Object> getAdminStats() {
        User admin = getAuthenticatedUser();
        if (admin.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", complaintRepository.count());
        stats.put("pending", complaintRepository.countByStatus(ComplaintStatus.PENDING));
        stats.put("assigned", complaintRepository.countByStatus(ComplaintStatus.ASSIGNED));
        stats.put("inProgress", complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS));
        stats.put("awaitingVerification", complaintRepository.countByStatus(ComplaintStatus.AWAITING_VERIFICATION));
        stats.put("resolved", complaintRepository.countByStatus(ComplaintStatus.RESOLVED));
        stats.put("closed", complaintRepository.countByStatus(ComplaintStatus.CLOSED));
        stats.put("pendingVerificationReports", workReportRepository.countByReviewDecision("PENDING"));

        return stats;
    }

    // 5. Worker Dashboard Stats
    @GetMapping("/worker/dashboard/stats")
    public Map<String, Object> getWorkerStats() {
        User worker = getAuthenticatedUser();
        if (worker.getRole() != UserRole.WORKER && worker.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Worker access required");
        }

        Long workerId = worker.getId();
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", complaintRepository.countByWorkerId(workerId));
        stats.put("assigned", complaintRepository.countByWorkerIdAndStatus(workerId, ComplaintStatus.ASSIGNED));
        stats.put("inProgress", complaintRepository.countByWorkerIdAndStatus(workerId, ComplaintStatus.IN_PROGRESS));
        stats.put("awaitingVerification", complaintRepository.countByWorkerIdAndStatus(workerId, ComplaintStatus.AWAITING_VERIFICATION));
        stats.put("resolved", complaintRepository.countByWorkerIdAndStatus(workerId, ComplaintStatus.RESOLVED));
        stats.put("closed", complaintRepository.countByWorkerIdAndStatus(workerId, ComplaintStatus.CLOSED));

        return stats;
    }
}
