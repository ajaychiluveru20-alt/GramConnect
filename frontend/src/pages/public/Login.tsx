import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { UserRole } from "../../types/auth";
import { 
  ShieldCheck, 
  HardHat, 
  Users, 
  ArrowLeft, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  KeyRound
} from "lucide-react";

interface PortalConfig {
  role: UserRole;
  slug: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  primaryColor: string;
  lightBg: string;
  gradient: string;
  demoEmail: string;
  demoPass: string;
  features: string[];
  redirectPath: string;
}

const PORTALS: Record<string, PortalConfig> = {
  admin: {
    role: "ADMIN",
    slug: "admin",
    title: "Admin Login",
    subtitle: "Panchayat Head, Sarpanch & Administrative Officers",
    badge: "OFFICIAL ACCESS",
    icon: ShieldCheck,
    primaryColor: "#1e3a8a",
    lightBg: "#eff6ff",
    gradient: "linear-gradient(135deg, #1e3a8a, #2563eb)",
    demoEmail: "admin@gramconnect.gov.in",
    demoPass: "Admin@123",
    features: [
      "Manage all village complaints & assignments",
      "Assign tasks to qualified workers",
      "Create & manage maintenance worker accounts",
      "Civic analytics, reports & villager registry",
    ],
    redirectPath: "/admin",
  },
  worker: {
    role: "WORKER",
    slug: "worker",
    title: "Worker Login",
    subtitle: "Field Technicians, Electricians, Plumbers & Sanitation Staff",
    badge: "FIELD STAFF",
    icon: HardHat,
    primaryColor: "#b45309",
    lightBg: "#fffbeb",
    gradient: "linear-gradient(135deg, #b45309, #d97706)",
    demoEmail: "worker@gramconnect.gov.in",
    demoPass: "Worker@123",
    features: [
      "View complaints assigned to your account",
      "Accept jobs & change status to In Progress",
      "Submit completion notes & resolution proof",
      "View history of resolved field work",
    ],
    redirectPath: "/worker",
  },
  user: {
    role: "VILLAGER",
    slug: "user",
    title: "User / Villager Login",
    subtitle: "Village Residents & Citizen Community",
    badge: "CITIZEN PORTAL",
    icon: Users,
    primaryColor: "#15803d",
    lightBg: "#f0fdf4",
    gradient: "linear-gradient(135deg, #15803d, #16a34a)",
    demoEmail: "villager@gramconnect.gov.in",
    demoPass: "User@123",
    features: [
      "Report local civic & infrastructure problems",
      "Track complaint status in real-time",
      "View assigned worker & resolution details",
      "Free self-service registration for all villagers",
    ],
    redirectPath: "/my-complaints",
  },
};

export default function Login() {
  const { role: routeRole } = useParams<{ role?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  // Normalize role slug (support 'villager' as alias for 'user')
  const activeSlug = routeRole === "villager" ? "user" : routeRole;
  const currentPortal = activeSlug && PORTALS[activeSlug] ? PORTALS[activeSlug] : null;

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // If already authenticated and matches, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "ADMIN") navigate("/admin");
      else if (user.role === "WORKER") navigate("/worker");
      else if (user.role === "VILLAGER") navigate("/my-complaints");
    }
  }, [isAuthenticated, user, navigate]);

  // Set default email/password hints when switching portal
  useEffect(() => {
    setError(null);
    setSuccess(null);
    if (currentPortal) {
      setEmail("");
      setPassword("");
    }
  }, [currentPortal]);

  function fillDemoCredentials() {
    if (!currentPortal) return;
    setEmail(currentPortal.demoEmail);
    setPassword(currentPortal.demoPass);
    setError(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email address and password.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const requiredRole = currentPortal ? currentPortal.role : undefined;
      const loggedUser = await login(email.trim(), password, requiredRole);
      setSuccess(`Welcome back, ${loggedUser.name}! Redirecting to dashboard...`);

      setTimeout(() => {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
        if (from) {
          navigate(from, { replace: true });
        } else if (loggedUser.role === "ADMIN") {
          navigate("/admin", { replace: true });
        } else if (loggedUser.role === "WORKER") {
          navigate("/worker", { replace: true });
        } else {
          navigate("/my-complaints", { replace: true });
        }
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please verify your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // VIEW 1: Selection Hub (when at /login without a sub-route)
  if (!currentPortal) {
    return (
      <main className="container" style={{ padding: "48px 20px 80px", maxWidth: 1180, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="badge-tag" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Sparkles size={14} /> GramConnect Unified Auth
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "var(--navy)", marginBottom: 12 }}>
            Select Your Login Portal
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 620, margin: "0 auto" }}>
            GramConnect provides three tailored interfaces with role-based access for Panchayat officials, field technicians, and village residents.
          </p>
        </div>

        {/* 3 Portal Selection Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 28,
            alignItems: "stretch",
          }}
        >
          {Object.values(PORTALS).map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.slug}
                style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  transition: "all 0.25s ease",
                }}
              >
                {/* Card Top Banner */}
                <div
                  style={{
                    background: portal.gradient,
                    padding: "24px 24px 20px",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: 1.2,
                        background: "rgba(255,255,255,0.22)",
                        color: "#fff",
                        padding: "3px 8px",
                        borderRadius: 4,
                        marginBottom: 10,
                        textTransform: "uppercase",
                      }}
                    >
                      {portal.badge}
                    </span>
                    <h3 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#ffffff" }}>
                      {portal.title}
                    </h3>
                  </div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <Icon size={26} color="#ffffff" />
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: 24, display: "flex", flexDirection: "column", flex: 1 }}>
                  <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 20px", lineHeight: 1.5, minHeight: 42 }}>
                    {portal.subtitle}
                  </p>

                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 24, flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
                      Key Capabilities:
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                      {portal.features.map((feat, idx) => (
                        <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-main)" }}>
                          <CheckCircle2 size={16} color={portal.primaryColor} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Demo Credential Preview */}
                  <div
                    style={{
                      background: portal.lightBg,
                      border: `1px dashed ${portal.primaryColor}40`,
                      borderRadius: 8,
                      padding: "10px 14px",
                      marginBottom: 20,
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: portal.primaryColor, display: "block", marginBottom: 2 }}>
                      Default Demo Account:
                    </span>
                    <code style={{ color: "#334155", wordBreak: "break-all" }}>{portal.demoEmail}</code>
                    <div style={{ color: "#64748b", marginTop: 2 }}>
                      Password: <code>{portal.demoPass}</code>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/login/${portal.slug}`}
                    className="btn"
                    style={{
                      background: portal.primaryColor,
                      color: "#ffffff",
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    Open {portal.title} <ArrowRight size={16} />
                  </Link>

                  {portal.slug === "user" && (
                    <div style={{ textAlign: "center", marginTop: 12 }}>
                      <Link to="/register" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600 }}>
                        Don't have an account? Register as Villager →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Helper Info */}
        <div
          style={{
            marginTop: 48,
            padding: 20,
            background: "#f8fafc",
            border: "1px solid var(--border)",
            borderRadius: 12,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          <strong>Security Notice:</strong> Role authorization is verified cryptographically by Spring Boot with JWT tokens.
          An account registered as Villager cannot access Worker or Admin dashboards.
        </div>
      </main>
    );
  }

  // VIEW 2: Dedicated Role Login Form (when at /login/admin, /login/worker, or /login/user)
  const Icon = currentPortal.icon;

  return (
    <main className="container" style={{ padding: "40px 20px 80px", maxWidth: 540, margin: "0 auto" }}>
      {/* Return to Selection Button */}
      <div style={{ marginBottom: 20 }}>
        <Link
          to="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-muted)",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            padding: "6px 12px",
            borderRadius: 6,
            background: "#ffffff",
            border: "1px solid var(--border)",
          }}
        >
          <ArrowLeft size={16} /> Back to Portal Selection
        </Link>
      </div>

      {/* Main Login Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid var(--border)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Card Header */}
        <div
          style={{
            background: currentPortal.gradient,
            padding: "32px 28px",
            color: "#ffffff",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              backdropFilter: "blur(6px)",
            }}
          >
            <Icon size={30} color="#ffffff" />
          </div>
          <span
            style={{
              display: "inline-block",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
              background: "rgba(255,255,255,0.22)",
              padding: "3px 10px",
              borderRadius: 4,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            {currentPortal.badge}
          </span>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px", color: "#ffffff" }}>
            {currentPortal.title}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
            {currentPortal.subtitle}
          </p>
        </div>

        {/* Card Form Body */}
        <div style={{ padding: "28px 28px 32px" }}>
          {/* Quick Demo Credentials Autofill Banner */}
          <div
            style={{
              background: currentPortal.lightBg,
              border: `1px solid ${currentPortal.primaryColor}30`,
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: currentPortal.primaryColor }}>
                Demo Credentials:
              </div>
              <div style={{ fontSize: 12, color: "#334155" }}>
                <code>{currentPortal.demoEmail}</code>
              </div>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              style={{
                background: currentPortal.primaryColor,
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
              }}
            >
              <KeyRound size={13} /> Auto-Fill
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 20,
                fontSize: 13,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 20,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <div>{success}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label
                htmlFor="email"
                style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}
              >
                Email Address or Username
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-subtle)",
                    display: "flex",
                  }}
                >
                  <Mail size={17} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={currentPortal.demoEmail}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-subtle)",
                    display: "flex",
                  }}
                >
                  <Lock size={17} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 42px 12px 42px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-subtle)",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn"
              style={{
                background: currentPortal.primaryColor,
                color: "#ffffff",
                padding: "13px",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" /> Verifying Credentials...
                </>
              ) : (
                <>Sign in to {currentPortal.title}</>
              )}
            </button>
          </form>

          {/* Bottom Switcher */}
          <div
            style={{
              marginTop: 24,
              paddingTop: 18,
              borderTop: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {currentPortal.slug === "user" ? (
              <div>
                Don't have a Villager account?{" "}
                <Link to="/register" style={{ color: "var(--primary)", fontWeight: 700 }}>
                  Register as Villager →
                </Link>
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)" }}>
                {currentPortal.slug === "admin"
                  ? "Admin accounts are configured exclusively by Panchayat authorities."
                  : "Worker accounts are provisioned and activated by the Panchayat Administrator."}
              </div>
            )}

            <div>
              <Link to="/login" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
                Switch to a different portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}