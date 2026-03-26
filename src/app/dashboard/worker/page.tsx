"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import JobAlertOverlay from "@/components/JobAlertOverlay";

// ============================================================
// WORKER DASHBOARD v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · Tonal surface hierarchy · Gradient CTA
// Real data + Job Alert Overlay · No harsh borders
// ============================================================

interface UserData {
  id: string;
  name: string;
  phone: string;
  user_type: string;
  trade?: string;
  kaizy_score?: number;
}

interface AlertNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
  is_read: boolean;
  data: Record<string, unknown>;
}

interface ActiveJobAlert {
  alertId: string;
  jobId: string;
  trade: string;
  distance: number;
  earnings: number;
  problemType?: string;
  address?: string;
  hirerName?: string;
  isEmergency?: boolean;
}

export default function WorkerDashboardPage() {
  const { isDark, toggle } = useTheme();
  const [isOnline, setIsOnline] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayJobs, setTodayJobs] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [toggling, setToggling] = useState(false);
  const [greeting, setGreeting] = useState("Good evening");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeJobAlert, setActiveJobAlert] = useState<ActiveJobAlert | null>(null);
  const [acceptedJob, setAcceptedJob] = useState<{ bookingId: string; otp: string; message: string } | null>(null);

  // Get greeting
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  // Fetch real logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.success && json.data) {
          setUser(json.data);
          fetchWorkerStats(json.data.id);
        }
      } catch {} finally { setLoading(false); }
    };
    fetchUser();
  }, []);

  // Fetch worker stats
  const fetchWorkerStats = async (workerId: string) => {
    try {
      const res = await fetch(`/api/earnings?workerId=${workerId}&period=today`);
      const json = await res.json();
      if (json.success && json.data) {
        setTodayEarnings(Number(json.data.totalEarnings) || 0);
        setTodayJobs(Number(json.data.totalJobs) || 0);
        setAvgRating(Number(json.data.avgRating) || 0);
      }
    } catch {
      setTodayEarnings(0);
      setTodayJobs(0);
      setAvgRating(0);
    }
  };

  // Real toggle online/offline — updates GPS + Supabase
  const handleToggle = async () => {
    if (!user) return;
    setToggling(true);
    try {
      const goOnline = !isOnline;
      let lat = 11.0168, lng = 76.9558;

      if (goOnline && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve(); },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      }

      const res = await fetch("/api/workers/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: user.id,
          isOnline: goOnline,
          latitude: lat,
          longitude: lng,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsOnline(goOnline);
        if (navigator.vibrate) navigator.vibrate(50);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  // Poll for job alerts — show full-screen overlay for unread JOB_ALERT
  useEffect(() => {
    if (!user || !isOnline) return;

    const checkForAlerts = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}&limit=10`);
        const json = await res.json();
        if (json.success && json.data?.length) {
          setAlerts(json.data);

          // Find the most recent unread JOB_ALERT
          const unreadJobAlert = json.data.find(
            (n: AlertNotification) => n.type === 'JOB_ALERT' && !n.is_read
          );

          if (unreadJobAlert && !activeJobAlert && !acceptedJob) {
            const data = unreadJobAlert.data || {};
            setActiveJobAlert({
              alertId: unreadJobAlert.id,
              jobId: String(data.jobId || ''),
              trade: String(data.trade || 'technician'),
              distance: Number(data.distance || 0),
              earnings: Number(data.earnings || 0),
              problemType: String(data.problemType || ''),
              address: String(data.address || ''),
              isEmergency: Boolean(data.isEmergency),
            });
          }
        }
      } catch {}
    };

    checkForAlerts();
    const intervalId = setInterval(checkForAlerts, 10000); // Poll every 10s
    return () => clearInterval(intervalId);
  }, [user, isOnline, activeJobAlert, acceptedJob]);

  // Update GPS every 30 seconds while online
  useEffect(() => {
    if (!user || !isOnline) return;
    const gpsInterval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetch("/api/workers/toggle", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                workerId: user.id,
                isOnline: true,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              }),
            }).catch(() => {});
          },
          () => {},
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }, 30000);
    return () => clearInterval(gpsInterval);
  }, [user, isOnline]);

  // Handle job accept
  const handleAcceptJob = useCallback(async (alertId: string) => {
    if (!user || !activeJobAlert) return;
    try {
      const res = await fetch("/api/jobs/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId: alertId,
          workerId: user.id,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setAcceptedJob({
          bookingId: json.data?.bookingId || '',
          otp: json.data?.otp || '',
          message: json.data?.message || 'Job accepted!',
        });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } else {
        // Job already taken or expired
        setAcceptedJob({
          bookingId: '',
          otp: '',
          message: json.error === 'already_taken' ? 'This job was taken by another worker.' : 'Job expired. Wait for the next one!',
        });
      }
    } catch {
      setAcceptedJob({ bookingId: '', otp: '', message: 'Failed to accept. Check your connection.' });
    }
    setActiveJobAlert(null);

    // Mark notification as read
    try {
      await fetch(`/api/notifications`, { method: 'PATCH' });
    } catch {}
  }, [user, activeJobAlert]);

  // Handle job decline
  const handleDeclineJob = useCallback(async (alertId: string) => {
    setActiveJobAlert(null);
    // Mark as read
    try {
      await fetch(`/api/notifications`, { method: 'PATCH' });
    } catch {}
  }, []);

  const displayName = user?.name || user?.phone?.replace('+91', '') || "Worker";
  const tradeName = user?.trade || "Worker";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-app)" }}>

      {/* ═══ FULL-SCREEN JOB ALERT OVERLAY ═══ */}
      {activeJobAlert && (
        <JobAlertOverlay
          alert={activeJobAlert}
          onAccept={handleAcceptJob}
          onDecline={handleDeclineJob}
        />
      )}

      {/* ═══ JOB ACCEPTED BANNER ═══ */}
      {acceptedJob && (
        <div className="fixed top-0 left-0 right-0 z-[9998] p-4 animate-slide-down"
             style={{ background: acceptedJob.bookingId ? "var(--success)" : "var(--warning)" }}>
          <div className="max-w-md mx-auto text-center">
            <p className="text-[16px] font-black text-white">{acceptedJob.bookingId ? "✅ Job Accepted!" : "⚠️"}</p>
            <p className="text-[12px] mt-1 text-white opacity-80">{acceptedJob.message}</p>
            {acceptedJob.otp && (
              <p className="text-[20px] font-black text-white mt-2" style={{ letterSpacing: "4px" }}>
                OTP: {acceptedJob.otp}
              </p>
            )}
            <button onClick={() => setAcceptedJob(null)}
                    className="mt-3 text-[12px] font-bold px-4 py-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
              {acceptedJob.bookingId ? "Start Navigation" : "OK"}
            </button>
          </div>
        </div>
      )}

      {/* Header — Tonal layered */}
      <div className="px-5 pt-5 pb-5" style={{ background: isOnline ? (isDark ? "rgba(52,211,153,0.04)" : "#F0FFF4") : "var(--bg-app)" }}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>{greeting}</p>
            <h1 className="text-[22px] font-black tracking-tight mt-0.5" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>{displayName} 👋</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold" style={{ color: "var(--brand-soft)" }}>{tradeName}</span>
              <span className="trust-badge">KS {user?.kaizy_score || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: "var(--bg-surface)" }}>
              <span className="text-[14px]">{isDark ? "🌙" : "☀️"}</span>
            </button>
            <Link href="/settings" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: "var(--bg-surface)" }}>
              <span className="text-[14px]">⚙️</span>
            </Link>
          </div>
        </div>

        {/* Online/Offline Toggle — Tonal, no harsh border */}
        <button onClick={handleToggle} disabled={toggling}
                className="w-full rounded-[20px] p-4 flex items-center justify-between active:scale-[0.97] transition-all"
                style={{
                  background: isOnline ? "var(--success)" : "var(--bg-card)",
                  boxShadow: isOnline ? "0 12px 40px -4px rgba(52,211,153,0.35)" : "var(--shadow-card)",
                }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-7 rounded-full relative transition-all"
                 style={{ background: isOnline ? "rgba(255,255,255,0.25)" : "var(--bg-elevated)" }}>
              <div className="absolute top-0.5 rounded-full w-6 h-6 transition-all"
                   style={{
                     background: isOnline ? "#fff" : "var(--text-3)",
                     left: isOnline ? 22 : 2,
                     boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                   }} />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-black tracking-tight" style={{ color: isOnline ? "#fff" : "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
                {toggling ? "Switching..." : isOnline ? "● ONLINE" : "● OFFLINE"}
              </p>
              <p className="text-[10px] font-medium" style={{ color: isOnline ? "rgba(255,255,255,0.7)" : "var(--text-3)" }}>
                {isOnline ? "Receiving job alerts" : "Tap to start receiving jobs"}
              </p>
            </div>
          </div>
          {isOnline && <div className="w-3 h-3 rounded-full online-dot" style={{ background: "#fff" }} />}
        </button>
      </div>

      {/* Today's Stats — Editorial large numbers, tonal cards */}
      <div className="grid grid-cols-3 gap-2.5 px-5 mb-5">
        <div className="rounded-[16px] p-3.5 text-center" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <p className="text-[22px] font-black" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>₹{todayEarnings.toLocaleString("en-IN")}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: "var(--text-3)" }}>Today</p>
        </div>
        <div className="rounded-[16px] p-3.5 text-center" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <p className="text-[22px] font-black" style={{ color: "var(--brand)", fontFamily: "'Epilogue', sans-serif" }}>{todayJobs}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: "var(--text-3)" }}>Jobs</p>
        </div>
        <div className="rounded-[16px] p-3.5 text-center" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <p className="text-[22px] font-black" style={{ color: "var(--warning)", fontFamily: "'Epilogue', sans-serif" }}>{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: "var(--text-3)" }}>Rating</p>
        </div>
      </div>

      {/* Quick Actions — Tonal grid, no borders */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Quick Actions</p>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: "📊", label: "Earnings", href: "/earnings" },
            { icon: "📋", label: "My Jobs", href: "/my-bookings" },
            { icon: "🏆", label: "Leaderboard", href: "/leaderboard" },
            { icon: "🪪", label: "Verify ID", href: "/verify" },
            { icon: "🤖", label: "KaizyBot", href: "/konnectbot" },
            { icon: "⏰", label: "Schedule", href: "/schedule" },
          ].map(a => (
            <Link key={a.label} href={a.href}
                  className="rounded-[14px] p-3.5 text-center active:scale-[0.95] transition-all"
                  style={{ background: "var(--bg-surface)" }}>
              <span className="text-[22px]">{a.icon}</span>
              <p className="text-[9px] font-bold mt-1.5" style={{ color: "var(--text-2)" }}>{a.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Job Alerts */}
      <div className="px-5">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Recent Alerts</p>
          <Link href="/notifications" className="text-[10px] font-bold" style={{ color: "var(--brand-soft)" }}>See All →</Link>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-[18px] p-6 text-center" style={{ background: "var(--bg-card)" }}>
            <p className="text-[36px] mb-2">{isOnline ? "👀" : "😴"}</p>
            <p className="text-[13px] font-bold tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
              {isOnline ? "Waiting for job alerts..." : "Go online to receive jobs"}
            </p>
            <p className="text-[10px] mt-1 font-medium" style={{ color: "var(--text-3)" }}>
              {isOnline ? "We'll notify you" : "Toggle the switch above"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {alerts.map(a => (
              <div key={a.id} className="rounded-[14px] p-3.5 flex items-center gap-3"
                   style={{ background: a.is_read ? "var(--bg-surface)" : "var(--bg-card)", boxShadow: !a.is_read ? "0 0 0 1px rgba(255,107,0,0.2)" : "none" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: a.is_read ? "var(--bg-elevated)" : "var(--brand-tint)" }}>
                  <span className="text-[16px]">{a.type === 'JOB_ALERT' ? '🔔' : a.type === 'BOOKING_ACCEPTED' ? '✅' : a.type === 'PAYMENT_RECEIVED' ? '💰' : '📢'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold truncate" style={{ color: "var(--text-1)" }}>{a.title}</p>
                  <p className="text-[9px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>{a.body}</p>
                  <p className="text-[8px] mt-0.5 font-data" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!a.is_read && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--brand)" }} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
