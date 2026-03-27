"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ============================================================
// WORKER DETAIL v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · Tonal surfaces · JetBrains Mono data · No borders
// ============================================================

interface WorkerProfile {
  id: string; name: string; initials: string; skill: string;
  city: string; state: string; bio: string; rating: number;
  totalJobs: number; konnectScore: number; verified: boolean;
  available: boolean; experience: string; languages: string[];
  responseTime: string; completionRate: string;
  rate: { min: number; max: number };
  specializations: Array<{ name: string; level: string; verified: boolean; jobs: number }>;
  certifications: Array<{ name: string; issuer: string; year: string; verified: boolean }>;
  reviews: Array<{ name: string; business: string; rating: number; text: string; date: string }>;
  jobHistory: Array<{ title: string; client: string; amount: number; date: string; rating: number }>;
}

export default function WorkerProfilePage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "history">("overview");
  const [w, setW] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const res = await fetch(`/api/workers/${params.id}`);
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setW({
            id: d.id || String(params.id),
            name: d.name || d.users?.name || "Worker",
            initials: (d.name || d.users?.name || "W").split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 2),
            skill: d.trade_primary || "Technician",
            city: d.users?.city || "India",
            state: "Tamil Nadu",
            bio: d.bio || "",
            rating: d.avg_rating || 0,
            totalJobs: d.total_jobs || 0,
            konnectScore: d.kaizy_score || 0,
            verified: d.aadhaar_verified || false,
            available: d.is_available || false,
            experience: `${d.experience_years || 0} years`,
            languages: ["Tamil", "Hindi"],
            responseTime: "< 15 min",
            completionRate: d.total_jobs > 0 ? `${Math.round((d.total_jobs / (d.total_jobs + 2)) * 100)}%` : "—",
            rate: { min: d.rate_hourly || 300, max: (d.rate_hourly || 300) * 2.5 },
            specializations: [], certifications: [], reviews: [], jobHistory: [],
          });
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchWorker();
  }, [params.id]);

  if (loading || !w) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg-app)" }}>
      {/* Profile Header — Gradient */}
      <div className="pt-5 pb-7 px-5 rounded-b-[28px]" style={{ background: "var(--gradient-cta)" }}>
        <div className="flex items-center justify-between mb-5">
          <Link href="/marketplace" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "rgba(255,255,255,0.15)" }}>
            <span className="text-[14px] text-white">←</span>
          </Link>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <span className="text-white text-[14px]">📤</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-[22px] font-black"
                 style={{ background: "rgba(255,255,255,0.2)" }}>{w.initials}</div>
            {w.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                   style={{ background: "var(--info)" }}>
                <span className="text-white text-[10px]">✓</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-[18px] font-black text-white tracking-tight" style={{ fontFamily: "'Epilogue', sans-serif" }}>{w.name}</h1>
            <p className="text-[11px] text-white/60 font-medium">{w.skill} • {w.experience}</p>
            <p className="text-[9px] text-white/40 flex items-center gap-1">📍 {w.city}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 mb-4">
          {[
            { val: `${w.rating}★`, label: "Rating" },
            { val: String(w.totalJobs), label: "Jobs" },
            { val: String(w.konnectScore), label: "Score" },
            { val: w.responseTime, label: "Response" },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-[14px] p-2 text-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              <p className="text-[12px] font-black text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</p>
              <p className="text-[7px] text-white/40 font-bold uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button className="flex-1 py-3 rounded-[14px] font-bold text-[12px] text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  style={{ background: "rgba(255,255,255,0.2)" }}>
            📞 Book Now
          </button>
          <button className="w-12 h-12 rounded-[14px] flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: "rgba(255,255,255,0.15)" }}>
            <span className="text-[18px]">💬</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 px-5 py-3" style={{ background: "var(--bg-app)" }}>
        <div className="flex gap-1 rounded-[14px] p-1" style={{ background: "var(--bg-surface)" }}>
          {[
            { id: "overview" as const, label: "Overview" },
            { id: "reviews" as const, label: `Reviews (${w.reviews.length})` },
            { id: "history" as const, label: "Jobs" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className="flex-1 py-2.5 rounded-[10px] text-[10px] font-bold text-center transition-all"
                    style={{
                      background: activeTab === tab.id ? "var(--brand)" : "transparent",
                      color: activeTab === tab.id ? "#fff" : "var(--text-3)",
                    }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 space-y-3">
        {activeTab === "overview" && (
          <>
            {/* Skills */}
            <div className="rounded-[18px] p-4" style={{ background: "var(--bg-card)" }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Skills & Specializations</p>
              <div className="space-y-2">
                {w.specializations.length === 0 ? (
                  <p className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>No specializations listed yet</p>
                ) : w.specializations.map((skill, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-[14px]" style={{ background: "var(--bg-surface)" }}>
                    <span className="text-[18px]">🏅</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{skill.name}</p>
                        {skill.verified && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "var(--success)" }}>Verified</span>}
                      </div>
                      <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{skill.level} • {skill.jobs} jobs</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="rounded-[18px] p-4" style={{ background: "var(--bg-card)" }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Details</p>
              <div className="space-y-2">
                {[
                  { icon: "📍", label: "Location", value: `${w.city}, ${w.state}` },
                  { icon: "🗣️", label: "Languages", value: w.languages.join(", ") },
                  { icon: "📅", label: "Experience", value: w.experience },
                  { icon: "💰", label: "Rate Range", value: `₹${w.rate.min} – ₹${w.rate.max}` },
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-[14px]" style={{ background: "var(--bg-surface)" }}>
                    <span className="text-[14px]">{d.icon}</span>
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{d.label}</p>
                      <p className="text-[11px] font-bold" style={{ color: "var(--text-1)", fontFamily: d.label === "Rate Range" ? "'JetBrains Mono', monospace" : "inherit" }}>{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KonnectScore */}
            <div className="rounded-[18px] p-4" style={{ background: "var(--bg-card)" }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>KaizyScore™</p>
              <div className="text-center mb-3">
                <span className="text-[42px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>{w.konnectScore}</span>
                <span className="text-[14px] font-medium" style={{ color: "var(--text-3)" }}>/900</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden mb-3" style={{ background: "var(--bg-surface)" }}>
                <div className="h-full rounded-full" style={{ width: `${(w.konnectScore / 900) * 100}%`, background: "var(--gradient-cta)" }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { range: "300-500", label: "Building" },
                  { range: "500-700", label: "Good" },
                  { range: "700-900", label: "Excellent" },
                ].map((tier, i) => (
                  <div key={i} className="p-2 rounded-[10px] text-[9px]"
                       style={{ background: w.konnectScore >= (i === 0 ? 300 : i === 1 ? 500 : 700) ? "var(--brand-tint)" : "var(--bg-surface)", color: "var(--text-2)" }}>
                    <p className="font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{tier.range}</p>
                    <p className="font-medium">{tier.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* KonnectPassport Card */}
            <div className="rounded-[18px] overflow-hidden" style={{ background: "var(--bg-card)" }}>
              <div className="p-5" style={{ background: "var(--gradient-cta)" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-bold text-[11px] flex items-center gap-1.5">⚡ KonnectPassport</span>
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">VERIFIED</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white text-[16px] font-bold">{w.initials}</div>
                  <div>
                    <p className="text-white font-bold text-[13px]">{w.name}</p>
                    <p className="text-white/60 text-[10px]">{w.skill}</p>
                    <p className="text-white/50 text-[9px] flex items-center gap-1">📍 {w.city}, {w.state}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>KonnectID</p>
                  <p className="text-[12px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{w.id}</p>
                </div>
                <div className="w-14 h-14 rounded-[10px] flex items-center justify-center text-[28px]" style={{ background: "var(--bg-surface)" }}>📱</div>
              </div>
            </div>
          </>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-2.5">
            {w.reviews.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-[48px] block mb-3">⭐</span>
                <p className="text-[14px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>No reviews yet</p>
                <p className="text-[10px] font-medium mt-1" style={{ color: "var(--text-3)" }}>Be the first to review this worker</p>
              </div>
            ) : w.reviews.map((review, i) => (
              <div key={i} className="rounded-[18px] p-4" style={{ background: "var(--bg-card)" }}>
                <div className="flex items-center gap-0.5 mb-2">
                  {Array.from({ length: review.rating }, (_, j) => <span key={j} className="text-[14px]">⭐</span>)}
                </div>
                <p className="text-[11px] font-medium leading-relaxed mb-3" style={{ color: "var(--text-2)" }}>{review.text}</p>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: "var(--brand)" }}>
                      {review.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold" style={{ color: "var(--text-1)" }}>{review.name}</p>
                      <p className="text-[8px] font-medium" style={{ color: "var(--text-3)" }}>{review.business}</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "history" && (
          <div className="rounded-[18px] p-4" style={{ background: "var(--bg-card)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Job History</p>
            {w.jobHistory.length === 0 ? (
              <p className="text-[11px] font-medium py-8 text-center" style={{ color: "var(--text-3)" }}>No job history available</p>
            ) : (
              <div className="space-y-2">
                {w.jobHistory.map((job, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-[14px]" style={{ background: "var(--bg-surface)" }}>
                    <span className="text-[18px]">🔧</span>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{job.title}</p>
                      <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{job.client} • {job.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>₹{job.amount.toLocaleString()}</p>
                      <div className="flex items-center gap-0.5 justify-end">
                        {Array.from({ length: job.rating }, (_, j) => <span key={j} className="text-[8px]">⭐</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Book CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 z-50"
           style={{ background: "var(--bg-app)", boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
        <button className="w-full rounded-[16px] py-4 text-[13px] font-black text-white active:scale-[0.97] transition-transform"
                style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
          📞 Book {w.name.split(" ")[0]} Now
        </button>
      </div>
    </div>
  );
}
