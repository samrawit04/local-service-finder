import { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const POLL_INTERVAL = 30_000; // 30 seconds

const typeIcon: Record<string, string> = {
  new_booking:          "📅",
  booking_accepted:     "✅",
  booking_rejected:     "❌",
  booking_completed:    "🎉",
  new_application:      "📋",
  application_accepted: "🎊",
  application_rejected: "📭",
  job_completed:        "🏁",
};

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString();
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [open, setOpen]                   = useState(false);
  const panelRef                          = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/Notifications/unread-count");
      setUnreadCount(data.count);
    } catch { /* silently fail */ }
  }, [user]);

  const fetchAll = useCallback(async () => {
    try {
      const { data } = await api.get("/Notifications");
      setNotifications(data);
    } catch { /* silently fail */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.put("/Notifications/read-all");
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silently fail */ }
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    if (!user) return;
    fetchCount();
    const timer = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [user, fetchCount]);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await fetchAll();
      if (unreadCount > 0) await markAllRead();
    }
  };

  if (!user) return null;

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="notif-bell-btn"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications</span>
            {notifications.some(n => !n.isRead) && (
              <button className="notif-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={32} color="var(--text-faint)" style={{ marginBottom: 8 }} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item${n.isRead ? "" : " notif-item-unread"}`}
                >
                  <div className="notif-item-icon">
                    {typeIcon[n.type] ?? "🔔"}
                  </div>
                  <div className="notif-item-body">
                    <p className="notif-item-title">{n.title}</p>
                    <p className="notif-item-msg">{n.message}</p>
                    <p className="notif-item-time">{fmt(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <div className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
