"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { authApi } from "@/lib/api";

// ============================================================
// LOGIN v12.0 — Split hero/form layout (Urban Company style)
// Hero brand zone (45%) · White form card (55%)
// Step 1: Type → Step 2: Phone → Step 3: OTP → Step 4: Success
// ============================================================

type Step = "type" | "phone" | "otp" | "success";

export default function LoginPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [userType, setUserType] = useState<"worker" | "hirer">("worker");
  const [step, setStep] = useState<Step>("type");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [debugOtp, setDebugOtp] = useState("");
  const [otpChannel, setOtpChannel] = useState<string>("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  useEffect(() => {
    if (step === "otp") otpRefs.current[0]?.focus();
  }, [step]);

  const handleSendOTP = async () => {
    setError("");
    if (phone.length !== 10) { setError("Enter a valid 10-digit number"); return; }
    setLoading(true);
    try {
      const r = await authApi.sendOtp(phone);
      if (r.success) {
        setStep("otp");
        setCountdown(30);
        if (r.data?.channel) setOtpChannel(r.data.channel);
        const showOtp = r.data?.fallback_otp || r.data?.debug_otp;
        if (showOtp) setDebugOtp(showOtp);
      } else setError(r.error || "Failed");
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const handleOtpChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
    if (v && i === 5) { const f = n.join(""); if (f.length === 6) handleVerify(f); }
  };
  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleVerify = async (otpStr?: string) => {
    setError("");
    const full = otpStr || otp.join("");
    if (full.length !== 6) { setError("Enter 6-digit OTP"); return; }
    setLoading(true);
    try {
      const r = await authApi.verifyOtp(phone, full, userType);
      if (r.success) {
        const actualRole = r.data?.user?.userType || userType;
        const isNew = r.data?.isNewUser || false;
        try {
          localStorage.setItem("kaizy_user_type", actualRole);
          localStorage.setItem("kaizy_user_phone", phone);
          if (r.data?.user?.name) localStorage.setItem("kaizy_user_name", r.data.user.name);
          document.cookie = `kaizy_user_type=${actualRole};path=/;max-age=31536000`;
        } catch {}
        setStep("success");
        const destination = isNew
          ? (actualRole === "worker" ? "/register/worker" : "/onboarding/hirer")
          : (actualRole === "worker" ? "/dashboard/worker" : "/dashboard/hirer");
        setTimeout(() => router.push(destination), 1500);
      } else {
        setError(r.error || "Invalid OTP");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  // ── Hero zone colors per step ──
  const heroGradient =
    step === "otp" ? (otpChannel.includes("whatsapp") ? "linear-gradient(160deg,#25D366,#128C7E)" : "linear-gradient(160deg,#FF6B00,#C84B00)")
    : step === "success" ? "linear-gradient(160deg,#10B981,#047857)"
    : "linear-gradient(160deg,#FF6B00,#C84B00)";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: isDark ? "var(--bg-lowest)" : "#F5F5F5" }}>

      {/* ══════════════════════════════
          HERO BAND (top ~40%)
      ══════════════════════════════ */}
      <div
        className="relative flex-shrink-0 overflow-hidden flex flex-col items-center justify-center"
        style={{ minHeight: "40vh", background: heroGradient, transition: "background 0.5s ease" }}
      >
        {/* Decorative rings */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />

        {step === "type" && (
          <div className="relative text-center px-6 py-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kaizy-logo.png" alt="Kaizy" className="w-16 h-16 rounded-[18px] mx-auto mb-4"
                 style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }} />
            <h1 className="text-[28px] font-black text-white leading-tight tracking-tight" style={{ fontFamily: "'Epilogue', sans-serif" }}>
              Welcome to Kaizy
            </h1>
            <p className="text-[13px] font-medium mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
              India&apos;s Workforce OS
            </p>
            {/* Trust pills */}
            <div className="flex items-center justify-center gap-3 mt-4">
              {["⭐ 4.8 rated", "🛡️ ID verified", "50K+ jobs"].map(t => (
                <span key={t} className="text-[10px] font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {step === "phone" && (
          <div className="relative text-center px-6 py-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                 style={{ background: "rgba(255,255,255,0.2)" }}>
              <span className="text-3xl">📱</span>
            </div>
            <h2 className="text-[24px] font-black text-white" style={{ fontFamily: "'Epilogue', sans-serif" }}>
              Enter Your Number
            </h2>
            <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
              We&apos;ll send a WhatsApp OTP
            </p>
          </div>
        )}

        {step === "otp" && (
          <div className="relative text-center px-6 py-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                 style={{ background: "rgba(255,255,255,0.2)" }}>
              <span className="text-3xl">{otpChannel.includes("whatsapp") ? "💬" : "🔐"}</span>
            </div>
            <h2 className="text-[24px] font-black text-white" style={{ fontFamily: "'Epilogue', sans-serif" }}>
              Verify OTP
            </h2>
            <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
              {otpChannel.includes("whatsapp") ? "Check your WhatsApp" : "Code sent to"} +91 {phone}
            </p>
            {otpChannel.includes("whatsapp") && (
              <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
                <span className="text-white text-[11px] font-bold">💚 Sent via WhatsApp</span>
              </div>
            )}
          </div>
        )}

        {step === "success" && (
          <div className="relative text-center px-6 py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 anim-spring"
                 style={{ background: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.4)" }}>
              <span className="text-white text-3xl font-black">✓</span>
            </div>
            <h2 className="text-[26px] font-black text-white" style={{ fontFamily: "'Epilogue', sans-serif" }}>Welcome! 🎉</h2>
            <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>Setting up your dashboard...</p>
            <div className="mt-4 w-5 h-5 border-2 rounded-full mx-auto animate-spin"
                 style={{ borderColor: "rgba(255,255,255,0.5)", borderTopColor: "#fff" }} />
          </div>
        )}
      </div>

      {/* ══════════════════════════════
          FORM CARD (bottom ~60%)
      ══════════════════════════════ */}
      <div
        className="flex-1 flex flex-col rounded-t-[28px] px-5 pt-6 pb-8 -mt-5 relative z-10"
        style={{ background: isDark ? "var(--bg-app)" : "#fff", boxShadow: "0 -4px 24px rgba(0,0,0,0.08)" }}
      >
        {/* ═══ STEP 1: Type Selection ═══ */}
        {step === "type" && (
          <div className="anim-up">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>
              I am a...
            </p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                {
                  type: "worker" as const,
                  emoji: "👷",
                  label: "Worker",
                  sub: "Find jobs near me",
                  perks: ["Earn daily", "Choose jobs", "KaizyPass ID"],
                },
                {
                  type: "hirer" as const,
                  emoji: "🏠",
                  label: "Home Owner",
                  sub: "Hire a worker",
                  perks: ["Quick booking", "Verified workers", "Track live"],
                },
              ].map(t => (
                <button
                  key={t.type}
                  onClick={() => setUserType(t.type)}
                  className="flex flex-col rounded-[22px] p-4 text-left active:scale-[0.97] transition-all"
                  style={{
                    background: userType === t.type
                      ? (isDark ? "rgba(255,107,0,0.12)" : "rgba(255,107,0,0.06)")
                      : "var(--bg-surface)",
                    border: `2px solid ${userType === t.type ? "var(--brand)" : "transparent"}`,
                    boxShadow: userType === t.type ? "0 0 0 4px rgba(255,107,0,0.08)" : "none",
                  }}
                >
                  <span className="text-[32px] mb-2">{t.emoji}</span>
                  <span className="text-[14px] font-extrabold mb-0.5" style={{ color: "var(--text-1)" }}>{t.label}</span>
                  <span className="text-[10px] font-medium mb-3" style={{ color: "var(--text-3)" }}>{t.sub}</span>
                  <div className="flex flex-col gap-1">
                    {t.perks.map(p => (
                      <span key={p} className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: "var(--text-2)" }}>
                        <span style={{ color: "var(--brand)" }}>✓</span> {p}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("phone")}
              className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] transition-transform"
              style={{ background: "var(--gradient-cta)", color: "#FFDBCC", boxShadow: "var(--shadow-brand)" }}
            >
              Continue as {userType === "worker" ? "Worker" : "Home Owner"} →
            </button>

            <div className="flex items-center gap-4 mt-auto pt-5">
              {[
                { icon: "🔒", text: "Bank-grade encryption" },
                { icon: "📵", text: "No spam calls" },
              ].map(t => (
                <div key={t.text} className="flex items-center gap-1.5 flex-1">
                  <span className="text-[12px]">{t.icon}</span>
                  <span className="text-[9px] font-semibold" style={{ color: "var(--text-3)" }}>{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Phone ═══ */}
        {step === "phone" && (
          <div className="anim-up">
            <button onClick={() => setStep("type")} className="flex items-center gap-1.5 text-[12px] font-bold mb-5" style={{ color: "var(--text-3)" }}>
              ← Back
            </button>

            <div className="flex rounded-[16px] overflow-hidden mb-2"
                 style={{ background: isDark ? "var(--bg-lowest)" : "#F8F8F8", border: "1.5px solid var(--border-2)" }}>
              <span className="flex items-center px-4 text-[14px] font-bold shrink-0"
                    style={{ background: isDark ? "var(--bg-surface)" : "rgba(0,0,0,0.04)", color: isDark ? "var(--text-2)" : "#333" }}>
                🇮🇳 +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
                className="flex-1 py-[15px] px-4 text-[20px] font-bold tracking-[0.15em] outline-none bg-transparent"
                style={{ color: isDark ? "var(--text-1)" : "#111", fontFamily: "'JetBrains Mono', monospace" }}
                placeholder="98765 43210"
                inputMode="numeric"
                autoFocus
              />
            </div>

            {error && <p className="text-[11px] font-bold mb-2 mt-1" style={{ color: "var(--danger)" }}>{error}</p>}

            <div className="rounded-[14px] p-3 mt-3 mb-5 flex items-start gap-2.5"
                 style={{ background: isDark ? "rgba(255,107,0,0.08)" : "rgba(255,107,0,0.06)" }}>
              <span className="text-[14px] mt-0.5">🔐</span>
              <p className="text-[10px] font-semibold leading-relaxed" style={{ color: "var(--text-2)" }}>
                OTP will be sent via WhatsApp. No sign-up required — we&apos;ll create your account automatically.
              </p>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading || phone.length !== 10}
              className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all"
              style={{
                background: phone.length === 10 ? "var(--gradient-cta)" : "var(--bg-elevated)",
                color: phone.length === 10 ? "#FFDBCC" : "var(--text-3)",
                boxShadow: phone.length === 10 ? "var(--shadow-brand)" : "none",
              }}
            >
              {loading ? "Sending..." : "Send OTP via WhatsApp →"}
            </button>

            <p className="text-[9px] text-center mt-4" style={{ color: "var(--text-3)" }}>
              By continuing you agree to our{" "}
              <span style={{ color: "var(--brand-soft)" }}>Terms</span> and{" "}
              <span style={{ color: "var(--brand-soft)" }}>Privacy Policy</span>
            </p>
          </div>
        )}

        {/* ═══ STEP 3: OTP ═══ */}
        {step === "otp" && (
          <div className="anim-up">
            {debugOtp && (
              <div className="rounded-[14px] p-3 mb-4 text-center" style={{ background: "var(--success-tint)", border: "1px solid rgba(52,211,153,0.3)" }}>
                <p className="text-[9px] font-bold mb-1" style={{ color: "var(--success)" }}>🔑 Your OTP Code:</p>
                <p className="text-[28px] font-black tracking-[0.3em]"
                   style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>{debugOtp}</p>
                <p className="text-[8px] mt-1" style={{ color: "var(--success)", opacity: 0.7 }}>Valid for 10 minutes</p>
              </div>
            )}

            <div className="flex gap-3 justify-center mb-4">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)}
                  className="text-center text-[22px] font-black outline-none rounded-[14px] transition-all"
                  style={{
                    width: 46, height: 54,
                    background: d ? (isDark ? "rgba(255,107,0,0.15)" : "rgba(255,107,0,0.08)") : "var(--bg-surface)",
                    border: `2px solid ${d ? "var(--brand)" : "var(--border-2)"}`,
                    color: "var(--text-1)",
                    fontFamily: "'JetBrains Mono', monospace",
                    boxShadow: d ? "0 0 12px rgba(255,107,0,0.15)" : "none",
                  }}
                />
              ))}
            </div>

            {error && <p className="text-[11px] font-bold mb-3 text-center" style={{ color: "var(--danger)" }}>{error}</p>}

            <button
              onClick={() => handleVerify()}
              disabled={loading || otp.join("").length !== 6}
              className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all"
              style={{
                background: otp.join("").length === 6 ? "var(--gradient-cta)" : "var(--bg-elevated)",
                color: otp.join("").length === 6 ? "#FFDBCC" : "var(--text-3)",
                boxShadow: otp.join("").length === 6 ? "var(--shadow-brand)" : "none",
              }}
            >
              {loading ? "Verifying..." : "Verify & Continue ✓"}
            </button>

            <div className="text-center mt-4">
              {countdown > 0 ? (
                <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
                  Resend in <span className="font-bold" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>{countdown}s</span>
                </p>
              ) : (
                <button onClick={handleSendOTP} className="text-[12px] font-bold" style={{ color: "var(--brand)" }}>
                  🔄 Resend OTP
                </button>
              )}
            </div>

            <button onClick={() => setStep("phone")} className="text-[12px] font-bold block mx-auto mt-3" style={{ color: "var(--text-3)" }}>
              ← Change Number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
