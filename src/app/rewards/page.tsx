"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// REWARD DETAILS — Stitch "Reward Details" Screen
// Now fetches real incentive data from API
// ============================================================

interface Reward {
  id: string;
  title: string;
  icon: string;
  amount: number;
  type: string;
  description: string;
  status: "claimed" | "active" | "available" | "unlimited";
  progress?: number;
  target?: number;
  date?: string;
}

export default function RewardDetailsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadIncentives() {
      try {
        // Get user info to find worker_id
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        const meData = await meRes.json();
        const workerId = meData?.data?.id;

        if (!workerId) {
          setLoading(false);
          return;
        }

        // Fetch real incentive data
        const res = await fetch(`/api/incentives?worker_id=${workerId}`, { credentials: "include" });
        const data = await res.json();

        if (data.success && data.data) {
          const mapped: Reward[] = [];

          // Map daily targets to rewards
          const daily = data.data.daily?.targets || [];
          daily.forEach((t: { id: string; label: string; icon: string; bonus: number; achieved: boolean; current: number; jobs?: number }) => {
            mapped.push({
              id: t.id,
              title: t.label,
              icon: t.icon,
              amount: t.bonus,
              type: "daily",
              description: `Daily target: complete ${t.jobs || 0} jobs today`,
              status: t.achieved ? "claimed" : t.current > 0 ? "active" : "available",
              progress: t.current,
              target: t.jobs,
              date: t.achieved ? "Today" : "",
            });
          });

          // Map weekly targets
          const weekly = data.data.weekly?.targets || [];
          weekly.forEach((t: { id: string; label: string; icon: string; bonus: number; achieved: boolean; current: number; jobs?: number; streak?: number }) => {
            const target = t.jobs || t.streak || 0;
            mapped.push({
              id: t.id,
              title: t.label,
              icon: t.icon,
              amount: t.bonus,
              type: "weekly",
              description: `Weekly challenge`,
              status: t.achieved ? "claimed" : t.current > 0 ? "active" : "available",
              progress: t.current,
              target,
              date: t.achieved ? "This week" : "",
            });
          });

          // Map monthly targets
          const monthly = data.data.monthly?.targets || [];
          monthly.forEach((t: { id: string; label: string; icon: string; bonus: number; achieved: boolean; current: number; jobs?: number; rating?: number; earnings?: number }) => {
            const target = t.jobs || t.rating || t.earnings || 0;
            mapped.push({
              id: t.id,
              title: t.label,
              icon: t.icon,
              amount: t.bonus,
              type: "milestone",
              description: `Monthly milestone`,
              status: t.achieved ? "claimed" : t.current > 0 ? "active" : "available",
              progress: t.current,
              target,
              date: t.achieved ? "This month" : "",
            });
          });

          // Map special bonuses
          const special = data.data.special || [];
          special.forEach((s: { id: string; label: string; icon: string; bonus: number; type: string }) => {
            mapped.push({
              id: s.id,
              title: s.label,
              icon: s.icon,
              amount: s.bonus,
              type: s.type,
              description: "Special bonus",
              status: "available",
            });
          });

          setRewards(mapped);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadIncentives();
  }, []);

  const totalClaimed = rewards.filter(r => r.status === "claimed").reduce((sum, r) => sum + r.amount, 0);
  const totalAvailable = rewards.filter(r => r.status === "available").reduce((sum, r) => sum + r.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3"
               style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
          <p className="text-[11px] font-bold" style={{ color: "var(--text-3)" }}>Loading rewards...</p>
        </div>
      </div>
    );
  }

  if (error || rewards.length === 0) {
    return (
      <div className="min-h-screen pb-20" style={{ background: "var(--bg-app)" }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 mb-5">
            <Link href="/incentives" aria-label="Go back"
                  className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: "var(--bg-surface)" }}>
              <span className="text-[14px]">←</span>
            </Link>
            <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
              Rewards & Bonuses
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-8 pt-20">
          <span className="text-[56px] block mb-4">🏆</span>
          <h2 className="text-[18px] font-black tracking-tight text-center mb-2"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            No Rewards Yet
          </h2>
          <p className="text-[12px] font-medium text-center" style={{ color: "var(--text-3)" }}>
            Complete your first job to start earning rewards
          </p>
          <Link href="/"
                className="mt-6 px-8 py-3 rounded-[14px] text-[12px] font-bold text-white active:scale-95 transition-transform"
                style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
            Find Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/incentives" aria-label="Go back"
                className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Rewards & Bonuses
          </h1>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[18px] p-4 text-center" style={{ background: "var(--gradient-cta)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-1">Total Earned</p>
            <p className="text-[24px] font-black text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ₹{totalClaimed.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-[18px] p-4 text-center" style={{ background: "var(--bg-card)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>Available</p>
            <p className="text-[24px] font-black" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
              ₹{totalAvailable.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Active Challenges */}
      {rewards.filter(r => r.status === "active").length > 0 && (
        <div className="px-5 mb-5">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Active Challenges
          </p>
          <div className="space-y-2">
            {rewards.filter(r => r.status === "active").map(reward => (
              <div key={reward.id} className="rounded-[16px] p-4" style={{ background: "var(--bg-card)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[20px]"
                       style={{ background: "var(--brand-tint)" }}>{reward.icon}</div>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{reward.title}</p>
                    <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{reward.description}</p>
                  </div>
                  <p className="text-[14px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
                    ₹{reward.amount}
                  </p>
                </div>
                {reward.progress !== undefined && reward.target !== undefined && reward.target > 0 && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[8px] font-bold" style={{ color: "var(--text-3)" }}>Progress</span>
                      <span className="text-[8px] font-bold" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {reward.progress}/{reward.target}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-surface)" }}>
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${Math.min((reward.progress / reward.target) * 100, 100)}%`,
                        background: "var(--gradient-cta)",
                      }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Rewards */}
      {rewards.filter(r => r.status === "available" || r.status === "unlimited").length > 0 && (
        <div className="px-5 mb-5">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Available Rewards
          </p>
          <div className="space-y-2">
            {rewards.filter(r => r.status === "available" || r.status === "unlimited").map(reward => (
              <div key={reward.id} className="rounded-[16px] p-4 flex items-center gap-3" style={{ background: "var(--bg-card)" }}>
                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[20px]"
                     style={{ background: "var(--success-tint)" }}>{reward.icon}</div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{reward.title}</p>
                  <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{reward.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-black" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
                    +₹{reward.amount}
                  </p>
                  {reward.status === "unlimited" && (
                    <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
                      UNLIMITED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claimed History */}
      {rewards.filter(r => r.status === "claimed").length > 0 && (
        <div className="px-5">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Claimed
          </p>
          {rewards.filter(r => r.status === "claimed").map(reward => (
            <div key={reward.id} className="rounded-[16px] p-4 flex items-center gap-3 mb-2" style={{ background: "var(--bg-surface)" }}>
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[16px]"
                   style={{ background: "var(--bg-elevated)" }}>{reward.icon}</div>
              <div className="flex-1">
                <p className="text-[11px] font-bold" style={{ color: "var(--text-2)" }}>{reward.title}</p>
                <p className="text-[8px] font-medium" style={{ color: "var(--text-3)" }}>{reward.date}</p>
              </div>
              <p className="text-[11px] font-bold" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
                ₹{reward.amount} ✓
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
