import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { UserRole } from "../../types/auth";
import { Loader2, ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <Loader2 size={36} className="spin" style={{ color: "#15803d" }} />
        <p style={{ color: "#64748b", fontWeight: 600 }}>Verifying credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Pick the most relevant login page if single role is specified
    let targetLogin = "/login";
    if (allowedRoles?.length === 1) {
      if (allowedRoles[0] === "ADMIN") targetLogin = "/login/admin";
      else if (allowedRoles[0] === "WORKER") targetLogin = "/login/worker";
      else if (allowedRoles[0] === "VILLAGER") targetLogin = "/login/user";
    }
    return <Navigate to={targetLogin} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <main className="container" style={{ padding: "60px 20px", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <div style={{ background: "#fff", border: "1px solid #fee2e2", borderRadius: 12, padding: 36, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ color: "#991b1b", marginBottom: 8 }}>Access Restricted</h2>
          <p style={{ color: "#64748b", marginBottom: 24 }}>
            Your account ({user.email}) has role <strong>{user.role}</strong> and is not authorized to access this section.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {user.role === "ADMIN" && <a href="/admin" className="btn btn-primary">Go to Admin Dashboard</a>}
            {user.role === "WORKER" && <a href="/worker" className="btn btn-primary">Go to Worker Dashboard</a>}
            {user.role === "VILLAGER" && <a href="/my-complaints" className="btn btn-primary">Go to My Complaints</a>}
            <a href="/login" className="btn btn-secondary">Switch Account</a>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
