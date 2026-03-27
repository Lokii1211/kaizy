"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// PERFORMANCE DASHBOARD v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · JetBrains Mono data · Tonal surfaces
// ============================================================

interface SkillData { name: string; level: string; jobs: number; }
interface FeedbackData { name: string; area: string; time: string; text: string; rating: number; }

export default function PerformancePage() {
  const [user, setUser] = useState<{ name?: string; kaizy_score?: number; avg_rating?: number; total_jobs?: number; trade?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(j => {
      if (j.success && j.data) setUser(j.data);
    }).catch(() => {});
  }, []);

  const ks = user?.kaizy_score || 0;
  const rating = user?.avg_rating || 0;
  const jobs = user?.total_jobs || 0;
  const completionRate = jobs > 0 ? Math.round((jobs / Math.max(jobs + 2, 1)) * 100) : 0;
  const monthlyGrowth = 24; // demo

  const skills: SkillData[] = [
    { name: "Precision Carpentry", level: "Expert", jobs: 124 },
    { name: "Modular Wiring", level: "Advanced", jobs: 89 },
    { name: "Layout Design", level: "Intermediate", jobs: 42 },
  ];

  const feedback: FeedbackData[] = [
    { name: "Priya Sharma", area: "HSR Layout", time: "2 days ago", rating: 5,
      text: "Exceptional work on our modular kitchen. Very professional, arrived 10 mins early and left the site spotless." },
    { name: "Anish Kapoor", area: "Indiranagar", time: "1 week ago", rating: 5,
      text: "Fixed a complex wiring issue others couldn't diagnose. Very thorough with the technical documentation." },
  ];

  const ksBadge = ks >= 800 ? { label: "Elite Artisan", color: "#FFD700" }
    : ks >= 600 ? { label: "Pro Worker", color: "var(--brand)" }
    : { label: "Rising Worker", color: "var(--info)" };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Gradient Hero */}
      <div className="px-5 pt-5 pb-8 rounded-b-[28px]" style={{ background: "var(--gradient-cta)" }}>
        <div className="flex items-center justify-between mb-5">
          <Link href="/dashboard/worker" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "rgba(255,255,255,0.15)" }}>
            <span className="text-[14px] text-white">←</span>
          </Link>
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Performance</span>
          <div className="w-9" />
        </div>

        <div className="text-center">
          <p className="text-[56px] font-black text-white leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {ks || "—"}
          </p>
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">KaizyScore</p>
          <span className="inline-block mt-2 text-[9px] font-bold px-3 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
            ⭐ {ksBadge.label}
          </span>
        </div>
      </div>

      <div className="px-5 -mt-5 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { v: rating > 0 ? `${rating.toFixed(2)}` : "—", sub: "/5", l: "Rating", icon: "⭐" },
            { v: `${completionRate}`, sub: "%", l: "Completion", icon: "✓" },
            { v: `+${monthlyGrowth}`, sub: "%", l: "Growth", icon: "📈" },
          ].map(s => (
            <div key={s.l} className="rounded-[16px] p-3.5 text-center"
                 style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
              <div className="flex items-baseline justify-center">
                <span className="text-[22px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{s.v}</span>
                <span className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>{s.sub}</span>
              </div>
              <p className="text-[8px] font-bold uppercase tracking-wider mt-1" style={{ color: "var(--text-3)" }}>{s.icon} {s.l}</p>
            </div>
          ))}
        </div>

        {/* Score Boost Tip — Stitch CTA card */}
        <div className="flex items-center gap-3 rounded-[16px] p-4" style={{ background: "var(--brand-tint)" }}>
          <span className="text-[24px]">🚀</span>
          <div className="flex-1">
            <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>Boost Your Score</p>
            <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
              Get certified to unlock ₹800+/hr premium jobs
            </p>
          </div>
          <span className="text-[12px]" style={{ color: "var(--brand)" }}>→</span>
        </div>

        {/* Earnings Card */}
        <div className="rounded-[18px] p-5" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>This Month</p>
          <p className="text-[32px] font-black mt-1" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
            ₹24,850<span className="text-[14px]">.00</span>
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--success)", color: "#fff" }}>+18% vs last month</span>
            <span className="text-[8px] font-bold" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
              {jobs} jobs completed
            </span>
          </div>
        </div>

        {/* Top Skills — from Stitch */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Top Skills</p>
          <div className="space-y-2.5">
            {skills.map((s, i) => (
              <div key={i} className="flex items-center gap-3 rounded-[16px] p-4" style={{ background: "var(--bg-surface)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black"
                     style={{ background: "var(--brand-tint)", color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{s.name}</p>
                  <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{s.level} • {s.jobs} Jobs</p>
                </div>
                {/* Skill bar */}
                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(100, (s.jobs / 150) * 100)}%`,
                    background: "var(--gradient-cta)",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Feedback — from Stitch */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Recent Feedback</p>
          <div className="space-y-2.5">
            {feedback.map((f, i) => (
              <div key={i} className="rounded-[16px] p-4" style={{ background: "var(--bg-card)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                         style={{ background: "var(--gradient-cta)" }}>
                      {f.name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{f.name}</p>
                      <p className="text-[8px] font-medium" style={{ color: "var(--text-3)" }}>{f.area} • {f.time}</p>
                    </div>
                  </div>
                  <div className="flex">
                    {Array.from({ length: f.rating }).map((_, j) => (
                      <span key={j} className="text-[10px]" style={{ color: "var(--warning)" }}>★</span>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] font-medium leading-relaxed" style={{ color: "var(--text-3)" }}>
                  &ldquo;{f.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
