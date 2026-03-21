"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ============================================================
// NOTIFICATIONS — Real Supabase data + working Accept/Decline
// ============================================================

interface Notification {
  id: string; type: string; title: string; body: string;
  data: Record<string, unknown>; is_read: boolean; created_at: string;
}

const tabs = ["All", "Bookings", "Payments", "Alerts"];
const typeToTab: Record<string, string> = {
  JOB_ALERT: "Alerts", EMERGENCY_ALERT: "Alerts", BOOKING_ACCEPTED: "Bookings",
  PAYMENT_RECEIVED: "Payments", JOB_COMPLETED: "Bookings",
};
const typeToIcon: Record<string, string> = {
  JOB_ALERT: "🔔", EMERGENCY_ALERT: "🆘", BOOKING_ACCEPTED: "✅",
  PAYMENT_RECEIVED: "💰", JOB_COMPLETED: "⭐",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [declined, setDeclined] = useState<string[]>([]);

  // Fetch real notifications via API
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=50");
      const json = await res.json();
      if (json.success && json.data) setNotifications(json.data);
    } catch (e) {
      console.error("[notifications]", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 15 seconds
    const id = setInterval(fetchNotifications, 15000);
    return () => clearInterval(id);
  }, []);

  // Get current user ID from auth token cookie
  const getCurrentUserId = (): string => {
    try {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('kaizy_token='));
      if (tokenCookie) {
        const token = tokenCookie.split('=')[1];
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.userId || "";
      }
    } catch {}
    return "";
  };

  // Accept job alert — uses REAL user ID from auth
  const handleAccept = async (notif: Notification) => {
    const alertId = notif.data?.alertId as string;
    const jobId = notif.data?.jobId as string;
    const workerId = getCurrentUserId();

    if (!jobId) return;
    if (!workerId) {
      // Not logged in — redirect to login
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("/api/jobs/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId: alertId || notif.id,
          workerId,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setAccepted(prev => [...prev, notif.id]);
        // Store booking data and navigate to tracking
        try {
          sessionStorage.setItem("kaizy_active_booking", JSON.stringify({
            bookingId: json.data?.bookingId,
            jobId: json.data?.jobId,
            otp: json.data?.otp,
          }));
        } catch {}
        setTimeout(() => router.push("/tracking"), 1500);
      } else {
        setDeclined(prev => [...prev, notif.id]);
      }
    } catch (e) {
      console.error("[accept error]", e);
    }
  };

  // Decline — mark locally + call API
  const handleDecline = async (notif: Notification) => {
    const jobId = notif.data?.jobId as string;
    const workerId = getCurrentUserId();
    setDeclined(prev => [...prev, notif.id]);
    
    if (jobId && workerId) {
      try {
        await fetch("/api/dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "decline", jobId, workerId, reason: "user_declined" }),
        });
      } catch {}
    }
  };

  // Mark all read
  const markAllRead = async () => {
    try { await fetch("/api/notifications", { method: "PATCH" }); } catch {}
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const filtered = activeTab === 0
    ? notifications
    : notifications.filter(n => typeToTab[n.type] === tabs[activeTab]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      <div className="px-4 pt-4 pb-2">
        <div className="flex justify-between items-center mb-3">
          <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>Activity</h1>
          <button onClick={markAllRead} className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>Mark all read</button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)}
                    className="shrink-0 rounded-full px-3.5 py-[7px] text-[11px] font-bold active:scale-95"
                    style={{ background: activeTab === i ? "var(--brand)" : "var(--bg-card)", color: activeTab === i ? "#fff" : "var(--text-2)" }}>
              {t}
              {i === 0 && notifications.filter(n => !n.is_read).length > 0 && (
                <span className="ml-1 text-[9px] bg-white text-orange-500 rounded-full px-1.5 font-black">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-3 space-y-2">
        {/* Loading */}
        {loading && [1,2,3].map(i => (
          <div key={i} className="skeleton rounded-xl" style={{ height: 80 }} />
        ))}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[40px] mb-3">📭</p>
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No notifications yet</p>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>
              When workers respond to your jobs, you&apos;ll see it here
            </p>
          </div>
        )}

        {/* Real notifications */}
        {!loading && filtered.map(n => {
          const icon = typeToIcon[n.type] || "🔔";
          const isJobAlert = n.type === "JOB_ALERT" || n.type === "EMERGENCY_ALERT";
          const isAccepted = accepted.includes(n.id);
          const isDeclined = declined.includes(n.id);

          return (
            <div key={n.id} className="rounded-xl p-3 anim-up"
                 style={{
                   background: !n.is_read ? "var(--brand-tint)" : "var(--bg-card)",
                   border: !n.is_read ? "1px solid rgba(255,107,0,0.15)" : "1px solid var(--border-1)",
                 }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] shrink-0"
                     style={{ background: "var(--bg-elevated)" }}>{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{n.title}</p>
                    {!n.is_read && <div className="w-2 h-2 rounded-full shrink-0 online-dot" style={{ background: "var(--brand)" }} />}
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-2)" }}>{n.body}</p>
                  <p className="text-[9px] mt-1 font-semibold" style={{ color: "var(--text-3)" }}>{timeAgo(n.created_at)}</p>
                </div>
              </div>

              {/* Real Accept/Decline for job alerts */}
              {isJobAlert && !isAccepted && !isDeclined && (
                <div className="flex gap-2 mt-2 pl-[52px]">
                  <button onClick={() => handleAccept(n)}
                          className="flex-1 rounded-lg py-2 text-[11px] font-bold text-white active:scale-95"
                          style={{ background: "var(--success)" }}>✓ Accept</button>
                  <button onClick={() => handleDecline(n)}
                          className="flex-1 rounded-lg py-2 text-[11px] font-bold active:scale-95"
                          style={{ background: "var(--danger-tint)", color: "var(--danger)", border: "1px solid var(--danger)" }}>✕ Decline</button>
                </div>
              )}
              {isAccepted && <p className="text-[10px] font-bold mt-2 pl-[52px]" style={{ color: "var(--success)" }}>✓ Accepted — Navigating to job</p>}
              {isDeclined && <p className="text-[10px] font-bold mt-2 pl-[52px]" style={{ color: "var(--text-3)" }}>Declined</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
