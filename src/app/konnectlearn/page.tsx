"use client";

import { useState } from "react";
import Link from "next/link";

// ============================================================
// KONNECT LEARN v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · Tonal surfaces · Gradient CTAs
// ============================================================

const courses = [
  { id: 1, title: "House Wiring — Beginner to Expert", skill: "Electrician", icon: "⚡", lang: "Hindi + Tamil", duration: "12 hrs", lessons: 24, enrolled: "2.3K", rating: 4.8, badge: "Wiring Expert", free: true, progress: 65 },
  { id: 2, title: "Solar Panel Installation", skill: "Electrician", icon: "☀️", lang: "Hindi", duration: "8 hrs", lessons: 16, enrolled: "1.5K", rating: 4.7, badge: "Solar Pro", free: true, progress: 0 },
  { id: 3, title: "Modern Plumbing Techniques", skill: "Plumber", icon: "🔧", lang: "Hindi + Tamil", duration: "10 hrs", lessons: 20, enrolled: "1.8K", rating: 4.6, badge: "Adv Plumber", free: true, progress: 0 },
  { id: 4, title: "Split AC Service & Repair", skill: "AC Tech", icon: "❄️", lang: "Hindi + English", duration: "14 hrs", lessons: 28, enrolled: "1.1K", rating: 4.9, badge: "AC Service Pro", free: false, progress: 0 },
  { id: 5, title: "Furniture Making & Carpentry", skill: "Carpenter", icon: "🪚", lang: "Hindi", duration: "16 hrs", lessons: 32, enrolled: "980", rating: 4.5, badge: "Furniture Expert", free: true, progress: 0 },
  { id: 6, title: "Industrial Welding — MIG & Arc", skill: "Welder", icon: "🔩", lang: "Hindi + Marathi", duration: "18 hrs", lessons: 36, enrolled: "670", rating: 4.7, badge: "Welder Pro", free: false, progress: 0 },
];

export default function KonnectLearnPage() {
  const [selectedSkill, setSelectedSkill] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = courses.filter(c => {
    const matchSkill = selectedSkill === "All" || c.skill === selectedSkill;
    const matchSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSkill && matchSearch;
  });

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header — Stitch gradient */}
      <div className="pt-5 pb-7 px-5 rounded-b-[28px]" style={{ background: "var(--gradient-cta)" }}>
        <div className="flex items-center justify-between mb-5">
          <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "rgba(255,255,255,0.15)" }}>
            <span className="text-[14px] text-white">←</span>
          </Link>
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">KonnectLearn</span>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
            <span className="text-[14px]">🎓</span>
          </div>
        </div>

        <h1 className="text-[20px] font-black tracking-tight text-white" style={{ fontFamily: "'Epilogue', sans-serif" }}>
          Learn. Earn Badges. Get Better Jobs.
        </h1>
        <p className="text-[10px] mt-1 font-medium text-white/50">AI-powered upskilling in your language • FREE</p>

        <div className="flex gap-2.5 mt-4">
          {[
            { val: "50+", label: "Courses" },
            { val: "12K+", label: "Trained" },
            { val: "8", label: "Languages" },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-[14px] p-2.5 text-center" style={{ background: "rgba(255,255,255,0.12)" }}>
              <p className="text-[14px] font-black text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</p>
              <p className="text-[8px] text-white/40 font-bold uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4 mt-5">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px]">🔍</span>
          <input className="w-full pl-10 pr-4 py-3 rounded-[14px] text-[12px] font-medium outline-none"
                 style={{ background: "var(--bg-card)", color: "var(--text-1)" }}
                 placeholder="Search courses..."
                 value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        {/* Skill pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {["All", "Electrician", "Plumber", "AC Tech", "Carpenter", "Welder"].map(s => (
            <button key={s} onClick={() => setSelectedSkill(s)}
                    className="px-3.5 py-2 rounded-full text-[10px] font-bold whitespace-nowrap transition-all active:scale-95"
                    style={{ background: selectedSkill === s ? "var(--brand)" : "var(--bg-surface)", color: selectedSkill === s ? "#fff" : "var(--text-3)" }}>
              {s}
            </button>
          ))}
        </div>

        {/* AI Skill Gap Alert */}
        <div className="rounded-[16px] p-4" style={{ background: "var(--danger-tint)" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[14px]">📊</span>
            <p className="text-[10px] font-bold" style={{ color: "var(--danger)" }}>AI Skill Gap Alert</p>
          </div>
          <p className="text-[10px] font-medium" style={{ color: "var(--text-2)" }}>
            Solar Panel installers have <span className="font-bold" style={{ color: "var(--danger)" }}>3x higher demand</span> than supply in your city!
          </p>
        </div>

        {/* Continue Learning */}
        {courses[0].progress > 0 && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Continue Learning</p>
            <div className="rounded-[18px] p-4" style={{ background: "var(--bg-card)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px]" style={{ background: "var(--brand-tint)" }}>
                  {courses[0].icon}
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{courses[0].title}</p>
                  <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{courses[0].lessons} lessons • {courses[0].duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                  <div className="h-full rounded-full" style={{ width: `${courses[0].progress}%`, background: "var(--gradient-cta)" }} />
                </div>
                <span className="text-[9px] font-bold" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>{courses[0].progress}%</span>
              </div>
              <button className="w-full py-3 rounded-[14px] text-[12px] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                      style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
                ▶ Resume Learning
              </button>
            </div>
          </div>
        )}

        {/* Course List */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>All Courses</p>
          <div className="space-y-2.5">
            {filtered.map(c => (
              <div key={c.id} className="rounded-[18px] overflow-hidden active:scale-[0.98] transition-all" style={{ background: "var(--bg-card)" }}>
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[18px] shrink-0" style={{ background: "var(--bg-surface)" }}>
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-1)" }}>{c.title}</p>
                      <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{c.skill} • {c.lang}</p>
                    </div>
                    <span className="text-[7px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: c.free ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: c.free ? "var(--success)" : "var(--warning)" }}>
                      {c.free ? "FREE" : "₹299"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3 text-[9px] font-bold" style={{ color: "var(--text-3)" }}>
                    <span>▶ {c.lessons} lessons</span>
                    <span>⏱ {c.duration}</span>
                    <span>⭐ {c.rating}</span>
                    <span>👥 {c.enrolled}</span>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 rounded-[12px] mb-3" style={{ background: "var(--brand-tint)" }}>
                    <span className="text-[12px]">🏅</span>
                    <p className="text-[9px] font-bold" style={{ color: "var(--brand)" }}>
                      Earn: <span className="font-black">{c.badge}</span> badge → unlock higher-paying jobs
                    </p>
                  </div>

                  <button className="w-full py-3 rounded-[14px] text-[11px] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                          style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
                    ▶ Start Learning
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <span className="text-[48px] block mb-3">📚</span>
            <p className="text-[14px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>No courses found</p>
          </div>
        )}
      </div>
    </div>
  );
}
