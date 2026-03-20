"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap, Phone, ArrowRight, ArrowLeft, Shield, CheckCircle2,
  Building2, MapPin, Briefcase, Users, FileText,
} from "lucide-react";

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
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="bg-gradient-to-br from-[#1E293B] to-blue-800 pt-3 pb-5 px-5 rounded-b-[28px]">
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <span className="text-white font-bold text-sm">Business Registration</span>
          <span className="text-white/50 text-xs">{step}/3</span>
        </div>
        <div className="flex gap-1">
          {[1,2,3].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-white" : "bg-white/20"}`} />
          ))}
        </div>
      </div>

      <div className="px-4 py-5">
          {step === 1 && (
            <div className="animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#1E293B]/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[#1E293B]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Business Details</h2>
                  <p className="text-[var(--color-muted)] text-sm">Tell us about your business</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Business Name</label>
                  <input type="text" className="input" placeholder="e.g., Kumar Electronics" value={formData.businessName} onChange={(e) => setFormData((p) => ({ ...p, businessName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Owner / Manager Name</label>
                  <input type="text" className="input" placeholder="Your full name" value={formData.ownerName} onChange={(e) => setFormData((p) => ({ ...p, ownerName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-sm font-medium">+91</span>
                    <input type="tel" className="input !pl-14" placeholder="10-digit number" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} maxLength={10} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <div className="relative">
                    <input type="text" className="input !pl-10" placeholder="e.g., Lucknow" value={formData.city} onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))} />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#1E293B]/10 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-[#1E293B]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Business Type</h2>
                  <p className="text-[var(--color-muted)] text-sm">What kind of business do you run?</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {businessTypes.map((type) => (
                  <button key={type} onClick={() => setFormData((p) => ({ ...p, businessType: type }))}
                    className={`p-4 rounded-xl border-2 text-left text-sm font-medium transition-all ${formData.businessType === type ? "border-[#FF6B2C] bg-[#FF6B2C]/5 text-[#FF6B2C]" : "border-[#E2E8F0] hover:border-[#FF6B2C]/50"}`}>
                    {type}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">GST Number (Optional)</label>
                  <input type="text" className="input" placeholder="e.g., 29ABCDE1234F1Z5" value={formData.gst} onChange={(e) => setFormData((p) => ({ ...p, gst: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">How often do you hire workers?</label>
                  <select className="input" value={formData.teamSize} onChange={(e) => setFormData((p) => ({ ...p, teamSize: e.target.value }))}>
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
            <div className="animate-scale-in text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#3B82F6]/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-[#3B82F6]" />
              </div>
              <h2 className="text-3xl font-bold mb-2">You&apos;re All Set! 🎉</h2>
              <p className="text-[var(--color-muted)] mb-8">Your business account is ready. Start finding verified workers now.</p>

              <div className="card !p-0 overflow-hidden max-w-sm mx-auto mb-8">
                <div className="p-6 bg-gradient-to-br from-[#1E293B] to-[#334155] text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-bold text-sm flex items-center gap-2"><Zap className="w-4 h-4" /> Kaizy Business</span>
                    <span className="badge bg-white/20 text-white text-[10px]">VERIFIED</span>
                  </div>
                  <p className="font-bold text-lg">{formData.businessName || "Kumar Electronics"}</p>
                  <p className="text-white/60 text-sm">{formData.businessType || "Shop / Retail Store"}</p>
                  <p className="text-white/60 text-xs flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{formData.city || "Lucknow"}</p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[var(--color-muted)]">Business ID</p>
                  <p className="font-mono font-bold text-sm">KON-BIZ-2024-04512</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/dashboard/hirer" className="btn-primary !w-full !justify-center !py-3.5">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/marketplace" className="btn-secondary !w-full !justify-center !py-3.5">
                  Browse Workers Now
                </Link>
              </div>
            </div>
          )}

          {step < 3 && (
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="btn-secondary !py-3">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              <button onClick={() => setStep(step + 1)} className="btn-primary flex-1 !justify-center !py-3">
                {step === 2 ? "Complete Registration" : "Next"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 justify-center mt-6 text-[10px] text-gray-400">
          <Shield className="w-3 h-3" /> DPDP Compliant
        </div>
    </div>
  );
}
