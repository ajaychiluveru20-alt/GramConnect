import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, 
  RotateCw, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  Wrench, 
  Archive, 
  Inbox, 
  Tag, 
  MapPin, 
  Calendar, 
  X,
  UserPlus,
  Users,
  HardHat,
  BarChart3,
  Check,
  Ban,
  FileText,
  Loader2,
  ClipboardCheck,
  User,
  CalendarClock,
  AlertTriangle,
  History
} from "lucide-react";
import { 
  getComplaints, 
  getComplaintStats, 
  updateComplaintStatus,
  assignComplaint,
  closeComplaint,
  getComplaintHistory,
  getComplaintReports,
  getCompletionReports,
  approveCompletionReport,
  rejectCompletionReport
} from "../../services/complaintService";
import { 
  getUsers, 
  getWorkers, 
  createWorker, 
  toggleWorkerStatus 
} from "../../services/userService";
import type { Complaint, ComplaintStats, WorkReport, ComplaintHistory } from "../../types/complaint";
import type { UserProfile, CreateWorkerInput } from "../../types/auth";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../context/NotificationContext";

const STATUSES: { value: string; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "AWAITING_VERIFICATION", label: "Awaiting Verification" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const CATEGORIES = [
  "ALL",
  "Water Supply",
  "Roads",
  "Electricity",
  "Street Lights",
  "Garbage",
  "Drainage",
  "Sanitation",
  "Other",
];

export default function Dashboard() {
  const { user: currentAdmin } = useAuth();
  const { t, translateCategory, translateStatus, translatePriority } = useLanguage();
  const { showToast, addNotification } = useNotifications();

  // Tab State: "complaints" | "verification" | "workers" | "users" | "reports"
  const [activeTab, setActiveTab] = useState<"complaints" | "verification" | "workers" | "users" | "reports">("complaints");

  // Data states
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [completionReports, setCompletionReports] = useState<WorkReport[]>([]);

  // Loading & feedback states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filters for complaints
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");

  // Filter for completion reports
  const [verificationFilter, setVerificationFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");

  // Inline assignment & status selection maps
  const [selectedStatuses, setSelectedStatuses] = useState<Record<number, string>>({});
  const [selectedWorkers, setSelectedWorkers] = useState<Record<number, number>>({});
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  // Detail Modal State with Audit History and Reports
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [complaintHistoryList, setComplaintHistoryList] = useState<ComplaintHistory[]>([]);
  const [complaintReportsList, setComplaintReportsList] = useState<WorkReport[]>([]);
  const [loadingDetailsExtra, setLoadingDetailsExtra] = useState(false);
  const [closingComplaint, setClosingComplaint] = useState(false);

  // Worker Modal State
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [newWorker, setNewWorker] = useState<CreateWorkerInput>({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [workerCreating, setWorkerCreating] = useState(false);

  // Assignment Modal with Deadline & Instructions
  const [assignModalComplaint, setAssignModalComplaint] = useState<Complaint | null>(null);
  const [modalWorkerId, setModalWorkerId] = useState<number | "">("");
  const [modalInstructions, setModalInstructions] = useState("");
  const [modalDeadline, setModalDeadline] = useState("");
  const [modalAssigning, setModalAssigning] = useState(false);

  // Reject Completion Report Modal
  const [rejectModalReport, setRejectModalReport] = useState<WorkReport | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reportActionLoading, setReportActionLoading] = useState(false);

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setPageError("");

    try {
      const [complaintsList, statsData, workersList, usersList, reportsList] = await Promise.all([
        getComplaints(),
        getComplaintStats().catch(() => null),
        getWorkers().catch(() => []),
        getUsers().catch(() => []),
        getCompletionReports().catch(() => []),
      ]);

      setComplaints(complaintsList);
      if (statsData) setStats(statsData);
      setWorkers(workersList);
      setAllUsers(usersList);
      setCompletionReports(reportsList);

      // Initialize status & worker assignment maps
      const statusMap: Record<number, string> = {};
      const workerMap: Record<number, number> = {};
      complaintsList.forEach((c) => {
        statusMap[c.id] = c.status;
        if (c.worker) workerMap[c.id] = c.worker.id;
      });
      setSelectedStatuses(statusMap);
      setSelectedWorkers(workerMap);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load admin data";
      setPageError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Update complaint status
  async function handleStatusUpdate(id: number) {
    const newStatus = selectedStatuses[id];
    if (!newStatus) return;

    setUpdatingId(id);
    setActionFeedback(null);

    try {
      const updated = await updateComplaintStatus(id, newStatus);
      setComplaints((prev) => prev.map((item) => (item.id === id ? updated : item)));
      const updatedStats = await getComplaintStats().catch(() => null);
      if (updatedStats) setStats(updatedStats);

      const msg = `Complaint #${id} status updated to "${newStatus.replace("_", " ")}".`;
      setActionFeedback({ type: "success", message: msg });

      showToast({
        type: "success",
        title: "Status Updated",
        message: msg,
      });

      addNotification({
        title: `Complaint #${id} Status Updated`,
        message: `Complaint #${id} status changed to ${newStatus.replace("_", " ")}.`,
        type: "status",
        complaintId: id,
        link: "/admin",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Status update failed";
      setActionFeedback({ type: "error", message: `Error updating Complaint #${id}: ${msg}` });
      showToast({ type: "error", title: "Update Failed", message: msg });
    } finally {
      setUpdatingId(null);
    }
  }

  // Assign complaint to worker (inline quick assign)
  async function handleAssignWorker(id: number) {
    const workerId = selectedWorkers[id];
    if (!workerId) return;

    setAssigningId(id);
    setActionFeedback(null);

    try {
      const updated = await assignComplaint(id, workerId);
      setComplaints((prev) => prev.map((item) => (item.id === id ? updated : item)));
      const assignedWorkerName = workers.find((w) => w.id === workerId)?.name || "Worker";

      const msg = `Complaint #${id} successfully assigned to ${assignedWorkerName}.`;
      setActionFeedback({ type: "success", message: msg });

      showToast({
        type: "success",
        title: "Worker Assigned",
        message: msg,
      });

      addNotification({
        title: `Complaint #${id} Assigned`,
        message: `Assigned to field technician ${assignedWorkerName}.`,
        type: "assignment",
        complaintId: id,
        link: "/admin",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Assignment failed";
      setActionFeedback({ type: "error", message: `Error assigning Complaint #${id}: ${msg}` });
      showToast({ type: "error", title: "Assignment Failed", message: msg });
    } finally {
      setAssigningId(null);
    }
  }

  // Open detailed assignment modal with deadline and instructions
  function openAssignModal(c: Complaint) {
    setAssignModalComplaint(c);
    setModalWorkerId(c.worker?.id ?? "");
    setModalInstructions(c.adminInstructions ?? "");
    setModalDeadline(c.deadline ? c.deadline.substring(0, 16) : "");
  }

  // Submit detailed assignment with instructions & deadline
  async function handleModalAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignModalComplaint || !modalWorkerId) return;

    setModalAssigning(true);
    setActionFeedback(null);

    try {
      const updated = await assignComplaint(assignModalComplaint.id, {
        workerId: Number(modalWorkerId),
        instructions: modalInstructions.trim() || undefined,
        deadline: modalDeadline || undefined,
      });

      setComplaints((prev) => prev.map((item) => (item.id === assignModalComplaint.id ? updated : item)));
      const assignedWorkerName = workers.find((w) => w.id === Number(modalWorkerId))?.name || "Technician";

      const msg = `Complaint #${assignModalComplaint.id} assigned to ${assignedWorkerName} with instructions and deadline.`;
      setActionFeedback({ type: "success", message: msg });
      showToast({ type: "success", title: "Task Assigned", message: msg });

      addNotification({
        title: `Task #${assignModalComplaint.id} Assigned`,
        message: `Assigned to ${assignedWorkerName} with Panchayat instructions.`,
        type: "assignment",
        complaintId: assignModalComplaint.id,
        link: "/admin",
      });

      setAssignModalComplaint(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to assign task";
      showToast({ type: "error", title: "Assignment Failed", message: msg });
    } finally {
      setModalAssigning(false);
    }
  }

  // Open complaint details with audit history and work reports
  async function openComplaintDetails(c: Complaint) {
    setSelectedComplaint(c);
    setComplaintHistoryList([]);
    setComplaintReportsList([]);
    setLoadingDetailsExtra(true);

    try {
      const [hist, reps] = await Promise.all([
        getComplaintHistory(c.id).catch(() => []),
        getComplaintReports(c.id).catch(() => []),
      ]);
      setComplaintHistoryList(hist);
      setComplaintReportsList(reps);
    } catch {
      // ignore
    } finally {
      setLoadingDetailsExtra(false);
    }
  }

  // Close verified complaint
  async function handleCloseComplaint(complaintId: number) {
    setClosingComplaint(true);
    try {
      const updated = await closeComplaint(complaintId);
      setComplaints((prev) => prev.map((item) => (item.id === complaintId ? updated : item)));
      setSelectedComplaint(updated);
      const updatedStats = await getComplaintStats().catch(() => null);
      if (updatedStats) setStats(updatedStats);

      const msg = `Complaint #${complaintId} has been officially verified and closed.`;
      setActionFeedback({ type: "success", message: msg });
      showToast({ type: "success", title: "Complaint Closed", message: msg });

      addNotification({
        title: `Complaint #${complaintId} Closed`,
        message: `Panchayat administration verified and closed complaint #${complaintId}.`,
        type: "status",
        complaintId,
        link: "/admin",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to close complaint";
      showToast({ type: "error", title: "Action Failed", message: msg });
    } finally {
      setClosingComplaint(false);
    }
  }

  // Approve worker completion report
  async function handleApproveCompletionReport(reportId: number) {
    setReportActionLoading(true);
    try {
      const updated = await approveCompletionReport(reportId);
      setCompletionReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));

      const targetComplaintId = updated.complaint?.id ?? updated.complaintId;

      // Update complaint status to RESOLVED
      if (targetComplaintId) {
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === targetComplaintId
              ? { ...c, status: "RESOLVED", resolvedAt: new Date().toISOString() }
              : c
          )
        );
      }
      const updatedStats = await getComplaintStats().catch(() => null);
      if (updatedStats) setStats(updatedStats);

      const msg = `Work Report #${reportId} approved! Complaint #${targetComplaintId || ""} is now marked as RESOLVED.`;
      setActionFeedback({ type: "success", message: msg });
      showToast({ type: "success", title: "Work Approved", message: msg });

      if (targetComplaintId) {
        addNotification({
          title: `Work Approved for #${targetComplaintId}`,
          message: `Technician's completion report approved. Status marked as Resolved.`,
          type: "status",
          complaintId: targetComplaintId,
          link: "/admin",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve completion report";
      showToast({ type: "error", title: "Approval Failed", message: msg });
    } finally {
      setReportActionLoading(false);
    }
  }

  // Reject worker completion report
  async function handleRejectCompletionReport(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectModalReport) return;
    if (!rejectReason.trim()) {
      showToast({ type: "error", title: "Reason Required", message: "Please specify why the report is rejected." });
      return;
    }

    setReportActionLoading(true);
    try {
      const updated = await rejectCompletionReport(rejectModalReport.id, rejectReason.trim());
      setCompletionReports((prev) => prev.map((r) => (r.id === rejectModalReport.id ? updated : r)));

      const targetComplaintId = updated.complaint?.id ?? updated.complaintId ?? rejectModalReport.complaint?.id ?? rejectModalReport.complaintId;

      // In complaints list, status reverts to IN_PROGRESS
      if (targetComplaintId) {
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === targetComplaintId
              ? { ...c, status: "IN_PROGRESS" }
              : c
          )
        );
      }
      const updatedStats = await getComplaintStats().catch(() => null);
      if (updatedStats) setStats(updatedStats);

      const msg = `Work report #${rejectModalReport.id} rejected and returned to technician. Complaint #${targetComplaintId || ""} is back In Progress.`;
      setActionFeedback({ type: "success", message: msg });
      showToast({ type: "info", title: "Report Returned to Worker", message: msg });

      if (targetComplaintId) {
        addNotification({
          title: `Report Rejected for #${targetComplaintId}`,
          message: `Work report returned to technician with feedback notes.`,
          type: "status",
          complaintId: targetComplaintId,
          link: "/admin",
        });
      }

      setRejectModalReport(null);
      setRejectReason("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reject report";
      showToast({ type: "error", title: "Action Failed", message: msg });
    } finally {
      setReportActionLoading(false);
    }
  }

  // Create Worker
  async function handleCreateWorker(e: React.FormEvent) {
    e.preventDefault();
    if (!newWorker.name || !newWorker.email || !newWorker.password) {
      setActionFeedback({ type: "error", message: "Please enter name, email and password for the worker." });
      return;
    }

    setWorkerCreating(true);
    setActionFeedback(null);

    try {
      const created = await createWorker(newWorker);
      setWorkers((prev) => [...prev, created]);
      setIsWorkerModalOpen(false);
      setNewWorker({ name: "", email: "", password: "", phone: "" });

      const msg = `Worker account created successfully for "${created.name}" (${created.email}).`;
      setActionFeedback({ type: "success", message: msg });

      showToast({
        type: "success",
        title: "Worker Created",
        message: msg,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create worker";
      setActionFeedback({ type: "error", message: msg });
      showToast({ type: "error", title: "Creation Failed", message: msg });
    } finally {
      setWorkerCreating(false);
    }
  }

  // Toggle Worker Active / Inactive
  async function handleToggleWorker(id: number, currentActive: boolean) {
    try {
      const updated = await toggleWorkerStatus(id, !currentActive);
      setWorkers((prev) => prev.map((w) => (w.id === id ? updated : w)));
      const msg = `Worker account for ${updated.name} ${updated.active ? "activated" : "deactivated"}.`;
      setActionFeedback({ type: "success", message: msg });
      showToast({ type: "info", title: "Worker Status Changed", message: msg });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle worker status";
      setActionFeedback({ type: "error", message: msg });
      showToast({ type: "error", title: "Error", message: msg });
    }
  }

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = String(c.id) === q || `#${c.id}` === q;
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesCat = c.category.toLowerCase().includes(q);
        const matchesLoc = c.location ? c.location.toLowerCase().includes(q) : false;
        const matchesWorker = c.worker ? c.worker.name.toLowerCase().includes(q) : false;
        const matchesVillager = c.user ? c.user.name.toLowerCase().includes(q) : false;
        if (!matchesId && !matchesTitle && !matchesCat && !matchesLoc && !matchesWorker && !matchesVillager) return false;
      }
      if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
      if (filterCategory !== "ALL" && c.category.toLowerCase() !== filterCategory.toLowerCase()) return false;
      return true;
    });
  }, [complaints, searchQuery, filterStatus, filterCategory]);

  // Filtered completion reports
  const pendingReportsCount = useMemo(() => {
    return completionReports.filter((r) => !r.reviewDecision || r.reviewDecision === "PENDING").length;
  }, [completionReports]);

  const filteredReports = useMemo(() => {
    if (verificationFilter === "ALL") return completionReports;
    return completionReports.filter((r) => {
      if (verificationFilter === "PENDING") {
        return !r.reviewDecision || r.reviewDecision === "PENDING";
      }
      return r.reviewDecision === verificationFilter;
    });
  }, [completionReports, verificationFilter]);

  const cards = [
    { title: "Total Complaints", count: stats?.total ?? complaints.length, color: "#1e3a8a", bg: "#eff6ff", icon: <Inbox size={20} color="#1e3a8a" /> },
    { title: translateStatus("PENDING"), count: stats?.pending ?? complaints.filter((c) => c.status === "PENDING").length, color: "#b45309", bg: "#fef3c7", icon: <Clock size={20} color="#b45309" /> },
    { title: translateStatus("ASSIGNED"), count: stats?.assigned ?? complaints.filter((c) => c.status === "ASSIGNED").length, color: "#7e22ce", bg: "#f3e8ff", icon: <UserCheck size={20} color="#7e22ce" /> },
    { title: translateStatus("IN_PROGRESS"), count: stats?.inProgress ?? complaints.filter((c) => c.status === "IN_PROGRESS").length, color: "#0284c7", bg: "#e0f2fe", icon: <Wrench size={20} color="#0284c7" /> },
    { title: translateStatus("AWAITING_VERIFICATION"), count: stats?.awaitingVerification ?? complaints.filter((c) => c.status === "AWAITING_VERIFICATION").length, color: "#d97706", bg: "#fef9c3", icon: <ClipboardCheck size={20} color="#d97706" /> },
    { title: translateStatus("RESOLVED"), count: stats?.resolved ?? complaints.filter((c) => c.status === "RESOLVED").length, color: "#15803d", bg: "#dcfce7", icon: <CheckCircle2 size={20} color="#15803d" /> },
    { title: translateStatus("CLOSED"), count: stats?.closed ?? complaints.filter((c) => c.status === "CLOSED").length, color: "#475569", bg: "#f1f5f9", icon: <Archive size={20} color="#475569" /> },
  ];

  function getStatusBadge(status: string) {
    const s = status.toUpperCase();
    let badgeClass = "badge-pending";
    if (s === "ASSIGNED") { badgeClass = "badge-assigned"; }
    else if (s === "IN_PROGRESS") { badgeClass = "badge-in-progress"; }
    else if (s === "AWAITING_VERIFICATION") { badgeClass = "badge-awaiting-verification"; }
    else if (s === "RESOLVED") { badgeClass = "badge-resolved"; }
    else if (s === "CLOSED") { badgeClass = "badge-closed"; }
    return <span className={`badge ${badgeClass}`}>{translateStatus(status)}</span>;
  }

  function getPriorityBadge(priority: string | undefined) {
    const p = (priority ?? "MEDIUM").toUpperCase();
    let badgeClass = "badge-priority-medium";
    if (p === "HIGH") { badgeClass = "badge-priority-high"; }
    else if (p === "LOW") { badgeClass = "badge-priority-low"; }
    return <span className={`badge ${badgeClass}`}>{translatePriority(p)}</span>;
  }

  return (
    <main className="container" style={{ paddingBottom: 60 }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="badge badge-assigned" style={{ fontSize: 11 }}>
              <ShieldCheck size={12} /> {t("nav.admin", "Gram Panchayat Administration")}
            </span>
            {currentAdmin && (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Logged in: <strong>{currentAdmin.name}</strong> ({currentAdmin.email})
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 800, margin: 0, color: "var(--navy)" }}>
            {t("nav.admin", "Admin Management Dashboard")}
          </h1>
          <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 15 }}>
            Central administration console. Monitor village grievances, assign maintenance technicians with instructions & deadlines, review work completion reports, and close verified complaints.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
          >
            <RotateCw size={15} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : t("action.refresh", "Refresh Data")}
          </button>
        </div>
      </div>

      {/* Action feedback banner */}
      {actionFeedback && (
        <div className={`alert ${actionFeedback.type === "success" ? "alert-success" : "alert-error"}`} role="status">
          {actionFeedback.type === "success" ? <CheckCircle2 size={18} style={{ flexShrink: 0 }} /> : <AlertCircle size={18} style={{ flexShrink: 0 }} />}
          <div>{actionFeedback.message}</div>
        </div>
      )}

      {/* Error state */}
      {pageError && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>{pageError}</div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <section className="metric-cards-grid" aria-label="Complaint Statistics" style={{ marginBottom: 24 }}>
        {cards.map((c) => (
          <article key={c.title} className="metric-card" style={{ borderTop: `4px solid ${c.color}` }}>
            <div className="metric-card-top">
              <span className="metric-card-title">{c.title}</span>
              <div style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {c.icon}
              </div>
            </div>
            <div className="metric-card-val" style={{ color: c.color }}>
              {loading ? "..." : c.count}
            </div>
          </article>
        ))}
      </section>

      {/* Tabs Navigation */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          gap: 8,
          marginBottom: 20,
          background: "#ffffff",
          padding: "8px 12px 0",
          borderRadius: "8px 8px 0 0",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("complaints")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "complaints" ? "3px solid #1e3a8a" : "3px solid transparent",
            color: activeTab === "complaints" ? "#1e3a8a" : "var(--text-muted)",
            fontWeight: activeTab === "complaints" ? 700 : 600,
            cursor: "pointer",
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          <Inbox size={16} /> {t("nav.complaints", "Complaints Management")} ({complaints.length})
        </button>

        <button
          onClick={() => setActiveTab("verification")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "verification" ? "3px solid #1e3a8a" : "3px solid transparent",
            color: activeTab === "verification" ? "#1e3a8a" : "var(--text-muted)",
            fontWeight: activeTab === "verification" ? 700 : 600,
            cursor: "pointer",
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          <ClipboardCheck size={16} /> Work Verification
          {pendingReportsCount > 0 && (
            <span
              style={{
                background: "#f59e0b",
                color: "#fff",
                fontSize: 11,
                padding: "2px 7px",
                borderRadius: 9999,
                fontWeight: 800,
              }}
            >
              {pendingReportsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("workers")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "workers" ? "3px solid #1e3a8a" : "3px solid transparent",
            color: activeTab === "workers" ? "#1e3a8a" : "var(--text-muted)",
            fontWeight: activeTab === "workers" ? 700 : 600,
            cursor: "pointer",
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          <HardHat size={16} /> {t("nav.worker", "Maintenance Workers")} ({workers.length})
        </button>

        <button
          onClick={() => setActiveTab("users")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "users" ? "3px solid #1e3a8a" : "3px solid transparent",
            color: activeTab === "users" ? "#1e3a8a" : "var(--text-muted)",
            fontWeight: activeTab === "users" ? 700 : 600,
            cursor: "pointer",
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          <Users size={16} /> Registered Villagers ({allUsers.filter((u) => u.role === "VILLAGER").length})
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "reports" ? "3px solid #1e3a8a" : "3px solid transparent",
            color: activeTab === "reports" ? "#1e3a8a" : "var(--text-muted)",
            fontWeight: activeTab === "reports" ? 700 : 600,
            cursor: "pointer",
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          <BarChart3 size={16} /> Civic Reports
        </button>
      </div>

      {/* TAB 1: COMPLAINTS MANAGEMENT */}
      {activeTab === "complaints" && (
        <div>
          {/* Search and Filters */}
          <div className="filter-bar" style={{ marginBottom: 16 }}>
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search by ID, title, category, location, citizen, or assigned worker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              aria-label="Filter by Status"
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {translateStatus(s.value)}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by Category"
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "ALL" ? "All Categories" : translateCategory(cat)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, fontSize: 13, color: "var(--text-muted)" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, margin: 0, color: "var(--navy)" }}>
              All Village Complaints
            </h2>
            <span>
              Showing <strong>{filteredComplaints.length}</strong> of <strong>{complaints.length}</strong>
            </span>
          </div>

          {loading ? (
            <div className="panel empty-state">
              <RotateCw size={36} className="animate-spin" style={{ color: "var(--primary)", margin: "0 auto 16px" }} />
              <h3>Loading complaints...</h3>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="panel empty-state">
              <Inbox size={32} style={{ color: "var(--text-subtle)", margin: "0 auto 12px" }} />
              <h3>No matching complaints found</h3>
              <p>Adjust your search query or filter settings.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>ID</th>
                    <th>Complaint Title & Category</th>
                    <th>Citizen Details</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th style={{ minWidth: 240 }}>Assign Worker</th>
                    <th style={{ minWidth: 190 }}>Update Status</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((c) => {
                    const currentDraftStatus = selectedStatuses[c.id] ?? c.status;
                    const isStatusDirty = currentDraftStatus !== c.status;
                    const isUpdating = updatingId === c.id;

                    const currentDraftWorker = selectedWorkers[c.id] ?? c.worker?.id ?? "";
                    const isWorkerDirty = currentDraftWorker !== (c.worker?.id ?? "");
                    const isAssigning = assigningId === c.id;

                    return (
                      <tr key={c.id}>
                        <td>
                          <span style={{ fontWeight: 800, color: "var(--navy)" }}>#{c.id}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 2 }}>{c.title}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--text-muted)" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Tag size={11} /> {translateCategory(c.category)}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Calendar size={11} /> {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {c.deadline && (
                            <div style={{ fontSize: 11, color: "#b45309", marginTop: 2, display: "inline-flex", alignItems: "center", gap: 3 }}>
                              <Clock size={11} /> Due: {new Date(c.deadline).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td>
                          {c.user ? (
                            <div>
                              <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: 13 }}>{c.user.name}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.user.phone || c.user.email}</div>
                              {c.user.village && (
                                <div style={{ fontSize: 11, color: "#15803d" }}>Ward: {c.user.village}</div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-subtle)", fontSize: 12 }}>Citizen</span>
                          )}
                        </td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
                            <MapPin size={12} /> {c.location || "Village Area"}
                          </span>
                        </td>
                        <td>{getPriorityBadge(c.priority)}</td>
                        <td>{getStatusBadge(c.status)}</td>
                        
                        {/* Worker Assignment Dropdown & Modal Button */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <select
                                aria-label={`Assign worker for complaint ${c.id}`}
                                value={currentDraftWorker}
                                disabled={isAssigning}
                                onChange={(e) =>
                                  setSelectedWorkers((prev) => ({
                                    ...prev,
                                    [c.id]: Number(e.target.value),
                                  }))
                                }
                                style={{
                                  padding: "6px 8px",
                                  fontSize: 12,
                                  borderRadius: 6,
                                  border: isWorkerDirty ? "1px solid #7e22ce" : "1px solid var(--border)",
                                  background: isWorkerDirty ? "#faf5ff" : "#fff",
                                  flex: 1,
                                }}
                              >
                                <option value="">{c.worker ? `${c.worker.name} (Assigned)` : "-- Select Worker --"}</option>
                                {workers
                                  .filter((w) => w.active)
                                  .map((w) => (
                                    <option key={w.id} value={w.id}>
                                      {w.name}
                                    </option>
                                  ))}
                              </select>

                              <button
                                type="button"
                                className="btn btn-sm"
                                disabled={!isWorkerDirty || isAssigning || !currentDraftWorker}
                                onClick={() => handleAssignWorker(c.id)}
                                style={{
                                  padding: "6px 10px",
                                  background: "#7e22ce",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                                title={isWorkerDirty ? "Save worker assignment" : "No change"}
                              >
                                {isAssigning ? <Loader2 size={12} className="animate-spin" /> : t("action.assign", "Assign")}
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => openAssignModal(c)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: "2px 0",
                                color: "#7e22ce",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                textAlign: "left",
                              }}
                            >
                              <CalendarClock size={12} /> Set Instructions & Deadline
                            </button>
                          </div>
                        </td>

                        {/* Status Change Dropdown */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <select
                              aria-label={`Update status for complaint ${c.id}`}
                              value={currentDraftStatus}
                              disabled={isUpdating}
                              onChange={(e) =>
                                setSelectedStatuses((prev) => ({
                                  ...prev,
                                  [c.id]: e.target.value,
                                }))
                              }
                              style={{
                                padding: "6px 8px",
                                fontSize: 12,
                                borderRadius: 6,
                                border: isStatusDirty ? "1px solid var(--primary)" : "1px solid var(--border)",
                                background: isStatusDirty ? "#f0fdf4" : "#fff",
                                flex: 1,
                              }}
                            >
                              {STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {translateStatus(s.value)}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={!isStatusDirty || isUpdating}
                              onClick={() => handleStatusUpdate(c.id)}
                              style={{ padding: "6px 10px", fontSize: 11 }}
                            >
                              {isUpdating ? <Loader2 size={12} className="animate-spin" /> : t("action.update", "Update")}
                            </button>
                          </div>
                        </td>

                        {/* Details Modal Trigger */}
                        <td>
                          <button
                            type="button"
                            onClick={() => openComplaintDetails(c)}
                            style={{
                              background: "#f1f5f9",
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              padding: "6px 10px",
                              fontSize: 12,
                              color: "var(--navy)",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontWeight: 600,
                            }}
                          >
                            <FileText size={13} /> {t("action.view", "Full Report")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WORK VERIFICATION (APPROVE / REJECT COMPLETION REPORTS) */}
      {activeTab === "verification" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, margin: 0, color: "var(--navy)" }}>
                Field Work Completion Verification
              </h2>
              <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 14 }}>
                Review technical completion reports, inspect materials used and proof submitted by workers, and approve or reject tasks.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setVerificationFilter(filterKey)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    border: verificationFilter === filterKey ? "2px solid #1e3a8a" : "1px solid var(--border)",
                    background: verificationFilter === filterKey ? "#eff6ff" : "#fff",
                    color: verificationFilter === filterKey ? "#1e3a8a" : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  {filterKey === "PENDING" ? `Awaiting Verification (${pendingReportsCount})` : filterKey}
                </button>
              ))}
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="panel empty-state">
              <ClipboardCheck size={36} style={{ color: "var(--text-subtle)", margin: "0 auto 12px" }} />
              <h3>No completion reports found</h3>
              <p>There are no completion reports matching the "{verificationFilter}" status.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filteredReports.map((report) => {
                const isPending = !report.reviewDecision || report.reviewDecision === "PENDING";
                const isApproved = report.reviewDecision === "APPROVED";
                const isRejected = report.reviewDecision === "REJECTED";
                const compId = report.complaint?.id ?? report.complaintId;
                const compTitle = report.complaint?.title ?? report.complaintTitle;
                const compCategory = report.complaint?.category ?? report.complaintCategory;
                const compLocation = report.complaint?.location ?? report.complaintLocation;
                const techName = report.worker?.name ?? report.workerName ?? "Panchayat Technician";
                const techPhone = report.worker?.phone ?? report.workerPhone;
                const techEmail = report.worker?.email ?? report.workerEmail;

                return (
                  <div
                    key={report.id}
                    className="panel"
                    style={{
                      padding: 24,
                      borderLeft: `5px solid ${isApproved ? "#15803d" : isRejected ? "#dc2626" : "#f59e0b"}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 800, color: "var(--navy)", fontSize: 16 }}>
                            Report #{report.id} · Complaint #{compId}
                          </span>
                          <span
                            className="badge"
                            style={{
                              background: isApproved ? "#dcfce7" : isRejected ? "#fee2e2" : "#fef3c7",
                              color: isApproved ? "#15803d" : isRejected ? "#b91c1c" : "#b45309",
                              border: `1px solid ${isApproved ? "#bbf7d0" : isRejected ? "#fecaca" : "#fde68a"}`,
                              fontSize: 11,
                            }}
                          >
                            {report.reviewDecision || "PENDING VERIFICATION"}
                          </span>
                        </div>

                        {compTitle && (
                          <h3 style={{ margin: "4px 0 0", fontSize: 16, color: "var(--navy)", fontWeight: 700 }}>
                            {compTitle}
                          </h3>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "var(--text-muted)", marginTop: 4, flexWrap: "wrap" }}>
                          {compCategory && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Tag size={12} /> {translateCategory(compCategory)}
                            </span>
                          )}
                          {compLocation && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <MapPin size={12} /> {compLocation}
                            </span>
                          )}
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Calendar size={12} /> Submitted: {new Date(report.submittedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Worker Info */}
                      <div style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 12, textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "#7e22ce" }}>
                          Technician: {techName}
                        </div>
                        {techPhone && (
                          <div style={{ color: "var(--text-muted)" }}>Phone: {techPhone}</div>
                        )}
                        {techEmail && (
                          <div style={{ color: "var(--text-muted)" }}>{techEmail}</div>
                        )}
                      </div>
                    </div>

                    {/* Report Technical Details */}
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", marginBottom: 3 }}>
                          WORK COMPLETED DESCRIPTION:
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--text-main)", lineHeight: 1.5 }}>
                          {report.workDescription}
                        </p>
                      </div>

                      {report.materialsUsed && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", marginBottom: 3 }}>
                            MATERIALS & EQUIPMENT USED:
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
                            {report.materialsUsed}
                          </p>
                        </div>
                      )}

                      {report.remarks && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", marginBottom: 3 }}>
                            ADDITIONAL WORKER REMARKS:
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
                            {report.remarks}
                          </p>
                        </div>
                      )}

                      {report.proofDetails && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", marginBottom: 3 }}>
                            PROOF OF WORK / ON-SITE VERIFICATION:
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "#15803d", fontWeight: 600 }}>
                            {report.proofDetails}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* If rejected, show admin comments */}
                    {isRejected && report.adminComments && (
                      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, fontSize: 13, color: "#b91c1c" }}>
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>Admin Rejection Reason & Instructions:</div>
                        <p style={{ margin: 0 }}>"{report.adminComments}"</p>
                        {report.reviewedAt && (
                          <div style={{ fontSize: 11, marginTop: 4, color: "#991b1b" }}>
                            Rejected on: {new Date(report.reviewedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* If approved, show approval info */}
                    {isApproved && (
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 10, fontSize: 12, color: "#166534" }}>
                        <span style={{ fontWeight: 700 }}>Work Approved & Verified.</span>
                        {report.reviewedAt && ` Verified on: ${new Date(report.reviewedAt).toLocaleString()}`}
                      </div>
                    )}

                    {/* Action buttons if Pending */}
                    {isPending && (
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 4 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={reportActionLoading}
                          onClick={() => {
                            setRejectModalReport(report);
                            setRejectReason("");
                          }}
                          style={{ color: "#dc2626", borderColor: "#fca5a5", background: "#fef2f2" }}
                        >
                          <Ban size={14} /> Reject & Return to Worker
                        </button>

                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={reportActionLoading}
                          onClick={() => handleApproveCompletionReport(report.id)}
                          style={{ background: "#15803d" }}
                        >
                          {reportActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve Work (Mark Resolved)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WORKERS MANAGEMENT */}
      {activeTab === "workers" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, margin: 0, color: "var(--navy)" }}>
                Panchayat Maintenance Workers
              </h2>
              <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 14 }}>
                Create, view, activate or deactivate authorized technician accounts.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsWorkerModalOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <UserPlus size={15} /> Add New Worker
            </button>
          </div>

          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Worker Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Assigned Tasks</th>
                  <th>Account Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => {
                  const assignedCount = complaints.filter((c) => c.worker?.id === w.id).length;
                  const activeComplaints = complaints.filter((c) => c.worker?.id === w.id && c.status !== "RESOLVED" && c.status !== "CLOSED").length;

                  return (
                    <tr key={w.id}>
                      <td><strong>#{w.id}</strong></td>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--navy)" }}>{w.name}</div>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Role: WORKER</span>
                      </td>
                      <td>{w.email}</td>
                      <td>{w.phone || "Not provided"}</td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{assignedCount} total</span>{" "}
                        <span style={{ fontSize: 12, color: activeComplaints > 0 ? "#b45309" : "#15803d" }}>
                          ({activeComplaints} active)
                        </span>
                      </td>
                      <td>
                        {w.active ? (
                          <span className="badge badge-resolved" style={{ fontSize: 11 }}>Active</span>
                        ) : (
                          <span className="badge badge-closed" style={{ fontSize: 11 }}>Deactivated</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleWorker(w.id, w.active)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "1px solid var(--border)",
                            background: w.active ? "#fff1f2" : "#f0fdf4",
                            color: w.active ? "#e11d48" : "#166534",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {w.active ? <Ban size={13} /> : <Check size={13} />}
                          {w.active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REGISTERED VILLAGERS */}
      {activeTab === "users" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, margin: 0, color: "var(--navy)" }}>
              Registered Village Citizens
            </h2>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 14 }}>
              Villagers who have registered accounts to file and track local grievances.
            </p>
          </div>

          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Citizen Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Village / Ward</th>
                  <th>Complaints Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allUsers
                  .filter((u) => u.role === "VILLAGER")
                  .map((u) => {
                    const submittedCount = complaints.filter((c) => c.user?.id === u.id).length;
                    return (
                      <tr key={u.id}>
                        <td><strong>#{u.id}</strong></td>
                        <td>
                          <div style={{ fontWeight: 700, color: "var(--navy)" }}>{u.name}</div>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone || "—"}</td>
                        <td>{u.village || "Gram Panchayat"}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: "#15803d" }}>{submittedCount} complaints</span>
                        </td>
                        <td>
                          <span className="badge badge-resolved" style={{ fontSize: 11 }}>Active</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CIVIC REPORTS */}
      {activeTab === "reports" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <div className="panel" style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: "var(--navy)" }}>Resolution Rate Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {STATUSES.map((s) => {
                const count = complaints.filter((c) => c.status === s.value).length;
                const pct = complaints.length > 0 ? Math.round((count / complaints.length) * 100) : 0;
                return (
                  <div key={s.value}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{translateStatus(s.value)}</span>
                      <span style={{ color: "var(--text-muted)" }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ background: "#f1f5f9", borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background:
                            s.value === "RESOLVED"
                              ? "#15803d"
                              : s.value === "IN_PROGRESS"
                              ? "#0284c7"
                              : s.value === "AWAITING_VERIFICATION"
                              ? "#d97706"
                              : s.value === "ASSIGNED"
                              ? "#7e22ce"
                              : s.value === "PENDING"
                              ? "#b45309"
                              : "#64748b",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel" style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", color: "var(--navy)" }}>Complaints by Category</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {CATEGORIES.filter((cat) => cat !== "ALL").map((cat) => {
                const count = complaints.filter((c) => c.category === cat).length;
                return (
                  <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{translateCategory(cat)}</span>
                    <span className="badge badge-assigned" style={{ fontSize: 12 }}>{count} reported</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* COMPLAINT DETAILS & AUDIT TIMELINE MODAL */}
      {selectedComplaint && (
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
              maxWidth: 720,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: "var(--navy)" }}>
                  Complaint #{selectedComplaint.id}
                </span>
                {getStatusBadge(selectedComplaint.status)}
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Problem Title & Description */}
              <div>
                <h3 style={{ margin: "0 0 6px", color: "var(--navy)", fontSize: 18 }}>
                  {selectedComplaint.title}
                </h3>
                <p style={{ margin: 0, color: "var(--text-main)", fontSize: 14, lineHeight: 1.6, background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Citizen Details */}
              {selectedComplaint.user && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#166534", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <User size={14} /> Reported by Citizen:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, color: "#14532d" }}>
                    <div>Name: <strong>{selectedComplaint.user.name}</strong></div>
                    <div>Phone: <strong>{selectedComplaint.user.phone || "Not provided"}</strong></div>
                    <div>Email: <strong>{selectedComplaint.user.email}</strong></div>
                    <div>Village/Ward: <strong>{selectedComplaint.user.village || "Gram Panchayat"}</strong></div>
                  </div>
                </div>
              )}

              {/* Attributes Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Category:</span>
                  <strong>{translateCategory(selectedComplaint.category)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Priority:</span>
                  <strong>{translatePriority(selectedComplaint.priority)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Location:</span>
                  <strong>{selectedComplaint.location || "Village area"}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Reported Date:</span>
                  <strong>{new Date(selectedComplaint.createdAt).toLocaleString()}</strong>
                </div>
              </div>

              {/* Worker Assignment Section */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--navy)" }}>Assigned Maintenance Technician:</h4>
                {selectedComplaint.worker ? (
                  <div style={{ background: "#f3e8ff", border: "1px solid #e9d5ff", padding: "12px 14px", borderRadius: 8, fontSize: 13 }}>
                    <div style={{ fontWeight: 700, color: "#7e22ce" }}>{selectedComplaint.worker.name}</div>
                    <div style={{ color: "#6b21a8", marginTop: 2 }}>
                      {selectedComplaint.worker.email} · {selectedComplaint.worker.phone || "No phone"}
                    </div>
                    {selectedComplaint.assignedAt && (
                      <div style={{ fontSize: 11, color: "#9333ea", marginTop: 4 }}>
                        Assigned on: {new Date(selectedComplaint.assignedAt).toLocaleString()}
                      </div>
                    )}
                    {selectedComplaint.deadline && (
                      <div style={{ fontSize: 12, color: "#b45309", marginTop: 4, fontWeight: 700 }}>
                        Completion Deadline: {new Date(selectedComplaint.deadline).toLocaleString()}
                      </div>
                    )}
                    {selectedComplaint.adminInstructions && (
                      <div style={{ marginTop: 8, padding: 8, background: "#fff", borderRadius: 6, border: "1px solid #e9d5ff" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#7e22ce" }}>ADMIN INSTRUCTIONS: </span>
                        <span style={{ fontSize: 12, color: "#4c1d95" }}>{selectedComplaint.adminInstructions}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No worker assigned yet.</span>
                )}
              </div>

              {/* Completion Reports for this complaint */}
              {complaintReportsList.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--navy)" }}>Submitted Work Completion Reports:</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {complaintReportsList.map((rep) => (
                      <div key={rep.id} style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 8, padding: 12, fontSize: 13 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <strong>Report #{rep.id} by {rep.worker?.name ?? rep.workerName ?? "Worker"}</strong>
                          <span className={`badge ${rep.reviewDecision === "APPROVED" ? "badge-resolved" : rep.reviewDecision === "REJECTED" ? "badge-priority-high" : "badge-assigned"}`} style={{ fontSize: 10 }}>
                            {rep.reviewDecision || "PENDING"}
                          </span>
                        </div>
                        <div>Work: {rep.workDescription}</div>
                        {rep.materialsUsed && <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Materials: {rep.materialsUsed}</div>}
                        {rep.proofDetails && <div style={{ color: "#15803d", fontSize: 12 }}>Proof: {rep.proofDetails}</div>}
                        {rep.adminComments && (
                          <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>
                            Admin Comment: "{rep.adminComments}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Audit History Timeline */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--navy)", display: "flex", alignItems: "center", gap: 6 }}>
                  <History size={16} /> Audit History & Progress Timeline:
                </h4>
                {loadingDetailsExtra ? (
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading history records...</div>
                ) : complaintHistoryList.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No event history recorded yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {complaintHistoryList.map((entry) => (
                      <div key={entry.id} style={{ display: "flex", gap: 12, fontSize: 13 }}>
                        <div style={{ width: 140, flexShrink: 0, fontSize: 11, color: "var(--text-muted)" }}>
                          {new Date(entry.createdAt).toLocaleString()}
                        </div>
                        <div style={{ flex: 1, paddingLeft: 10, borderLeft: "2px solid #cbd5e1" }}>
                          <span style={{ fontWeight: 700, color: "var(--navy)" }}>{entry.action || `Status: ${entry.newStatus}`}</span>{" "}
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>by {entry.performedByName || entry.changedByName || "Panchayat System"}</span>
                          {entry.previousStatus && entry.newStatus && (
                            <div style={{ fontSize: 11, color: "#1e3a8a", marginTop: 2 }}>
                              Transition: {entry.previousStatus} → {entry.newStatus}
                            </div>
                          )}
                          {entry.remarks && (
                            <div style={{ fontSize: 12, color: "var(--text-main)", marginTop: 2, fontStyle: "italic" }}>
                              "{entry.remarks}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                {selectedComplaint.status === "RESOLVED" && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={closingComplaint}
                    onClick={() => handleCloseComplaint(selectedComplaint.id)}
                    style={{ background: "#475569", color: "#fff", display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    {closingComplaint ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
                    Official Sign-Off & Close Complaint
                  </button>
                )}
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedComplaint(null)}
              >
                {t("action.close", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENT MODAL WITH DEADLINE & INSTRUCTIONS */}
      {assignModalComplaint && (
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
              maxWidth: 540,
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarClock size={20} color="#7e22ce" />
                <h3 style={{ margin: 0, fontSize: 18, color: "var(--navy)" }}>
                  Assign Task #{assignModalComplaint.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalComplaint(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleModalAssignSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <strong style={{ fontSize: 14, color: "var(--navy)" }}>{assignModalComplaint.title}</strong>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                  Location: {assignModalComplaint.location || "Village Area"} · Category: {translateCategory(assignModalComplaint.category)}
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Select Maintenance Worker *</label>
                <select
                  required
                  value={modalWorkerId}
                  onChange={(e) => setModalWorkerId(Number(e.target.value))}
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", boxSizing: "border-box" }}
                >
                  <option value="">-- Choose Authorized Field Worker --</option>
                  {workers
                    .filter((w) => w.active)
                    .map((w) => {
                      const activeCount = complaints.filter((c) => c.worker?.id === w.id && c.status !== "RESOLVED" && c.status !== "CLOSED").length;
                      return (
                        <option key={w.id} value={w.id}>
                          {w.name} ({activeCount} active tasks)
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Completion Deadline (Optional)</label>
                <input
                  type="datetime-local"
                  value={modalDeadline}
                  onChange={(e) => setModalDeadline(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Panchayat Instructions to Worker</label>
                <textarea
                  rows={3}
                  value={modalInstructions}
                  onChange={(e) => setModalInstructions(e.target.value)}
                  placeholder="e.g. Inspect overhead cable joint, coordinate with Ward 3 member before digging, ensure water valve is shut off..."
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", boxSizing: "border-box", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setAssignModalComplaint(null)}
                >
                  {t("action.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={modalAssigning || !modalWorkerId}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#7e22ce" }}
                >
                  {modalAssigning ? <Loader2 size={14} className="animate-spin" /> : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT COMPLETION REPORT MODAL */}
      {rejectModalReport && (
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
              maxWidth: 520,
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={20} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: 18, color: "var(--navy)" }}>
                  Reject Completion Report #{rejectModalReport.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalReport(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRejectCompletionReport} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <strong style={{ fontSize: 14, color: "var(--navy)" }}>
                  {rejectModalReport.complaint?.title ?? rejectModalReport.complaintTitle ?? "Complaint"}
                </strong>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                  Worker: {rejectModalReport.worker?.name ?? rejectModalReport.workerName ?? "Panchayat Technician"}
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5, color: "#991b1b" }}>
                  Rejection Reason & Required Remediation *
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Specify what work remains incomplete or unsatisfactory (e.g. Pipeline still leaking at the T-joint, rubble not cleared from road, transformer trip fuse needs secondary check)..."
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", boxSizing: "border-box", fontSize: 13 }}
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                  This message will be shown to the worker so they can fix the issue and submit an updated report.
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setRejectModalReport(null)}
                >
                  {t("action.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={reportActionLoading || !rejectReason.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#dc2626" }}
                >
                  {reportActionLoading ? <Loader2 size={14} className="animate-spin" /> : "Reject & Return to Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE WORKER MODAL */}
      {isWorkerModalOpen && (
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
                <HardHat size={20} color="#b45309" />
                <h3 style={{ margin: 0, fontSize: 18, color: "var(--navy)" }}>Provision New Maintenance Worker</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkerModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Worker Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={newWorker.name}
                  onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="suresh.worker@gramconnect.gov.in"
                  value={newWorker.email}
                  onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Temporary password"
                  value={newWorker.password}
                  onChange={(e) => setNewWorker({ ...newWorker, password: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={newWorker.phone || ""}
                  onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsWorkerModalOpen(false)}
                >
                  {t("action.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={workerCreating}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#b45309" }}
                >
                  {workerCreating ? <Loader2 size={14} className="animate-spin" /> : "Create Worker Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
