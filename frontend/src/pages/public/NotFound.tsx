import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="container" style={{ textAlign: "center", padding: "80px 24px" }}>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 72, fontWeight: 800, color: "var(--navy)", margin: 0 }}>
        404
      </h1>
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: "12px 0 8px", color: "var(--navy)" }}>
        Page Not Found
      </h2>
      <p style={{ color: "var(--text-muted)", maxWidth: 440, margin: "0 auto 28px" }}>
        The page you are looking for does not exist or may have been relocated.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <Link className="btn btn-primary" to="/">
          <Home size={16} /> Return Home
        </Link>
        <Link className="btn btn-secondary" to="/complaints">
          <ArrowLeft size={16} /> View Complaints
        </Link>
      </div>
    </main>
  );
}