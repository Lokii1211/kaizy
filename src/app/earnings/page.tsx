"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// EARNINGS — Real data from Supabase earnings ledger
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
      <div className="px-4 pt-4 pb-5" style={{ background: isDark ? "#0A0A00" : "#FFFFF0" }}>
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>Earnings</h1>
          <div className="w-9" />
        </div>

        {/* Total earnings card */}
        <div className="rounded-2xl p-5 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <p className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>
            {period === "today" ? "Today's" : period === "week" ? "This Week's" : "This Month's"} Earnings
          </p>
          <p className="text-[36px] font-black mt-1" style={{ color: "var(--success)" }}>
            ₹{totalEarnings.toLocaleString("en-IN")}
          </p>
          <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>
            {totalJobs} jobs · {earnings.length} transactions
          </p>
        </div>

        {/* Period tabs */}
        <div className="flex gap-2 mt-3">
          {(["today", "week", "month"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
                    className="flex-1 rounded-lg py-2 text-[12px] font-bold active:scale-95"
                    style={{
                      background: period === p ? "var(--brand)" : "var(--bg-elevated)",
                      color: period === p ? "#fff" : "var(--text-2)",
                    }}>
              {p === "today" ? "Today" : p === "week" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 px-4 mt-3 mb-4">
        <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <p className="text-[16px] font-black" style={{ color: "var(--brand)" }}>{totalJobs}</p>
          <p className="text-[9px]" style={{ color: "var(--text-3)" }}>Jobs</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <p className="text-[16px] font-black" style={{ color: "var(--success)" }}>
            ₹{totalJobs > 0 ? Math.round(totalEarnings / totalJobs) : 0}
          </p>
          <p className="text-[9px]" style={{ color: "var(--text-3)" }}>Avg/Job</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <p className="text-[16px] font-black" style={{ color: "var(--info)" }}>
            {earnings.filter(e => e.status === "pending").length}
          </p>
          <p className="text-[9px]" style={{ color: "var(--text-3)" }}>Pending</p>
        </div>
      </div>

      {/* Commission Breakdown */}
      <div className="px-4 mb-4">
        <div className="rounded-xl p-4" style={{
          background: isBlocked ? "rgba(239,68,68,0.05)" : "var(--bg-card)",
          border: isBlocked ? "1.5px solid var(--danger)" : "1px solid var(--border-1)",
        }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>💰 Payout Breakdown</p>
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
      <div className="px-4">
        <p className="text-[12px] font-bold mb-2" style={{ color: "var(--text-3)" }}>Transactions</p>

        {loading && [1,2,3].map(i => <div key={i} className="skeleton rounded-xl mb-2" style={{ height: 60 }} />)}

        {!loading && earnings.length === 0 && (
          <div className="text-center py-12 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <p className="text-[40px] mb-2">💰</p>
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No earnings yet</p>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>Complete jobs to start earning</p>
            <Link href="/dashboard/worker" className="inline-block mt-4 rounded-xl px-6 py-3 text-[13px] font-bold text-white active:scale-95"
                  style={{ background: "var(--brand)" }}>Go Online →</Link>
          </div>
        )}

        {!loading && earnings.map(e => (
          <div key={e.id} className="flex items-center gap-3 rounded-xl p-3 mb-2"
               style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] shrink-0"
                 style={{ background: "var(--bg-elevated)" }}>
              {typeIcons[e.type] || "💼"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold capitalize" style={{ color: "var(--text-1)" }}>
                {e.type.replace("_", " ")}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                {new Date(e.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                {" · "}
                <span style={{ color: statusColors[e.status] || "var(--text-3)" }}>{e.status}</span>
              </p>
            </div>
            <p className="text-[14px] font-black" style={{ color: e.type === "penalty" ? "var(--danger)" : "var(--success)" }}>
              {e.type === "penalty" ? "-" : "+"}₹{Number(e.amount).toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
