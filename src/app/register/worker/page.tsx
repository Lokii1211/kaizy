"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { supabase } from "@/lib/supabase";

// ============================================================
// WORKER REGISTRATION — Multi-step form with real Supabase save
// ============================================================

const trades = [
  { key: "electrician", icon: "⚡", name: "Electrician" },
  { key: "plumber", icon: "🔧", name: "Plumber" },
  { key: "mechanic", icon: "🚗", name: "Mechanic" },
  { key: "ac_repair", icon: "❄️", name: "AC Repair" },
  { key: "carpenter", icon: "🪚", name: "Carpenter" },
  { key: "painter", icon: "🎨", name: "Painter" },
];

export default function WorkerRegisterPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [trade, setTrade] = useState("");
  const [experience, setExperience] = useState("");
  const [rate, setRate] = useState("400");
  const [upiId, setUpiId] = useState("");
  const [city, setCity] = useState("Coimbatore");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    try {
      // Create user
      const { data: user, error: userErr } = await supabase
        .from("users")
        .insert({
          phone: phone.startsWith("+91") ? phone : `+91${phone}`,
          name,
          user_type: "worker",
          city,
        })
        .select()
        .single();

      if (userErr) {
        if (userErr.message.includes("duplicate")) {
          setError("This phone number is already registered. Try logging in.");
        } else {
          setError(userErr.message);
        }
        setSaving(false);
        return;
      }

      // Create worker profile
      await supabase.from("worker_profiles").insert({
        id: user.id,
        trade_primary: trade,
        experience_years: parseInt(experience) || 0,
        rate_hourly: parseFloat(rate) || 400,
        bio,
        upi_id: upiId,
        is_online: false,
        is_available: true,
      });

      setStep(4); // Success
    } catch (e) {
      setError("Registration failed. Please try again.");
      console.error("[register]", e);
    } finally {
      setSaving(false);
    }
  };

  // Success step
  if (step === 4) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-app)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 animate-bounce-in"
             style={{ background: "var(--success)", boxShadow: "0 8px 32px rgba(52,211,153,0.3)" }}>
          <span className="text-white text-[32px]">✓</span>
        </div>
        <h1 className="text-[22px] font-black text-center" style={{ color: "var(--text-1)" }}>Welcome, {name}! 🎉</h1>
        <p className="text-[14px] mt-2 text-center" style={{ color: "var(--text-2)" }}>
          Your worker profile is live
        </p>
        <p className="text-[12px] mt-1 text-center" style={{ color: "var(--text-3)" }}>
          Log in to start receiving job alerts
        </p>
        <Link href="/login" className="mt-6 rounded-xl px-8 py-4 text-[14px] font-black text-white active:scale-95"
              style={{ background: "var(--brand)" }}>Login Now →</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/login" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <div>
            <h1 className="text-[18px] font-black" style={{ color: "var(--text-1)" }}>Register as Worker</h1>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Step {step} of 3</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-4">
          {[1,2,3].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full" style={{ background: s <= step ? "var(--brand)" : "var(--bg-elevated)" }} />
          ))}
        </div>
      </div>

      <div className="px-4">
        {/* Step 1: Basic info */}
        {step === 1 && (
          <div className="space-y-4 stagger">
            <div>
              <label className="text-[12px] font-bold block mb-1" style={{ color: "var(--text-2)" }}>Full Name *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                     className="w-full rounded-xl px-4 py-3 text-[14px] font-medium outline-none"
                     style={{ background: isDark ? "rgba(255,255,255,0.95)" : "#fff", color: "#111", border: "1px solid var(--border-2)" }}
                     placeholder="e.g. Raju Kumar" />
            </div>
            <div>
              <label className="text-[12px] font-bold block mb-1" style={{ color: "var(--text-2)" }}>Phone Number *</label>
              <div className="flex rounded-xl overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.95)" : "#fff", border: "1px solid var(--border-2)" }}>
                <span className="flex items-center px-3 text-[13px] font-bold" style={{ background: "rgba(0,0,0,0.05)", color: "#333" }}>🇮🇳 +91</span>
                <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                       className="flex-1 px-3 py-3 text-[14px] font-medium outline-none bg-transparent" style={{ color: "#111" }}
                       placeholder="98765 43210" inputMode="numeric" />
              </div>
            </div>
            <div>
              <label className="text-[12px] font-bold block mb-1" style={{ color: "var(--text-2)" }}>City</label>
              <input value={city} onChange={e => setCity(e.target.value)}
                     className="w-full rounded-xl px-4 py-3 text-[14px] font-medium outline-none"
                     style={{ background: isDark ? "rgba(255,255,255,0.95)" : "#fff", color: "#111", border: "1px solid var(--border-2)" }}
                     placeholder="Coimbatore" />
            </div>
            <button onClick={() => { if (name && phone.length === 10) setStep(2); else setError("Name and phone required"); }}
                    disabled={!name || phone.length !== 10}
                    className="w-full rounded-xl py-4 text-[14px] font-black text-white active:scale-[0.98] disabled:opacity-40"
                    style={{ background: "var(--brand)" }}>
              Next → Trade Selection
            </button>
          </div>
        )}

        {/* Step 2: Trade selection */}
        {step === 2 && (
          <div className="stagger">
            <p className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>What&apos;s your primary trade?</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {trades.map(t => (
                <button key={t.key} onClick={() => setTrade(t.key)}
                        className="flex items-center gap-3 rounded-xl p-4 text-left active:scale-95 transition-all"
                        style={{
                          background: trade === t.key ? "var(--brand-tint)" : "var(--bg-card)",
                          border: trade === t.key ? "2px solid var(--brand)" : "2px solid transparent",
                        }}>
                  <span className="text-[24px]">{t.icon}</span>
                  <span className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{t.name}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "var(--text-2)" }}>Experience (years)</label>
                <input value={experience} onChange={e => setExperience(e.target.value)}
                       className="w-full rounded-xl px-4 py-3 text-[14px] font-medium outline-none"
                       style={{ background: isDark ? "rgba(255,255,255,0.95)" : "#fff", color: "#111", border: "1px solid var(--border-2)" }}
                       placeholder="e.g. 5" inputMode="numeric" />
              </div>
              <div>
                <label className="text-[12px] font-bold block mb-1" style={{ color: "var(--text-2)" }}>Hourly Rate (₹)</label>
                <input value={rate} onChange={e => setRate(e.target.value)}
                       className="w-full rounded-xl px-4 py-3 text-[14px] font-medium outline-none"
                       style={{ background: isDark ? "rgba(255,255,255,0.95)" : "#fff", color: "#111", border: "1px solid var(--border-2)" }}
                       placeholder="e.g. 500" inputMode="numeric" />
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 rounded-xl py-3 text-[13px] font-bold active:scale-95"
                      style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>← Back</button>
              <button onClick={() => { if (trade) setStep(3); }}
                      disabled={!trade}
                      className="flex-1 rounded-xl py-3 text-[13px] font-bold text-white active:scale-95 disabled:opacity-40"
                      style={{ background: "var(--brand)" }}>Next →</button>
            </div>
          </div>
        )}

        {/* Step 3: Payment + Bio */}
        {step === 3 && (
          <div className="space-y-4 stagger">
            <div>
              <label className="text-[12px] font-bold block mb-1" style={{ color: "var(--text-2)" }}>UPI ID (for payouts)</label>
              <input value={upiId} onChange={e => setUpiId(e.target.value)}
                     className="w-full rounded-xl px-4 py-3 text-[14px] font-medium outline-none"
                     style={{ background: isDark ? "rgba(255,255,255,0.95)" : "#fff", color: "#111", border: "1px solid var(--border-2)" }}
                     placeholder="yourname@upi" />
            </div>
            <div>
              <label className="text-[12px] font-bold block mb-1" style={{ color: "var(--text-2)" }}>Short Bio (optional)</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                        className="w-full rounded-xl px-4 py-3 text-[14px] font-medium outline-none resize-none"
                        style={{ background: isDark ? "rgba(255,255,255,0.95)" : "#fff", color: "#111", border: "1px solid var(--border-2)" }}
                        placeholder="Tell hirers about your skills and experience..." />
            </div>

            {/* Summary card */}
            <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <p className="text-[12px] font-bold mb-2" style={{ color: "var(--text-3)" }}>Profile Summary</p>
              <div className="space-y-1 text-[12px]">
                <p style={{ color: "var(--text-2)" }}>👤 {name}</p>
                <p style={{ color: "var(--text-2)" }}>📱 +91{phone}</p>
                <p style={{ color: "var(--text-2)" }}>🔧 {trades.find(t => t.key === trade)?.name} · {experience || "0"} years</p>
                <p style={{ color: "var(--text-2)" }}>💰 ₹{rate}/hour</p>
                <p style={{ color: "var(--text-2)" }}>📍 {city}</p>
              </div>
            </div>

            {error && (
              <p className="text-[12px] font-bold text-center" style={{ color: "var(--danger)" }}>{error}</p>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 rounded-xl py-3 text-[13px] font-bold active:scale-95"
                      style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>← Back</button>
              <button onClick={handleSubmit} disabled={saving}
                      className="flex-1 rounded-xl py-3 text-[13px] font-bold text-white active:scale-95 disabled:opacity-60"
                      style={{ background: "var(--success)" }}>
                {saving ? "Creating..." : "✓ Register"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
