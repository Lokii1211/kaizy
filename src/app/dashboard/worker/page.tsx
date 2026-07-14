"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { useAuth } from "@/stores/AuthStore";
import { supabase } from "@/lib/supabase";
import JobAlertOverlay from "@/components/JobAlertOverlay";
import LivenessCheck from "@/components/LivenessCheck";
import NightSafetyBriefing from "@/components/NightSafetyBriefing";

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
  id: string;
  trade: string;
  tradeIcon: string;
  problem: string;
  distance: number;
  eta: number;
  earnings: number;
  hirerRating: number;
  hirerName: string;
  duration: string;
  isEmergency: boolean;
  address: string;
}

export default function WorkerDashboardPage() {
  const { isDark, toggle } = useTheme();
  const { user: authUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authUser !== null && authUser.user_type !== "worker") router.replace("/dashboard/hirer");
  }, [authUser, router]);
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
  const [showLivenessCheck, setShowLivenessCheck] = useState(false);
  const [showNightBriefing, setShowNightBriefing] = useState(false);
  const [pendingAlertId, setPendingAlertId] = useState<string | null>(null);
  const [alertFetchFailures, setAlertFetchFailures] = useState(0);

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

  // Performs the actual online/offline toggle API call — updates GPS + Supabase
  const performToggle = async (goOnline: boolean) => {
    if (!user) return;
    setToggling(true);
    try {
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

  // Toggle handler — going online requires a weekly liveness check first
  const handleToggle = async () => {
    if (!user) return;
    const goOnline = !isOnline;

    if (goOnline) {
      // Pause and require liveness verification before going online
      setShowLivenessCheck(true);
      return;
    }

    // Going offline — no liveness check needed
    await performToggle(false);
  };

  // Poll /api/workers/alerts every 8s — primary job alert delivery path
  useEffect(() => {
    if (!user || !isOnline) return;

    const checkForAlerts = async () => {
      try {
        const res = await fetch("/api/workers/alerts");
        if (!res.ok) throw new Error("bad response");
        const json = await res.json();
        setAlertFetchFailures(0);

        if (json.success && json.data && !activeJobAlert && !acceptedJob) {
          const d = json.data;
          setActiveJobAlert({
            id: d.id,
            trade: d.trade,
            tradeIcon: d.tradeIcon,
            problem: d.problem,
            distance: d.distance,
            eta: d.eta,
            earnings: d.earnings,
            hirerRating: d.hirerRating,
            hirerName: d.hirerName,
            duration: d.duration,
            isEmergency: d.isEmergency,
            address: d.address,
          });
        }
      } catch {
        setAlertFetchFailures(prev => prev + 1);
      }
    };

    checkForAlerts();
    const intervalId = setInterval(checkForAlerts, 8000);
    return () => clearInterval(intervalId);
  }, [user, isOnline, activeJobAlert, acceptedJob]);

  // Realtime: subscribe to job_alerts INSERT for this worker (instant delivery)
  useEffect(() => {
    if (!user || !isOnline || !supabase) return;

    const channel = supabase
      .channel(`job-alerts-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "job_alerts",
        filter: `worker_id=eq.${user.id}`,
      }, () => {
        // Trigger an immediate poll to get the full alert details
        fetch("/api/workers/alerts").then(r => r.json()).then(json => {
          if (json.success && json.data && !activeJobAlert && !acceptedJob) {
            const d = json.data;
            setActiveJobAlert({
              id: d.id, trade: d.trade, tradeIcon: d.tradeIcon, problem: d.problem,
              distance: d.distance, eta: d.eta, earnings: d.earnings,
              hirerRating: d.hirerRating, hirerName: d.hirerName, duration: d.duration,
              isEmergency: d.isEmergency, address: d.address,
            });
          }
        }).catch(() => {});
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  // Handle job accept — calls /api/jobs/accept which runs accept_job_atomic
  const handleAcceptJob = useCallback(async (alertId: string) => {
    if (!user || !activeJobAlert) return;
    try {
      const res = await fetch("/api/jobs/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      const json = await res.json();

      if (json.success && json.data?.bookingId) {
        const { bookingId, otp } = json.data;
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        // Store job context for active-job page
        try {
          sessionStorage.setItem("kaizy_active_job", JSON.stringify({
            jobId: activeJobAlert.id,
            bookingId,
            trade: activeJobAlert.trade,
            problem: activeJobAlert.problem,
            pricing: { total: activeJobAlert.earnings },
          }));
          sessionStorage.setItem("kaizy_booking_location", JSON.stringify({
            address: activeJobAlert.address,
            lat: activeJobAlert.distance ? 11.0168 : undefined,
            lng: activeJobAlert.distance ? 76.9558 : undefined,
          }));
        } catch {}

        setAcceptedJob({ bookingId, otp, message: "Job accepted! Head to the customer." });
        setActiveJobAlert(null);

        // Navigate to active-job page after brief delay
        setTimeout(() => router.push("/active-job"), 1500);
      } else {
        setAcceptedJob({
          bookingId: "",
          otp: "",
          message: json.error === "already_taken"
            ? "This job was just taken by another worker."
            : "Job expired. A new one will come soon!",
        });
        setActiveJobAlert(null);
      }
    } catch {
      setAcceptedJob({ bookingId: "", otp: "", message: "Failed to accept. Check your connection." });
      setActiveJobAlert(null);
    }
  }, [user, activeJobAlert, router]);

  // Handle job decline
  const handleDeclineJob = useCallback(async (alertId: string) => {
    setActiveJobAlert(null);
    // Mark as read
    try {
      await fetch(`/api/notifications`, { method: 'PATCH' });
    } catch {}
  }, []);

  // Intercepts JobAlertOverlay's onAccept — inserts a night safety briefing
  // for jobs between 9 PM and 6 AM before the real accept fires.
  const handleJobAlertAccept = useCallback((alertId: string) => {
    const hour = new Date().getHours();
    const isNightJob = hour >= 21 || hour < 6;

    if (isNightJob) {
      setPendingAlertId(alertId);
      setShowNightBriefing(true);
      return;
    }

    handleAcceptJob(alertId);
  }, [handleAcceptJob]);

  const displayName = (user?.name || "").split(" ")[0] || user?.phone?.replace('+91', '') || "Worker";
  const tradeName = user?.trade || "Worker";
  const kaizyScore = user?.kaizy_score || 0;
  const scoreProgress = Math.min((kaizyScore / 1000) * 100, 100);

  if (loading) {
    return (
      <div className="min-h-screen pb-28" style={{ background: "var(--bg-app)" }}>
        <div className="px-5 pt-6 pb-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <div className="skeleton h-3 w-20 rounded-full mb-2" />
              <div className="skeleton h-7 w-36 rounded-full mb-2" />
              <div className="skeleton h-3 w-24 rounded-full" />
            </div>
            <div className="flex gap-2">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="skeleton w-10 h-10 rounded-xl" />
            </div>
          </div>
          <div className="skeleton h-[100px] w-full rounded-[22px] mb-4" />
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-[18px]" />)}
          </div>
        </div>
        <div className="px-5 space-y-2.5">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-[16px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg-app)" }}>

      {/* ═══ OVERLAYS ═══ */}
      {activeJobAlert && (
        <JobAlertOverlay alert={activeJobAlert} onAccept={handleJobAlertAccept} onDecline={handleDeclineJob} />
      )}
      {showNightBriefing && activeJobAlert && (
        <NightSafetyBriefing
          jobDetails={{ trade: activeJobAlert.trade, distance: activeJobAlert.distance, earnings: activeJobAlert.earnings, area: activeJobAlert.address }}
          onAccept={() => { setShowNightBriefing(false); if (pendingAlertId) handleAcceptJob(pendingAlertId); setPendingAlertId(null); }}
          onDecline={() => { setShowNightBriefing(false); setPendingAlertId(null); setActiveJobAlert(null); }}
        />
      )}
      {showLivenessCheck && user && (
        <LivenessCheck workerId={user.id} lastVerifiedAt={undefined}
          onVerified={() => { setShowLivenessCheck(false); performToggle(true); }}
          onSkip={() => setShowLivenessCheck(false)} />
      )}

      {/* ═══ ACCEPTED JOB BANNER ═══ */}
      {acceptedJob && (
        <div className="fixed top-0 left-0 right-0 z-[9998] p-4 animate-slide-down"
             style={{ background: acceptedJob.bookingId ? "var(--success)" : "var(--warning)" }}>
          <div className="max-w-md mx-auto text-center">
            <p className="text-[16px] font-black text-white">{acceptedJob.bookingId ? "✅ Job Accepted!" : "⚠️"}</p>
            <p className="text-[12px] mt-1 text-white/80">{acceptedJob.message}</p>
            {acceptedJob.otp && (
              <p className="text-[24px] font-black text-white mt-2" style={{ letterSpacing: "6px", fontFamily: "'JetBrains Mono', monospace" }}>
                {acceptedJob.otp}
              </p>
            )}
            <button onClick={() => setAcceptedJob(null)}
                    className="mt-3 text-[12px] font-bold px-5 py-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
              {acceptedJob.bookingId ? "Start Navigation →" : "OK"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          HEADER
      ══════════════════════════════ */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>{greeting} 👋</p>
            <h1 className="text-[24px] font-black tracking-tight leading-tight"
                style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
              {displayName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-semibold capitalize" style={{ color: "var(--brand)" }}>{tradeName}</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
                KS {kaizyScore}/1000
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notifications" aria-label="Notifications"
                  className="w-10 h-10 rounded-xl flex items-center justify-center relative active:scale-90 transition-transform"
                  style={{ background: "var(--bg-surface)" }}>
              <span className="text-[16px]">🔔</span>
              {alerts.filter(a => !a.is_read).length > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                     style={{ background: "var(--danger)", border: "2px solid var(--bg-app)" }} />
              )}
            </Link>
            <button onClick={toggle} aria-label="Toggle theme"
                    className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: "var(--bg-surface)" }}>
              <span className="text-[16px]">{isDark ? "🌙" : "☀️"}</span>
            </button>
          </div>
        </div>

        {/* ══ ONLINE TOGGLE ══ */}
        <button onClick={handleToggle} disabled={toggling}
                className="w-full rounded-[22px] p-5 active:scale-[0.97] transition-all"
                style={{
                  background: isOnline ? "linear-gradient(135deg, #10B981, #059669)" : "var(--bg-card)",
                  boxShadow: isOnline ? "0 12px 40px -4px rgba(52,211,153,0.35)" : "var(--shadow-card)",
                }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Pill toggle */}
              <div className="w-14 h-8 rounded-full relative transition-all flex-shrink-0"
                   style={{ background: isOnline ? "rgba(255,255,255,0.25)" : "var(--bg-elevated)" }}>
                <div className="absolute top-1 rounded-full w-6 h-6 transition-all"
                     style={{ background: isOnline ? "#fff" : "var(--text-3)", left: isOnline ? 28 : 4, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }} />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-black"
                   style={{ color: isOnline ? "#fff" : "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
                  {toggling ? "Switching..." : isOnline ? "You're Online" : "You're Offline"}
                </p>
                <p className="text-[11px] font-medium"
                   style={{ color: isOnline ? "rgba(255,255,255,0.7)" : "var(--text-3)" }}>
                  {isOnline ? "Receiving job alerts" : "Tap to start earning"}
                </p>
              </div>
            </div>
            {isOnline && <div className="w-3 h-3 rounded-full online-dot" style={{ background: "#fff" }} />}
          </div>
          {isOnline && alertFetchFailures >= 3 && (
            <p className="text-[10px] font-bold mt-2 text-center" style={{ color: "rgba(255,255,255,0.8)" }}>
              ⚠️ Connection issue — alerts may be delayed
            </p>
          )}
        </button>
      </div>

      {/* ══════════════════════════════
          TODAY'S STATS
      ══════════════════════════════ */}
      <div className="px-5 mb-5">
        {/* Earnings hero */}
        <div className="rounded-[20px] p-5 mb-3" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>Today&apos;s Earnings</p>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-[40px] font-black leading-none" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
              ₹{todayEarnings.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[18px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>{todayJobs}</p>
              <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Jobs done</p>
            </div>
            <div>
              <p className="text-[18px] font-black" style={{ color: "var(--warning)", fontFamily: "'Epilogue', sans-serif" }}>
                {avgRating > 0 ? avgRating.toFixed(1) + "★" : "—"}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Avg rating</p>
            </div>
            <div>
              <p className="text-[18px] font-black" style={{ color: "var(--info)", fontFamily: "'JetBrains Mono', monospace" }}>{kaizyScore}</p>
              <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>KaizyScore</p>
            </div>
          </div>

          {/* Score progress */}
          {kaizyScore > 0 && (
            <div className="mt-3">
              <div className="flex justify-between mb-1">
                <span className="text-[9px] font-bold" style={{ color: "var(--text-3)" }}>KaizyScore Progress</span>
                <span className="text-[9px] font-bold" style={{ color: "var(--brand)" }}>{kaizyScore}/1000</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${scoreProgress}%`, background: "var(--gradient-cta)" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════
          QUICK ACTIONS
      ══════════════════════════════ */}
      <div className="px-5 mb-5">
        <p className="text-[13px] font-black mb-3" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
          Quick Actions
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: "💰", label: "Earnings", href: "/earnings", color: "#10B981" },
            { icon: "📋", label: "My Jobs", href: "/active-job", color: "#FF6B00" },
            { icon: "🏆", label: "Leaderboard", href: "/leaderboard", color: "#F59E0B" },
            { icon: "🪪", label: "KaizyPass", href: "/verify", color: "#3B82F6" },
            { icon: "💬", label: "KaizyBot", href: "/kaizybot", color: "#8B5CF6" },
            { icon: "⚙️", label: "Settings", href: "/settings", color: "#78716C" },
          ].map(a => (
            <Link key={a.label} href={a.href}
                  className="flex flex-col items-center rounded-[18px] py-4 px-2 active:scale-[0.95] transition-all"
                  style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
              <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[20px] mb-2"
                   style={{ background: `${a.color}12` }}>
                {a.icon}
              </div>
              <span className="text-[9px] font-bold text-center" style={{ color: "var(--text-2)" }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════
          JOB ALERTS
      ══════════════════════════════ */}
      <div className="px-5">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[13px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Recent Alerts
          </p>
          <Link href="/notifications" className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>
            See All →
          </Link>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-[22px] p-7 text-center" style={{ background: "var(--bg-card)" }}>
            <span className="text-[44px] block mb-3">{isOnline ? "👀" : "😴"}</span>
            <p className="text-[15px] font-black mb-1" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
              {isOnline ? "Watching for jobs..." : "You are offline"}
            </p>
            <p className="text-[12px] font-medium" style={{ color: "var(--text-3)" }}>
              {isOnline ? "New job alerts will appear here" : "Toggle the switch above to start earning"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.map(a => {
              const alertIcon = a.type === 'JOB_ALERT' ? '🔔' : a.type === 'BOOKING_ACCEPTED' ? '✅' : a.type === 'PAYMENT_RECEIVED' ? '💰' : '📢';
              return (
                <div key={a.id} className="rounded-[18px] p-4 flex items-center gap-3.5"
                     style={{
                       background: a.is_read ? "var(--bg-surface)" : "var(--bg-card)",
                       boxShadow: !a.is_read ? "0 0 0 1.5px rgba(255,107,0,0.2), var(--shadow-card)" : "none",
                     }}>
                  <div className="w-10 h-10 rounded-[13px] flex items-center justify-center text-[18px] shrink-0"
                       style={{ background: a.is_read ? "var(--bg-elevated)" : "var(--brand-tint)" }}>
                    {alertIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-1)" }}>{a.title}</p>
                    <p className="text-[10px] font-medium mt-0.5 line-clamp-1" style={{ color: "var(--text-3)" }}>{a.body}</p>
                    <p className="text-[9px] mt-1" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {new Date(a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!a.is_read && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--brand)" }} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
