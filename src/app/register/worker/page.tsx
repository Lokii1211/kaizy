"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Phone,
  ArrowRight,
  ArrowLeft,
  Shield,
  CheckCircle2,
  User,
  Mic,
  Camera,
  MapPin,
  CircuitBoard,
  Droplets,
  Hammer,
  Paintbrush,
  Wind,
  Wrench,
  Scissors,
  Flame,
  Cog,
  Languages,
  QrCode,
} from "lucide-react";

const skills = [
  { id: "electrician", name: "Electrician", nameHi: "इलेक्ट्रीशियन", icon: CircuitBoard, color: "#FF6B2C" },
  { id: "plumber", name: "Plumber", nameHi: "प्लंबर", icon: Droplets, color: "#3B82F6" },
  { id: "carpenter", name: "Carpenter", nameHi: "बढ़ई", icon: Hammer, color: "#8B5CF6" },
  { id: "painter", name: "Painter", nameHi: "पेंटर", icon: Paintbrush, color: "#22C55E" },
  { id: "ac_tech", name: "AC Technician", nameHi: "AC तकनीशियन", icon: Wind, color: "#00C9A7" },
  { id: "welder", name: "Welder", nameHi: "वेल्डर", icon: Wrench, color: "#F59E0B" },
  { id: "tailor", name: "Tailor", nameHi: "दर्जी", icon: Scissors, color: "#EC4899" },
  { id: "mason", name: "Mason", nameHi: "राजमिस्त्री", icon: Cog, color: "#6366F1" },
];

const languages = [
  { id: "hi", name: "Hindi", native: "हिन्दी" },
  { id: "ta", name: "Tamil", native: "தமிழ்" },
  { id: "bn", name: "Bengali", native: "বাংলা" },
  { id: "te", name: "Telugu", native: "తెలుగు" },
  { id: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { id: "mr", name: "Marathi", native: "मराठी" },
  { id: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { id: "od", name: "Odia", native: "ଓଡ଼ିଆ" },
];

export default function WorkerRegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    otp: "",
    language: "hi",
    selectedSkills: [] as string[],
    city: "",
    experience: "",
  });

  const totalSteps = 5;

  const toggleSkill = (skillId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skillId)
        ? prev.selectedSkills.filter((s) => s !== skillId)
        : [...prev.selectedSkills, skillId],
    }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#FF6B2C] to-orange-700 pt-3 pb-5 px-5 rounded-b-[28px]">
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <span className="text-white font-bold text-sm">Worker Registration</span>
          <span className="text-white/50 text-xs">{step}/{totalSteps}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < step ? "bg-white" : "bg-white/20"}`} />
          ))}
        </div>
      </div>

      <div className="px-4 py-5">
          {/* Step 1: Language Selection */}
          {step === 1 && (
            <div className="animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FF6B2C]/10 flex items-center justify-center">
                  <Languages className="w-6 h-6 text-[#FF6B2C]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">Choose Your Language</h2>
                  <p className="text-[var(--color-muted)] text-sm">अपनी भाषा चुनें</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setFormData((p) => ({ ...p, language: lang.id }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.language === lang.id
                        ? "border-[#FF6B2C] bg-[#FF6B2C]/5"
                        : "border-[#E2E8F0] hover:border-[#FF6B2C]/50"
                    }`}
                  >
                    <p className="font-bold text-[var(--foreground)]">{lang.native}</p>
                    <p className="text-xs text-[var(--color-muted)]">{lang.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Phone + OTP */}
          {step === 2 && (
            <div className="animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FF6B2C]/10 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-[#FF6B2C]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">Your Phone Number</h2>
                  <p className="text-[var(--color-muted)] text-sm">We&apos;ll send jobs to this number via WhatsApp</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-sm font-medium">+91</span>
                    <input
                      type="tel"
                      className="input !pl-14"
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                      maxLength={10}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City / Town</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="input !pl-10"
                      placeholder="e.g., Coimbatore, Lucknow"
                      value={formData.city}
                      onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Skill Selection */}
          {step === 3 && (
            <div className="animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FF6B2C]/10 flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-[#FF6B2C]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">Select Your Skills</h2>
                  <p className="text-[var(--color-muted)] text-sm">Tap all skills you can do (select multiple)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {skills.map((skill) => {
                  const selected = formData.selectedSkills.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all group ${
                        selected
                          ? "border-[#FF6B2C] bg-[#FF6B2C]/5"
                          : "border-[#E2E8F0] hover:border-[#FF6B2C]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                          style={{ background: `${skill.color}15` }}
                        >
                          <skill.icon className="w-5 h-5" style={{ color: skill.color }} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[var(--foreground)]">{skill.name}</p>
                          <p className="text-xs text-[var(--color-muted)]">{skill.nameHi}</p>
                        </div>
                      </div>
                      {selected && (
                        <CheckCircle2 className="w-5 h-5 text-[#FF6B2C] absolute top-3 right-3" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Years of Experience</label>
                <select
                  className="input"
                  value={formData.experience}
                  onChange={(e) => setFormData((p) => ({ ...p, experience: e.target.value }))}
                >
                  <option value="">Select experience</option>
                  <option value="0-2">0–2 years</option>
                  <option value="2-5">2–5 years</option>
                  <option value="5-10">5–10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Selfie + Voice */}
          {step === 4 && (
            <div className="animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FF6B2C]/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-[#FF6B2C]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">Verify Your Identity</h2>
                  <p className="text-[var(--color-muted)] text-sm">Quick photo & voice for secure verification</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="border-2 border-dashed border-[#E2E8F0] rounded-2xl p-8 text-center hover:border-[#FF6B2C] transition-colors cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl bg-[#FF6B2C]/10 flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-[#FF6B2C]" />
                  </div>
                  <p className="font-semibold text-[var(--foreground)] mb-1">Take a Selfie</p>
                  <p className="text-sm text-[var(--color-muted)]">Clear face photo for your KonnectPassport</p>
                </div>
                <div className="border-2 border-dashed border-[#E2E8F0] rounded-2xl p-8 text-center hover:border-[#3B82F6] transition-colors cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl bg-[#3B82F6]/10 flex items-center justify-center mx-auto mb-4">
                    <Mic className="w-8 h-8 text-[#3B82F6]" />
                  </div>
                  <p className="font-semibold text-[var(--foreground)] mb-1">Voice Introduction</p>
                  <p className="text-sm text-[var(--color-muted)]">Say your name and skills in your language (30 sec)</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Success — KonnectID */}
          {step === 5 && (
            <div className="animate-scale-in text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#3B82F6]/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-[#3B82F6]" />
              </div>
              <h2 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                Welcome to KonnectOn! 🎉
              </h2>
              <p className="text-[var(--color-muted)] mb-8">
                Your KonnectPassport is ready. Share your QR code to get hired directly.
              </p>

              {/* Mock KonnectID Card */}
              <div className="card !p-0 overflow-hidden max-w-sm mx-auto mb-8">
                <div className="p-6" style={{ background: "var(--gradient-primary)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-white" />
                      <span className="text-white font-bold text-sm">KonnectPassport</span>
                    </div>
                    <span className="badge bg-white/20 text-white text-[10px]">VERIFIED</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                      {formData.name ? formData.name[0]?.toUpperCase() : "R"}K
                    </div>
                    <div className="text-left">
                      <p className="text-white font-bold">{formData.name || "Raju Kumar"}</p>
                      <p className="text-white/60 text-sm">
                        {formData.selectedSkills.map((s) => skills.find((sk) => sk.id === s)?.name).join(", ") || "Electrician"}
                      </p>
                      <p className="text-white/60 text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {formData.city || "Coimbatore"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--color-muted)]">KonnectID</p>
                    <p className="font-mono font-bold text-sm">KON-2024-08271</p>
                  </div>
                  <div className="w-16 h-16 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-[var(--foreground)]" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/dashboard/worker" className="btn-primary !w-full !justify-center !py-3.5">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="btn-secondary !w-full !justify-center !py-3.5">
                  Share KonnectID on WhatsApp
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 5 && (
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="btn-secondary !py-3"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                onClick={() => setStep(step + 1)}
                className="btn-primary flex-1 !justify-center !py-3"
              >
                {step === 4 ? "Complete Registration" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 justify-center mt-6 text-[10px] text-gray-400">
          <Shield className="w-3 h-3" />
          Encrypted & DPDP compliant
        </div>
    </div>
  );
}
