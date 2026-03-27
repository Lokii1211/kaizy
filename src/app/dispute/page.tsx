"use client";

import { useState } from "react";
import Link from "next/link";

// ============================================================
// DISPUTE CENTER v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · Tonal surfaces · Gradient CTAs · No borders
// ============================================================

type DisputeStep = "select" | "evidence" | "tracking";
type DisputeType = "quality" | "incomplete" | "noshow" | "overcharge" | "damage" | "other";

const disputeTypes: { type: DisputeType; icon: string; label: string; desc: string }[] = [
  { type: "quality", icon: "⚠️", label: "Poor Work Quality", desc: "Work done but quality was not as expected" },
  { type: "incomplete", icon: "❌", label: "Incomplete Work", desc: "Worker left before completing the full job" },
  { type: "noshow", icon: "👻", label: "Worker No-Show", desc: "Worker never arrived at the job location" },
  { type: "overcharge", icon: "💰", label: "Overcharged", desc: "Worker charged extra beyond the agreed amount" },
  { type: "damage", icon: "🔨", label: "Property Damage", desc: "Worker caused damage during the job" },
  { type: "other", icon: "📝", label: "Other Issue", desc: "Something else went wrong" },
];

export default function DisputePage() {
  const [step, setStep] = useState<DisputeStep>("select");
  const [selectedType, setSelectedType] = useState<DisputeType | null>(null);
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [loading, setLoading] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState("");

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("tracking");
    }, 2000);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/help" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
              Dispute Center
            </h1>
            <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>Resolution within 24 hours</p>
          </div>
          <span className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>🛡️ Protected</span>
        </div>

        {/* Tabs — Stitch tonal pills */}
        <div className="flex gap-2 rounded-[14px] p-1" style={{ background: "var(--bg-surface)" }}>
          {(["new", "history"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
                    className="flex-1 py-2.5 rounded-[10px] text-[11px] font-bold transition-all"
                    style={{
                      background: activeTab === tab ? "var(--bg-card)" : "transparent",
                      color: activeTab === tab ? "var(--text-1)" : "var(--text-3)",
                      boxShadow: activeTab === tab ? "var(--shadow-sm)" : "none",
                    }}>
              {tab === "new" ? "⚡ File Dispute" : "📋 My Disputes"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-3">
        {activeTab === "new" && (
          <>
            {/* SLA Banner */}
            <div className="flex items-center gap-3 rounded-[16px] p-4 mb-4" style={{ background: "var(--brand-tint)" }}>
              <span className="text-[24px]">⏰</span>
              <div>
                <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>24-Hour Resolution Guarantee</p>
                <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
                  Our ops team reviews every dispute with both parties. Evidence-based decisions only.
                </p>
              </div>
            </div>

            {/* Step 1: Select */}
            {step === "select" && (
              <div className="space-y-2.5">
                <p className="text-[14px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
                  What went wrong?
                </p>
                <p className="text-[10px] font-medium mb-3" style={{ color: "var(--text-3)" }}>
                  Select the type of issue with your recent booking.
                </p>

                {/* Booking selector */}
                <div className="flex items-center gap-3 rounded-[16px] p-4 mb-3" style={{ background: "var(--bg-card)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[16px]"
                       style={{ background: "var(--brand-tint)" }}>📋</div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>Your Recent Booking</p>
                    <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>Select the booking you want to dispute</p>
                  </div>
                  <span className="text-[12px]" style={{ color: "var(--text-3)" }}>▼</span>
                </div>

                {disputeTypes.map(dt => (
                  <button key={dt.type}
                          onClick={() => { setSelectedType(dt.type); setStep("evidence"); }}
                          className="w-full flex items-center gap-3 rounded-[16px] p-4 text-left active:scale-[0.98] transition-all"
                          style={{
                            background: selectedType === dt.type ? "var(--brand-tint)" : "var(--bg-surface)",
                            boxShadow: selectedType === dt.type ? "0 0 0 2px var(--brand)" : "none",
                          }}>
                    <span className="text-[22px]">{dt.icon}</span>
                    <div className="flex-1">
                      <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{dt.label}</p>
                      <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{dt.desc}</p>
                    </div>
                    <span className="text-[12px]" style={{ color: "var(--text-3)" }}>→</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Evidence */}
            {step === "evidence" && (
              <div className="space-y-4">
                <button onClick={() => setStep("select")} className="text-[10px] font-bold flex items-center gap-1"
                        style={{ color: "var(--text-3)" }}>← Back</button>

                <p className="text-[14px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
                  Add Evidence
                </p>
                <p className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>
                  Help our ops team understand the issue. More evidence = faster resolution.
                </p>

                {/* Type badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold"
                      style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
                  {disputeTypes.find(d => d.type === selectedType)?.icon} {disputeTypes.find(d => d.type === selectedType)?.label}
                </span>

                {/* Description */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Describe the issue *</p>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                            className="w-full rounded-[16px] p-4 text-[12px] font-medium outline-none resize-none"
                            style={{ background: "var(--bg-surface)", color: "var(--text-1)" }}
                            placeholder="Tell us what happened in detail..." />
                  <p className="text-[8px] font-bold mt-1" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {description.length}/500
                  </p>
                </div>

                {/* Photo upload */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Photos / Evidence</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[1, 2, 3].map(i => (
                      <button key={i} className="aspect-square rounded-[16px] flex flex-col items-center justify-center gap-1"
                              style={{ background: "var(--bg-surface)", border: "2px dashed rgba(255,255,255,0.08)" }}>
                        <span className="text-[18px]">📷</span>
                        <span className="text-[8px] font-bold" style={{ color: "var(--text-3)" }}>Add Photo</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution options */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Expected Resolution</p>
                  <div className="space-y-2">
                    {[
                      { label: "Full refund", desc: "Complete refund to payment method" },
                      { label: "Partial refund", desc: "Refund for incomplete portion" },
                      { label: "Redo the job", desc: "Same worker fixes for free" },
                      { label: "Different worker", desc: "Assign new worker to complete" },
                    ].map(opt => (
                      <button key={opt.label} onClick={() => setSelectedResolution(opt.label)}
                              className="w-full flex items-center gap-3 rounded-[14px] p-3.5 text-left active:scale-[0.98] transition-all"
                              style={{
                                background: selectedResolution === opt.label ? "var(--brand-tint)" : "var(--bg-surface)",
                                boxShadow: selectedResolution === opt.label ? "0 0 0 2px var(--brand)" : "none",
                              }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center"
                             style={{ background: selectedResolution === opt.label ? "var(--brand)" : "var(--bg-card)" }}>
                          {selectedResolution === opt.label && <span className="text-[8px] text-white">✓</span>}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{opt.label}</p>
                          <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleSubmit} disabled={!description || loading}
                        className="w-full rounded-[16px] py-4 text-[13px] font-black text-white active:scale-[0.97] transition-all disabled:opacity-40"
                        style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
                  {loading ? "⏳ Submitting..." : "📤 Submit Dispute"}
                </button>

                <p className="text-[9px] text-center font-medium" style={{ color: "var(--text-3)" }}>
                  Both you and the worker will be notified. Response within 24 hours.
                </p>
              </div>
            )}

            {/* Step 3: Tracking */}
            {step === "tracking" && (
              <div className="text-center py-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                     style={{ background: "var(--success)", boxShadow: "0 8px 32px rgba(34,197,94,0.3)" }}>
                  <span className="text-white text-[32px]">✓</span>
                </div>
                <h2 className="text-[18px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
                  Dispute Filed Successfully
                </h2>
                <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--text-3)" }}>
                  Case ID: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-1)" }}>DIS-2024-0847</span>
                </p>

                {/* Timeline */}
                <div className="rounded-[18px] p-5 text-left mt-5 mb-5" style={{ background: "var(--bg-card)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>Resolution Timeline</p>
                  <div className="space-y-4">
                    {[
                      { time: "Now", label: "Dispute filed", status: "done", detail: "Your evidence has been submitted" },
                      { time: "~2 hrs", label: "Ops team reviews", status: "active", detail: "Our team examines evidence from both sides" },
                      { time: "~8 hrs", label: "Worker contacted", status: "pending", detail: "Worker will share their perspective" },
                      { time: "~24 hrs", label: "Decision communicated", status: "pending", detail: "Both parties notified via WhatsApp" },
                    ].map((t, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full"
                               style={{
                                 background: t.status === "done" ? "var(--success)" : t.status === "active" ? "var(--brand)" : "var(--bg-elevated)",
                                 animation: t.status === "active" ? "pulse 2s ease infinite" : "none",
                               }} />
                          {i < 3 && <div className="w-0.5 flex-1 mt-1" style={{ background: t.status === "done" ? "var(--success)" : "var(--bg-elevated)" }} />}
                        </div>
                        <div className="pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-bold" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>{t.time}</span>
                            <span className="text-[11px] font-bold" style={{
                              color: t.status === "done" ? "var(--success)" : t.status === "active" ? "var(--brand)" : "var(--text-3)",
                            }}>{t.label}</span>
                          </div>
                          <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{t.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/"
                      className="inline-block w-full rounded-[16px] py-4 text-[13px] font-black text-white active:scale-[0.97] transition-all"
                      style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
                  Back to Home
                </Link>
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                 style={{ background: "var(--success)", boxShadow: "0 4px 16px rgba(34,197,94,0.2)" }}>
              <span className="text-white text-[24px]">✓</span>
            </div>
            <p className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>All Clear!</p>
            <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--text-3)" }}>No disputes yet. We hope it stays that way! 🙏</p>
          </div>
        )}
      </div>
    </div>
  );
}
