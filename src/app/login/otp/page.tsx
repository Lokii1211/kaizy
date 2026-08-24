"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import { useAuth } from "@/stores/AuthStore";
import LoadingShell from "@/components/LoadingShell";

// ============================================================
// KAIZY LOGIN — Real WhatsApp OTP (Step 2: 6-Digit OTP Verification)
// 6 large input boxes (52×60px each, 8px gap) · Auto-focus & auto-submit
// ============================================================

function OtpVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useTheme();
  const { login } = useAuth();

  const phoneParam = searchParams.get("phone") || "";
  const roleParam = (searchParams.get("role") as "worker" | "hirer") || "hirer";

  const [phone, setPhone] = useState(phoneParam);
  const [userType, setUserType] = useState<"worker" | "hirer">(roleParam);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isSuccess, setIsSuccess] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!phoneParam) {
      try {
        const storedPhone = localStorage.getItem("kaizy_pending_phone");
        const storedRole = localStorage.getItem("kaizy_pending_role") as "worker" | "hirer";
        if (storedPhone) setPhone(storedPhone);
        if (storedRole) setUserType(storedRole);
      } catch {}
    }
  }, [phoneParam]);

  // Countdown timer: 30s
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first box on mount
  useEffect(() => {
    otpRefs.current[0]?.focus();
  }, []);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleOtpChange = (index: number, val: string) => {
    // Only accept numeric digit
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned && val !== "") return;

    const newOtp = [...otp];

    // Handle paste of full 6-digit OTP
    if (cleaned.length > 1) {
      const pastedDigits = cleaned.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedDigits[i] || "";
      }
      setOtp(newOtp);
      setError("");
      const full = newOtp.join("");
      if (full.length === 6) {
        verifyCode(full);
      }
      return;
    }

    newOtp[index] = cleaned.slice(-1);
    setOtp(newOtp);
    setError("");

    // Auto-advance to next box
    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when 6th digit entered
    if (cleaned && index === 5) {
      const fullCode = newOtp.join("");
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  const verifyCode = async (codeToVerify?: string) => {
    const fullOtp = codeToVerify || otp.join("");
    if (fullOtp.length !== 6) {
      setError("Enter complete 6-digit OTP");
      triggerShake();
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          otp: fullOtp,
          userType,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
        const resolvedRole = data.userType || userType;

        // Update local auth store
        if (data.user) {
          login({
            id: data.userId || data.user.id,
            name: data.user.name || "User",
            phone: data.user.phone || phone,
            user_type: resolvedRole,
          });
        }

        // Navigate to role home after brief green flash
        setTimeout(() => {
          if (data.isNewUser) {
            router.replace(resolvedRole === "worker" ? "/register/worker" : "/onboarding/hirer");
          } else {
            router.replace(resolvedRole === "worker" ? "/dashboard/worker" : "/dashboard/hirer");
          }
        }, 800);
      } else {
        triggerShake();
        if (data.reason === "expired") {
          setError("OTP expired. Request a new one");
          setOtp(["", "", "", "", "", ""]);
          otpRefs.current[0]?.focus();
        } else if (data.reason === "blocked") {
          setError("Too many attempts. Request new OTP");
        } else if (data.reason === "wrong") {
          const left = data.attemptsLeft !== undefined ? data.attemptsLeft : "";
          setError(`Wrong OTP.${left !== "" ? ` ${left} attempt${left === 1 ? "" : "s"} left` : ""}`);
        } else {
          setError(data.error || "Verification failed");
        }
      }
    } catch {
      setError("Network error. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError("");
    setOtp(["", "", "", "", "", ""]);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCountdown(30);
        otpRefs.current[0]?.focus();
      } else {
        setError(data.error || "Failed to resend OTP");
      }
    } catch {
      setError("Network error. Could not resend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-500"
      style={{
        background: isSuccess
          ? "#10B981"
          : isDark
          ? "var(--bg-lowest)"
          : "#FFFFFF",
      }}
    >
      {/* ── Top Hero Zone (40%) ── */}
      <div
        className="relative flex-shrink-0 overflow-hidden flex flex-col items-center justify-center px-6 pt-10 pb-8 transition-all duration-500"
        style={{
          minHeight: "38vh",
          background: isSuccess
            ? "#10B981"
            : "linear-gradient(160deg, #25D366, #128C7E)",
        }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />

        {isSuccess ? (
          <div className="text-center relative z-10 anim-spring">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/20 border-2 border-white/40">
              <span className="text-white text-4xl font-black">✓</span>
            </div>
            <h1 className="text-[26px] font-black text-white" style={{ fontFamily: "'Epilogue', sans-serif" }}>
              Verified! 🎉
            </h1>
            <p className="text-[12px] font-semibold text-white/80 mt-1">
              Loading your dashboard...
            </p>
          </div>
        ) : (
          <div className="text-center relative z-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-white/20">
              <span className="text-3xl">💬</span>
            </div>
            <h1 className="text-[24px] font-black text-white leading-tight" style={{ fontFamily: "'Epilogue', sans-serif" }}>
              WhatsApp Verification
            </h1>
            <p className="text-[12px] font-semibold mt-1 text-white/80">
              Enter 6-digit code sent to +91 {phone || "your number"}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold">
              <span>🔒 10-Minute Validity</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Form Card (60%) ── */}
      <div
        className="flex-1 flex flex-col rounded-t-[28px] px-6 pt-6 pb-8 -mt-5 relative z-10"
        style={{
          background: isDark ? "var(--bg-app)" : "#FFFFFF",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-[12px] font-bold"
            style={{ color: "var(--text-3)" }}
          >
            ← Change Number
          </Link>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(37,211,102,0.1)",
              color: isDark ? "#25D366" : "#128C7E",
            }}
          >
            WhatsApp OTP
          </span>
        </div>

        {/* 6 Large Input Boxes: 52×60px each, 8px gap */}
        <div className={`flex gap-2 justify-center mb-4 ${isShaking ? "shake" : ""}`}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => {
                otpRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="text-center text-[24px] font-black outline-none rounded-[16px] transition-all"
              style={{
                width: 52,
                height: 60,
                background: digit
                  ? isDark
                    ? "rgba(37,211,102,0.15)"
                    : "rgba(37,211,102,0.08)"
                  : "var(--bg-surface)",
                border: error
                  ? "2px solid var(--danger)"
                  : digit
                  ? "2px solid #25D366"
                  : "1.5px solid var(--border-2)",
                color: "var(--text-1)",
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: digit ? "0 0 14px rgba(37,211,102,0.2)" : "none",
              }}
            />
          ))}
        </div>

        {error && (
          <p className="text-[11px] font-bold text-center mb-4" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}

        {/* Verify CTA */}
        <button
          type="button"
          onClick={() => verifyCode()}
          disabled={loading || otp.join("").length !== 6 || isSuccess}
          className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all shadow-md mt-2"
          style={{
            background: otp.join("").length === 6 ? "var(--gradient-cta)" : "var(--bg-elevated)",
            color: otp.join("").length === 6 ? "#FFFFFF" : "var(--text-3)",
            boxShadow: otp.join("").length === 6 ? "var(--shadow-brand)" : "none",
          }}
        >
          {loading ? "Verifying OTP..." : isSuccess ? "Success! Redirecting..." : "Verify & Continue →"}
        </button>

        {/* Resend Countdown */}
        <div className="text-center mt-6">
          {countdown > 0 ? (
            <p className="text-[12px] font-medium" style={{ color: "var(--text-3)" }}>
              Resend in{" "}
              <span
                className="font-bold"
                style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}
              >
                0:{countdown < 10 ? `0${countdown}` : countdown}
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-[12px] font-bold active:scale-95 transition-transform"
              style={{ color: "var(--brand)" }}
            >
              🔄 Resend OTP via WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <OtpVerificationContent />
    </Suspense>
  );
}
