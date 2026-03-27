"use client";

import { useState } from "react";
import Link from "next/link";

// ============================================================
// HIRER REGISTRATION v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · Tonal surfaces · Gradient CTAs · No borders
// ============================================================

export default function HirerRegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: "", ownerName: "", phone: "", city: "",
    businessType: "", gst: "", teamSize: "",
  });

  const businessTypes = [
    "Shop / Retail Store", "Construction Company", "Factory / Manufacturing",
    "Restaurant / Hotel", "Apartment / Housing Society", "Event Management",
    "Individual / Homeowner", "Other",
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="pt-5 pb-6 px-5 rounded-b-[28px]" style={{ background: "var(--gradient-cta)" }}>
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "rgba(255,255,255,0.15)" }}>
            <span className="text-white text-[14px]">←</span>
          </Link>
          <span className="text-white/70 font-bold text-[10px] uppercase tracking-widest">Business Registration</span>
          <span className="text-white/50 text-[10px] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{step}/3</span>
        </div>
        <div className="flex gap-1">
          {[1,2,3].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-white" : "bg-white/20"}`} />
          ))}
        </div>
      </div>

      <div className="px-5 py-5">
        {step === 1 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px]" style={{ background: "var(--bg-surface)" }}>🏢</div>
              <div>
                <h2 className="text-[18px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>Business Details</h2>
                <p className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>Tell us about your business</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: "Business Name", placeholder: "e.g., Kumar Electronics", key: "businessName" },
                { label: "Owner / Manager Name", placeholder: "Your full name", key: "ownerName" },
                { label: "City", placeholder: "e.g., Lucknow", key: "city" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>{field.label}</label>
                  <input type="text" placeholder={field.placeholder}
                         value={formData[field.key as keyof typeof formData]}
                         onChange={(e) => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                         className="w-full rounded-[14px] px-4 py-3.5 text-[12px] font-medium outline-none"
                         style={{ background: "var(--bg-card)", color: "var(--text-1)" }} />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>Phone Number</label>
                <div className="flex items-center gap-2 rounded-[14px] px-4 py-3.5" style={{ background: "var(--bg-card)" }}>
                  <span className="text-[12px] font-bold" style={{ color: "var(--text-3)" }}>+91</span>
                  <input type="tel" placeholder="10-digit number"
                         value={formData.phone}
                         onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                         maxLength={10}
                         className="flex-1 bg-transparent text-[12px] font-medium outline-none"
                         style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px]" style={{ background: "var(--bg-surface)" }}>💼</div>
              <div>
                <h2 className="text-[18px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>Business Type</h2>
                <p className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>What kind of business do you run?</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {businessTypes.map((type) => (
                <button key={type} onClick={() => setFormData(p => ({ ...p, businessType: type }))}
                        className="p-3.5 rounded-[14px] text-left text-[11px] font-bold transition-all active:scale-95"
                        style={{
                          background: formData.businessType === type ? "var(--brand-tint)" : "var(--bg-card)",
                          boxShadow: formData.businessType === type ? "0 0 0 2px var(--brand)" : "none",
                          color: formData.businessType === type ? "var(--brand)" : "var(--text-2)",
                        }}>
                  {type}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>GST Number (Optional)</label>
                <input type="text" placeholder="e.g., 29ABCDE1234F1Z5"
                       value={formData.gst}
                       onChange={(e) => setFormData(p => ({ ...p, gst: e.target.value }))}
                       className="w-full rounded-[14px] px-4 py-3.5 text-[12px] font-medium outline-none"
                       style={{ background: "var(--bg-card)", color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>How often do you hire workers?</label>
                <select value={formData.teamSize}
                        onChange={(e) => setFormData(p => ({ ...p, teamSize: e.target.value }))}
                        className="w-full rounded-[14px] px-4 py-3.5 text-[12px] font-medium outline-none appearance-none"
                        style={{ background: "var(--bg-card)", color: "var(--text-1)" }}>
                  <option value="">Select frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="project">Per Project</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center pt-8">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                 style={{ background: "var(--success)", boxShadow: "0 8px 24px rgba(34,197,94,0.3)" }}>
              <span className="text-white text-[32px]">✓</span>
            </div>
            <h2 className="text-[22px] font-black tracking-tight mb-2" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
              You&apos;re All Set! 🎉
            </h2>
            <p className="text-[11px] font-medium mb-8" style={{ color: "var(--text-3)" }}>Your business account is ready. Start finding verified workers now.</p>

            {/* Business Card */}
            <div className="rounded-[18px] overflow-hidden max-w-sm mx-auto mb-8" style={{ background: "var(--bg-card)" }}>
              <div className="p-5" style={{ background: "var(--gradient-cta)" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-bold text-[10px] flex items-center gap-1.5">⚡ Kaizy Business</span>
                  <span className="text-[7px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">VERIFIED</span>
                </div>
                <p className="text-white font-bold text-[14px]">{formData.businessName || "Kumar Electronics"}</p>
                <p className="text-white/60 text-[10px]">{formData.businessType || "Shop / Retail Store"}</p>
                <p className="text-white/50 text-[9px] flex items-center gap-1 mt-1">📍 {formData.city || "Lucknow"}</p>
              </div>
              <div className="p-4">
                <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Business ID</p>
                <p className="text-[12px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>KON-BIZ-2024-04512</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link href="/dashboard/hirer" className="block w-full rounded-[16px] py-3.5 text-[12px] font-black text-white text-center active:scale-[0.97] transition-transform"
                    style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
                Go to Dashboard →
              </Link>
              <Link href="/marketplace" className="block w-full rounded-[16px] py-3.5 text-[12px] font-bold text-center active:scale-[0.97] transition-transform"
                    style={{ background: "var(--bg-card)", color: "var(--text-2)" }}>
                Browse Workers Now
              </Link>
            </div>
          </div>
        )}

        {step < 3 && (
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)}
                      className="px-5 py-3.5 rounded-[14px] text-[12px] font-bold active:scale-95 transition-transform"
                      style={{ background: "var(--bg-card)", color: "var(--text-2)" }}>
                ← Back
              </button>
            )}
            <button onClick={() => setStep(step + 1)}
                    className="flex-1 rounded-[16px] py-3.5 text-[12px] font-black text-white text-center active:scale-[0.97] transition-transform"
                    style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
              {step === 2 ? "Complete Registration" : "Next →"}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 justify-center mt-4 text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
        🔒 DPDP Compliant
      </div>
    </div>
  );
}
