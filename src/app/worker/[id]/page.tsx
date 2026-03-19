"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Star, MapPin, CheckCircle2, BadgeCheck, Clock, IndianRupee, QrCode,
  ArrowRight, Phone, Calendar, Shield, Award, TrendingUp, Briefcase,
  CircuitBoard, ThumbsUp, MessageSquare, Share2, Download, ChevronRight,
  User, Globe, Languages, Zap, Eye,
} from "lucide-react";

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
            id: d.id || params.id,
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
            specializations: [],
            certifications: [],
            reviews: [],
            jobHistory: [],
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
    <div className="min-h-screen bg-[var(--color-surface)] pb-24">
      {/* Profile Header */}
      <div style={{ background: "var(--gradient-hero)" }} className="pt-3 pb-6 px-5 rounded-b-[28px]">
        <div className="flex items-center justify-between mb-5">
          <Link href="/marketplace" className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform">
            <ArrowRight className="w-4 h-4 text-white rotate-180" />
          </Link>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"><Share2 className="w-4 h-4 text-white" /></button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-2xl font-bold shadow-xl">{w.initials}</div>
            {w.verified && <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center border-2 border-white"><BadgeCheck className="w-3.5 h-3.5 text-white" /></div>}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">{w.name}</h1>
            <p className="text-xs text-white/60">{w.skill} • {w.experience}</p>
            <p className="text-[10px] text-white/40 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {w.city}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {[
            { val: `${w.rating}★`, label: "Rating" },
            { val: String(w.totalJobs), label: "Jobs" },
            { val: String(w.konnectScore), label: "Score" },
            { val: w.responseTime, label: "Response" },
          ].map(s => (
            <div key={s.label} className="flex-1 bg-white/10 rounded-xl p-2 text-center">
              <p className="text-sm font-extrabold text-white">{s.val}</p>
              <p className="text-[8px] text-white/40">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <Phone className="w-4 h-4" /> Book Now
          </button>
          <button className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center active:scale-90 transition-transform">
            <MessageSquare className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100">
        <div className="flex">
          {[
            { id: "overview" as const, label: "Overview" },
            { id: "reviews" as const, label: `Reviews (${w.reviews.length})` },
            { id: "history" as const, label: "Jobs" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
                activeTab === tab.id ? "text-[var(--color-primary)] border-[var(--color-primary)]" : "text-gray-400 border-transparent"
              }`}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
              {activeTab === "overview" && (
                <>
                  {/* Skills */}
                  <div className="card">
                    <h2 className="text-lg font-bold mb-4">Skills & Specializations</h2>
                    <div className="space-y-3">
                      {w.specializations.map((skill, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-surface)]">
                          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                            <Award className="w-5 h-5 text-[var(--color-primary)]" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{skill.name}</p>
                              {skill.verified && <BadgeCheck className="w-4 h-4 text-[var(--color-accent)]" />}
                            </div>
                            <p className="text-xs text-[var(--color-muted)]">{skill.level} • {skill.jobs} jobs completed</p>
                          </div>
                          <span className={`badge ${skill.verified ? "badge-success" : "badge-warning"} text-[10px]`}>
                            {skill.verified ? "Verified" : "Self-declared"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="card">
                    <h2 className="text-lg font-bold mb-4">Certifications</h2>
                    <div className="space-y-3">
                      {w.certifications.map((cert, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-surface)]">
                          <div className="w-10 h-10 rounded-xl bg-[var(--color-info)]/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-[var(--color-info)]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{cert.name}</p>
                            <p className="text-xs text-[var(--color-muted)]">{cert.issuer} • {cert.year}</p>
                          </div>
                          {cert.verified && (
                            <span className="badge badge-success text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> DigiLocker Verified
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-4">
                  {w.reviews.map((review, i) => (
                    <div key={i} className="card">
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: review.rating }, (_, j) => (
                          <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ))}
                        {Array.from({ length: 5 - review.rating }, (_, j) => (
                          <Star key={j} className="w-4 h-4 text-gray-200" />
                        ))}
                      </div>
                      <p className="text-sm text-[var(--foreground)] leading-relaxed mb-3">{review.text}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] text-xs font-bold">
                            {review.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-xs font-semibold">{review.name}</p>
                            <p className="text-[10px] text-[var(--color-muted)]">{review.business}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-[var(--color-muted)]">{review.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "history" && (
                <div className="card">
                  <h2 className="text-lg font-bold mb-4">Job History</h2>
                  <div className="space-y-3">
                    {w.jobHistory.map((job, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-surface)]">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                          <CircuitBoard className="w-5 h-5 text-[var(--color-primary)]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{job.title}</p>
                          <p className="text-xs text-[var(--color-muted)]">{job.client} • {job.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">₹{job.amount.toLocaleString()}</p>
                          <div className="flex items-center gap-0.5 justify-end">
                            {Array.from({ length: job.rating }, (_, j) => (
                              <Star key={j} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KonnectPassport Card */}
              <div className="card !p-0 overflow-hidden">
                <div className="p-5" style={{ background: "var(--gradient-primary)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-bold text-sm flex items-center gap-1.5">
                      <Zap className="w-4 h-4" /> KonnectPassport
                    </span>
                    <span className="badge bg-white/20 text-white text-[10px]">
                      <BadgeCheck className="w-3 h-3" /> VERIFIED
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                      {w.initials}
                    </div>
                    <div>
                      <p className="text-white font-bold">{w.name}</p>
                      <p className="text-white/60 text-sm">{w.skill}</p>
                      <p className="text-white/50 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{w.city}, {w.state}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] text-[var(--color-muted)]">KonnectID</p>
                      <p className="font-mono font-bold text-sm">{w.id}</p>
                    </div>
                    <div className="w-16 h-16 rounded-lg bg-[var(--color-surface)] flex items-center justify-center">
                      <QrCode className="w-10 h-10 text-[var(--foreground)]" />
                    </div>
                  </div>
                  <button className="btn-primary !w-full !justify-center !py-2.5 !text-sm">
                    <Phone className="w-4 h-4" /> Contact Worker
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="card">
                <h3 className="font-bold text-sm mb-4">Details</h3>
                <div className="space-y-3">
                  {[
                    { icon: MapPin, label: "Location", value: `${w.city}, ${w.state}` },
                    { icon: Languages, label: "Languages", value: w.languages.join(", ") },
                    { icon: Calendar, label: "Experience", value: w.experience },
                    { icon: IndianRupee, label: "Rate Range", value: `₹${w.rate.min} – ₹${w.rate.max}` },
                  ].map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface)]">
                      <d.icon className="w-4 h-4 text-[var(--color-muted)]" />
                      <div>
                        <p className="text-[10px] text-[var(--color-muted)]">{d.label}</p>
                        <p className="text-sm font-medium">{d.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KonnectScore */}
              <div className="card">
                <h3 className="font-bold text-sm mb-4">KonnectScore™</h3>
                <div className="text-center mb-4">
                  <span className="text-5xl font-bold text-[var(--color-primary)]">{w.konnectScore}</span>
                  <span className="text-sm text-[var(--color-muted)]">/900</span>
                  <p className="text-xs text-[var(--color-accent)] mt-1 flex items-center gap-1 justify-center">
                    <TrendingUp className="w-3.5 h-3.5" /> +45 this month
                  </p>
                </div>
                <div className="progress-bar mb-3">
                  <div className="progress-bar-fill" style={{ width: `${(w.konnectScore / 900) * 100}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { range: "300-500", label: "Building", active: false },
                    { range: "500-700", label: "Good", active: false },
                    { range: "700-900", label: "Excellent", active: true },
                  ].map((tier, i) => (
                    <div key={i} className={`p-2 rounded-lg text-[10px] ${tier.active ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold" : "bg-[var(--color-surface)] text-[var(--color-muted)]"}`}>
                      <p className="font-bold">{tier.range}</p>
                      <p>{tier.label}</p>
                    </div>
                  ))}
                </div>
              </div>
      </div>
    </div>
  );
}
