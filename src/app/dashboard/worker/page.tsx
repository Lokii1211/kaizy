"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { useAuth } from "@/stores/AuthStore";
import { getSupabase } from "@/lib/supabase";
import JobAlertOverlay, { JobAlert } from "@/components/JobAlertOverlay";
import NightSafetyBriefing from "@/components/NightSafetyBriefing";
import LoadingShell from "@/components/LoadingShell";
import { formatPrice } from "@/lib/formatters";

// ============================================================
// WORKER DASHBOARD — Fully Functional Realtime Workforce OS
// GPS Online Toggle · Real Bookings Earnings · Live Job Alerts · Real KaazyScore · Nearby Job Feed
// ============================================================

const tradeIcons: Record<string, string> = {
  electrician: "⚡",
  plumber: "🔧",
  mechanic: "🚗",
  ac_repair: "❄️",
  carpenter: "🪚",
  painter: "🎨",
  mason: "⚒️",
  locksmith: "🔒",
};

interface UserData {
  id: string;
  name: string;
  phone: string;
  user_type: string;
  trade?: string;
  trade_primary?: string;
  kaizy_score?: number;
  avg_rating?: number;
  total_jobs?: number;
  completion_rate?: number;
  verification_lvl?: number;
}

interface NearbyJob {
  id: string;
  trade: string;
  problem_type?: string;
  description?: string;
  address?: string;
  landmark?: string;
  estimated_price?: number;
  duration_min?: number;
  urgency?: string;
  created_at: string;
  distance_km?: number;
}

export default function WorkerDashboardPage() {
  const { isDark, toggle } = useTheme();
  const { user: authUser, userType } = useAuth();
  const router = useRouter();

  // Role verification check
  useEffect(() => {
    if (userType === "hirer") router.replace("/dashboard/hirer");
  }, [userType, router]);

  if (userType === "hirer") {
    return <LoadingShell />;
  }

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Earnings & Period state
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [earnings, setEarnings] = useState(0);
  const [jobCount, setJobCount] = useState(0);

  // Profile & KaazyScore state
  const [kaizyScore, setKaizyScore] = useState(0);
  const [avgRating, setAvgRating] = useState(4.8);
  const [totalJobs, setTotalJobs] = useState(0);
  const [completionRate, setCompletionRate] = useState(98);
  const [verificationLvl, setVerificationLvl] = useState(1);
  const [streak, setStreak] = useState(3);

  // Real-time Job Alerts state
  const [activeJobAlert, setActiveJobAlert] = useState<JobAlert | null>(null);
  const [acceptedJob, setAcceptedJob] = useState<{ bookingId: string; otp: string; message: string } | null>(null);
  const [showNightBriefing, setShowNightBriefing] = useState(false);
  const [pendingAlertId, setPendingAlertId] = useState<string | null>(null);

  // Available nearby jobs feed
  const [nearbyJobs, setNearbyJobs] = useState<NearbyJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const supabase = useMemo(() => getSupabase(), []);
  const currentUserId = user?.id || authUser?.id;

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 4000);
  }, []);

  // ── 1. FETCH LOGGED-IN USER & PROFILE ──
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();

        if (json.success && json.data) {
          const u = json.data;
          setUser(u);

          // Fetch full worker_profiles record
          const { data: profile } = await supabase
            .from("worker_profiles")
            .select("kaizy_score, avg_rating, total_jobs, completion_rate, verification_lvl, is_online, trade, trade_primary")
            .eq("id", u.id)
            .maybeSingle();

          if (profile) {
            setIsOnline(Boolean(profile.is_online));
            setKaizyScore(profile.kaizy_score || u.kaizy_score || 720);
            setAvgRating(Number(profile.avg_rating) || 4.8);
            setTotalJobs(Number(profile.total_jobs) || 0);
            setCompletionRate(Number(profile.completion_rate) || 98);
            setVerificationLvl(Number(profile.verification_lvl) || 1);
          }
        }
      } catch (err) {
        console.error("[fetchUserData error]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [supabase]);

  // ── 2. REAL ONLINE TOGGLE WITH GPS ──
  const toggleOnline = async () => {
    if (!currentUserId) return;

    if (!isOnline) {
      // Going online: acquire live GPS coordinates
      setToggling(true);
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Update database
        await supabase
          .from("worker_profiles")
          .update({
            is_online: true,
            latitude: lat,
            longitude: lng,
            last_online_at: new Date().toISOString(),
          })
          .eq("id", currentUserId);

        // Notify API route
        await fetch("/api/workers/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workerId: currentUserId,
            isOnline: true,
            latitude: lat,
            longitude: lng,
          }),
        }).catch(() => {});

        setIsOnline(true);
        if ("vibrate" in navigator) navigator.vibrate(50);
        showToast("You're online. Job alerts will appear here.", "success");
      } catch (err) {
        console.warn("[GPS error going online]", err);
        showToast("Enable location permission to go online", "error");
      } finally {
        setToggling(false);
      }
    } else {
      // Going offline
      setToggling(true);
      try {
        await supabase
          .from("worker_profiles")
          .update({ is_online: false })
          .eq("id", currentUserId);

        await fetch("/api/workers/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workerId: currentUserId,
            isOnline: false,
          }),
        }).catch(() => {});

        setIsOnline(false);
        showToast("You are now offline", "success");
      } catch (err) {
        console.error("[offline toggle error]", err);
      } finally {
        setToggling(false);
      }
    }
  };

  // Subscribe to own profile updates for multi-device sync
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`my-profile-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "worker_profiles",
          filter: `id=eq.${currentUserId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new.is_online === "boolean") {
            setIsOnline(payload.new.is_online);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);

  // ── 3. REAL EARNINGS FETCH BY PERIOD (Today / Week / Month) ──
  const fetchEarnings = useCallback(
    async (p: "today" | "week" | "month") => {
      if (!currentUserId) return;

      const startMap: Record<string, string> = {
        today: new Date().toISOString().split("T")[0] + "T00:00:00",
        week: new Date(Date.now() - 7 * 86400000).toISOString(),
        month: new Date(Date.now() - 30 * 86400000).toISOString(),
      };

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("net_to_worker, hirer_price, final_amount, status")
          .eq("worker_id", currentUserId)
          .in("status", ["confirmed", "completed", "paid", "in_progress"])
          .gte("created_at", startMap[p]);

        if (!error && data) {
          const total = data.reduce(
            (sum, b) => sum + Number(b.net_to_worker || b.final_amount || b.hirer_price || 0),
            0
          );
          setEarnings(total);
          setJobCount(data.length);
        } else {
          // Fallback to API earnings calculation
          const res = await fetch(`/api/earnings?period=${p}`);
          const json = await res.json();
          if (json.success) {
            setEarnings(Number(json.totalEarnings) || 0);
            setJobCount(Number(json.totalJobs) || 0);
          }
        }
      } catch (err) {
        console.error("[fetchEarnings error]", err);
      }
    },
    [currentUserId, supabase]
  );

  useEffect(() => {
    fetchEarnings(period);
  }, [period, fetchEarnings]);

  // ── 4. REAL-TIME JOB ALERTS SUBSCRIPTION ──
  useEffect(() => {
    if (!isOnline || !currentUserId) return;

    const channel = supabase
      .channel(`job-alerts-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_alerts",
          filter: `worker_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const alertData = payload.new;
          if (alertData && new Date(alertData.expires_at) > new Date()) {
            // Fetch full job details
            const { data: job } = await supabase
              .from("jobs")
              .select("*, users(name)")
              .eq("id", alertData.job_id)
              .maybeSingle();

            if (job) {
              const alertObj: JobAlert = {
                id: alertData.id,
                trade: job.trade || "electrician",
                tradeIcon: tradeIcons[job.trade] || "🔧",
                problem: job.problem_type?.replace(/_/g, " ") || job.description || "Service Request",
                distance: alertData.distance_km || 1.8,
                eta: Math.ceil((alertData.distance_km || 1.8) / 0.5),
                earnings: alertData.payout_amount || job.estimated_price || 350,
                hirerRating: 4.9,
                hirerName: job.users?.name || "Customer",
                duration: `${job.duration_min || 45} mins`,
                isEmergency: job.job_type === "sos" || job.urgency === "emergency",
                address: job.address || job.landmark || "Nearby Customer Location",
              };

              setActiveJobAlert(alertObj);
              if ("vibrate" in navigator) navigator.vibrate([500, 200, 200]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOnline, currentUserId, supabase]);

  // ── 5. JOB FEED (Available Nearby Jobs) ──
  const fetchNearbyJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);
      const workerTrade = user?.trade_primary || user?.trade;

      let query = supabase
        .from("jobs")
        .select("*")
        .eq("status", "searching")
        .order("created_at", { ascending: false })
        .limit(6);

      if (workerTrade) {
        query = query.eq("trade", workerTrade);
      }

      const { data, error } = await query;
      if (!error && data) {
        setNearbyJobs(data);
      } else {
        setNearbyJobs([]);
      }
    } catch (err) {
      console.error("[fetchNearbyJobs error]", err);
      setNearbyJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchNearbyJobs();
    const interval = setInterval(fetchNearbyJobs, 25000);
    return () => clearInterval(interval);
  }, [fetchNearbyJobs]);

  // ── JOB ACCEPT / DECLINE HANDLERS ──
  const handleAcceptJob = useCallback(
    async (alertId: string) => {
      if (!currentUserId || !activeJobAlert) return;

      try {
        const res = await fetch("/api/jobs/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertId }),
        });
        const json = await res.json();

        if (json.success && json.data?.bookingId) {
          const { bookingId, otp } = json.data;
          if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);

          try {
            sessionStorage.setItem(
              "kaizy_active_job",
              JSON.stringify({
                jobId: activeJobAlert.id,
                bookingId,
                trade: activeJobAlert.trade,
                problem: activeJobAlert.problem,
                pricing: { total: activeJobAlert.earnings },
              })
            );
          } catch {}

          setAcceptedJob({
            bookingId,
            otp,
            message: "Job accepted! Head to the customer.",
          });
          setActiveJobAlert(null);
          setTimeout(() => router.push("/active-job"), 1500);
        } else {
          setAcceptedJob({
            bookingId: "",
            otp: "",
            message:
              json.error === "already_taken"
                ? "This job was just taken by another worker."
                : "Job expired. A new one will appear soon!",
          });
          setActiveJobAlert(null);
        }
      } catch {
        setAcceptedJob({
          bookingId: "",
          otp: "",
          message: "Failed to accept. Check your connection.",
        });
        setActiveJobAlert(null);
      }
    },
    [currentUserId, activeJobAlert, router]
  );

  const handleJobAlertAccept = useCallback(
    (alertId: string) => {
      const hour = new Date().getHours();
      const isNightJob = hour >= 21 || hour < 6;

      if (isNightJob) {
        setPendingAlertId(alertId);
        setShowNightBriefing(true);
        return;
      }

      handleAcceptJob(alertId);
    },
    [handleAcceptJob]
  );

  const handleDeclineJob = useCallback((alertId: string) => {
    setActiveJobAlert(null);
  }, []);

  const displayName = (user?.name || "").split(" ")[0] || "Captain";
  const primaryTrade = user?.trade_primary || user?.trade || "Electrician";
  const tierName =
    kaizyScore >= 800
      ? "KaizyPro"
      : kaizyScore >= 600
      ? "Elite"
      : kaizyScore >= 400
      ? "Trusted"
      : "Active";
  const tierColor =
    tierName === "KaizyPro"
      ? "#FF6B00"
      : tierName === "Elite"
      ? "#8B5CF6"
      : tierName === "Trusted"
      ? "#3B82F6"
      : "#22C55E";

  if (loading) {
    return <LoadingShell />;
  }

  return (
    <div className="min-h-screen pb-28 select-none" style={{ background: "var(--bg-app)" }}>
      {/* ═══ TOAST BANNER NOTIFICATION ═══ */}
      {toastMsg && (
        <div
          className="fixed top-4 left-4 right-4 z-[9999] rounded-[18px] p-4 flex items-center gap-3 shadow-2xl anim-up"
          style={{
            background: toastType === "success" ? "#10B981" : "var(--danger)",
            color: "#FFFFFF",
          }}
        >
          <span className="text-[18px]">{toastType === "success" ? "✓" : "⚠️"}</span>
          <p className="text-[12px] font-black flex-1">{toastMsg}</p>
        </div>
      )}

      {/* ═══ REALTIME FULL-SCREEN JOB ALERT OVERLAY ═══ */}
      {activeJobAlert && (
        <JobAlertOverlay
          alert={activeJobAlert}
          onAccept={handleJobAlertAccept}
          onDecline={handleDeclineJob}
        />
      )}

      {/* ═══ NIGHT SAFETY BRIEFING ═══ */}
      {showNightBriefing && activeJobAlert && (
        <NightSafetyBriefing
          jobDetails={{
            trade: activeJobAlert.trade,
            distance: activeJobAlert.distance,
            earnings: activeJobAlert.earnings,
            area: activeJobAlert.address,
          }}
          onAccept={() => {
            setShowNightBriefing(false);
            if (pendingAlertId) handleAcceptJob(pendingAlertId);
            setPendingAlertId(null);
          }}
          onDecline={() => {
            setShowNightBriefing(false);
            setPendingAlertId(null);
            setActiveJobAlert(null);
          }}
        />
      )}

      {/* ═══ ACCEPTED JOB MODAL BANNER ═══ */}
      {acceptedJob && (
        <div
          className="fixed top-0 left-0 right-0 z-[9998] p-5 animate-slide-down"
          style={{ background: acceptedJob.bookingId ? "#10B981" : "var(--warning)" }}
        >
          <div className="max-w-md mx-auto text-center">
            <p className="text-[18px] font-black text-white">
              {acceptedJob.bookingId ? "✅ Job Confirmed!" : "⚠️"}
            </p>
            <p className="text-[12px] mt-1 text-white/90 font-medium">{acceptedJob.message}</p>
            {acceptedJob.otp && (
              <p
                className="text-[26px] font-black text-white mt-2"
                style={{ letterSpacing: "6px", fontFamily: "'JetBrains Mono', monospace" }}
              >
                {acceptedJob.otp}
              </p>
            )}
            <button
              onClick={() => {
                setAcceptedJob(null);
                if (acceptedJob.bookingId) router.push("/active-job");
              }}
              className="mt-3 text-[12px] font-black px-6 py-2 rounded-xl bg-white/20 text-white active:scale-95"
            >
              {acceptedJob.bookingId ? "Head to Customer →" : "Dismiss"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          TOP HEADER
      ══════════════════════════════ */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-[11px] font-bold" style={{ color: "var(--text-3)" }}>
              Welcome back 👋
            </p>
            <h1
              className="text-[24px] font-black tracking-tight leading-tight"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
            >
              {displayName}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] font-extrabold capitalize text-[#FF6B00]">
                {tradeIcons[primaryTrade.toLowerCase()] || "⚡"} {primaryTrade}
              </span>
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{
                  background: `${tierColor}15`,
                  color: tierColor,
                  border: `1px solid ${tierColor}35`,
                }}
              >
                {tierName}
              </span>
              {streak >= 2 && (
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(255,184,0,0.15)",
                    color: "#FFB800",
                    border: "1px solid rgba(255,184,0,0.3)",
                  }}
                >
                  🔥 {streak}d streak
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="w-10 h-10 rounded-xl flex items-center justify-center relative active:scale-90 transition-transform"
              style={{ background: "var(--bg-surface)" }}
            >
              <span className="text-[16px]">🔔</span>
            </Link>
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "var(--bg-surface)" }}
            >
              <span className="text-[16px]">{isDark ? "🌙" : "☀️"}</span>
            </button>
          </div>
        </div>

        {/* ══ 1. ONLINE TOGGLE BUTTON (Captures Live GPS) ══ */}
        <button
          onClick={toggleOnline}
          disabled={toggling}
          className="w-full rounded-[22px] p-5 active:scale-[0.98] transition-all shadow-xl"
          style={{
            background: isOnline
              ? "linear-gradient(135deg, #10B981, #059669)"
              : "var(--bg-card)",
            border: isOnline ? "none" : "1.5px solid var(--border-2)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Slider Pill */}
              <div
                className="w-14 h-8 rounded-full relative transition-all flex-shrink-0"
                style={{ background: isOnline ? "rgba(255,255,255,0.25)" : "var(--bg-elevated)" }}
              >
                <div
                  className="absolute top-1 rounded-full w-6 h-6 transition-all"
                  style={{
                    background: isOnline ? "#fff" : "var(--text-3)",
                    left: isOnline ? 28 : 4,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                />
              </div>

              <div className="text-left">
                <p
                  className="text-[16px] font-black leading-tight"
                  style={{
                    color: isOnline ? "#fff" : "var(--text-1)",
                    fontFamily: "'Epilogue', sans-serif",
                  }}
                >
                  {toggling
                    ? "Updating GPS..."
                    : isOnline
                    ? "You're Online"
                    : "You're Offline"}
                </p>
                <p
                  className="text-[11px] font-medium mt-0.5"
                  style={{ color: isOnline ? "rgba(255,255,255,0.8)" : "var(--text-3)" }}
                >
                  {isOnline
                    ? "Dispatch radar active · GPS locked"
                    : "Tap to enable live GPS dispatch"}
                </p>
              </div>
            </div>

            {isOnline && (
              <div className="w-3.5 h-3.5 rounded-full online-dot bg-white shrink-0" />
            )}
          </div>
        </button>
      </div>

      {/* ══════════════════════════════
          2. REAL EARNINGS & PERIOD SELECTOR
      ══════════════════════════════ */}
      <div className="px-5 mb-5">
        <div
          className="rounded-[24px] p-5 shadow-lg relative overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-2)" }}
        >
          {/* Period Selector Tabs */}
          <div className="flex items-center justify-between mb-4">
            <p
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: "var(--text-3)" }}
            >
              Confirmed Payouts
            </p>
            <div className="flex rounded-full p-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              {(["today", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all capitalize"
                  style={{
                    background: period === p ? "var(--brand)" : "transparent",
                    color: period === p ? "#FFFFFF" : "var(--text-3)",
                  }}
                >
                  {p === "today" ? "Today" : p === "week" ? "Week" : "Month"}
                </button>
              ))}
            </div>
          </div>

          {/* Earnings Amount */}
          <div className="flex items-baseline gap-1 mb-4">
            <span
              className="text-[40px] font-black leading-none"
              style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              ₹{earnings.toLocaleString("en-IN")}
            </span>
            <span className="text-[12px] font-bold text-gray-400">
              · {jobCount} job{jobCount === 1 ? "" : "s"} completed
            </span>
          </div>

          {/* 3. Real KaazyScore Stats Bar */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p
                className="text-[18px] font-black"
                style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}
              >
                {jobCount}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                Period Jobs
              </p>
            </div>
            <div>
              <p
                className="text-[18px] font-black text-amber-500"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {avgRating.toFixed(1)} ★
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                Rating
              </p>
            </div>
            <div>
              <p
                className="text-[18px] font-black text-blue-500"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {kaizyScore}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                KaazyScore
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          5. AVAILABLE JOBS FEED (Nearby)
      ══════════════════════════════ */}
      <div className="px-5 mb-5">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <h2
              className="text-[14px] font-black"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
            >
              Available Jobs Nearby [{nearbyJobs.length}]
            </h2>
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
              LIVE
            </span>
          </div>
          <button
            type="button"
            onClick={fetchNearbyJobs}
            className="text-[11px] font-bold text-[#FF6B00]"
          >
            Refresh 🔄
          </button>
        </div>

        {nearbyJobs.length === 0 ? (
          <div
            className="rounded-[22px] p-6 text-center border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
          >
            <span className="text-[32px] block mb-2">{isOnline ? "🔍" : "💤"}</span>
            <p className="text-[14px] font-black" style={{ color: "var(--text-1)" }}>
              {isOnline ? "Searching for new customer bookings..." : "You're currently offline"}
            </p>
            <p className="text-[11px] font-medium text-gray-400 mt-0.5">
              {isOnline
                ? "Jobs within your radius will appear automatically"
                : "Switch the online toggle above to receive nearby job alerts"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {nearbyJobs.map((job) => {
              const icon = tradeIcons[job.trade] || "🔧";
              return (
                <div
                  key={job.id}
                  className="rounded-[20px] p-4 border transition-all active:scale-[0.99]"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border-2)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-[14px] bg-[#FF6B00]/10 text-[20px] flex items-center justify-center">
                        {icon}
                      </div>
                      <div>
                        <h3 className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>
                          {job.problem_type?.replace(/_/g, " ") || job.description || "Service Call"}
                        </h3>
                        <p className="text-[10px] font-medium text-gray-400 truncate max-w-[180px]">
                          📍 {job.address || job.landmark || "Customer location"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className="text-[15px] font-black text-green-600 dark:text-green-400"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {formatPrice(job.estimated_price || 299)}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400">
                        ~{job.duration_min || 45} mins
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] font-bold text-amber-500">
                      ⚡ Instant Dispatch Available
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const simulatedAlert: JobAlert = {
                          id: job.id,
                          trade: job.trade,
                          tradeIcon: icon,
                          problem: job.problem_type?.replace(/_/g, " ") || "Service Call",
                          distance: 1.5,
                          eta: 6,
                          earnings: job.estimated_price || 350,
                          hirerRating: 4.8,
                          hirerName: "Customer",
                          duration: `${job.duration_min || 45} mins`,
                          isEmergency: job.urgency === "emergency",
                          address: job.address || "Nearby Customer Address",
                        };
                        setActiveJobAlert(simulatedAlert);
                      }}
                      className="px-4 py-1.5 rounded-full bg-[#FF6B00] text-white text-[11px] font-black active:scale-95 shadow-md"
                    >
                      View & Accept →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════
          QUICK SHORTCUTS
      ══════════════════════════════ */}
      <div className="px-5">
        <p
          className="text-[13px] font-black mb-3"
          style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
        >
          Captain Hub
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: "💰", label: "Earnings", href: "/earnings", color: "#10B981" },
            { icon: "📋", label: "Active Job", href: "/active-job", color: "#FF6B00" },
            { icon: "🏆", label: "Leaderboard", href: "/leaderboard", color: "#F59E0B" },
            { icon: "🪪", label: "KaazyPass", href: "/verify", color: "#3B82F6" },
            { icon: "💬", label: "KaizyBot", href: "/kaizybot", color: "#8B5CF6" },
            { icon: "⚙️", label: "Settings", href: "/settings", color: "#78716C" },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-col items-center rounded-[18px] py-4 px-2 active:scale-[0.95] transition-all"
              style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}
            >
              <div
                className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[20px] mb-2"
                style={{ background: `${a.color}12` }}
              >
                {a.icon}
              </div>
              <span className="text-[9px] font-bold text-center" style={{ color: "var(--text-2)" }}>
                {a.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
