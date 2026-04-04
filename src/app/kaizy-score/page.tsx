"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// KAIZYSCORE DASHBOARD v11.0
// Worker credit score built from work → loan access
// Reference: CIBIL Score + Urban Company Pro Score
// ============================================================

const scoreFactors = [
  { label: "Jobs Completed", weight: "30%", icon: "📋", value: 312, max: 500, unit: "jobs" },
  { label: "Avg Rating", weight: "25%", icon: "⭐", value: 4.8, max: 5.0, unit: "stars" },
  { label: "On-Time Rate", weight: "20%", icon: "⏰", value: 96, max: 100, unit: "%" },
  { label: "Completion Rate", weight: "15%", icon: "✅", value: 98, max: 100, unit: "%" },
  { label: "Response Speed", weight: "10%", icon: "⚡", value: 12, max: 15, unit: "sec avg" },
];

const loanPartners = [
  { name: "KreditBee", logo: "🏦", maxAmount: "₹50,000", interest: "14% p.a.", minScore: 700 },
  { name: "MoneyTap", logo: "💳", maxAmount: "₹1,00,000", interest: "12% p.a.", minScore: 750 },
  { name: "ACKO Insurance", logo: "🛡️", maxAmount: "₹5L cover", interest: "₹99/mo", minScore: 500 },
];

const milestones = [
  { score: 300, label: "Starter", color: "#EF4444", icon: "🌱" },
  { score: 500, label: "Builder", color: "#F59E0B", icon: "🧱" },
  { score: 700, label: "Credit Ready", color: "#10B981", icon: "💳" },
  { score: 850, label: "Elite", color: "#8B5CF6", icon: "👑" },
];

export default function KaizyScorePage() {
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const targetScore = 742;

  useEffect(() => {
    setLoading(false);
    // Animate score count-up
    let current = 0;
    const interval = setInterval(() => {
      current += Math.ceil((targetScore - current) * 0.08);
      if (current >= targetScore) {
        current = targetScore;
        clearInterval(interval);
      }
      setScore(current);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const currentMilestone = milestones.filter(m => targetScore >= m.score).pop() || milestones[0];
  const nextMilestone = milestones.find(m => targetScore < m.score);
  const progressToNext = nextMilestone
    ? ((targetScore - (currentMilestone?.score || 0)) / (nextMilestone.score - (currentMilestone?.score || 0))) * 100
    : 100;

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/settings" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black tracking-tight"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            KaizyScore™
          </h1>
        </div>
      </div>

      {/* Score hero */}
      <div className="mx-5 mb-5 rounded-[24px] p-6 text-center relative overflow-hidden"
           style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
             style={{ background: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)" }} />

        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1 relative z-10">
          Your KaizyScore
        </p>
        <p className="text-[72px] font-black text-white leading-none relative z-10"
           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {score}
        </p>
        <p className="text-[11px] font-bold text-white/70 mt-1 relative z-10">
          out of 900
        </p>

        {/* Milestone badge */}
        <div className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full relative z-10"
             style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
          <span className="text-[14px]">{currentMilestone?.icon}</span>
          <span className="text-[10px] font-bold text-white">{currentMilestone?.label}</span>
        </div>
      </div>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <div className="mx-5 mb-5 rounded-[18px] p-4" style={{ background: "var(--bg-card)" }}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold" style={{ color: "var(--text-2)" }}>
              {currentMilestone?.icon} {currentMilestone?.label}
            </p>
            <p className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>
              {nextMilestone.icon} {nextMilestone.label} ({nextMilestone.score})
            </p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
            <div className="h-full rounded-full transition-all"
                 style={{ width: `${progressToNext}%`, background: currentMilestone?.color || "var(--brand)" }} />
          </div>
          <p className="text-[9px] font-medium mt-1.5" style={{ color: "var(--text-3)" }}>
            {nextMilestone.score - targetScore} more points to unlock {nextMilestone.label}
          </p>
        </div>
      )}

      {/* Score factors */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
          Score Factors
        </p>
        <div className="space-y-2">
          {scoreFactors.map(f => {
            const pct = Math.min(100, (f.value / f.max) * 100);
            return (
              <div key={f.label} className="rounded-[14px] p-3.5" style={{ background: "var(--bg-card)" }}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">{f.icon}</span>
                    <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{f.label}</p>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "var(--bg-surface)", color: "var(--text-3)" }}>
                      {f.weight}
                    </span>
                  </div>
                  <p className="text-[11px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {f.value}{f.unit === "%" || f.unit === "stars" ? f.unit === "%" ? "%" : "" : ""} <span className="text-[8px] font-medium" style={{ color: "var(--text-3)" }}>{f.unit}</span>
                  </p>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                  <div className="h-full rounded-full transition-all"
                       style={{ width: `${pct}%`, background: pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loan partners */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
          💳 Credit & Loan Partners
        </p>
        <div className="space-y-2">
          {loanPartners.map(p => {
            const eligible = targetScore >= p.minScore;
            return (
              <div key={p.name} className="rounded-[16px] p-4 flex items-center gap-3"
                   style={{ background: "var(--bg-card)", opacity: eligible ? 1 : 0.5 }}>
                <span className="text-[24px]">{p.logo}</span>
                <div className="flex-1">
                  <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{p.name}</p>
                  <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
                    Up to {p.maxAmount} · {p.interest}
                  </p>
                </div>
                <div className="text-right">
                  {eligible ? (
                    <span className="text-[9px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: "var(--success-tint)", color: "var(--success)" }}>
                      Eligible ✓
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: "var(--bg-surface)", color: "var(--text-3)" }}>
                      Need {p.minScore}+
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips to improve */}
      <div className="mx-5 rounded-[18px] p-4" style={{ background: "var(--brand-tint)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "var(--brand)" }}>
          🚀 Improve Your Score
        </p>
        <div className="space-y-2">
          {[
            { tip: "Complete 3 more jobs this week", impact: "+15 pts", icon: "📋" },
            { tip: "Maintain 4.5+ rating for 30 days", impact: "+25 pts", icon: "⭐" },
            { tip: "Verify your bank account", impact: "+20 pts", icon: "🏦" },
            { tip: "Respond to alerts within 10 seconds", impact: "+10 pts", icon: "⚡" },
          ].map(t => (
            <div key={t.tip} className="flex items-center gap-2">
              <span className="text-[12px]">{t.icon}</span>
              <p className="text-[10px] font-medium flex-1" style={{ color: "var(--text-2)" }}>{t.tip}</p>
              <span className="text-[9px] font-bold" style={{ color: "var(--success)" }}>{t.impact}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
