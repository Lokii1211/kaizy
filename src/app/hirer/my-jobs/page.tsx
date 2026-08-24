"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { getSupabase } from "@/lib/supabase";
import UserAvatar from "@/components/UserAvatar";
import LoadingShell from "@/components/LoadingShell";
import { formatPrice } from "@/lib/formatters";

// ============================================================
// HIRER MY JOBS — /hirer/my-jobs
// 3 Tabs: [Active] [Upcoming] [History]
// Live Status Card · Progress Bar · Context Actions · Book Again · Receipts
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

interface ActiveJobItem {
  id: string;
  status: string;
  created_at: string;
  hirer_price: number;
  total_quoted?: number;
  trade: string;
  problem_type: string;
  description: string;
  worker_id: string;
  worker_name: string;
  worker_trade: string;
  worker_phone: string;
  worker_rating: number;
  worker_photo?: string | null;
}

interface UpcomingJobItem {
  id: string;
  status: string;
  scheduled_for: string;
  hirer_price: number;
  trade: string;
  problem_type: string;
  worker_id: string;
  worker_name: string;
  worker_trade: string;
  worker_photo?: string | null;
  is_confirmed: boolean;
}

interface HistoryJobItem {
  id: string;
  status: "confirmed" | "cancelled" | "refunded";
  completed_at: string;
  total_paid: number;
  trade: string;
  problem_type: string;
  worker_id: string;
  worker_name: string;
  rating_given?: number | null;
  has_review: boolean;
  visit_charge: number;
  labour_charge: number;
  parts_cost: number;
}

export default function HirerMyJobsPage() {
  const { isDark } = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "history">("active");
  const [loading, setLoading] = useState(true);

  const [activeJobs, setActiveJobs] = useState<ActiveJobItem[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<UpcomingJobItem[]>([]);
  const [historyJobs, setHistoryJobs] = useState<HistoryJobItem[]>([]);

  // Receipt Modal
  const [receiptItem, setReceiptItem] = useState<HistoryJobItem | null>(null);

  // Cancellation Modal
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabase(), []);

  // ── 1. FETCH ALL HIRER JOBS ──
  const fetchAllJobs = useCallback(async () => {
    try {
      setLoading(true);
      const { data: bookingsData, error } = await supabase
        .from("bookings")
        .select("*, jobs(*, users(*)), worker:worker_id(name, trade_primary, phone, avg_rating, profile_photo), reviews(rating)")
        .order("created_at", { ascending: false })
        .limit(60);

      if (!error && bookingsData) {
        const activeList: ActiveJobItem[] = [];
        const upcomingList: UpcomingJobItem[] = [];
        const historyList: HistoryJobItem[] = [];

        bookingsData.forEach((b) => {
          const wObj = b.worker || {};
          const jObj = b.jobs || {};
          const status = b.status || "accepted";
          const scheduledFor = b.scheduled_for || jObj.scheduled_for;

          // History check
          if (status === "confirmed" || status === "cancelled" || status === "refunded") {
            const rev = b.reviews?.[0];
            historyList.push({
              id: b.id,
              status: status as "confirmed" | "cancelled" | "refunded",
              completed_at: b.completed_at || b.updated_at || b.created_at,
              total_paid: Number(b.total_amount) || Number(b.hirer_price) || 350,
              trade: jObj.trade || "electrician",
              problem_type: jObj.problem_type || "General Service",
              worker_id: b.worker_id,
              worker_name: wObj.name || "Suresh Kumar",
              rating_given: rev?.rating || null,
              has_review: Boolean(rev?.rating),
              visit_charge: Number(b.visit_charge) || 49,
              labour_charge: Number(b.worker_quote) || 300,
              parts_cost: Number(b.parts_cost) || 0,
            });
            return;
          }

          // Upcoming check (scheduled in future and not yet completed)
          if (scheduledFor && new Date(scheduledFor).getTime() > Date.now() && status === "accepted") {
            upcomingList.push({
              id: b.id,
              status,
              scheduled_for: scheduledFor,
              hirer_price: Number(b.hirer_price) || 299,
              trade: jObj.trade || "electrician",
              problem_type: jObj.problem_type || "Inspection",
              worker_id: b.worker_id,
              worker_name: wObj.name || "Suresh Kumar",
              worker_trade: wObj.trade_primary || jObj.trade || "Electrician",
              worker_photo: wObj.profile_photo || null,
              is_confirmed: true,
            });
            return;
          }

          // Active in-progress jobs
          const activeStatuses = [
            "accepted",
            "en_route",
            "arrived",
            "quote_sent",
            "quote_approved",
            "working",
            "in_progress",
            "completed",
          ];

          if (activeStatuses.includes(status)) {
            activeList.push({
              id: b.id,
              status,
              created_at: b.created_at,
              hirer_price: Number(b.hirer_price) || 299,
              total_quoted: Number(b.total_amount) || 0,
              trade: jObj.trade || "electrician",
              problem_type: jObj.problem_type || "Service Request",
              description: jObj.description || "",
              worker_id: b.worker_id,
              worker_name: wObj.name || "Suresh Kumar",
              worker_trade: wObj.trade_primary || jObj.trade || "Electrician",
              worker_phone: wObj.phone || "+919876500000",
              worker_rating: Number(wObj.avg_rating) || 4.9,
              worker_photo: wObj.profile_photo || null,
            });
          }
        });

        setActiveJobs(activeList);
        setUpcomingJobs(upcomingList);
        setHistoryJobs(historyList);
      }
    } catch (err) {
      console.error("[HirerMyJobs fetch err]", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAllJobs();
  }, [fetchAllJobs]);

  // Realtime subscription for instant updates on active jobs
  useEffect(() => {
    const channel = supabase
      .channel("hirer-my-jobs-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => fetchAllJobs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchAllJobs]);

  // Cancel booking handler
  const handleCancelBooking = async (bId: string) => {
    try {
      await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bId, reason: "Cancelled by Hirer" }),
      });
      setCancellingBookingId(null);
      fetchAllJobs();
    } catch {}
  };

  const getStageIndex = (st: string) => {
    if (st === "completed") return 3;
    if (st === "working" || st === "quote_approved" || st === "quote_sent" || st === "arrived") return 2;
    if (st === "en_route") return 1;
    return 0;
  };

  if (loading) return <LoadingShell />;

  return (
    <div
      className="min-h-screen pb-24 select-none"
      style={{ background: isDark ? "var(--bg-app)" : "#F9FAFB" }}
    >
      {/* ── HEADER ── */}
      <div
        className="px-5 pt-7 pb-4 border-b sticky top-0 z-30 backdrop-blur-md flex justify-between items-center"
        style={{
          background: isDark ? "rgba(10,10,10,0.92)" : "rgba(255,255,255,0.95)",
          borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
        }}
      >
        <Link
          href="/"
          className="w-9 h-9 rounded-full flex items-center justify-center border font-bold"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          ←
        </Link>
        <h1
          className="text-[18px] font-black"
          style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
        >
          My Bookings & Jobs
        </h1>
        <div className="w-9" />
      </div>

      {/* ── 3 TABS BAR ── */}
      <div className="px-5 pt-4 pb-2">
        <div
          className="p-1 rounded-[16px] border flex gap-1 shadow-sm"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className="flex-1 py-2.5 rounded-[12px] text-[12px] font-black transition-all flex items-center justify-center gap-1.5"
            style={{
              background: activeTab === "active" ? "#FF6B00" : "transparent",
              color: activeTab === "active" ? "#FFFFFF" : "var(--text-2)",
            }}
          >
            <span>Active</span>
            {activeJobs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className="flex-1 py-2.5 rounded-[12px] text-[12px] font-black transition-all flex items-center justify-center gap-1.5"
            style={{
              background: activeTab === "upcoming" ? "#FF6B00" : "transparent",
              color: activeTab === "upcoming" ? "#FFFFFF" : "var(--text-2)",
            }}
          >
            <span>Upcoming</span>
            {upcomingJobs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20">
                {upcomingJobs.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className="flex-1 py-2.5 rounded-[12px] text-[12px] font-black transition-all"
            style={{
              background: activeTab === "history" ? "#FF6B00" : "transparent",
              color: activeTab === "history" ? "#FFFFFF" : "var(--text-2)",
            }}
          >
            History
          </button>
        </div>
      </div>

      {/* ══════════════════════════════
          TAB 1: ACTIVE JOBS
      ══════════════════════════════ */}
      {activeTab === "active" && (
        <div className="px-5 pt-3 space-y-4">
          {activeJobs.length === 0 ? (
            <div
              className="p-10 rounded-[24px] border text-center my-6 space-y-3"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
            >
              <span className="text-[44px] block">⚡</span>
              <h3 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>
                No active bookings right now
              </h3>
              <p className="text-[12px] font-medium text-gray-400 max-w-xs mx-auto">
                Need fast emergency repairs or want to schedule ahead?
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <Link
                  href="/hirer/sos"
                  className="px-5 py-2.5 rounded-[14px] text-[12px] font-black text-white bg-[#FF6B00] shadow-md"
                >
                  Book Emergency SOS →
                </Link>
                <Link
                  href="/hirer/browse"
                  className="px-5 py-2.5 rounded-[14px] text-[12px] font-bold border"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border-2)" }}
                >
                  Browse Captains
                </Link>
              </div>
            </div>
          ) : (
            activeJobs.map((job) => {
              const stage = getStageIndex(job.status);
              const icon = tradeIcons[job.trade] || "⚡";

              return (
                <div
                  key={job.id}
                  className="p-5 rounded-[24px] border shadow-md space-y-4"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
                >
                  {/* Top Worker + Price Row */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-[#FF6B00] overflow-hidden">
                        <UserAvatar name={job.worker_name} size={48} />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-black" style={{ color: "var(--text-1)" }}>
                          {job.worker_name}
                        </h3>
                        <p className="text-[11px] font-bold text-gray-400 capitalize">
                          {icon} {job.worker_trade} · ★ {job.worker_rating.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    <span className="text-[16px] font-black text-green-600 dark:text-green-400 font-mono">
                      {formatPrice(job.total_quoted || job.hirer_price)}
                    </span>
                  </div>

                  {/* Status Badge + Problem */}
                  <div className="flex justify-between items-center p-3 rounded-[14px] bg-black/5 dark:bg-white/5 text-[12px]">
                    <span className="font-extrabold capitalize" style={{ color: "var(--text-1)" }}>
                      {job.problem_type.replace(/_/g, " ")}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 capitalize flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-ping" />
                      {job.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* 4-Stage Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[8px] font-black uppercase text-gray-400 mb-1">
                      <span className={stage >= 0 ? "text-[#FF6B00]" : ""}>Confirmed</span>
                      <span className={stage >= 1 ? "text-[#FF6B00]" : ""}>En Route</span>
                      <span className={stage >= 2 ? "text-[#FF6B00]" : ""}>Arrived</span>
                      <span className={stage >= 3 ? "text-green-500" : ""}>Done</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 flex gap-1 p-0.5">
                      {[0, 1, 2, 3].map((s) => (
                        <div
                          key={s}
                          className="flex-1 h-full rounded-full transition-all"
                          style={{
                            background:
                              s <= stage
                                ? s === 3
                                  ? "#10B981"
                                  : "#FF6B00"
                                : "transparent",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Context-Specific Action Buttons */}
                  <div className="pt-1 flex gap-2">
                    {job.status === "en_route" && (
                      <Link
                        href={`/hirer/tracking/${job.id}`}
                        className="flex-1 py-3 rounded-[14px] text-[12px] font-black text-white text-center shadow-lg active:scale-95 transition-all"
                        style={{ background: "#FF6B00" }}
                      >
                        🚗 Track Live Location →
                      </Link>
                    )}

                    {(job.status === "arrived" || job.status === "quote_sent") && (
                      <Link
                        href={`/hirer/tracking/${job.id}`}
                        className="flex-1 py-3 rounded-[14px] text-[12px] font-black text-white text-center shadow-lg active:scale-95 transition-all"
                        style={{ background: "#10B981" }}
                      >
                        📋 View Diagnosis Quote →
                      </Link>
                    )}

                    {(job.status === "working" || job.status === "in_progress") && (
                      <>
                        <Link
                          href={`/chat?bookingId=${job.id}`}
                          className="flex-1 py-3 rounded-[14px] text-[12px] font-black border text-center active:scale-95"
                          style={{
                            background: "var(--bg-surface)",
                            borderColor: "var(--border-2)",
                            color: "var(--text-1)",
                          }}
                        >
                          💬 Chat with Captain
                        </Link>
                        <Link
                          href={`/hirer/tracking/${job.id}`}
                          className="flex-1 py-3 rounded-[14px] text-[12px] font-black text-white text-center shadow-md active:scale-95"
                          style={{ background: "#FF6B00" }}
                        >
                          View Status →
                        </Link>
                      </>
                    )}

                    {job.status === "completed" && (
                      <Link
                        href={`/hirer/review/${job.id}`}
                        className="flex-1 py-3.5 rounded-[14px] text-[13px] font-black text-white text-center shadow-xl active:scale-95"
                        style={{ background: "#10B981" }}
                      >
                        Confirm Job Done & Rate →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══════════════════════════════
          TAB 2: UPCOMING JOBS
      ══════════════════════════════ */}
      {activeTab === "upcoming" && (
        <div className="px-5 pt-3 space-y-4">
          {upcomingJobs.length === 0 ? (
            <div
              className="p-10 rounded-[24px] border text-center my-6 space-y-3"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
            >
              <span className="text-[44px] block">📅</span>
              <h3 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>
                No upcoming scheduled jobs
              </h3>
              <p className="text-[12px] font-medium text-gray-400 max-w-xs mx-auto">
                Schedule a captain for tomorrow or later this week.
              </p>
              <Link
                href="/hirer/browse"
                className="inline-block px-5 py-2.5 rounded-[14px] text-[12px] font-black text-white bg-[#FF6B00] shadow-md mt-2"
              >
                Schedule a Captain →
              </Link>
            </div>
          ) : (
            upcomingJobs.map((job) => {
              const d = new Date(job.scheduled_for);
              const dateStr = d.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const timeStr = d.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={job.id}
                  className="p-5 rounded-[24px] border shadow-sm space-y-3"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
                >
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-[#FF6B00]/15 text-[#FF6B00]">
                      📅 {dateStr} · {timeStr}
                    </span>
                    <span className="text-[11px] font-black text-green-500">
                      ✓ Slot Reserved
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <UserAvatar name={job.worker_name} size={42} />
                    <div>
                      <h4 className="text-[13px] font-black" style={{ color: "var(--text-1)" }}>
                        {job.worker_name}
                      </h4>
                      <p className="text-[11px] font-semibold text-gray-400 capitalize">
                        {job.worker_trade} · {job.problem_type.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--border-2)" }}>
                    <Link
                      href={`/hirer/book/${job.worker_id}`}
                      className="flex-1 py-2.5 rounded-[12px] text-[12px] font-bold border text-center active:scale-95"
                      style={{
                        background: "var(--bg-surface)",
                        borderColor: "var(--border-2)",
                        color: "var(--text-1)",
                      }}
                    >
                      Reschedule
                    </Link>

                    <button
                      type="button"
                      onClick={() => setCancellingBookingId(job.id)}
                      className="flex-1 py-2.5 rounded-[12px] text-[12px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══════════════════════════════
          TAB 3: HISTORY (PAST JOBS)
      ══════════════════════════════ */}
      {activeTab === "history" && (
        <div className="px-5 pt-3 space-y-3">
          {historyJobs.length === 0 ? (
            <div
              className="p-10 rounded-[24px] border text-center my-6 space-y-2"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
            >
              <span className="text-[36px] block">📜</span>
              <h3 className="text-[15px] font-black" style={{ color: "var(--text-1)" }}>
                No completed history yet
              </h3>
            </div>
          ) : (
            historyJobs.map((item) => {
              const icon = tradeIcons[item.trade] || "⚡";
              const dateStr = new Date(item.completed_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-[20px] border shadow-sm space-y-3"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[20px]">{icon}</span>
                      <div>
                        <h4 className="text-[13px] font-black" style={{ color: "var(--text-1)" }}>
                          {item.problem_type.replace(/_/g, " ")}
                        </h4>
                        <p className="text-[10px] text-gray-400">{dateStr} · with {item.worker_name}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[14px] font-black font-mono" style={{ color: "var(--text-1)" }}>
                        {formatPrice(item.total_paid)}
                      </span>
                      <span
                        className={`block text-[9px] font-black uppercase ${
                          item.status === "confirmed"
                            ? "text-green-500"
                            : item.status === "refunded"
                            ? "text-amber-500"
                            : "text-gray-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Rating / Review Prompt */}
                  {!item.has_review && item.status === "confirmed" && (
                    <div className="p-2.5 rounded-[12px] bg-[#FF6B00]/10 flex justify-between items-center">
                      <span className="text-[11px] font-bold text-[#FF6B00]">
                        ⭐ How was your service?
                      </span>
                      <Link
                        href={`/hirer/review/${item.id}`}
                        className="text-[11px] font-black text-[#FF6B00] underline"
                      >
                        Rate Experience →
                      </Link>
                    </div>
                  )}

                  {/* Bottom Actions: Book Again & Receipt */}
                  <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--border-2)" }}>
                    <button
                      type="button"
                      onClick={() => setReceiptItem(item)}
                      className="flex-1 py-2 rounded-[10px] text-[11px] font-black border active:scale-95"
                      style={{
                        background: "var(--bg-surface)",
                        borderColor: "var(--border-2)",
                        color: "var(--text-1)",
                      }}
                    >
                      🧾 View Receipt
                    </button>

                    <Link
                      href={`/hirer/book/${item.worker_id}?problemType=${item.problem_type}`}
                      className="flex-1 py-2 rounded-[10px] text-[11px] font-black text-white text-center active:scale-95 shadow-sm"
                      style={{ background: "#FF6B00" }}
                    >
                      Book Again ↺
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══════════════════════════════
          RECEIPT BREAKDOWN MODAL
      ══════════════════════════════ */}
      {receiptItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5 anim-fade">
          <div
            className="w-full max-w-sm rounded-[24px] p-6 border shadow-2xl space-y-4 anim-spring"
            style={{
              background: isDark ? "var(--bg-card)" : "#FFFFFF",
              borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
            }}
          >
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: "var(--border-2)" }}>
              <div>
                <h3 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>
                  Payment Receipt
                </h3>
                <p className="text-[10px] font-mono text-gray-400">ID: KON-{receiptItem.id.slice(0, 8)}</p>
              </div>
              <button onClick={() => setReceiptItem(null)} className="text-gray-400 text-[18px] font-bold p-1">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-gray-400">Visit Deposit</span>
                <span className="font-mono font-bold" style={{ color: "var(--text-1)" }}>
                  {formatPrice(receiptItem.visit_charge)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Labour Charge</span>
                <span className="font-mono font-bold" style={{ color: "var(--text-1)" }}>
                  {formatPrice(receiptItem.labour_charge)}
                </span>
              </div>
              {receiptItem.parts_cost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Replacement Parts</span>
                  <span className="font-mono font-bold" style={{ color: "var(--text-1)" }}>
                    {formatPrice(receiptItem.parts_cost)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Platform & Insurance</span>
                <span className="font-mono font-bold" style={{ color: "var(--text-1)" }}>
                  ₹15
                </span>
              </div>

              <div className="pt-2 border-t flex justify-between items-center text-[14px] font-black" style={{ borderColor: "var(--border-2)" }}>
                <span style={{ color: "var(--text-1)" }}>Total Paid:</span>
                <span className="text-green-500 font-mono">{formatPrice(receiptItem.total_paid)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setReceiptItem(null)}
              className="w-full py-3 rounded-[14px] text-[12px] font-black text-white"
              style={{ background: "#FF6B00" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          CANCEL CONFIRMATION MODAL
      ══════════════════════════════ */}
      {cancellingBookingId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5 anim-fade">
          <div
            className="w-full max-w-sm rounded-[24px] p-6 text-center border shadow-2xl space-y-4"
            style={{
              background: isDark ? "var(--bg-card)" : "#FFFFFF",
              borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
            }}
          >
            <span className="text-[32px] block">⚠️</span>
            <h3 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>
              Cancel scheduled booking?
            </h3>
            <p className="text-[12px] text-gray-400">
              The visit charge deposit will be refunded back to your source account.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCancellingBookingId(null)}
                className="flex-1 py-3 rounded-[14px] text-[12px] font-bold border"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border-2)" }}
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => handleCancelBooking(cancellingBookingId)}
                className="flex-1 py-3 rounded-[14px] text-[12px] font-black bg-red-500 text-white"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
