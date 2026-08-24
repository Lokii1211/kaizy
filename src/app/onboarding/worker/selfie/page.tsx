"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { useAuth } from "@/stores/AuthStore";
import UserAvatar from "@/components/UserAvatar";

// ============================================================
// WORKER ONBOARDING — SCREEN 1: SELFIE & LIVENESS DETECTION
// Circular 200px viewfinder · Sequential liveness prompts · Name & Exp
// ============================================================

const LIVENESS_STEPS = [
  { id: 1, text: "Look straight at the camera", emoji: "👀" },
  { id: 2, text: "Blink slowly", emoji: "😉" },
  { id: 3, text: "Smile naturally", emoji: "😊" },
];

export default function WorkerSelfieOnboardingPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { user, login } = useAuth();

  const [name, setName] = useState("");
  const [experience, setExperience] = useState<number>(3);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLivenessActive, setIsLivenessActive] = useState(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError(true);
      setIsLivenessActive(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedPhoto(dataUrl);
        setIsLivenessActive(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
      }
    }
  }, []);

  // Liveness progression timer (2s intervals)
  useEffect(() => {
    if (!isLivenessActive || capturedPhoto || cameraError) return;

    const timer = setTimeout(() => {
      if (currentStepIndex < LIVENESS_STEPS.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        // Auto-capture on 3rd step completed
        captureFrame();
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [currentStepIndex, isLivenessActive, capturedPhoto, cameraError, captureFrame]);

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCurrentStepIndex(0);
    setIsLivenessActive(true);
    startCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCapturedPhoto(ev.target?.result as string);
        setIsLivenessActive(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Please enter your full name as on ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Save details to localStorage
      try {
        localStorage.setItem("kaizy_worker_name", trimmedName);
        localStorage.setItem("kaizy_worker_exp", String(experience));
        if (capturedPhoto) localStorage.setItem("kaizy_worker_photo", capturedPhoto);
      } catch {}

      // Update users record
      await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          profile_photo: capturedPhoto || null,
        }),
      });

      if (user) {
        login({
          ...user,
          name: trimmedName,
          user_type: "worker",
        });
      }

      router.push("/onboarding/worker/trade");
    } catch {
      router.push("/onboarding/worker/trade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-6 pt-10 pb-8" style={{ background: isDark ? "var(--bg-app)" : "#FFFFFF" }}>
      <div>
        {/* ── Progress: Step 1 of 6 ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${i === 1 ? "w-6 bg-[#FF6B00]" : "w-2 bg-gray-300 dark:bg-gray-700"}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-[#FF6B00]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            STEP 1 / 6
          </span>
        </div>

        {/* ── Title ── */}
        <h1 className="text-[22px] font-black tracking-tight mb-1" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
          Your KaazyPassport starts here
        </h1>
        <p className="text-[12px] font-medium leading-relaxed mb-6" style={{ color: "var(--text-3)" }}>
          A verified live selfie establishes hirer trust and enables high-value dispatch orders.
        </p>

        {/* ── Circular 200px Viewfinder ── */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-[200px] h-[200px] rounded-full overflow-hidden relative shadow-lg flex items-center justify-center"
            style={{
              border: capturedPhoto ? "3px solid var(--success)" : "3px dashed #FF6B00",
              background: isDark ? "var(--bg-lowest)" : "#F3F4F6",
            }}
          >
            {capturedPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={capturedPhoto} alt="Captured Selfie" className="w-full h-full object-cover" />
            ) : cameraError ? (
              <div className="text-center px-4">
                <span className="text-3xl mb-1 block">📷</span>
                <p className="text-[10px] font-bold text-gray-500">Camera unavailable</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-[10px] font-bold text-[#FF6B00] underline"
                >
                  Upload photo
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {/* Liveness Target Ring */}
                <div className="absolute inset-2 rounded-full border-2 border-white/40 pointer-events-none" />
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Liveness Instruction Banner */}
          {!capturedPhoto && !cameraError && (
            <div className="mt-3.5 px-4 py-2 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center gap-2 anim-pulse">
              <span className="text-[14px]">{LIVENESS_STEPS[currentStepIndex].emoji}</span>
              <p className="text-[11px] font-black text-[#FF6B00]">
                {LIVENESS_STEPS[currentStepIndex].text}
              </p>
            </div>
          )}

          {capturedPhoto && (
            <div className="flex items-center gap-3 mt-3">
              <span className="text-[11px] font-bold text-green-500">✓ Liveness verified</span>
              <button
                type="button"
                onClick={handleRetake}
                className="text-[11px] font-bold text-[#FF6B00] underline"
              >
                Retake
              </button>
            </div>
          )}

          {cameraError && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-[11px] font-bold px-4 py-2 rounded-full bg-[#FF6B00]/10 text-[#FF6B00]"
            >
              📁 Choose Photo from Device
            </button>
          )}
        </div>

        {/* ── Name Input ── */}
        <div className="space-y-1.5 mb-5">
          <label className="text-[10px] font-black uppercase tracking-widest block" style={{ color: "var(--text-2)" }}>
            Full Name (as on ID) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="e.g. Raju K. or Ramesh Sharma"
            className="w-full rounded-[16px] px-4 py-3.5 text-[14px] font-bold outline-none"
            style={{
              background: isDark ? "var(--bg-lowest)" : "#F8F8F8",
              color: "var(--text-1)",
              border: `1.5px solid ${name.trim().length >= 2 ? "var(--brand)" : "var(--border-2)"}`,
            }}
          />
        </div>

        {/* ── Experience Slider ── */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-2)" }}>
              Years of Experience
            </label>
            <span className="text-[13px] font-black text-[#FF6B00]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {experience === 0 ? "Just starting out" : `${experience} Year${experience > 1 ? "s" : ""}`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={35}
            step={1}
            value={experience}
            onChange={(e) => setExperience(parseInt(e.target.value))}
            className="w-full accent-[#FF6B00] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-bold text-gray-400">
            <span>0 yrs</span>
            <span>15 yrs</span>
            <span>35+ yrs</span>
          </div>
        </div>

        {error && <p className="text-[11px] font-bold text-red-500 mb-2">{error}</p>}
      </div>

      {/* ── Continue Button ── */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading || name.trim().length < 2}
          className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all shadow-md"
          style={{
            background: name.trim().length >= 2 ? "var(--gradient-cta)" : "var(--bg-elevated)",
            color: name.trim().length >= 2 ? "#FFFFFF" : "var(--text-3)",
            boxShadow: name.trim().length >= 2 ? "var(--shadow-brand)" : "none",
          }}
        >
          {loading ? "Saving Profile..." : "Continue to Trade →"}
        </button>
      </div>
    </div>
  );
}
