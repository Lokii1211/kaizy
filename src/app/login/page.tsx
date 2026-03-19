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
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (countdown > 0) { const t = setTimeout(() => setCountdown(countdown - 1), 1000); return () => clearTimeout(t); } }, [countdown]);
  useEffect(() => { if (step === "otp") otpRefs.current[0]?.focus(); }, [step]);

  const handleSendOTP = async () => {
    setError(""); if (phone.length !== 10) { setError("Enter a valid 10-digit number"); return; }
    setLoading(true);
    try {
      const r = await authApi.sendOtp(phone);
      if (r.success) { setStep("otp"); setCountdown(30); if (r.data?.debug_otp) setDebugOtp(r.data.debug_otp); }
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
      {step === "type" && (
        <div className="w-full max-w-sm animate-scale-in text-center">
          <p className="text-[56px] mb-4">👋</p>
          <h1 className="text-[22px] font-black mb-2" style={{ color: "var(--text-1)", fontFamily: "var(--font-syne)" }}>Welcome to Kaizy</h1>
          <p className="text-[12px] mb-6" style={{ color: "var(--text-3)" }}>Looking for work, or need a skilled worker?</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { type: "worker" as const, icon: "🔧", label: "I am a Worker", sub: "Find jobs near me" },
              { type: "hirer" as const, icon: "🏠", label: "I need Help", sub: "Hire a worker" },
            ].map(t => (
              <button key={t.type} onClick={() => setUserType(t.type)}
                      className="flex flex-col items-center gap-2 rounded-[14px] py-5 px-3 active:scale-95 transition-all"
                      style={{ background: userType === t.type ? "var(--brand-tint)" : "var(--bg-card)",
                               border: userType === t.type ? "2px solid var(--brand)" : "2px solid var(--border-1)" }}>
                <span className="text-[32px]">{t.icon}</span>
                <span className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>{t.label}</span>
                <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{t.sub}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setStep("phone")} className="w-full rounded-[14px] py-4 text-[14px] font-black text-white active:scale-[0.98]"
                  style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>Get Started →</button>
        </div>
      )}

      {step === "phone" && (
        <div className="w-full max-w-sm animate-slide-up text-center">
          <p className="text-[48px] mb-3">📱</p>
          <h1 className="text-[22px] font-black mb-2" style={{ color: "var(--text-1)" }}>Enter Your Number</h1>
          <p className="text-[12px] mb-6" style={{ color: "var(--text-3)" }}>We&apos;ll send a 6-digit OTP</p>
          <div className="flex rounded-[14px] overflow-hidden mb-4" style={{ background: isDark ? "rgba(255,255,255,0.95)" : "#fff", border: isDark ? "none" : "1px solid var(--border-2)" }}>
            <span className="flex items-center px-4 text-[14px] font-bold" style={{ background: "rgba(0,0,0,0.05)", color: "#333", borderRight: "1px solid #eee" }}>🇮🇳 +91</span>
            <input type="tel" value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g,"").slice(0,10)); setError(""); }}
                   className="flex-1 py-[14px] px-4 text-[18px] font-bold tracking-[0.2em] outline-none bg-transparent" style={{ color: "#111" }}
                   placeholder="98765 43210" inputMode="numeric" autoFocus />
          </div>
          {error && <p className="text-[12px] font-bold mb-3" style={{ color: "var(--danger)" }}>{error}</p>}
          <button onClick={handleSendOTP} disabled={loading || phone.length !== 10}
                  className="w-full rounded-[14px] py-4 text-[14px] font-black text-white active:scale-[0.98] disabled:opacity-40"
                  style={{ background: phone.length === 10 ? "var(--brand)" : "var(--bg-elevated)" }}>
            {loading ? "Sending..." : "Get OTP →"}</button>
          <button onClick={() => setStep("type")} className="text-[12px] font-bold mt-4" style={{ color: "var(--text-3)" }}>← Back</button>
        </div>
      )}

      {step === "otp" && (
        <div className="w-full max-w-sm animate-slide-up text-center">
          <p className="text-[48px] mb-3">🔐</p>
          <h1 className="text-[22px] font-black mb-1" style={{ color: "var(--text-1)" }}>Verify OTP</h1>
          <p className="text-[12px] mb-6" style={{ color: "var(--text-3)" }}>Code sent to +91 {phone}</p>
          {debugOtp && (
            <div className="rounded-[14px] p-3 mb-4 text-center" style={{ background: "var(--info-tint)", border: "1px solid var(--info)" }}>
              <p className="text-[10px] font-bold" style={{ color: "var(--info)" }}>Your OTP:</p>
              <p className="text-[24px] font-black" style={{ color: "var(--info)", fontFamily: "'JetBrains Mono', monospace" }}>{debugOtp}</p>
            </div>
          )}
          <div className="flex gap-3 justify-center mb-4">
            {otp.map((d, i) => (
              <input key={i} ref={el => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={d}
                     onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKey(i, e)}
                     className="text-center text-[22px] font-black outline-none rounded-[14px]"
                     style={{ width: 48, height: 56, background: d ? "var(--brand-tint)" : "var(--bg-card)",
                              border: d ? "2px solid var(--brand)" : "2px solid var(--border-1)", color: "var(--text-1)",
                              fontFamily: "'JetBrains Mono', monospace" }} />
            ))}
          </div>
          {error && <p className="text-[12px] font-bold mb-3" style={{ color: "var(--danger)" }}>{error}</p>}
          <button onClick={() => handleVerify()} disabled={loading || otp.join("").length !== 6}
                  className="w-full rounded-[14px] py-4 text-[14px] font-black text-white active:scale-[0.98] disabled:opacity-40"
                  style={{ background: otp.join("").length === 6 ? "var(--brand)" : "var(--bg-elevated)" }}>
            {loading ? "Verifying..." : "Verify & Login ✓"}</button>
          <div className="mt-4">{countdown > 0 ? (
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Resend in <span className="font-bold" style={{ color: "var(--brand)" }}>{countdown}s</span></p>
          ) : <button onClick={handleSendOTP} className="text-[12px] font-bold" style={{ color: "var(--brand)" }}>🔄 Resend OTP</button>}</div>
        </div>
      )}

      {step === "success" && (
        <div className="animate-scale-in text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 mx-auto animate-bounce-in"
               style={{ background: "var(--success)", boxShadow: "0 8px 32px rgba(0,208,132,0.3)" }}>
            <span className="text-white text-[32px]">✓</span>
          </div>
          <h1 className="text-[22px] font-black" style={{ color: "var(--text-1)" }}>Welcome! 🎉</h1>
          <p className="text-[12px] mt-2" style={{ color: "var(--text-3)" }}>Setting up your dashboard...</p>
          <div className="mt-4 w-5 h-5 border-2 rounded-full mx-auto animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
        </div>
      )}
    </div>
  );
}
