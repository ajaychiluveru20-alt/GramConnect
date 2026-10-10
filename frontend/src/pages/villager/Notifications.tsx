import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Search, 
  Filter, 
  ExternalLink,
  Calendar,
  Volume2,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { useNotifications, type NotificationType } from "../../context/NotificationContext";
import { useLanguage } from "../../context/LanguageContext";

export default function Notifications() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll 
  } = useNotifications();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (selectedType !== "ALL" && n.type !== selectedType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesMsg = n.message.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg) return false;
      }
      return true;
    });
  }, [notifications, selectedType, searchQuery]);

  function getIcon(type: NotificationType) {
    if (type === "urgent") return <AlertTriangle size={18} color="#d97706" />;
    if (type === "status") return <CheckCircle2 size={18} color="#16a34a" />;
    return <Info size={18} color="#2563eb" />;
  }

  function getTypeBadge(type: NotificationType) {
    if (type === "urgent") {
      return (
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#fef3c7", color: "#b45309" }}>
          Urgent Advisory
        </span>
      );
    }
    if (type === "status") {
      return (
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#dcfce7", color: "#166534" }}>
          Complaint Update
        </span>
      );
    }
    return (
      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#dbeafe", color: "#1e40af" }}>
        Panchayat Notice
      </span>
    );
  }

  return (
    <main className="container" style={{ padding: "36px 20px 80px", maxWidth: 900, margin: "0 auto" }}>
      {/* Back button */}
      <div style={{ marginBottom: 16 }}>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-muted)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="badge badge-assigned" style={{ fontSize: 11 }}>
              <Bell size={12} /> Live Civic Broadcasts
            </span>
            {unreadCount > 0 && (
              <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 700 }}>
                ({unreadCount} unread)
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 800, margin: 0, color: "var(--navy)" }}>
            {t("notif.title", "Notifications Center")}
          </h1>
          <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 15 }}>
            Real-time complaint status transitions, maintenance alerts, and official Gram Panchayat advisories.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={markAllAsRead}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <CheckCheck size={15} /> {t("action.markAllRead", "Mark All as Read")}
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={clearAll}
              style={{ color: "#dc2626", borderColor: "#fecaca" }}
            >
              <Trash2 size={15} /> {t("action.clearAll", "Clear All")}
            </button>
          )}
        </div>
      </div>

      {/* Filters and search */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search notifications by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          aria-label="Filter Notifications by Type"
          className="filter-select"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="ALL">All Categories ({notifications.length})</option>
          <option value="status">Complaint Updates</option>
          <option value="announcement">Panchayat Notices</option>
          <option value="urgent">Urgent Advisories</option>
        </select>
      </div>

      {/* Notification Cards List */}
      {filteredNotifications.length === 0 ? (
        <div className="panel empty-state">
          <Bell size={36} style={{ color: "var(--text-subtle)", margin: "0 auto 12px" }} />
          <h3>No notifications in this view</h3>
          <p>You have reviewed all current notifications or no records match your search filter.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              className="panel"
              style={{
                padding: "20px 22px",
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                background: n.read ? "#ffffff" : "#f0fdf4",
                borderLeft: `5px solid ${n.read ? "var(--border)" : "var(--primary)"}`,
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: n.type === "status" ? "#dcfce7" : n.type === "urgent" ? "#fef3c7" : "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {getIcon(n.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--navy)" }}>
                      {n.title}
                    </h3>
                    {getTypeBadge(n.type)}
                    {!n.read && (
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#15803d" }} />
                    )}
                  </div>

                  <span style={{ fontSize: 12, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={12} /> {new Date(n.timestamp).toLocaleString()}
                  </span>
                </div>

                <p style={{ margin: "0 0 12px", color: "var(--text-main)", fontSize: 14, lineHeight: 1.6 }}>
                  {n.message}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  {n.link && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        if (!n.read) markAsRead(n.id);
                        navigate(n.link!);
                      }}
                      style={{ padding: "6px 12px", fontSize: 12 }}
                    >
                      View Linked Record <ExternalLink size={12} />
                    </button>
                  )}

                  {!n.read && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => markAsRead(n.id)}
                      style={{ padding: "6px 12px", fontSize: 12 }}
                    >
                      <Check size={12} /> Mark as Read
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteNotification(n.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-subtle)",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 8px",
                    }}
                    title="Remove from history"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}