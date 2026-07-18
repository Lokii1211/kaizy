"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/AuthStore";

// ============================================================
// EARNINGS v12.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · JetBrains Mono data · Tonal surfaces
// Today / Week / Month breakdowns with pending payouts
// ============================================================

interface EarningEntry {
  id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  booking_id: string;
  hirer_name?: string;
  trade?: string;
}

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};

export default function EarningsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");

  useEffect(() => {
    if (user !== null && user.user_type !== "worker") router.replace("/dashboard/hirer");
  }, [user, router]);
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  // Commission state
  const [commissionTotal, setCommissionTotal] = useState(0);
  const [commissionPending, setCommissionPending] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const [kaizyScore, setKaizyScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [tier, setTier] = useState("Active");
  const [tierColor, setTierColor] = useState("#22C55E");
  const [weeklyChart, setWeeklyChart] = useState<{ day: string; amount: number }[]>([]);
  const [bonusClaiming, setBonusClaiming] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/earnings?period=${period}`);
        const json = await res.json();
        if (json.success) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped = (json.data || []).map((e: any) => ({
            id: e.id,
            amount: e.amount,
            type: e.type || "job_payment",
            status: e.status || "credited",
            created_at: e.created_at,
            booking_id: e.booking_id || e.id,
            hirer_name: e.hirer_name || "Customer",
            trade: e.trade || "",
          }));
          setEarnings(mapped);
          setTotalEarnings(json.totalEarnings || mapped.reduce((sum: number, e: EarningEntry) => sum + Number(e.amount), 0));
          setTotalJobs(json.totalJobs || mapped.length);
          setKaizyScore(json.kaizyScore || 0);
          setStreak(json.streak || 0);
          setTier(json.tier || "Active");
          setTierColor(json.tierColor || "#22C55E");
          if (json.weeklyChart?.length) setWeeklyChart(json.weeklyChart);
        }
      } catch (e) {
        console.error("[earnings]", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, [period]);

  // Fetch commission summary
  useEffect(() => {
    const fetchCommission = async () => {
      try {
        const res = await fetch('/api/commission');
        const json = await res.json();
        if (json.success && json.data?.summary) {
          setCommissionTotal(json.data.summary.totalCommission || 0);
          setCommissionPending(json.data.summary.totalPending || 0);
          setIsBlocked(json.data.summary.isBlocked || false);
        }
      } catch { /* commission endpoint may not exist yet */ }
    };
    fetchCommission();
  }, []);

  const typeLabels: Record<string, string> = {
    job_payment: "Job Payment", bonus: "Bonus", referral: "Referral Bonus", tip: "Tip", penalty: "Penalty",
  };
  const typeIcons: Record<string, string> = {
    job_payment: "💼", bonus: "🎁", referral: "👥", tip: "💝", penalty: "⚠️",
  };
  const statusColors: Record<string, { color: string; bg: string }> = {
    pending: { color: "var(--warning)", bg: "rgba(245,158,11,0.1)" },
    credited: { color: "var(--success)", bg: "rgba(34,197,94,0.1)" },
    withdrawn: { color: "var(--text-3)", bg: "var(--bg-surface)" },
  };

  const pendingEarnings = earnings.filter(e => e.status === "pending");
  const pendingTotal = pendingEarnings.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-5" style={{ background: "var(--bg-app)" }}>
        <div className="flex justify-between items-center mb-5">
          <Link href="/dashboard/worker" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">&#8592;</span>
          </Link>
          <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>Earnings</h1>
          <div className="w-9" />
        </div>

        {/* Total earnings card */}
        <div className="rounded-[20px] p-6 text-center" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            {period === "today" ? "Today's" : period === "week" ? "This Week's" : "This Month's"} Earnings
          </p>
          <p className="text-[38px] font-black mt-1" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{totalEarnings.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] mt-1 font-medium" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
            {totalJobs} jobs completed
          </p>
        </div>

        {/* Period tabs */}
        <div className="flex gap-2 mt-4">
          {(["today", "week", "month"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
                    className="flex-1 rounded-full py-2 text-[11px] font-bold active:scale-95 transition-all"
                    style={{
                      background: period === p ? "var(--gradient-cta)" : "var(--bg-surface)",
                      color: period === p ? "#FFDBCC" : "var(--text-3)",
                      boxShadow: period === p ? "var(--shadow-brand)" : "none",
                    }}>
              {p === "today" ? "Today" : p === "week" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* 7-Day Chart */}
      {weeklyChart.length > 0 && (
        <div className="px-5 mb-4">
          <div className="rounded-[16px] p-4" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Last 7 Days</p>
              <div className="flex items-center gap-3">
                {streak >= 2 && (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(255,184,0,0.15)", color: "#FFB800" }}>
                    🔥 {streak}-day streak
                  </span>
                )}
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${tierColor}20`, color: tierColor }}>
                  {tier}
                </span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-[56px]">
              {(() => {
                const maxAmt = Math.max(...weeklyChart.map(d => d.amount), 1);
                return weeklyChart.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-[4px] transition-all relative"
                      style={{
                        height: `${Math.max(3, (d.amount / maxAmt) * 48)}px`,
                        background: d.amount > 0
                          ? (i === weeklyChart.length - 1 ? "var(--gradient-cta)" : "var(--brand)")
                          : "var(--bg-elevated)",
                        opacity: i === weeklyChart.length - 1 ? 1 : 0.55,
                      }}>
                      {d.amount > 0 && i === weeklyChart.length - 1 && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[7px] font-black"
                          style={{ color: "var(--brand)" }}>
                          ₹{d.amount}
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] font-bold" style={{ color: i === weeklyChart.length - 1 ? "var(--brand)" : "var(--text-3)" }}>
                      {d.day}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 px-5 mt-4 mb-5">
        <div className="rounded-[14px] p-3 text-center" style={{ background: "var(--bg-surface)" }}>
          <p className="text-[16px] font-black" style={{ color: "var(--brand)", fontFamily: "'Epilogue', sans-serif" }}>{totalJobs}</p>
          <p className="text-[7px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>Jobs</p>
        </div>
        <div className="rounded-[14px] p-3 text-center" style={{ background: "var(--bg-surface)" }}>
          <p className="text-[16px] font-black" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{totalJobs > 0 ? Math.round(totalEarnings / totalJobs) : 0}
          </p>
          <p className="text-[7px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>Avg/Job</p>
        </div>
        <div className="rounded-[14px] p-3 text-center" style={{ background: "var(--bg-surface)" }}>
          <p className="text-[16px] font-black" style={{ color: "#FFB800", fontFamily: "'JetBrains Mono', monospace" }}>
            {streak > 0 ? `${streak}🔥` : "0"}
          </p>
          <p className="text-[7px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>Streak</p>
        </div>
        <div className="rounded-[14px] p-3 text-center" style={{ background: "var(--bg-surface)" }}>
          <p className="text-[16px] font-black" style={{ color: "var(--info)", fontFamily: "'JetBrains Mono', monospace" }}>
            {kaizyScore}
          </p>
          <p className="text-[7px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>KS</p>
        </div>
      </div>

      {/* Streak bonus claim banner */}
      {streak >= 7 && !bonusClaimed && (
        <div className="px-5 mb-4">
          <div className="rounded-[16px] p-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(255,184,0,0.15), rgba(255,107,0,0.1))", border: "1px solid rgba(255,184,0,0.3)" }}>
            <span className="text-[28px]">🔥</span>
            <div className="flex-1">
              <p className="text-[12px] font-black" style={{ color: "var(--text-1)" }}>
                {streak}-Day Streak Bonus Ready!
              </p>
              <p className="text-[9px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>
                Claim ₹{streak >= 30 ? 200 : streak >= 14 ? 100 : 50} added to your next payout
              </p>
            </div>
            <button disabled={bonusClaiming}
                    onClick={async () => {
                      setBonusClaiming(true);
                      try {
                        const res = await fetch("/api/earnings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: streak >= 30 ? "streak_30" : streak >= 14 ? "streak_14" : "streak_7" }) });
                        const j = await res.json();
                        if (j.success) setBonusClaimed(true);
                      } catch {}
                      setBonusClaiming(false);
                    }}
                    className="rounded-[12px] px-3 py-2 text-[10px] font-black text-white active:scale-95 shrink-0 disabled:opacity-60"
                    style={{ background: "#FFB800" }}>
              {bonusClaiming ? "..." : "Claim"}
            </button>
          </div>
        </div>
      )}
      {bonusClaimed && (
        <div className="px-5 mb-4">
          <div className="rounded-[16px] p-3.5 flex items-center gap-2" style={{ background: "var(--success-tint)" }}>
            <span className="text-[18px]">✅</span>
            <p className="text-[11px] font-bold" style={{ color: "var(--success)" }}>Bonus claimed! Will appear in your next UPI payout.</p>
          </div>
        </div>
      )}

      {/* Pending payouts section */}
      {pendingTotal > 0 && (
        <div className="px-5 mb-5">
          <div className="rounded-[16px] p-4" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>Pending Payouts</p>
              <span className="text-[16px] font-black" style={{ color: "var(--warning)", fontFamily: "'JetBrains Mono', monospace" }}>
                ₹{pendingTotal.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
              {pendingEarnings.length} transaction{pendingEarnings.length !== 1 ? "s" : ""} awaiting payout via UPI
            </p>
          </div>
        </div>
      )}

      {/* Commission Breakdown */}
      <div className="px-5 mb-5">
        <div className="rounded-[16px] p-4" style={{
          background: isBlocked ? "var(--danger-tint)" : "var(--bg-card)",
          boxShadow: isBlocked ? "0 0 0 1px var(--danger)" : "var(--shadow-card)",
        }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>Payout Breakdown</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>₹5/job</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px]" style={{ color: "var(--text-2)" }}>Gross Earnings</span>
              <span className="text-[13px] font-bold" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
                ₹{totalEarnings.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px]" style={{ color: "var(--text-2)" }}>Kaizy Commission ({totalJobs} x ₹5)</span>
              <span className="text-[13px] font-bold" style={{ color: "var(--danger)", fontFamily: "'JetBrains Mono', monospace" }}>
                -₹{commissionTotal}
              </span>
            </div>
            <div style={{ borderTop: "1px dashed var(--border-1)", paddingTop: 8 }}>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>Net Payout</span>
                <span className="text-[16px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
                  ₹{Math.max(0, totalEarnings - commissionTotal).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Pending commission warning */}
          {commissionPending > 0 && (
            <div className="mt-3 rounded-lg p-2.5 flex items-center gap-2" style={{
              background: isBlocked ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
            }}>
              <span className="text-[14px]">{isBlocked ? "!" : "..."}</span>
              <div>
                <p className="text-[10px] font-bold" style={{ color: isBlocked ? "var(--danger)" : "var(--warning)" }}>
                  {isBlocked
                    ? `Account blocked - ₹${commissionPending} unpaid commission`
                    : `₹${commissionPending} commission pending`
                  }
                </p>
                <p className="text-[9px]" style={{ color: "var(--text-3)" }}>
                  {isBlocked ? "Clear dues to accept new jobs" : "Auto-deducted from next UPI payout"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction list */}
      <div className="px-5">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Recent Transactions</p>

        {loading && [1,2,3].map(i => <div key={i} className="skeleton rounded-xl mb-2" style={{ height: 68 }} />)}

        {!loading && earnings.length === 0 && (
          <div className="text-center py-12 rounded-[18px]" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
            <p className="text-[40px] mb-2">💰</p>
            <p className="text-[14px] font-bold tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>No earnings yet</p>
            <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--text-3)" }}>Complete jobs to start earning</p>
            <Link href="/dashboard/worker" className="inline-block mt-4 rounded-full px-6 py-3 text-[12px] font-bold active:scale-95"
                  style={{ background: "var(--gradient-cta)", color: "#FFDBCC" }}>
              Go Online
            </Link>
          </div>
        )}

        {!loading && earnings.map(e => {
          const st = statusColors[e.status] || statusColors.pending;
          const tradeIcon = e.trade ? (tradeIcons[e.trade] || "🔧") : "";
          const dateStr = new Date(e.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          const timeStr = new Date(e.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

          return (
            <div key={e.id} className="flex items-center gap-3 rounded-[14px] p-3.5 mb-2"
                 style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[16px] shrink-0"
                   style={{ background: "var(--bg-surface)" }}>
                {tradeIcon || typeIcons[e.type] || "💼"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-bold truncate" style={{ color: "var(--text-1)" }}>
                    {e.hirer_name || typeLabels[e.type] || e.type.replace("_", " ")}
                  </p>
                  {e.trade && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: "var(--bg-surface)", color: "var(--text-2)" }}>
                      {e.trade.replace("_", " ")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-medium" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {dateStr} {timeStr}
                  </span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: st.bg, color: st.color }}>
                    {e.status}
                  </span>
                </div>
              </div>
              <p className="text-[14px] font-black shrink-0"
                 style={{ color: e.type === "penalty" ? "var(--danger)" : "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
                {e.type === "penalty" ? "-" : "+"}₹{Number(e.amount).toLocaleString("en-IN")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
