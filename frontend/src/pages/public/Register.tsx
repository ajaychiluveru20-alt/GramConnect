import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { 
  Users, 
  ArrowLeft, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert 
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields (Name, Email, Password).");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);

    try {
      const newUser = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        village: village.trim() || undefined,
      });

      setSuccess(`Account registered successfully for ${newUser.name}! Redirecting...`);
      setTimeout(() => {
        navigate("/my-complaints", { replace: true });
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ padding: "40px 20px 80px", maxWidth: 580, margin: "0 auto" }}>
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
          <ArrowLeft size={16} /> Back to Login
        </Link>
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid var(--border)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #15803d, #16a34a)",
            padding: "30px 28px",
            color: "#ffffff",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Users size={28} color="#ffffff" />
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
            CITIZEN ENROLLMENT
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px", color: "#ffffff" }}>
            Villager / Citizen Registration
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
            Register your account to report problems, track live repair progress, and stay updated.
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: "28px 28px 32px" }}>
          {/* Security policy notice */}
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 20,
              fontSize: 12,
              color: "#166534",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>
              Public registration registers you as a <strong>Villager</strong>. Admin and Worker accounts are strictly provisioned by Panchayat administrators.
            </span>
          </div>

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

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                htmlFor="name"
                style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 5 }}
              >
                Full Name *
              </label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }} />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  style={{
                    width: "100%",
                    padding: "11px 14px 11px 40px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 5 }}
              >
                Email Address *
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@example.com"
                  required
                  style={{
                    width: "100%",
                    padding: "11px 14px 11px 40px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label
                  htmlFor="phone"
                  style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 5 }}
                >
                  Phone Number
                </label>
                <div style={{ position: "relative" }}>
                  <Phone size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }} />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 40px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="village"
                  style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 5 }}
                >
                  Village / Ward
                </label>
                <div style={{ position: "relative" }}>
                  <MapPin size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }} />
                  <input
                    id="village"
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Rampur Gram"
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 40px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 5 }}
              >
                Password * (min. 6 characters)
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  style={{
                    width: "100%",
                    padding: "11px 40px 11px 40px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 14,
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
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 5 }}
              >
                Confirm Password *
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }} />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  style={{
                    width: "100%",
                    padding: "11px 14px 11px 40px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: "13px",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" /> Creating Account...
                </>
              ) : (
                "Create Villager Account"
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: 22,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
              textAlign: "center",
              fontSize: 13,
            }}
          >
            Already registered?{" "}
            <Link to="/login/user" style={{ color: "var(--primary)", fontWeight: 700 }}>
              Sign in to Villager Portal →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}