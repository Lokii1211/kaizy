"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// COMMISSION STATUS — Worker commission ledger
// ₹5 flat per job or 2% whichever is higher
// Soft-blocks at ₹50 unpaid balance
// Reference: Rapido captain earnings breakdown
// ============================================================

interface CommissionEntry {
  id: string;
  job_id: string;
  trade: string;
  date: string;
  job_amount: number;
  commission: number;
  status: "paid" | "pending";
}

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};

// Mock data until API connected
const mockEntries: CommissionEntry[] = [
  { id: "c1", job_id: "J-4821", trade: "electrician", date: "Today, 2:30 PM", job_amount: 600, commission: 12, status: "pending" },
  { id: "c2", job_id: "J-4820", trade: "electrician", date: "Today, 11:00 AM", job_amount: 350, commission: 7, status: "pending" },
  { id: "c3", job_id: "J-4819", trade: "electrician", date: "Yesterday", job_amount: 200, commission: 5, status: "paid" },
  { id: "c4", job_id: "J-4818", trade: "electrician", date: "Yesterday", job_amount: 500, commission: 10, status: "paid" },
  { id: "c5", job_id: "J-4817", trade: "electrician", date: "28 Mar", job_amount: 800, commission: 16, status: "paid" },
  { id: "c6", job_id: "J-4816", trade: "electrician", date: "27 Mar", job_amount: 250, commission: 5, status: "paid" },
];

export default function CommissionPage() {
  const [entries, setEntries] = useState<CommissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    // Fetch from API, fallback to mock
    const fetchCommission = async () => {
      try {
        const res = await fetch("/api/workers/commission");
        const json = await res.json();
        if (json.success && json.data?.entries) {
          setEntries(json.data.entries);
        } else {
          setEntries(mockEntries);
        }
      } catch {
        setEntries(mockEntries);
      }
      setLoading(false);
    };
    fetchCommission();
  }, []);

  const pendingAmount = entries.filter(e => e.status === "pending").reduce((s, e) => s + e.commission, 0);
  const paidAmount = entries.filter(e => e.status === "paid").reduce((s, e) => s + e.commission, 0);
  const totalJobs = entries.length;
  const isBlocked = pendingAmount >= 50;

  const handlePayNow = async () => {
    setPaying(true);
    // In production: open Razorpay/UPI for commission payment
    setTimeout(() => {
      setEntries(prev => prev.map(e => ({ ...e, status: "paid" as const })));
      setPaying(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/settings" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Commission
          </h1>
        </div>
      </div>

      {/* Block alert */}
      {isBlocked && (
        <div className="mx-5 mb-4 rounded-[18px] p-4 anim-spring"
             style={{ background: "var(--danger-tint)", border: "1px solid var(--danger)" }}>
          <div className="flex items-center gap-3">
            <span className="text-[24px]">🚫</span>
            <div className="flex-1">
              <p className="text-[12px] font-black" style={{ color: "var(--danger)" }}>
                Account Soft-Blocked
              </p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--text-2)" }}>
                Pay ₹{pendingAmount} commission to accept new jobs
              </p>
            </div>
          </div>
          <button onClick={handlePayNow} disabled={paying}
                  className="w-full mt-3 rounded-[14px] py-3 text-[12px] font-bold text-white active:scale-95 disabled:opacity-50 transition-all"
                  style={{ background: "var(--danger)" }}>
            {paying ? "Processing..." : `Pay ₹${pendingAmount} via UPI →`}
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 px-5 mb-5">
        <div className="rounded-[16px] p-3.5 text-center" style={{ background: "var(--bg-card)" }}>
          <p className="text-[20px] font-black"
             style={{ color: pendingAmount > 0 ? "var(--warning)" : "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{pendingAmount}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>
            Pending
          </p>
        </div>
        <div className="rounded-[16px] p-3.5 text-center" style={{ background: "var(--bg-card)" }}>
          <p className="text-[20px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{paidAmount}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>
            Total Paid
          </p>
        </div>
        <div className="rounded-[16px] p-3.5 text-center" style={{ background: "var(--bg-card)" }}>
          <p className="text-[20px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            {totalJobs}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>
            Jobs
          </p>
        </div>
      </div>

      {/* How commission works */}
      <div className="mx-5 mb-5 rounded-[18px] p-4" style={{ background: "var(--brand-tint)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--brand)" }}>
          How Commission Works
        </p>
        <div className="space-y-1.5">
          {[
            "₹5 flat per job OR 2% of job value — whichever is higher",
            "Jobs under ₹250 → ₹0 commission (free!)",
            "Auto-deducted from your earnings",
            "If balance exceeds ₹50 → account soft-blocked",
            "Pay via UPI to unlock instantly",
          ].map((text, i) => (
            <p key={i} className="text-[10px] font-medium flex items-start gap-2" style={{ color: "var(--text-2)" }}>
              <span style={{ color: "var(--brand)" }}>{i < 3 ? "✓" : "⚠️"}</span>
              {text}
            </p>
          ))}
        </div>
      </div>

      {/* Pay button (if not blocked but has pending) */}
      {!isBlocked && pendingAmount > 0 && (
        <div className="mx-5 mb-5">
          <button onClick={handlePayNow} disabled={paying}
                  className="w-full rounded-[16px] py-3.5 text-[12px] font-bold active:scale-95 disabled:opacity-50 transition-all"
                  style={{ background: "var(--bg-card)", color: "var(--text-1)" }}>
            {paying ? "Processing..." : `Pay ₹${pendingAmount} Commission`}
          </button>
        </div>
      )}

      {/* No pending */}
      {pendingAmount === 0 && !loading && (
        <div className="mx-5 mb-5 rounded-[18px] p-4 text-center" style={{ background: "var(--success-tint)" }}>
          <span className="text-[24px]">✅</span>
          <p className="text-[12px] font-bold mt-1" style={{ color: "var(--success)" }}>
            All Clear — ₹0 owed
          </p>
          <p className="text-[9px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>
            You can accept all jobs without restriction
          </p>
        </div>
      )}

      {/* Transaction ledger */}
      <div className="px-5">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
          Commission Ledger
        </p>

        {loading && [1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-[14px] mb-2" />)}

        {!loading && entries.map(entry => (
          <div key={entry.id} className="flex items-center gap-3 rounded-[14px] p-3 mb-2"
               style={{ background: "var(--bg-card)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[16px] shrink-0"
                 style={{ background: "var(--bg-surface)" }}>
              {tradeIcons[entry.trade] || "🔧"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>
                {entry.job_id} · ₹{entry.job_amount.toLocaleString("en-IN")}
              </p>
              <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
                {entry.date}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[12px] font-black"
                 style={{ color: entry.status === "pending" ? "var(--warning)" : "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
                -₹{entry.commission}
              </p>
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: entry.status === "paid" ? "var(--success-tint)" : "var(--warning-tint)",
                      color: entry.status === "paid" ? "var(--success)" : "var(--warning)",
                    }}>
                {entry.status === "paid" ? "PAID" : "PENDING"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* KaizyPro upsell */}
      <div className="mx-5 mt-6 rounded-[20px] p-5"
           style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[28px]">👑</span>
          <div>
            <p className="text-[14px] font-black text-white">KaizyPro — ₹299/mo</p>
            <p className="text-[10px] font-medium text-white/60">0% commission + priority jobs</p>
          </div>
        </div>
        <div className="space-y-1 mb-3">
          {["0% commission on ALL jobs", "Top placement in search", "Priority job alerts (5s early)", "Dedicated support line"].map(b => (
            <p key={b} className="text-[10px] font-medium text-white/80 flex items-center gap-1.5">
              <span className="text-white">✓</span> {b}
            </p>
          ))}
        </div>
        <button className="w-full rounded-[14px] py-3 text-[12px] font-bold active:scale-95 transition-all"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)" }}>
          Upgrade to Pro →
        </button>
      </div>
    </div>
  );
}
