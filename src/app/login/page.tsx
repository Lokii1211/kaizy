"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// KAIZY LOGIN — Real WhatsApp OTP (Step 1: Role & Phone)
// ============================================================

export default function LoginPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [userType, setUserType] = useState<"worker" | "hirer">("worker");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidIndianPhone = /^[6-9]\d{9}$/.test(phone);

  const handleSendOTP = async () => {
    setError("");
    if (!isValidIndianPhone) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Save temporary role preference
        try {
          localStorage.setItem("kaizy_pending_role", userType);
          localStorage.setItem("kaizy_pending_phone", phone);
        } catch {}
        // Navigate to Screen 2: OTP Entry
        router.push(`/login/otp?phone=${phone}&role=${userType}`);
      } else {
        setError(data.error || "Failed to send OTP. Please try again.");
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: isDark ? "var(--bg-lowest)" : "#FFFFFF" }}>
      {/* ── Top Hero Zone (40%) ── */}
      <div
        className="relative flex-shrink-0 overflow-hidden flex flex-col items-center justify-center px-6 pt-10 pb-8"
        style={{ minHeight: "38vh", background: "linear-gradient(160deg, #FF6B00, #C84B00)" }}
      >
        {/* Decorative background glows */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/kaizy-logo.png"
          alt="Kaizy"
          className="w-16 h-16 rounded-[18px] mb-3 shadow-xl relative z-10"
        />
        <h1 className="text-[26px] font-black text-white leading-tight tracking-tight text-center relative z-10" style={{ fontFamily: "'Epilogue', sans-serif" }}>
          Welcome to Kaizy
        </h1>
        <p className="text-[12px] font-semibold mt-1 text-white/80 text-center relative z-10">
          India&apos;s Workforce OS · Instant On-Demand Dispatch
        </p>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-2 mt-4 relative z-10 flex-wrap">
          {["⚡ Instant Dispatch", "🛡️ Verified KYC", "💬 WhatsApp Login"].map(t => (
            <span key={t} className="text-[9px] font-bold px-3 py-1 rounded-full text-white" style={{ background: "rgba(255,255,255,0.18)" }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── Form Card (60%) ── */}
      <div
        className="flex-1 flex flex-col rounded-t-[28px] px-6 pt-6 pb-8 -mt-5 relative z-10"
        style={{ background: isDark ? "var(--bg-app)" : "#FFFFFF", boxShadow: "0 -4px 24px rgba(0,0,0,0.08)" }}
      >
        {/* Role Selection */}
        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
          I am registering as:
        </p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => setUserType("worker")}
            className="flex flex-col rounded-[20px] p-4 text-left active:scale-[0.97] transition-all"
            style={{
              background: userType === "worker"
                ? (isDark ? "rgba(255,107,0,0.12)" : "rgba(255,107,0,0.06)")
                : "var(--bg-surface)",
              border: `2px solid ${userType === "worker" ? "var(--brand)" : "transparent"}`,
              boxShadow: userType === "worker" ? "0 0 0 4px rgba(255,107,0,0.08)" : "none",
            }}
          >
            <span className="text-[28px] mb-1.5">👷</span>
            <span className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>Worker</span>
            <span className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>Find jobs near me</span>
          </button>

          <button
            type="button"
            onClick={() => setUserType("hirer")}
            className="flex flex-col rounded-[20px] p-4 text-left active:scale-[0.97] transition-all"
            style={{
              background: userType === "hirer"
                ? (isDark ? "rgba(255,107,0,0.12)" : "rgba(255,107,0,0.06)")
                : "var(--bg-surface)",
              border: `2px solid ${userType === "hirer" ? "var(--brand)" : "transparent"}`,
              boxShadow: userType === "hirer" ? "0 0 0 4px rgba(255,107,0,0.08)" : "none",
            }}
          >
            <span className="text-[28px] mb-1.5">🏠</span>
            <span className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>Home Owner</span>
            <span className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>Hire a worker</span>
          </button>
        </div>

        {/* Phone Entry */}
        <label className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: "var(--text-3)" }}>
          Mobile Number
        </label>
        <div
          className="flex items-center rounded-[18px] overflow-hidden mb-2 transition-all"
          style={{
            background: isDark ? "var(--bg-lowest)" : "#F8F8F8",
            border: `1.5px solid ${isValidIndianPhone ? "var(--success)" : "var(--border-2)"}`,
          }}
        >
          <span
            className="flex items-center px-4 text-[14px] font-bold shrink-0"
            style={{
              background: isDark ? "var(--bg-surface)" : "rgba(0,0,0,0.04)",
              color: isDark ? "var(--text-2)" : "#333",
            }}
          >
            🇮🇳 +91
          </span>
          <input
            type="tel"
            value={phone}
            onChange={e => {
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
              setError("");
            }}
            className="flex-1 py-[15px] px-3 text-[18px] font-bold tracking-[0.1em] outline-none bg-transparent"
            style={{ color: isDark ? "var(--text-1)" : "#111", fontFamily: "'JetBrains Mono', monospace" }}
            placeholder="98765 43210"
            inputMode="numeric"
            autoFocus
          />
          {isValidIndianPhone && (
            <span className="pr-4 text-[16px] text-green-500 font-bold">✓</span>
          )}
        </div>

        {error && (
          <p className="text-[11px] font-bold mb-2 mt-1" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}

        {/* WhatsApp OTP Info Callout */}
        <div
          className="rounded-[16px] p-3.5 mt-2 mb-6 flex items-center gap-3"
          style={{ background: isDark ? "rgba(37,211,102,0.1)" : "rgba(37,211,102,0.08)" }}
        >
          <span className="text-[22px] shrink-0">💬</span>
          <div className="flex-1">
            <p className="text-[11px] font-bold" style={{ color: isDark ? "#25D366" : "#128C7E" }}>
              OTP sent to WhatsApp
            </p>
            <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
              Fast, secure &amp; zero SMS delay. Auto-registers your account.
            </p>
          </div>
        </div>

        {/* Send OTP CTA */}
        <button
          type="button"
          onClick={handleSendOTP}
          disabled={loading || !isValidIndianPhone}
          className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all shadow-md"
          style={{
            background: isValidIndianPhone ? "var(--gradient-cta)" : "var(--bg-elevated)",
            color: isValidIndianPhone ? "#FFFFFF" : "var(--text-3)",
            boxShadow: isValidIndianPhone ? "var(--shadow-brand)" : "none",
          }}
        >
          {loading ? "Sending WhatsApp OTP..." : "Send OTP →"}
        </button>

        <p className="text-[9px] text-center mt-auto pt-6" style={{ color: "var(--text-3)" }}>
          By continuing you agree to Kaizy&apos;s{" "}
          <span style={{ color: "var(--brand)" }}>Terms of Service</span> and{" "}
          <span style={{ color: "var(--brand)" }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
