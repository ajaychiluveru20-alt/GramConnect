import { Link, Route, Routes } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Services from "./pages/public/Services";
import Emergency from "./pages/public/Emergency";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import ReportProblem from "./pages/villager/ReportProblem";
import MyComplaints from "./pages/villager/MyComplaints";
import Notifications from "./pages/villager/Notifications";
import Dashboard from "./pages/admin/Dashboard";
import WorkerDashboard from "./pages/worker/Dashboard";
import NotFound from "./pages/public/NotFound";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { NotificationProvider } from "./context/NotificationContext";
import { PhoneCall, Heart } from "lucide-react";
import "./App.css";

function AppContent() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <div className="app-shell">
      <Navbar />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/emergency" element={<Emergency />} />

        {/* Authentication & Registration */}
        <Route path="/login" element={<Login />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Notifications Center */}
        <Route path="/notifications" element={<Notifications />} />

        {/* Villager / Citizen Routes */}
        <Route path="/report" element={<ReportProblem />} />
        <Route path="/complaints" element={<MyComplaints />} />
        <Route path="/my-complaints" element={<MyComplaints />} />
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute allowedRoles={["VILLAGER", "ADMIN"]}>
              <MyComplaints />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes (Restricted strictly to ADMIN) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Worker Routes (Restricted strictly to WORKER) */}
        <Route
          path="/worker"
          element={
            <ProtectedRoute allowedRoles={["WORKER"]}>
              <WorkerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/dashboard"
          element={
            <ProtectedRoute allowedRoles={["WORKER"]}>
              <WorkerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <footer>
        <div className="footer-content">
          <div className="footer-brand">
            <h4>{t("brand.name", "GramConnect")} – {t("brand.subtitle", "Smart Village Problem Solver")}</h4>
            <p>
              {t("brand.motto", "A digital civic-tech platform connecting villagers, panchayat officers, and maintenance workers for transparent, rapid problem resolution and self-reliant villages.")}
            </p>
          </div>

          <div className="footer-links">
            <h5>{t("nav.services", "Portals & Navigation")}</h5>
            <ul>
              <li><Link to="/login/admin">{t("nav.admin", "Admin Portal")}</Link></li>
              <li><Link to="/login/worker">{t("nav.worker", "Worker Portal")}</Link></li>
              <li><Link to="/login/user">{t("nav.login", "Villager Login")}</Link></li>
              <li><Link to="/register">{t("nav.register", "Citizen Registration")}</Link></li>
              <li><Link to="/report">{t("nav.report", "Report a Problem")}</Link></li>
              <li><Link to="/notifications">{t("nav.notifications", "Notifications Center")}</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h5>{t("nav.emergency", "Emergency Helpline")}</h5>
            <ul>
              <li>
                <a href="tel:112" style={{ color: "#f87171", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <PhoneCall size={14} /> National Helpline: 112
                </a>
              </li>
              <li><a href="tel:108">Medical Ambulance: 108</a></li>
              <li><a href="tel:100">Police Emergency: 100</a></li>
              <li><a href="tel:101">Fire Services: 101</a></li>
              <li><Link to="/emergency">View All Contacts →</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {currentYear} GramConnect · Smart Rural Governance System · Built with Java 21, Spring Boot, React & PostgreSQL
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            Empowering rural communities with technology <Heart size={13} color="#ef4444" fill="#ef4444" />
          </span>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
}

export default App;
