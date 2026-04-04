"use client";

import Link from "next/link";

// ============================================================
// REWARD DETAILS — Stitch "Reward Details" Screen
// ============================================================

const rewards = [
  { id: 1, title: "First Job Bonus", icon: "🎁", amount: 100, type: "bonus", description: "Complete your first job on Kaizy", status: "claimed", date: "15 Mar" },
  { id: 2, title: "5 Star Streak", icon: "⭐", amount: 250, type: "bonus", description: "Get 5 consecutive 5-star ratings", status: "active", progress: 3, target: 5, date: "" },
  { id: 3, title: "Weekend Warrior", icon: "🏆", amount: 500, type: "bonus", description: "Complete 5 jobs on weekends", status: "active", progress: 2, target: 5, date: "" },
  { id: 4, title: "Referral Reward", icon: "🎯", amount: 200, type: "referral", description: "For each friend who joins and completes a job", status: "unlimited", date: "" },
  { id: 5, title: "Early Bird", icon: "🌅", amount: 50, type: "daily", description: "Accept a job before 8 AM", status: "available", date: "" },
  { id: 6, title: "Speed Demon", icon: "⚡", amount: 75, type: "bonus", description: "Complete job within 30 minutes of acceptance", status: "available", date: "" },
  { id: 7, title: "Perfect Month", icon: "🌟", amount: 1000, type: "milestone", description: "No cancellations and 4.8+ rating for entire month", status: "active", progress: 22, target: 30, date: "" },
];

export default function RewardDetailsPage() {
  const totalClaimed = rewards.filter(r => r.status === "claimed").reduce((sum, r) => sum + r.amount, 0);
  const totalAvailable = rewards.filter(r => r.status === "available").reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/incentives" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
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
              ₹{totalClaimed}
            </p>
          </div>
          <div className="rounded-[18px] p-4 text-center" style={{ background: "var(--bg-card)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>Available</p>
            <p className="text-[24px] font-black" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
              ₹{totalAvailable}
            </p>
          </div>
        </div>
      </div>

      {/* Active Challenges */}
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
              {reward.progress !== undefined && reward.target !== undefined && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[8px] font-bold" style={{ color: "var(--text-3)" }}>Progress</span>
                    <span className="text-[8px] font-bold" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {reward.progress}/{reward.target}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-surface)" }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${(reward.progress / reward.target) * 100}%`,
                      background: "var(--gradient-cta)",
                    }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Available Rewards */}
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

      {/* Claimed History */}
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
    </div>
  );
}
