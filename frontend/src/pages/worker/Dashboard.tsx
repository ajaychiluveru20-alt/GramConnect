import { useEffect, useState, useMemo } from "react";
import { 
  HardHat, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  MapPin, 
  Tag, 
  AlertCircle,
  PlayCircle,
  Search,
  Inbox,
  Calendar,
  X,
  Loader2,
  Check,
  ClipboardCheck,
  AlertTriangle,
  MessageSquarePlus,
  Send
} from "lucide-react";
import { 
  getComplaints, 
  updateComplaintStatus, 
  addProgress, 
  submitCompletionReport, 
  getComplaintReports 
} from "../../services/complaintService";
import type { Complaint, WorkReport } from "../../types/complaint";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../context/NotificationContext";

export default function WorkerDashboard() {
  const { user: currentWorker } = useAuth();
  const { t, translateCategory, translateStatus, translatePriority } = useLanguage();
  const { showToast, addNotification } = useNotifications();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [reportsMap, setReportsMap] = useState<Record<number, WorkReport[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Progress Note Modal State
  const [progressComplaint, setProgressComplaint] = useState<Complaint | null>(null);
  const [progressNoteText, setProgressNoteText] = useState("");
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);

  // Work Completion Report Modal State
  const [completionComplaint, setCompletionComplaint] = useState<Complaint | null>(null);
  const [workDescription, setWorkDescription] = useState("");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [remarks, setRemarks] = useState("");
  const [proofDetails, setProofDetails] = useState("");
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setAlertInfo(null);

    try {
      // Backend automatically scopes GET /api/complaints to current worker
      const data = await getComplaints();
      setComplaints(data);

      // Fetch reports for each complaint to show reviews / rejection feedback
      const reportsList = await Promise.all(
        data.map((c) => getComplaintReports(c.id).catch(() => []))
      );
      const map: Record<number, WorkReport[]> = {};
      data.forEach((c, idx) => {
        map[c.id] = reportsList[idx] || [];
      });
      setReportsMap(map);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load worker tasks";
      setAlertInfo({ type: "error", text: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Transition to IN_PROGRESS
  async function handleStartWork(id: number) {
    setUpdatingId(id);
    setAlertInfo(null);

    try {
      const updated = await updateComplaintStatus(id, "IN_PROGRESS");
      setComplaints((prev) => prev.map((c) => (c.id === id ? updated : c)));
      
      const successMsg = `Task #${id} status changed to IN PROGRESS. Field repair commenced.`;
      setAlertInfo({ type: "success", text: successMsg });
      
      showToast({
        type: "info",
        title: "Field Work Commenced",
        message: `Task #${id} is now In Progress.`,
      });

      addNotification({
        title: `Work Started: Task #${id}`,
        message: `You marked complaint #${id} "${updated.title}" as In Progress.`,
        type: "status",
        complaintId: id,
        link: "/worker",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not start work";
      setAlertInfo({ type: "error", text: msg });
      showToast({ type: "error", title: "Action Failed", message: msg });
    } finally {
      setUpdatingId(null);
    }
  }

  // Open Progress Note Modal
  function openProgressModal(c: Complaint) {
    setProgressComplaint(c);
    setProgressNoteText("");
  }

  // Submit Progress Note
  async function handleSubmitProgress(e: React.FormEvent) {
    e.preventDefault();
    if (!progressComplaint) return;
    if (!progressNoteText.trim()) {
      showToast({ type: "error", title: "Note Required", message: "Please enter progress details." });
      return;
    }

    setIsSubmittingProgress(true);
    try {
      await addProgress(progressComplaint.id, { notes: progressNoteText.trim() });
      const msg = `Progress update recorded for Task #${progressComplaint.id}.`;
      setAlertInfo({ type: "success", text: msg });
      showToast({ type: "success", title: "Progress Recorded", message: msg });

      setProgressComplaint(null);
      setProgressNoteText("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit progress note";
      showToast({ type: "error", title: "Failed", message: msg });
    } finally {
      setIsSubmittingProgress(false);
    }
  }

  // Open Completion Modal
  function openCompletionModal(complaint: Complaint, existingReport?: WorkReport) {
    setCompletionComplaint(complaint);
    setWorkDescription(existingReport?.workDescription || "");
    setMaterialsUsed(existingReport?.materialsUsed || "");
    setRemarks(existingReport?.remarks || "");
    setProofDetails(existingReport?.proofDetails || "");
  }

  // Submit Completion Report
  async function handleSubmitCompletion(e: React.FormEvent) {
    e.preventDefault();
    if (!completionComplaint) return;
    if (!workDescription.trim()) {
      setAlertInfo({ type: "error", text: "Please enter work description detailing how the problem was resolved." });
      return;
    }

    setIsSubmittingCompletion(true);
    try {
      const createdReport = await submitCompletionReport(completionComplaint.id, {
        workDescription: workDescription.trim(),
        materialsUsed: materialsUsed.trim() || undefined,
        remarks: remarks.trim() || undefined,
        proofDetails: proofDetails.trim() || undefined,
      });

      // Update complaint status to AWAITING_VERIFICATION in local list
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === completionComplaint.id
            ? { ...c, status: "AWAITING_VERIFICATION" }
            : c
        )
      );

      // Update reports map
      setReportsMap((prev) => ({
        ...prev,
        [completionComplaint.id]: [createdReport, ...(prev[completionComplaint.id] || [])],
      }));

      const successMsg = `Completion Report for Task #${completionComplaint.id} submitted! Awaiting Panchayat Admin verification.`;
      setAlertInfo({ type: "success", text: successMsg });

      showToast({
        type: "success",
        title: "Report Submitted",
        message: successMsg,
      });

      addNotification({
        title: `Report Submitted for #${completionComplaint.id}`,
        message: `Task #${completionComplaint.id} submitted for Panchayat verification.`,
        type: "status",
        complaintId: completionComplaint.id,
        link: "/worker",
      });

      setCompletionComplaint(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit completion report";
      setAlertInfo({ type: "error", text: msg });
      showToast({ type: "error", title: "Submission Failed", message: msg });
    } finally {
      setIsSubmittingCompletion(false);
    }
  }

  const filteredTasks = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = String(c.id) === q || `#${c.id}` === q;
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesLoc = c.location ? c.location.toLowerCase().includes(q) : false;
        const matchesCat = c.category.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesLoc && !matchesCat) return false;
      }

      return true;
    });
  }, [complaints, statusFilter, searchQuery]);

  // Worker Statistics
  const assignedCount = complaints.filter((c) => c.status === "ASSIGNED" || c.status === "PENDING").length;
  const inProgressCount = complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const awaitingVerificationCount = complaints.filter((c) => c.status === "AWAITING_VERIFICATION").length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;

  return (
    <main className="container" style={{ paddingBottom: 60 }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="badge badge-in-progress" style={{ fontSize: 11, background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}>
              <HardHat size={12} /> {t("nav.worker", "Panchayat Maintenance Technician")}
            </span>
            {currentWorker && (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Staff: <strong>{currentWorker.name}</strong> ({currentWorker.email})
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 800, margin: 0, color: "var(--navy)" }}>
            {t("nav.worker", "Worker Field Portal")}
          </h1>
          <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 15 }}>
            View tasks assigned to you, inspect Panchayat instructions and deadlines, start work, log progress updates, and submit completion reports for administrative verification.
          </p>
        </div>

        <button 
          type="button" 
          className="btn btn-secondary btn-sm" 
          onClick={() => loadData(true)}
          disabled={refreshing || loading}
        >
          <RotateCw size={15} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : t("action.refresh", "Refresh Tasks")}
        </button>
      </div>

      {/* Alert message */}
      {alertInfo && (
        <div className={`alert ${alertInfo.type === "success" ? "alert-success" : "alert-error"}`} role="status">
          {alertInfo.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <div>{alertInfo.text}</div>
        </div>
      )}

      {/* Worker Quick Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="panel" style={{ padding: 20, borderLeft: "4px solid #7e22ce" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            {translateStatus("ASSIGNED")}
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#7e22ce", marginTop: 4 }}>
            {loading ? "..." : assignedCount}
          </div>
        </div>

        <div className="panel" style={{ padding: 20, borderLeft: "4px solid #0284c7" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            {translateStatus("IN_PROGRESS")}
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0284c7", marginTop: 4 }}>
            {loading ? "..." : inProgressCount}
          </div>
        </div>

        <div className="panel" style={{ padding: 20, borderLeft: "4px solid #d97706" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            {translateStatus("AWAITING_VERIFICATION")}
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#d97706", marginTop: 4 }}>
            {loading ? "..." : awaitingVerificationCount}
          </div>
        </div>

        <div className="panel" style={{ padding: 20, borderLeft: "4px solid #15803d" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            {translateStatus("RESOLVED")}
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#15803d", marginTop: 4 }}>
            {loading ? "..." : resolvedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks by ID, location, or problem title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          aria-label="Filter Tasks by Status"
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Assigned Tasks ({complaints.length})</option>
          <option value="ASSIGNED">{translateStatus("ASSIGNED")} ({assignedCount})</option>
          <option value="IN_PROGRESS">{translateStatus("IN_PROGRESS")} ({inProgressCount})</option>
          <option value="AWAITING_VERIFICATION">{translateStatus("AWAITING_VERIFICATION")} ({awaitingVerificationCount})</option>
          <option value="RESOLVED">{translateStatus("RESOLVED")} ({resolvedCount})</option>
        </select>
      </div>

      {/* Task List Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, margin: 0, color: "var(--navy)" }}>
          Your Assigned Field Tasks ({filteredTasks.length})
        </h2>
      </div>

      {loading ? (
        <div className="panel empty-state">
          <RotateCw size={36} className="animate-spin" style={{ color: "var(--primary)", margin: "0 auto 16px" }} />
          <h3>Loading your field tasks...</h3>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="panel empty-state">
          <Inbox size={32} style={{ color: "var(--text-subtle)", margin: "0 auto 12px" }} />
          <h3>No assigned tasks in this view</h3>
          <p>You have no pending assignments matching the filter. Check back once the Panchayat administrator assigns new complaints.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredTasks.map((tItem) => {
            const isUpdating = updatingId === tItem.id;
            const isResolved = tItem.status === "RESOLVED" || tItem.status === "CLOSED";
            const isInProgress = tItem.status === "IN_PROGRESS";
            const isAwaitingVerification = tItem.status === "AWAITING_VERIFICATION";

            const complaintReports = reportsMap[tItem.id] || [];
            const latestReport = complaintReports[0];
            const isLatestRejected = latestReport?.reviewDecision === "REJECTED";

            return (
              <div 
                key={tItem.id} 
                className="panel"
                style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 14,
                  borderLeft: `5px solid ${
                    isResolved 
                      ? "#15803d" 
                      : isAwaitingVerification 
                      ? "#d97706" 
                      : isInProgress 
                      ? "#0284c7" 
                      : "#7e22ce"
                  }`,
                  padding: 22,
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 800, color: "var(--navy)", fontSize: 16 }}>
                        #{tItem.id}
                      </span>
                      <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--navy)" }}>
                        {tItem.title}
                      </h3>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 6, fontSize: 13, color: "var(--text-muted)", flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Tag size={13} /> {translateCategory(tItem.category)}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={13} /> {tItem.location || "Village Area"}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={13} /> Reported: {new Date(tItem.createdAt).toLocaleDateString()}
                      </span>
                      {tItem.assignedAt && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#7e22ce" }}>
                          <Clock size={13} /> Assigned: {new Date(tItem.assignedAt).toLocaleDateString()}
                        </span>
                      )}
                      {tItem.deadline && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#b45309", fontWeight: 700 }}>
                          <Clock size={13} /> Deadline: {new Date(tItem.deadline).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={`badge badge-priority-${String(tItem.priority).toLowerCase()}`}>
                      {translatePriority(tItem.priority)}
                    </span>
                    <span className={`badge badge-${tItem.status.toLowerCase().replace("_", "-")}`}>
                      {translateStatus(tItem.status)}
                    </span>
                  </div>
                </div>

                {/* Problem Description */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>
                    PROBLEM DESCRIPTION:
                  </div>
                  <p style={{ margin: 0, color: "var(--text-main)", fontSize: 14, lineHeight: 1.6, background: "var(--surface-alt)", padding: 12, borderRadius: "var(--radius-sm)" }}>
                    {tItem.description}
                  </p>
                </div>

                {/* Admin Instructions Banner (if provided) */}
                {tItem.adminInstructions && (
                  <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#6d28d9", marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
                      <Clock size={14} /> Panchayat Administration Instructions:
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#4c1d95" }}>
                      "{tItem.adminInstructions}"
                    </p>
                  </div>
                )}

                {/* Rejection Warning Banner with Admin Feedback (if rejected) */}
                {isLatestRejected && latestReport && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, color: "#991b1b" }}>
                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <AlertTriangle size={15} /> Completion Report Returned by Admin:
                    </div>
                    <p style={{ margin: "4px 0 8px", fontSize: 13 }}>
                      "{latestReport.adminComments || "Please review and rectify field work before resubmission."}"
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => openCompletionModal(tItem, latestReport)}
                      style={{ background: "#dc2626", fontSize: 12 }}
                    >
                      <RotateCw size={12} /> Edit & Resubmit Completion Report
                    </button>
                  </div>
                )}

                {/* Awaiting Verification Banner */}
                {isAwaitingVerification && (
                  <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: 8, padding: 12, color: "#854d0e" }}>
                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <ClipboardCheck size={16} color="#d97706" /> Work Completion Report Awaiting Panchayat Admin Sign-Off
                    </div>
                    {latestReport && (
                      <div style={{ marginTop: 6, fontSize: 12, color: "#713f12" }}>
                        <div>Summary: {latestReport.workDescription}</div>
                        {latestReport.proofDetails && <div>Proof: {latestReport.proofDetails}</div>}
                        <div style={{ fontSize: 11, marginTop: 4, color: "#a16207" }}>
                          Submitted: {new Date(latestReport.submittedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Resolution Notes display (if resolved) */}
                {isResolved && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
                      <CheckCircle2 size={14} /> Completed & Verified Work Summary:
                    </div>
                    {tItem.resolutionNotes && (
                      <p style={{ margin: "0 0 4px", fontSize: 13, color: "#14532d", fontStyle: "italic" }}>
                        "{tItem.resolutionNotes}"
                      </p>
                    )}
                    {latestReport && (
                      <div style={{ fontSize: 12, color: "#166534" }}>
                        Work: {latestReport.workDescription}
                        {latestReport.proofDetails && <span> · Proof: {latestReport.proofDetails}</span>}
                      </div>
                    )}
                    {tItem.resolvedAt && (
                      <div style={{ fontSize: 11, color: "#15803d", marginTop: 4 }}>
                        Resolved on {new Date(tItem.resolvedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Worker Action Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  {!isInProgress && !isResolved && !isAwaitingVerification && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={isUpdating}
                      onClick={() => handleStartWork(tItem.id)}
                      style={{ color: "#0284c7", borderColor: "#bae6fd", background: "#f0f9ff" }}
                    >
                      {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />} {t("action.startWork", "Start Working")}
                    </button>
                  )}

                  {isInProgress && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openProgressModal(tItem)}
                        style={{ color: "#0284c7", borderColor: "#bae6fd" }}
                      >
                        <MessageSquarePlus size={14} /> Log Progress Note
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={isUpdating}
                        onClick={() => openCompletionModal(tItem, latestReport)}
                        style={{ background: "#15803d" }}
                      >
                        <ClipboardCheck size={14} /> Submit Completion Report
                      </button>
                    </>
                  )}

                  {isAwaitingVerification && (
                    <span style={{ fontSize: 13, color: "#d97706", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Clock size={15} /> Awaiting Admin Approval
                    </span>
                  )}

                  {isResolved && (
                    <span style={{ fontSize: 13, color: "#15803d", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Check size={16} /> Work Verified & Closed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LOG PROGRESS NOTE MODAL */}
      {progressComplaint && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 500,
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MessageSquarePlus size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: 18, color: "var(--navy)" }}>
                  Log Progress Update #{progressComplaint.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProgressComplaint(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitProgress} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <strong style={{ fontSize: 14, color: "var(--navy)" }}>{progressComplaint.title}</strong>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                  Location: {progressComplaint.location || "Village Area"}
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>
                  Progress Notes / Current Status *
                </label>
                <textarea
                  required
                  rows={4}
                  value={progressNoteText}
                  onChange={(e) => setProgressNoteText(e.target.value)}
                  placeholder="e.g. Cleared 60% of blocked canal, awaiting backhoe operator for deep clearing tomorrow morning..."
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", boxSizing: "border-box", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setProgressComplaint(null)}
                >
                  {t("action.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProgress || !progressNoteText.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#0284c7" }}
                >
                  {isSubmittingProgress ? <Loader2 size={14} className="animate-spin" /> : "Save Progress Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FINAL WORK COMPLETION REPORT MODAL */}
      {completionComplaint && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 560,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ClipboardCheck size={20} color="#15803d" />
                <h3 style={{ margin: 0, fontSize: 18, color: "var(--navy)" }}>
                  Submit Work Completion Report #{completionComplaint.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCompletionComplaint(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCompletion} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <strong style={{ fontSize: 14, color: "var(--navy)", display: "block" }}>
                  {completionComplaint.title}
                </strong>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                  Location: {completionComplaint.location || "Village Area"} · Category: {translateCategory(completionComplaint.category)}
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>
                  Work Completed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="Describe in detail the repairs carried out (e.g. Replaced faulty transformer switch fuse, patched 4m asphalt pothole, cleaned sewage choke point)..."
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>
                  Materials & Equipment Used (Optional)
                </label>
                <input
                  type="text"
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                  placeholder="e.g. 10m PVC 2.5mm wire, 2 bags bitumen, 1 LED 40W street bulb"
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>
                  Proof of Work / Verification Details (Optional)
                </label>
                <input
                  type="text"
                  value={proofDetails}
                  onChange={(e) => setProofDetails(e.target.value)}
                  placeholder="e.g. Signed by Ward 4 Representative / Photo proof stored on field device"
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>
                  Technician Remarks / Observations (Optional)
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any additional observations or recommendations for future maintenance..."
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCompletionComplaint(null)}
                >
                  {t("action.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCompletion || !workDescription.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#15803d" }}
                >
                  {isSubmittingCompletion ? <Loader2 size={14} className="animate-spin" /> : "Submit for Admin Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}