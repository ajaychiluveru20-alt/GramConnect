import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Bell, 
  Check, 
  Trash2, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Volume2
} from "lucide-react";
import { useNotifications, type AppNotification } from "../../context/NotificationContext";
import { useLanguage } from "../../context/LanguageContext";

export default function NotificationBell() {
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

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const displayedList = filter === "unread" 
    ? notifications.filter((n) => !n.read) 
    : notifications;

  function handleNotificationClick(notif: AppNotification) {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  }

  function getNotificationIcon(type: string) {
    if (type === "urgent") return <AlertTriangle size={15} color="#d97706" />;
    if (type === "status") return <CheckCircle2 size={15} color="#16a34a" />;
    return <Info size={15} color="#2563eb" />;
  }

  function formatTime(iso: string) {
    try {
      const date = new Date(iso);
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.round(diffMs / 60000);
      const diffHrs = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);

      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return "Recent";
    }
  }

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open Notifications"
        style={{
          position: "relative",
          background: isOpen ? "#f1f5f9" : "transparent",
          border: "1px solid var(--border)",
          borderRadius: 8,
          width: 38,
          height: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--navy)",
          transition: "all 0.2s ease",
        }}
        title="View Notifications & Civic Advisories"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#dc2626",
              color: "#ffffff",
              fontSize: 10,
              fontWeight: 800,
              minWidth: 18,
              height: 18,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxShadow: "0 0 0 2px #ffffff",
              animation: "pulse 2s infinite",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 360,
            maxHeight: 480,
            background: "#ffffff",
            borderRadius: 14,
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            overflow: "hidden",
            animation: "fadeIn 0.15s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              background: "#f8fafc",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <strong style={{ fontSize: 14, color: "var(--navy)" }}>
                {t("notif.title", "Notifications")}
              </strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: "#fee2e2",
                    color: "#dc2626",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: 10,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Check size={13} /> {t("action.markAllRead", "Mark read")}
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div
            style={{
              display: "flex",
              padding: "6px 12px",
              background: "#ffffff",
              borderBottom: "1px solid var(--border)",
              gap: 6,
            }}
          >
            <button
              type="button"
              onClick={() => setFilter("all")}
              style={{
                border: "none",
                background: filter === "all" ? "var(--surface-alt)" : "transparent",
                color: filter === "all" ? "var(--navy)" : "var(--text-muted)",
                fontWeight: filter === "all" ? 700 : 500,
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {t("notif.all", "All")} ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              style={{
                border: "none",
                background: filter === "unread" ? "var(--surface-alt)" : "transparent",
                color: filter === "unread" ? "var(--navy)" : "var(--text-muted)",
                fontWeight: filter === "unread" ? 700 : 500,
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {t("notif.unread", "Unread")} ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div style={{ overflowY: "auto", maxHeight: 330, flex: 1 }}>
            {displayedList.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                <Bell size={28} style={{ opacity: 0.3, margin: "0 auto 8px" }} />
                <p style={{ margin: 0 }}>
                  {filter === "unread" ? "No unread notifications" : t("notif.empty", "No notifications")}
                </p>
              </div>
            ) : (
              displayedList.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid var(--border)",
                    background: n.read ? "#ffffff" : "#f0fdf4",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = n.read ? "#f8fafc" : "#e6f9ed";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = n.read ? "#ffffff" : "#f0fdf4";
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: n.type === "status" ? "#dcfce7" : n.type === "urgent" ? "#fef3c7" : "#dbeafe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {getNotificationIcon(n.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                      <strong
                        style={{
                          fontSize: 13,
                          color: "var(--navy)",
                          fontWeight: n.read ? 600 : 700,
                          lineHeight: 1.3,
                        }}
                      >
                        {n.title}
                      </strong>
                      <span style={{ fontSize: 10, color: "var(--text-subtle)", whiteSpace: "nowrap" }}>
                        {formatTime(n.timestamp)}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: "var(--text-muted)",
                        lineHeight: 1.4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {n.message}
                    </p>

                    {n.link && (
                      <div style={{ fontSize: 11, color: "var(--primary)", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        View details <ExternalLink size={10} />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-subtle)",
                      cursor: "pointer",
                      padding: 2,
                      opacity: 0.6,
                    }}
                    title="Delete notification"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "10px 14px",
              background: "#f8fafc",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
            }}
          >
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              style={{
                color: "var(--primary)",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {t("notif.viewAll", "Notifications Center")} →
            </Link>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                {t("action.clearAll", "Clear all")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
