"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// EARNINGS v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · JetBrains Mono data · Tonal surfaces
// ============================================================

interface EarningEntry {
  id: string; amount: number; type: string; status: string;
  created_at: string; booking_id: string;
}

export default function EarningsPage() {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  // Commission state
  const [commissionTotal, setCommissionTotal] = useState(0);
  const [commissionPending, setCommissionPending] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/earnings?period=${period}`);
        const json = await res.json();
        if (json.success && json.data) {
          setEarnings(json.data);
          setTotalEarnings(json.data.reduce((sum: number, e: EarningEntry) => sum + Number(e.amount), 0));
          setTotalJobs(json.data.filter((e: EarningEntry) => e.type === "job_payment").length);
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
      } catch {}
    };
    fetchCommission();
  }, []);

  const typeIcons: Record<string, string> = {
    job_payment: "💼", bonus: "🎁", referral: "👥", tip: "💝", penalty: "⚠️",
  };
  const statusColors: Record<string, string> = {
    pending: "var(--warning)", credited: "var(--success)", withdrawn: "var(--text-3)",
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-5" style={{ background: "var(--bg-app)" }}>
        <div className="flex justify-between items-center mb-5">
          <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>Earnings</h1>
          <div className="w-9" />
        </div>

        {/* Total earnings card — Gradient hero */}
        <div className="rounded-[20px] p-6 text-center" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            {period === "today" ? "Today's" : period === "week" ? "This Week's" : "This Month's"} Earnings
          </p>
          <p className="text-[38px] font-black mt-1" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{totalEarnings.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] mt-1 font-medium" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
            {totalJobs} jobs · {earnings.length} txns
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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5 px-5 mt-4 mb-5">
        <div className="rounded-[14px] p-3 text-center" style={{ background: "var(--bg-surface)" }}>
          <p className="text-[18px] font-black" style={{ color: "var(--brand)", fontFamily: "'Epilogue', sans-serif" }}>{totalJobs}</p>
          <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>Jobs</p>
        </div>
        <div className="rounded-[14px] p-3 text-center" style={{ background: "var(--bg-surface)" }}>
          <p className="text-[18px] font-black" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{totalJobs > 0 ? Math.round(totalEarnings / totalJobs) : 0}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>Avg/Job</p>
        </div>
        <div className="rounded-[14px] p-3 text-center" style={{ background: "var(--bg-surface)" }}>
          <p className="text-[18px] font-black" style={{ color: "var(--info)", fontFamily: "'Epilogue', sans-serif" }}>
            {earnings.filter(e => e.status === "pending").length}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>Pending</p>
        </div>
      </div>

      {/* Commission Breakdown */}
      <div className="px-5 mb-5">
        <div className="rounded-[16px] p-4" style={{
          background: isBlocked ? "var(--danger-tint)" : "var(--bg-card)",
          boxShadow: isBlocked ? "0 0 0 1px var(--danger)" : "none",
        }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>💰 Payout Breakdown</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>₹5/job</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px]" style={{ color: "var(--text-2)" }}>Gross Earnings</span>
              <span className="text-[13px] font-bold" style={{ color: "var(--success)" }}>₹{totalEarnings.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px]" style={{ color: "var(--text-2)" }}>Kaizy Commission ({totalJobs} jobs × ₹5)</span>
              <span className="text-[13px] font-bold" style={{ color: "var(--danger)" }}>-₹{commissionTotal}</span>
            </div>
            <div style={{ borderTop: "1px dashed var(--border-1)", paddingTop: 8 }}>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>Net Payout</span>
                <span className="text-[16px] font-black" style={{ color: "var(--brand)" }}>
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
              <span className="text-[14px]">{isBlocked ? "🚫" : "⏳"}</span>
              <div>
                <p className="text-[10px] font-bold" style={{ color: isBlocked ? "var(--danger)" : "var(--warning)" }}>
                  {isBlocked
                    ? `⚠️ Account blocked — ₹${commissionPending} unpaid commission`
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
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Transactions</p>

        {loading && [1,2,3].map(i => <div key={i} className="skeleton rounded-xl mb-2" style={{ height: 60 }} />)}

        {!loading && earnings.length === 0 && (
          <div className="text-center py-12 rounded-[18px]" style={{ background: "var(--bg-card)" }}>
            <p className="text-[40px] mb-2">💰</p>
            <p className="text-[14px] font-bold tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>No earnings yet</p>
            <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--text-3)" }}>Complete jobs to start earning</p>
            <Link href="/dashboard/worker" className="inline-block mt-4 rounded-full px-6 py-3 text-[12px] font-bold active:scale-95"
                  style={{ background: "var(--gradient-cta)", color: "#FFDBCC" }}>Go Online →</Link>
          </div>
        )}

        {!loading && earnings.map(e => (
          <div key={e.id} className="flex items-center gap-3 rounded-[14px] p-3.5 mb-2"
               style={{ background: "var(--bg-surface)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[16px] shrink-0"
                 style={{ background: "var(--bg-card)" }}>
              {typeIcons[e.type] || "💼"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold capitalize" style={{ color: "var(--text-1)" }}>
                {e.type.replace("_", " ")}
              </p>
              <p className="text-[9px] font-medium mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
                {new Date(e.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                {" · "}
                <span style={{ color: statusColors[e.status] || "var(--text-3)" }}>{e.status}</span>
              </p>
            </div>
            <p className="text-[14px] font-black" style={{ color: e.type === "penalty" ? "var(--danger)" : "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
              {e.type === "penalty" ? "-" : "+"}₹{Number(e.amount).toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
