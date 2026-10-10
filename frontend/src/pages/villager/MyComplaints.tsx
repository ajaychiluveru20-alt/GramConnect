import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  RotateCw, 
  X, 
  PlusCircle, 
  Inbox, 
  MapPin, 
  Calendar, 
  Tag, 
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  UserCheck,
  CheckCircle2,
  Clock,
  Wrench,
  User,
  ClipboardCheck,
  History,
  Phone
} from "lucide-react";
import { 
  getComplaints, 
  getMyComplaints, 
  getComplaintHistory, 
  getComplaintReports 
} from "../../services/complaintService";
import type { Complaint, ComplaintHistory, WorkReport } from "../../types/complaint";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";

const CATEGORY_KEYS = [
  "ALL",
  "Water Supply",
  "Roads",
  "Electricity",
  "Street Lights",
  "Garbage",
  "Drainage",
  "Sanitation",
  "Other"
];

export default function MyComplaints() {
  const { user, isAuthenticated } = useAuth();
  const { t, translateCategory, translateStatus, translatePriority } = useLanguage();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");

  // Expanded row details state
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [historyMap, setHistoryMap] = useState<Record<number, ComplaintHistory[]>>({});
  const [reportsMap, setReportsMap] = useState<Record<number, WorkReport[]>>({});
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);

  async function loadComplaints(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage("");

    try {
      // If logged in as villager, fetch specifically their submitted complaints
      const data = isAuthenticated && user?.role === "VILLAGER" 
        ? await getMyComplaints() 
        : await getComplaints();
      setComplaints(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load complaints from backend.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, [isAuthenticated, user?.role]);

  // Handle expanding row and fetching extra audit / completion report details
  async function toggleExpandRow(complaintId: number) {
    if (expandedRowId === complaintId) {
      setExpandedRowId(null);
      return;
    }

    setExpandedRowId(complaintId);

    // Fetch history and reports if not already cached
    if (!historyMap[complaintId] || !reportsMap[complaintId]) {
      setLoadingRowId(complaintId);
      try {
        const [hist, reps] = await Promise.all([
          getComplaintHistory(complaintId).catch(() => []),
          getComplaintReports(complaintId).catch(() => []),
        ]);
        setHistoryMap((prev) => ({ ...prev, [complaintId]: hist }));
        setReportsMap((prev) => ({ ...prev, [complaintId]: reps }));
      } catch {
        // ignore
      } finally {
        setLoadingRowId(null);
      }
    }
  }

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesId = String(c.id) === query || `#${c.id}` === query;
        const matchesTitle = c.title.toLowerCase().includes(query);
        const matchesCategory = c.category.toLowerCase().includes(query);
        const matchesLocation = c.location ? c.location.toLowerCase().includes(query) : false;
        const matchesDesc = c.description.toLowerCase().includes(query);

        if (!matchesId && !matchesTitle && !matchesCategory && !matchesLocation && !matchesDesc) {
          return false;
        }
      }

      if (selectedStatus !== "ALL" && c.status !== selectedStatus) return false;
      if (selectedCategory !== "ALL" && c.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (selectedPriority !== "ALL" && String(c.priority).toUpperCase() !== selectedPriority) return false;

      return true;
    });
  }, [complaints, searchTerm, selectedStatus, selectedCategory, selectedPriority]);

  const hasActiveFilters = searchTerm !== "" || selectedStatus !== "ALL" || selectedCategory !== "ALL" || selectedPriority !== "ALL";

  function clearFilters() {
    setSearchTerm("");
    setSelectedStatus("ALL");
    setSelectedCategory("ALL");
    setSelectedPriority("ALL");
  }

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

  function getStepStatus(currentStatus: string, step: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "AWAITING_VERIFICATION" | "RESOLVED") {
    const order = ["PENDING", "ASSIGNED", "IN_PROGRESS", "AWAITING_VERIFICATION", "RESOLVED", "CLOSED"];
    const currentIdx = order.indexOf(currentStatus);
    const stepIdx = order.indexOf(step);

    if (currentIdx >= stepIdx) return "completed";
    return "upcoming";
  }

  return (
    <main className="container" style={{ paddingBottom: 60 }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            {isAuthenticated && user?.role === "VILLAGER" ? (
              <span className="badge badge-resolved" style={{ fontSize: 11 }}>
                <User size={12} /> Resident Dashboard: {user.name} ({user.village || "Villager"})
              </span>
            ) : (
              <span className="badge badge-assigned" style={{ fontSize: 11 }}>
                Civic Transparency Portal
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 800, margin: "0 0 6px", color: "var(--navy)" }}>
            {isAuthenticated && user?.role === "VILLAGER" ? t("nav.myComplaints", "My Reported Complaints") : t("nav.complaints", "Village Complaints Tracker")}
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: 15 }}>
            {isAuthenticated && user?.role === "VILLAGER"
              ? "Track resolution stages, technician assignment, work completion reports, and Panchayat approvals for your grievances."
              : "Monitor reported community problems and verify real-time Panchayat resolution actions."}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={() => loadComplaints(true)}
            disabled={refreshing || loading}
          >
            <RotateCw size={15} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : t("action.refresh", "Refresh")}
          </button>
          <Link className="btn btn-primary btn-sm" to="/report">
            <PlusCircle size={15} /> {t("nav.report", "Report New Issue")}
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 20 }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by ID, keyword, category, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          aria-label="Filter by Status"
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">{translateStatus("PENDING")}</option>
          <option value="ASSIGNED">{translateStatus("ASSIGNED")}</option>
          <option value="IN_PROGRESS">{translateStatus("IN_PROGRESS")}</option>
          <option value="AWAITING_VERIFICATION">{translateStatus("AWAITING_VERIFICATION")}</option>
          <option value="RESOLVED">{translateStatus("RESOLVED")}</option>
          <option value="CLOSED">{translateStatus("CLOSED")}</option>
        </select>

        <select
          aria-label="Filter by Category"
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {CATEGORY_KEYS.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "ALL" ? "All Categories" : translateCategory(cat)}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by Priority"
          className="filter-select"
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
        >
          <option value="ALL">All Priorities</option>
          <option value="HIGH">{translatePriority("HIGH")}</option>
          <option value="MEDIUM">{translatePriority("MEDIUM")}</option>
          <option value="LOW">{translatePriority("LOW")}</option>
        </select>

        {hasActiveFilters && (
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={clearFilters}
            style={{ color: "#dc2626", borderColor: "#fca5a5" }}
          >
            <X size={14} /> {t("action.clearFilters", "Clear")}
          </button>
        )}
      </div>

      {/* Table section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, fontSize: 13, color: "var(--text-muted)" }}>
        <span>
          Showing <strong>{filteredComplaints.length}</strong> of <strong>{complaints.length}</strong> complaints
        </span>
      </div>

      {loading ? (
        <div className="panel empty-state">
          <RotateCw size={36} className="animate-spin" style={{ color: "var(--primary)", margin: "0 auto 16px" }} />
          <h3>Loading village records...</h3>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="panel empty-state">
          <Inbox size={32} style={{ color: "var(--text-subtle)", margin: "0 auto 12px" }} />
          <h3>No complaints found</h3>
          <p>
            {hasActiveFilters
              ? "No records matched your search or filter criteria. Try clearing some filters."
              : "No complaints have been recorded yet."}
          </p>
          <Link className="btn btn-primary btn-sm" to="/report" style={{ marginTop: 12 }}>
            <PlusCircle size={15} /> {t("nav.report", "Report a Problem")}
          </Link>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>Title & Category</th>
                <th>Village Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Worker</th>
                <th>Reported Date</th>
                <th style={{ textAlign: "right", width: 90 }}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((c) => {
                const isExpanded = expandedRowId === c.id;
                const historyItems = historyMap[c.id] || [];
                const reportItems = reportsMap[c.id] || [];
                const isLoadingExtra = loadingRowId === c.id;
                const latestReport = reportItems[0];

                return (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: "var(--navy)" }}>#{c.id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--navy)" }}>{c.title}</div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        <Tag size={11} /> {translateCategory(c.category)}
                      </span>

                      {/* Expanded Lifecycle & Notes View */}
                      {isExpanded && (
                        <div style={{ marginTop: 14, padding: 18, background: "var(--surface-alt)", borderRadius: 10, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 14 }}>
                          {/* Problem Full Description */}
                          <div>
                            <div style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--navy)" }}>
                              <FileText size={14} /> Full Problem Description:
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: "var(--text-main)", lineHeight: 1.6, background: "#fff", padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}>
                              {c.description}
                            </p>
                          </div>

                          {/* 5-Stage Lifecycle Tracker */}
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
                              Resolution Stage Tracker:
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              {[
                                { key: "PENDING", label: translateStatus("PENDING") },
                                { key: "ASSIGNED", label: translateStatus("ASSIGNED") },
                                { key: "IN_PROGRESS", label: translateStatus("IN_PROGRESS") },
                                { key: "AWAITING_VERIFICATION", label: translateStatus("AWAITING_VERIFICATION") },
                                { key: "RESOLVED", label: translateStatus("RESOLVED") },
                              ].map((step, idx) => {
                                const status = getStepStatus(c.status, step.key as any);
                                const isDone = status === "completed";
                                return (
                                  <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: "4px 8px",
                                        borderRadius: 6,
                                        background: isDone ? "#dcfce7" : "#f1f5f9",
                                        color: isDone ? "#15803d" : "#94a3b8",
                                      }}
                                    >
                                      {isDone && <CheckCircle2 size={12} />} {step.label}
                                    </span>
                                    {idx < 4 && <span style={{ color: "#cbd5e1" }}>→</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Worker Assignment Details */}
                          {c.worker && (
                            <div style={{ background: "#f3e8ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: 12 }}>
                              <div style={{ fontWeight: 700, color: "#7e22ce", fontSize: 13, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                                <UserCheck size={14} /> Assigned Maintenance Technician:
                              </div>
                              <div style={{ fontSize: 13, color: "#6b21a8" }}>
                                <strong>{c.worker.name}</strong> · Contact: {c.worker.phone || c.worker.email}
                              </div>
                              {c.deadline && (
                                <div style={{ fontSize: 12, color: "#b45309", marginTop: 4, fontWeight: 700 }}>
                                  Estimated Completion Target: {new Date(c.deadline).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Completion Report Details (if submitted by worker) */}
                          {latestReport && (
                            <div style={{ background: latestReport.reviewDecision === "APPROVED" ? "#f0fdf4" : "#fefce8", border: `1px solid ${latestReport.reviewDecision === "APPROVED" ? "#bbf7d0" : "#fef08a"}`, borderRadius: 8, padding: 14 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <div style={{ fontWeight: 700, color: latestReport.reviewDecision === "APPROVED" ? "#166534" : "#854d0e", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                                  <ClipboardCheck size={15} /> Worker's Completion Report & Proof:
                                </div>
                                <span className={`badge ${latestReport.reviewDecision === "APPROVED" ? "badge-resolved" : "badge-assigned"}`} style={{ fontSize: 10 }}>
                                  {latestReport.reviewDecision === "APPROVED" ? "Verified & Approved" : "Awaiting Panchayat Verification"}
                                </span>
                              </div>
                              <div style={{ fontSize: 13, color: "var(--text-main)", marginBottom: 4 }}>
                                <strong>Action Taken:</strong> {latestReport.workDescription}
                              </div>
                              {latestReport.materialsUsed && (
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                                  <strong>Materials:</strong> {latestReport.materialsUsed}
                                </div>
                              )}
                              {latestReport.proofDetails && (
                                <div style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>
                                  <strong>Proof / Site Inspection:</strong> {latestReport.proofDetails}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Resolution Notes (if completed) */}
                          {c.resolutionNotes && !latestReport && (
                            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12 }}>
                              <div style={{ fontWeight: 700, color: "#166534", fontSize: 12, marginBottom: 2 }}>
                                Resolution Notes from Worker:
                              </div>
                              <p style={{ margin: 0, fontSize: 13, color: "#14532d", fontStyle: "italic" }}>
                                "{c.resolutionNotes}"
                              </p>
                              {c.resolvedAt && (
                                <div style={{ fontSize: 11, color: "#15803d", marginTop: 4 }}>
                                  Resolved on {new Date(c.resolvedAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Event Timeline / Progress Updates */}
                          {isLoadingExtra ? (
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading timeline...</div>
                          ) : historyItems.length > 0 && (
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                                <History size={13} /> Activity History:
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {historyItems.map((h) => (
                                  <div key={h.id} style={{ fontSize: 12, display: "flex", gap: 8, color: "var(--text-muted)" }}>
                                    <span style={{ minWidth: 120 }}>{new Date(h.createdAt).toLocaleDateString()}</span>
                                    <span style={{ fontWeight: 600, color: "var(--navy)" }}>{h.action || `Status: ${h.newStatus}`}</span>
                                    {h.remarks && <span>— "{h.remarks}"</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
                        <MapPin size={12} /> {c.location || "Village Area"}
                      </span>
                    </td>
                    <td>{getPriorityBadge(c.priority)}</td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td>
                      {c.worker ? (
                        <div style={{ fontSize: 13 }}>
                          <span style={{ fontWeight: 700, color: "#7e22ce", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <UserCheck size={13} /> {c.worker.name}
                          </span>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {c.worker.phone || "Panchayat Tech"}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-subtle)", fontSize: 12 }}>Awaiting Assignment</span>
                      )}
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)" }}>
                        <Calendar size={12} /> {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => toggleExpandRow(c.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "6px 10px", fontSize: 11 }}
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {isExpanded ? "Hide" : t("action.track", "Track")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
