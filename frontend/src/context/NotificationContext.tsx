import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type NotificationType = "status" | "assignment" | "announcement" | "urgent";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  complaintId?: number;
  link?: string;
}

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastMessage {
  id?: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (item: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  showToast: (toast: Omit<ToastMessage, "id">) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = "gramconnect_notifications";

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    title: "Drinking Water Pipeline Maintenance",
    message: "Scheduled maintenance tomorrow from 9:00 AM to 1:00 PM across Wards 1 to 4. Please store adequate drinking water.",
    type: "announcement",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false,
    link: "/services",
  },
  {
    id: "notif-2",
    title: "Upcoming Gram Sabha Meeting",
    message: "Quarterly Gram Sabha meeting scheduled this Sunday at 10:30 AM in Panchayat Bhavan. All residents are welcome to participate.",
    type: "announcement",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    read: false,
    link: "/about",
  },
  {
    id: "notif-3",
    title: "Street Lighting Maintenance Drive",
    message: "Panchayat electrical maintenance crew has resolved 14 faulty street light points across the Main Bazaar & Temple Road.",
    type: "status",
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    read: true,
    link: "/complaints",
  },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_NOTIFICATIONS;
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback((item: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    const newNotif: AppNotification = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Also trigger toast for visibility
    showToast({
      type: item.type === "urgent" ? "warning" : "info",
      title: item.title,
      message: item.message,
    });
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, fullToast]);

    const duration = toast.duration ?? 4500;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
        showToast,
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <aside 
        aria-label="System Notifications" 
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 380,
          width: "100%",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";
          const isWarning = t.type === "warning";

          const bg = isSuccess ? "#f0fdf4" : isError ? "#fef2f2" : isWarning ? "#fffbeb" : "#eff6ff";
          const border = isSuccess ? "#bbf7d0" : isError ? "#fecaca" : isWarning ? "#fde68a" : "#bfdbfe";
          const color = isSuccess ? "#166534" : isError ? "#991b1b" : isWarning ? "#b45309" : "#1e40af";

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: "auto",
                background: bg,
                border: `1px solid ${border}`,
                color: color,
                borderRadius: 12,
                padding: "14px 16px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                animation: "slideIn 0.25s ease-out",
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                {isSuccess && <CheckCircle2 size={18} color="#16a34a" />}
                {isError && <AlertCircle size={18} color="#dc2626" />}
                {isWarning && <AlertTriangle size={18} color="#d97706" />}
                {!isSuccess && !isError && !isWarning && <Info size={18} color="#2563eb" />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{t.title}</div>
                <div style={{ fontSize: 12, lineHeight: 1.4, opacity: 0.9 }}>{t.message}</div>
              </div>

              <button
                type="button"
                onClick={() => t.id && dismissToast(t.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: color,
                  padding: 2,
                  display: "flex",
                  opacity: 0.7,
                }}
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </aside>
    </NotificationContext.Provider>
  );
};

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

export default useNotifications;