import { Link } from "react-router-dom";
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Target, 
  Sparkles, 
  ArrowRight,
  Database,
  Cpu
} from "lucide-react";

export default function About() {
  return (
    <main className="container" style={{ maxWidth: 900 }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div className="badge-tag">
          <Sparkles size={14} /> Digital India · Rural Governance
        </div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 36, fontWeight: 800, margin: "12px 0", color: "var(--navy)" }}>
          About GramConnect
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 640, margin: "0 auto", lineHeight: 1.7 }}>
          GramConnect is a modern civic-tech full-stack web application designed to bridge the gap between rural citizens, field maintenance workers, and Gram Panchayat officers.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 40 }}>
        <div className="panel">
          <Target size={28} style={{ color: "var(--primary)", marginBottom: 12 }} />
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, margin: "0 0 8px", color: "var(--navy)" }}>
            Our Mission
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Empower every villager with a transparent, voice-driven channel to report civic issues like water leaks, road damage, and electricity outages with zero paperwork.
          </p>
        </div>

        <div className="panel">
          <ShieldCheck size={28} style={{ color: "#1e3a8a", marginBottom: 12 }} />
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, margin: "0 0 8px", color: "var(--navy)" }}>
            Accountability
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Every reported issue is assigned an official tracking ID in PostgreSQL. Status transitions are monitored and visible to citizens and panchayat supervisors alike.
          </p>
        </div>

        <div className="panel">
          <Users size={28} style={{ color: "#7e22ce", marginBottom: 12 }} />
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, margin: "0 0 8px", color: "var(--navy)" }}>
            Community-Driven
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Fosters local civic participation, encouraging villagers and panchayat representatives to collaborate on rapid issue resolution.
          </p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 40 }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 20, margin: "0 0 16px", color: "var(--navy)" }}>
          Technology Architecture
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, margin: "0 0 16px" }}>
          GramConnect is engineered with an enterprise-grade full-stack architecture:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div style={{ padding: 16, background: "var(--surface-alt)", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>
              <Cpu size={16} /> Frontend Layer
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              React 19, TypeScript, Vite, React Router, and Lucide React icons for responsive, accessible UX.
            </div>
          </div>

          <div style={{ padding: 16, background: "var(--surface-alt)", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>
              <Building2 size={16} /> Backend REST API
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Java 21, Spring Boot 3.5, Spring Web, Spring Data JPA, Hibernate ORM, and Bean Validation.
            </div>
          </div>

          <div style={{ padding: 16, background: "var(--surface-alt)", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>
              <Database size={16} /> Relational Persistence
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              PostgreSQL (<code>gramconnect_db</code>) with robust schema constraints and status lifecycle tracking.
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <Link className="btn btn-primary" to="/report">
          Experience GramConnect <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}