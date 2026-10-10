package com.gramconnect.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "work_reports")
public class WorkReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "worker_id", nullable = false)
    private User worker;

    @Column(name = "report_type", nullable = false, length = 30)
    private String reportType = "COMPLETION"; // "PROGRESS" or "COMPLETION"

    @Column(name = "work_description", nullable = false, length = 2000)
    private String workDescription;

    @Column(name = "materials_used", length = 1000)
    private String materialsUsed;

    @Column(length = 2000)
    private String remarks;

    @Column(name = "proof_details", length = 2000)
    private String proofDetails;

    @Column(name = "review_decision", nullable = false, length = 30)
    private String reviewDecision = "PENDING"; // "PENDING", "APPROVED", "REJECTED"

    @Column(name = "admin_comments", length = 2000)
    private String adminComments;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    public WorkReport() {}

    public WorkReport(
        Complaint complaint,
        User worker,
        String reportType,
        String workDescription,
        String materialsUsed,
        String remarks,
        String proofDetails
    ) {
        this.complaint = complaint;
        this.worker = worker;
        this.reportType = reportType != null ? reportType : "COMPLETION";
        this.workDescription = workDescription;
        this.materialsUsed = materialsUsed;
        this.remarks = remarks;
        this.proofDetails = proofDetails;
        this.reviewDecision = "PENDING";
        this.submittedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public Complaint getComplaint() { return complaint; }
    public void setComplaint(Complaint complaint) { this.complaint = complaint; }

    public User getWorker() { return worker; }
    public void setWorker(User worker) { this.worker = worker; }

    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }

    public String getWorkDescription() { return workDescription; }
    public void setWorkDescription(String workDescription) { this.workDescription = workDescription; }

    public String getMaterialsUsed() { return materialsUsed; }
    public void setMaterialsUsed(String materialsUsed) { this.materialsUsed = materialsUsed; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getProofDetails() { return proofDetails; }
    public void setProofDetails(String proofDetails) { this.proofDetails = proofDetails; }

    public String getReviewDecision() { return reviewDecision; }
    public void setReviewDecision(String reviewDecision) { this.reviewDecision = reviewDecision; }

    public String getAdminComments() { return adminComments; }
    public void setAdminComments(String adminComments) { this.adminComments = adminComments; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
