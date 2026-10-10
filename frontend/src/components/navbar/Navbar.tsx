import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { 
  Home, 
  Info, 
  Wrench, 
  PlusCircle, 
  ListFilter, 
  ShieldCheck, 
  HardHat, 
  PhoneCall, 
  LogOut, 
  LogIn, 
  UserPlus, 
  User as UserIcon,
  Languages,
  Check
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage, type Language } from "../../context/LanguageContext";
import NotificationBell from "../notifications/NotificationBell";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close language menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    if (langMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [langMenuOpen]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const languagesList: { code: Language; name: string; native: string }[] = [
    { code: "en", name: "English", native: "English" },
    { code: "te", name: "Telugu", native: "తెలుగు" },
    { code: "hi", name: "Hindi", native: "हिंदी" },
  ];

  return (
    <header className="navbar">
      {/* Brand */}
      <Link className="brand" to="/" aria-label="GramConnect Home">
        <div className="brand-mark">G</div>
        <div className="brand-title">
          <span className="main-name">
            {t("brand.name", "GramConnect")}
          </span>
          <small>{t("brand.subtitle", "Smart Village Problem Solver")}</small>
        </div>
      </Link>

      {/* Main Nav Links */}
      <nav>
        <NavLink to="/" end>
          <Home size={16} /> {t("nav.home", "Home")}
        </NavLink>
        <NavLink to="/about">
          <Info size={16} /> {t("nav.about", "About")}
        </NavLink>
        <NavLink to="/services">
          <Wrench size={16} /> {t("nav.services", "Services")}
        </NavLink>

        {/* Role-specific Links */}
        {isAuthenticated && user?.role === "ADMIN" && (
          <NavLink to="/admin">
            <ShieldCheck size={16} /> {t("nav.admin", "Admin Portal")}
          </NavLink>
        )}

        {isAuthenticated && user?.role === "WORKER" && (
          <NavLink to="/worker">
            <HardHat size={16} /> {t("nav.worker", "Worker Tasks")}
          </NavLink>
        )}

        {isAuthenticated && user?.role === "VILLAGER" && (
          <>
            <NavLink to="/report">
              <PlusCircle size={16} /> {t("nav.report", "Report Problem")}
            </NavLink>
            <NavLink to="/my-complaints">
              <ListFilter size={16} /> {t("nav.myComplaints", "My Complaints")}
            </NavLink>
          </>
        )}

        {/* Unauthenticated Quick Links */}
        {!isAuthenticated && (
          <>
            <NavLink to="/report">
              <PlusCircle size={16} /> {t("nav.report", "Report Problem")}
            </NavLink>
            <NavLink to="/complaints">
              <ListFilter size={16} /> {t("nav.trackIssue", "Track Issue")}
            </NavLink>
          </>
        )}
      </nav>

      {/* Actions (Language Selector, Notification Bell, Emergency, Auth) */}
      <div className="nav-actions">
        {/* Language Selector Dropdown */}
        <div style={{ position: "relative" }} ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 11px",
              borderRadius: 8,
              background: langMenuOpen ? "#f1f5f9" : "#ffffff",
              border: "1px solid var(--border)",
              color: "var(--navy)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            title="Change Application Language (English / తెలుగు / हिंदी)"
          >
            <Languages size={15} color="var(--primary)" />
            <span>
              {language === "en" ? "EN" : language === "te" ? "తెలుగు" : "हिंदी"}
            </span>
          </button>

          {langMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "#ffffff",
                border: "1px solid var(--border)",
                borderRadius: 10,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12)",
                zIndex: 1000,
                minWidth: 150,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                animation: "fadeIn 0.15s ease",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  background: "#f8fafc",
                  borderBottom: "1px solid var(--border)",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                Select Language
              </div>
              {languagesList.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLanguage(l.code);
                    setLangMenuOpen(false);
                  }}
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "none",
                    background: language === l.code ? "#f0fdf4" : "transparent",
                    color: language === l.code ? "#15803d" : "var(--navy)",
                    fontSize: 13,
                    fontWeight: language === l.code ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (language !== l.code) e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (language !== l.code) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span>{l.native}</span>
                  {language === l.code && <Check size={14} color="#15803d" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Emergency Helpline Pill */}
        <a className="emergency-pill" href="tel:112" title="Toll Free National Emergency Helpline">
          <PhoneCall size={14} /> 112
        </a>

        {/* User Auth Section */}
        {isAuthenticated && user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 20,
                background:
                  user.role === "ADMIN"
                    ? "#eff6ff"
                    : user.role === "WORKER"
                    ? "#fffbeb"
                    : "#f0fdf4",
                border: `1px solid ${
                  user.role === "ADMIN"
                    ? "#bfdbfe"
                    : user.role === "WORKER"
                    ? "#fde68a"
                    : "#bbf7d0"
                }`,
                fontSize: 12,
                fontWeight: 700,
                color:
                  user.role === "ADMIN"
                    ? "#1e3a8a"
                    : user.role === "WORKER"
                    ? "#b45309"
                    : "#15803d",
              }}
            >
              <UserIcon size={14} />
              <span>{user.name}</span>
              <span
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  padding: "1px 6px",
                  borderRadius: 4,
                  background:
                    user.role === "ADMIN"
                      ? "#1e3a8a"
                      : user.role === "WORKER"
                      ? "#b45309"
                      : "#15803d",
                  color: "#ffffff",
                }}
              >
                {user.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "7px 12px",
                borderRadius: 6,
                background: "#f8fafc",
                border: "1px solid var(--border)",
                color: "#64748b",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#dc2626";
                e.currentTarget.style.borderColor = "#fecaca";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#64748b";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <LogOut size={14} /> {t("nav.logout", "Logout")}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <NavLink
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 14px",
                borderRadius: 6,
                background: "var(--primary-light)",
                color: "var(--primary-text)",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <LogIn size={14} /> {t("nav.login", "Login")}
            </NavLink>
            <NavLink
              to="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 14px",
                borderRadius: 6,
                background: "var(--primary)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <UserPlus size={14} /> {t("nav.register", "Register")}
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
}
