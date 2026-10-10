import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Droplets, 
  Car, 
  Zap, 
  Lightbulb, 
  Trash2, 
  Waves, 
  HelpCircle, 
  PlusCircle, 
  ListFilter, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight,
  Shield,
  Layers,
  Phone
} from "lucide-react";
import { getComplaintStats } from "../../services/complaintService";
import type { ComplaintStats } from "../../types/complaint";
import { useLanguage } from "../../context/LanguageContext";

export default function Home() {
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const { t, translateCategory, translateStatus } = useLanguage();

  useEffect(() => {
    getComplaintStats()
      .then((data) => setStats(data))
      .catch((err) => console.error("Could not fetch stats for homepage:", err))
      .finally(() => setLoadingStats(false));
  }, []);

  const categories = [
    {
      title: "Water Supply",
      desc: "Shortage, pipeline leaks, contaminated drinking water, or tap malfunctions.",
      icon: <Droplets size={24} />,
      badgeClass: "cat-water",
      action: "Water Supply"
    },
    {
      title: "Roads",
      desc: "Potholes, broken village roads, blockages, or unpaved road hazards.",
      icon: <Car size={24} />,
      badgeClass: "cat-roads",
      action: "Roads"
    },
    {
      title: "Electricity",
      desc: "Power outages, low voltage, damaged transformers, or exposed cables.",
      icon: <Zap size={24} />,
      badgeClass: "cat-electric",
      action: "Electricity"
    },
    {
      title: "Street Lights",
      desc: "Burnt bulbs, dark public lanes, non-functional poles, or timer issues.",
      icon: <Lightbulb size={24} />,
      badgeClass: "cat-light",
      action: "Street Lights"
    },
    {
      title: "Garbage",
      desc: "Uncollected public waste, overflowing village bins, or illegal dumping.",
      icon: <Trash2 size={24} />,
      badgeClass: "cat-garbage",
      action: "Garbage"
    },
    {
      title: "Drainage",
      desc: "Clogged storm drains, stagnant waste water, overflow, and mosquito risks.",
      icon: <Waves size={24} />,
      badgeClass: "cat-drainage",
      action: "Drainage"
    },
    {
      title: "Other",
      desc: "Public hygiene, school infrastructure, community hall, and related concerns.",
      icon: <HelpCircle size={24} />,
      badgeClass: "cat-other",
      action: "Other"
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Report the Problem",
      desc: "Villagers describe the civic issue, pick the category, specify village location, and set urgency priority.",
      icon: <PlusCircle size={20} color="#15803d" />
    },
    {
      step: "02",
      title: "Panchayat Verification",
      desc: "Local administration and gram panchayat review the issue, assign ground workers, and track execution.",
      icon: <Clock size={20} color="#1e3a8a" />
    },
    {
      step: "03",
      title: "Verified Resolution",
      desc: "Field workers execute repairs, update status to Resolved, and villagers verify the live progress.",
      icon: <CheckCircle2 size={20} color="#15803d" />
    }
  ];

  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="badge-tag">
          <Sparkles size={14} /> {t("hero.badge", "GramConnect · Smart Rural Governance")}
        </div>
        <h1>
          {t("hero.title", "Together for a Better Village")}
        </h1>
        <p>
          {t("hero.desc", "Empowering citizens and gram panchayats to report village problems, track real-time resolutions, and build cleaner, safer, and self-reliant communities.")}
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/report">
            <PlusCircle size={18} /> {t("hero.reportBtn", "Report a Problem")}
          </Link>
          <Link className="btn btn-secondary" to="/complaints">
            <ListFilter size={18} /> {t("hero.trackBtn", "View Complaints")}
          </Link>
          <Link className="btn btn-secondary" to="/login" style={{ background: "#ffffff", borderColor: "var(--border)" }}>
            {t("hero.loginHub", "Access Portals")} →
          </Link>
        </div>
      </section>

      {/* Live Backend Statistics Overview */}
      <section className="stats-bar-container" aria-label="Village Statistics">
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-val" style={{ color: "#1e3a8a" }}>
              {loadingStats ? "..." : (stats?.total ?? 0)}
            </span>
            <span className="stat-lbl">{t("action.search", "Total Complaints")}</span>
          </div>
          <div className="stat-box">
            <span className="stat-val" style={{ color: "#b45309" }}>
              {loadingStats ? "..." : (stats?.pending ?? 0)}
            </span>
            <span className="stat-lbl">{translateStatus("PENDING")}</span>
          </div>
          <div className="stat-box">
            <span className="stat-val" style={{ color: "#7e22ce" }}>
              {loadingStats ? "..." : (stats?.assigned ?? 0)}
            </span>
            <span className="stat-lbl">{translateStatus("ASSIGNED")}</span>
          </div>
          <div className="stat-box">
            <span className="stat-val" style={{ color: "#0284c7" }}>
              {loadingStats ? "..." : (stats?.inProgress ?? 0)}
            </span>
            <span className="stat-lbl">{translateStatus("IN_PROGRESS")}</span>
          </div>
          <div className="stat-box">
            <span className="stat-val" style={{ color: "#15803d" }}>
              {loadingStats ? "..." : (stats?.resolved ?? 0)}
            </span>
            <span className="stat-lbl">{translateStatus("RESOLVED")}</span>
          </div>
        </div>
      </section>

      {/* Problem Categories Section */}
      <section className="container">
        <div className="section-header">
          <span className="sub-title">Civic Services</span>
          <h2>Problem Categories We Solve</h2>
          <p>
            Choose from essential public utility categories to submit issues directly to the local gram panchayat authority.
          </p>
        </div>

        <div className="categories-grid">
          {categories.map((cat) => (
            <div key={cat.title} className="category-card">
              <div className={`cat-icon-wrap ${cat.badgeClass}`}>
                {cat.icon}
              </div>
              <h3>{translateCategory(cat.title)}</h3>
              <p>{cat.desc}</p>
              <div style={{ marginTop: "auto", paddingTop: 8 }}>
                <Link 
                  to={`/report?category=${encodeURIComponent(cat.action)}`} 
                  style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: 6, 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: "var(--primary)" 
                  }}
                >
                  {t("nav.report", "Report")} {translateCategory(cat.title)} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="section-header" style={{ marginTop: 60 }}>
          <span className="sub-title">Transparent Governance</span>
          <h2>How GramConnect Works</h2>
          <p>
            Three simple steps bridging rural residents, field workers, and gram panchayat officers.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((st) => (
            <div key={st.step} className="step-card">
              <div className="step-num">{st.step}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {st.icon}
                <h3 style={{ margin: 0 }}>{st.title}</h3>
              </div>
              <p>{st.desc}</p>
            </div>
          ))}
        </div>

        {/* Civic Quick Action Banner */}
        <div 
          style={{ 
            background: "linear-gradient(135deg, #15803d, #1e3a8a)", 
            borderRadius: "var(--radius-lg)", 
            padding: "40px clamp(20px, 4vw, 48px)", 
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
            boxShadow: "var(--shadow-lg)",
            marginTop: 48,
          }}
        >
          <div style={{ maxWidth: 600 }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px", color: "#fff" }}>
              Notice a problem in your street or village?
            </h3>
            <p style={{ margin: 0, opacity: 0.9, fontSize: 15 }}>
              Submit an online report in less than 2 minutes. No paperwork or long waits needed.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="btn btn-secondary" to="/report" style={{ color: "#15803d", border: "none" }}>
              <PlusCircle size={16} /> {t("nav.report", "File New Complaint")}
            </Link>
            <Link className="btn btn-secondary" to="/login" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
              <Shield size={16} /> {t("nav.login", "Role Portals")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}