import { useState, useEffect, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ListFilter, 
  Loader2,
  MapPin,
  Tag,
  AlertTriangle,
  FileText
} from "lucide-react";
import { reportComplaint } from "../../services/complaintService";
import type { Complaint } from "../../types/complaint";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../hooks/useAuth";

const CATEGORIES = [
  "Water Supply",
  "Roads",
  "Electricity",
  "Street Lights",
  "Garbage",
  "Drainage",
  "Sanitation",
  "Other"
];

const PRIORITIES = [
  { value: "LOW", label: "Low (Normal routine issue)", hint: "Non-urgent, can be addressed in schedule" },
  { value: "MEDIUM", label: "Medium (Affects several households)", hint: "Standard priority issue" },
  { value: "HIGH", label: "High (Urgent / safety hazard)", hint: "Immediate attention requested" },
];

export default function ReportProblem() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "Water Supply";

  const { t, translateCategory } = useLanguage();
  const { showToast, addNotification } = useNotifications();
  const { user, isAuthenticated } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [location, setLocation] = useState(user?.village || "");
  const [priority, setPriority] = useState("MEDIUM");

  const [loading, setLoading] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && CATEGORIES.includes(cat)) {
      setCategory(cat);
    }
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    if (!title.trim()) {
      setErrorMessage("Please enter a descriptive title for the issue.");
      return;
    }
    if (!description.trim()) {
      setErrorMessage("Please provide details in the description.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const created = await reportComplaint({
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim() || undefined,
        priority,
      });

      setSubmittedComplaint(created);

      // Trigger interactive Toast & In-App Notification
      showToast({
        type: "success",
        title: "Complaint Registered!",
        message: `Issue #${created.id} successfully saved to the Gram Panchayat database.`,
      });

      addNotification({
        title: `Complaint #${created.id} Filed`,
        message: `Your complaint "${created.title}" has been registered with status PENDING.`,
        type: "status",
        complaintId: created.id,
        link: "/my-complaints",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setLocation("");
      setPriority("MEDIUM");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Submission failed. Please check network.";
      setErrorMessage(message);
      showToast({
        type: "error",
        title: "Submission Failed",
        message: message,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSubmittedComplaint(null);
    setErrorMessage("");
  }

  return (
    <main className="container" style={{ maxWidth: 760, paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <Link 
          to="/complaints" 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 6, 
            fontSize: 13, 
            color: "var(--text-muted)",
            fontWeight: 600,
            marginBottom: 12,
            textDecoration: "none"
          }}
        >
          <ArrowLeft size={16} /> {t("action.track", "Back to Complaints List")}
        </Link>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 800, margin: "0 0 8px", color: "var(--navy)" }}>
          {t("report.title", "Report a Village Problem")}
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: 15 }}>
          {t("report.desc", "File a public utility or civic problem directly with the Gram Panchayat. All reports are logged into PostgreSQL for official action.")}
        </p>

        {isAuthenticated && user && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13, color: "#166534" }}>
            Filing as authenticated resident: <strong>{user.name}</strong> ({user.village || user.email})
          </div>
        )}
      </div>

      {submittedComplaint ? (
        <div className="panel" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div 
            style={{ 
              width: 64, 
              height: 64, 
              borderRadius: "50%", 
              background: "var(--primary-light)", 
              color: "var(--primary)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              margin: "0 auto 20px"
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <span className="badge badge-resolved" style={{ marginBottom: 12 }}>
            {t("report.success.title", "Complaint Successfully Registered")}
          </span>

          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: "10px 0 6px", color: "var(--navy)" }}>
            Complaint #{submittedComplaint.id}
          </h2>

          <p style={{ color: "var(--text-muted)", maxWidth: 480, margin: "0 auto 24px" }}>
            Your grievance <strong>"{submittedComplaint.title}"</strong> has been logged into the village records with status <strong>{submittedComplaint.status}</strong>.
          </p>

          <div 
            style={{ 
              background: "var(--surface-alt)", 
              borderRadius: "var(--radius-md)", 
              padding: 20, 
              maxWidth: 480, 
              margin: "0 auto 32px",
              textAlign: "left",
              fontSize: 14
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--text-muted)" }}>Category:</span>
              <strong>{translateCategory(submittedComplaint.category)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--text-muted)" }}>Location:</span>
              <strong>{submittedComplaint.location || "General Village Area"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "var(--text-muted)" }}>Priority:</span>
              <span className={`badge badge-priority-${String(submittedComplaint.priority).toLowerCase()}`}>
                {submittedComplaint.priority}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Logged At:</span>
              <span>{new Date(submittedComplaint.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <Link className="btn btn-primary" to="/my-complaints">
              <ListFilter size={16} /> Track My Complaints
            </Link>
            <button className="btn btn-secondary" onClick={handleReset}>
              Submit Another Problem
            </button>
          </div>
        </div>
      ) : (
        <div className="panel">
          {errorMessage && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: 20 }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong>Submission Error:</strong> {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label htmlFor="title" style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--navy)" }}>
                {t("report.form.title", "Problem Title")} <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                id="title"
                className="form-input"
                type="text"
                placeholder={t("report.form.titlePlaceholder", "Brief summary (e.g., Broken water pipe near main temple)")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
                style={{ width: "100%", padding: 11, borderRadius: 8, border: "1px solid var(--border)", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
              <div>
                <label htmlFor="category" style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--navy)" }}>
                  {t("report.form.category", "Problem Category")} <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select
                  id="category"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "100%", padding: 11, borderRadius: 8, border: "1px solid var(--border)", boxSizing: "border-box" }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {translateCategory(cat)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority" style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--navy)" }}>
                  {t("report.form.priority", "Urgency / Priority")}
                </label>
                <select
                  id="priority"
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{ width: "100%", padding: 11, borderRadius: 8, border: "1px solid var(--border)", boxSizing: "border-box" }}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 18 }}>
              <label htmlFor="location" style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--navy)" }}>
                {t("report.form.location", "Specific Village Location / Ward")}
              </label>
              <input
                id="location"
                className="form-input"
                type="text"
                placeholder={t("report.form.locationPlaceholder", "e.g., Ward 4, Near Primary School")}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={100}
                style={{ width: "100%", padding: 11, borderRadius: 8, border: "1px solid var(--border)", boxSizing: "border-box" }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label htmlFor="description" style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--navy)" }}>
                {t("report.form.desc", "Detailed Problem Description")} <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                id="description"
                className="form-textarea"
                rows={5}
                placeholder={t("report.form.descPlaceholder", "Describe the issue in detail...")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                required
                style={{ width: "100%", padding: 11, borderRadius: 8, border: "1px solid var(--border)", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Link to="/complaints" className="btn btn-secondary">
                {t("action.cancel", "Cancel")}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 160 }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> {t("report.form.submitting", "Submitting...")}
                  </>
                ) : (
                  <>
                    <Send size={16} /> {t("report.form.submit", "Submit Complaint")}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
