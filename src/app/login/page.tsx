"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { authApi } from "@/lib/api";

type Step = "type" | "phone" | "otp" | "success";

export default function LoginPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [userType, setUserType] = useState<"worker" | "hirer">("worker");
  const [step, setStep] = useState<Step>("type");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [debugOtp, setDebugOtp] = useState("");
  const [otpChannel, setOtpChannel] = useState<string>("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (countdown > 0) { const t = setTimeout(() => setCountdown(countdown - 1), 1000); return () => clearTimeout(t); } }, [countdown]);
  useEffect(() => { if (step === "otp") otpRefs.current[0]?.focus(); }, [step]);

  const handleSendOTP = async () => {
    setError(""); if (phone.length !== 10) { setError("Enter a valid 10-digit number"); return; }
    setLoading(true);
    try {
      const r = await authApi.sendOtp(phone);
      if (r.success) { 
        setStep("otp"); 
        setCountdown(30); 
        if (r.data?.channel) setOtpChannel(r.data.channel);
        const showOtp = r.data?.fallback_otp || r.data?.debug_otp;
        if (showOtp) setDebugOtp(showOtp); 
      }
      else setError(r.error || "Failed");
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const handleOtpChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
    if (v && i === 5) { const f = n.join(""); if (f.length === 6) handleVerify(f); }
  };
  const handleOtpKey = (i: number, e: React.KeyboardEvent) => { if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); };

  const handleVerify = async (otpStr?: string) => {
    setError(""); const full = otpStr || otp.join("");
    if (full.length !== 6) { setError("Enter 6-digit OTP"); return; }
    setLoading(true);
    try {
      const r = await authApi.verifyOtp(phone, full, userType);
      if (r.success) { setStep("success"); setTimeout(() => router.push(userType === "worker" ? "/dashboard/worker" : "/dashboard/hirer"), 1500); }
      else { setError(r.error || "Invalid OTP"); setOtp(["","","","","",""]); otpRefs.current[0]?.focus(); }
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: "var(--bg-app)" }}>

      {/* ═══ STEP 1: User Type ═══ */}
      {step === "type" && (
        <div className="w-full max-w-sm anim-scale text-center">
          {/* Logo + Brand */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kaizy-logo.png" alt="Kaizy" className="w-20 h-20 rounded-2xl mx-auto mb-5"
               style={{ boxShadow: "var(--shadow-brand)" }} />
          <h1 className="text-[26px] font-black mb-1 tracking-tight"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Welcome to <span className="text-gradient">Kaizy</span>
          </h1>
          <p className="text-[12px] mb-8" style={{ color: "var(--text-2)" }}>
            India&apos;s Workforce OS — 55 crore skilled workers
          </p>

          {/* Type Selection — Tonal Cards (No borders, tonal depth) */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { type: "worker" as const, icon: "🔧", label: "I'm a Worker", sub: "Find jobs near me" },
              { type: "hirer" as const, icon: "🏠", label: "I need Help", sub: "Hire a worker" },
            ].map(t => (
              <button key={t.type} onClick={() => setUserType(t.type)}
                      className="flex flex-col items-center gap-2.5 rounded-[20px] py-6 px-3 active:scale-[0.96] transition-all"
                      style={{
                        background: userType === t.type
                          ? (isDark ? "var(--bg-elevated)" : "var(--bg-card)")
                          : "var(--bg-surface)",
                        border: userType === t.type
                          ? "2px solid rgba(255,107,0,0.4)"
                          : "2px solid transparent",
                        boxShadow: userType === t.type ? "var(--shadow-card)" : "none",
                      }}>
                <span className="text-[36px]">{t.icon}</span>
                <span className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>{t.label}</span>
                <span className="text-[10px]" style={{ color: "var(--text-2)" }}>{t.sub}</span>
              </button>
            ))}
          </div>

          {/* CTA — Gradient Button */}
          <button onClick={() => setStep("phone")}
                  className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] transition-transform"
                  style={{
                    background: "var(--gradient-cta)",
                    color: "#FFDBCC",
                    boxShadow: "var(--shadow-brand)",
                    letterSpacing: "-0.01em",
                  }}>
            Get Started →
          </button>

          {/* Trust Signal */}
          <p className="text-[9px] mt-4 font-semibold" style={{ color: "var(--text-3)" }}>
            🔒 Secured with bank-grade encryption
          </p>
        </div>
      )}

      {/* ═══ STEP 2: Phone Entry ═══ */}
      {step === "phone" && (
        <div className="w-full max-w-sm anim-up text-center">
          {/* Hero Icon */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
               style={{ background: "var(--brand-tint)" }}>
            <span className="text-[28px]">📱</span>
          </div>
          <h1 className="text-[24px] font-black mb-1 tracking-tight"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Enter Your Phone
          </h1>
          <p className="text-[12px] mb-6" style={{ color: "var(--text-2)" }}>
            We&apos;ll send you a WhatsApp OTP
          </p>

          {/* Phone Input — Tonal (NO border, surface shift) */}
          <div className="flex rounded-[16px] overflow-hidden mb-1"
               style={{
                 background: isDark ? "var(--bg-lowest)" : "#fff",
                 border: isDark ? "1px solid rgba(90,65,54,0.15)" : "1px solid var(--border-2)",
               }}>
            <span className="flex items-center px-4 text-[14px] font-bold"
                  style={{
                    background: isDark ? "var(--bg-surface)" : "rgba(0,0,0,0.03)",
                    color: isDark ? "var(--text-2)" : "#333",
                  }}>
              🇮🇳 +91
            </span>
            <input type="tel" value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g,"").slice(0,10)); setError(""); }}
                   className="flex-1 py-[14px] px-4 text-[18px] font-bold tracking-[0.15em] outline-none bg-transparent"
                   style={{ color: isDark ? "var(--text-1)" : "#111", fontFamily: "'JetBrains Mono', monospace" }}
                   placeholder="98765 43210" inputMode="numeric" autoFocus />
          </div>
          {error && <p className="text-[11px] font-bold mb-2 mt-2" style={{ color: "var(--danger)" }}>{error}</p>}

          {/* Security Card */}
          <div className="rounded-[14px] p-3 mt-4 mb-5 flex items-start gap-3"
               style={{ background: "var(--trust-tint)" }}>
            <span className="text-[14px] mt-0.5">🔐</span>
            <div className="text-left">
              <p className="text-[11px] font-bold" style={{ color: "var(--trust)" }}>Secure Authentication</p>
              <p className="text-[9px] mt-0.5" style={{ color: "var(--text-2)" }}>
                Your data is encrypted. We use industry-standard protocols.
              </p>
            </div>
          </div>

          {/* CTA */}
          <button onClick={handleSendOTP} disabled={loading || phone.length !== 10}
                  className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all"
                  style={{
                    background: phone.length === 10 ? "var(--gradient-cta)" : "var(--bg-elevated)",
                    color: phone.length === 10 ? "#FFDBCC" : "var(--text-3)",
                    boxShadow: phone.length === 10 ? "var(--shadow-brand)" : "none",
                  }}>
            {loading ? "Sending..." : "Send OTP →"}
          </button>

          <button onClick={() => setStep("type")} className="text-[12px] font-bold mt-5" style={{ color: "var(--text-3)" }}>← Back</button>

          <p className="text-[9px] mt-4" style={{ color: "var(--text-3)" }}>
            By continuing you agree to our <span style={{ color: "var(--brand-soft)" }}>Terms of Service</span> and <span style={{ color: "var(--brand-soft)" }}>Privacy Policy</span>
          </p>
        </div>
      )}

      {/* ═══ STEP 3: OTP Verification ═══ */}
      {step === "otp" && (
        <div className="w-full max-w-sm anim-up text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
               style={{ background: otpChannel.includes('whatsapp') ? "rgba(37,211,102,0.12)" : "var(--brand-tint)" }}>
            <span className="text-[28px]">{otpChannel.includes('whatsapp') ? '💬' : '🔐'}</span>
          </div>
          <h1 className="text-[24px] font-black mb-1 tracking-tight"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Verify OTP
          </h1>
          <p className="text-[12px] mb-2" style={{ color: "var(--text-2)" }}>
            {otpChannel.includes('whatsapp') ? 'Check your WhatsApp 💚' : 'Code sent to'} +91 {phone}
          </p>

          {/* WhatsApp Badge */}
          {otpChannel.includes('whatsapp') && (
            <div className="rounded-full px-4 py-1.5 mb-4 inline-flex items-center gap-2"
                 style={{ background: '#25D366', color: '#fff' }}>
              <span className="text-[14px]">💬</span>
              <span className="text-[10px] font-bold">OTP sent via WhatsApp</span>
            </div>
          )}

          {/* Debug OTP */}
          {debugOtp && (
            <div className="rounded-[16px] p-4 mb-4" style={{ background: "var(--success-tint)", border: "1px solid rgba(52,211,153,0.3)" }}>
              <p className="text-[9px] font-bold mb-1" style={{ color: "var(--success)" }}>📩 Use this code to verify:</p>
              <p className="text-[28px] font-black tracking-[0.3em]"
                 style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>{debugOtp}</p>
              <p className="text-[8px] mt-1" style={{ color: "var(--text-3)" }}>SMS may take a moment to arrive</p>
            </div>
          )}

          {/* OTP Inputs — Tonal depth */}
          <div className="flex gap-3 justify-center mb-5">
            {otp.map((d, i) => (
              <input key={i} ref={el => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={d}
                     onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKey(i, e)}
                     className="text-center text-[22px] font-black outline-none rounded-[14px] transition-all"
                     style={{
                       width: 48, height: 56,
                       background: d ? "var(--brand-tint)" : "var(--bg-lowest)",
                       border: d ? "2px solid var(--brand)" : "2px solid rgba(90,65,54,0.15)",
                       color: "var(--text-1)",
                       fontFamily: "'JetBrains Mono', monospace",
                       boxShadow: d ? "0 0 12px rgba(255,107,0,0.15)" : "none",
                     }} />
            ))}
          </div>

          {error && <p className="text-[11px] font-bold mb-3" style={{ color: "var(--danger)" }}>{error}</p>}

          {/* Verify CTA */}
          <button onClick={() => handleVerify()} disabled={loading || otp.join("").length !== 6}
                  className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all"
                  style={{
                    background: otp.join("").length === 6 ? "var(--gradient-cta)" : "var(--bg-elevated)",
                    color: otp.join("").length === 6 ? "#FFDBCC" : "var(--text-3)",
                    boxShadow: otp.join("").length === 6 ? "var(--shadow-brand)" : "none",
                  }}>
            {loading ? "Verifying..." : "Verify & Login ✓"}
          </button>

          {/* Resend */}
          <div className="mt-4">{countdown > 0 ? (
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Resend in <span className="font-bold font-data" style={{ color: "var(--brand)" }}>{countdown}s</span></p>
          ) : <button onClick={handleSendOTP} className="text-[12px] font-bold" style={{ color: "var(--brand)" }}>🔄 Resend OTP</button>}</div>
        </div>
      )}

      {/* ═══ STEP 4: Success ═══ */}
      {step === "success" && (
        <div className="anim-scale text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 mx-auto anim-spring"
               style={{ background: "var(--success)", boxShadow: "0 12px 40px rgba(52,211,153,0.35)" }}>
            <span className="text-white text-[32px]">✓</span>
          </div>
          <h1 className="text-[24px] font-black tracking-tight"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Welcome! 🎉
          </h1>
          <p className="text-[12px] mt-2" style={{ color: "var(--text-2)" }}>Setting up your dashboard...</p>
          <div className="mt-5 w-5 h-5 border-2 rounded-full mx-auto animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
        </div>
      )}
    </div>
  );
}
