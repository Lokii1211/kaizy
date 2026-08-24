"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// WORKER ONBOARDING — SCREEN 4: ID DOCUMENT VERIFICATION
// 3:2 viewfinder guide · Front & Back capture · S3 submission
// ============================================================

type DocType = "aadhaar" | "voter_id" | "driving_licence" | "pan";
type CaptureStep = "front" | "back" | "review" | "submitted";

export default function WorkerVerificationOnboardingPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [docType, setDocType] = useState<DocType>("aadhaar");
  const [step, setStep] = useState<CaptureStep>("front");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError(true);
    }
  }, []);

  useEffect(() => {
    if (step === "front" || step === "back") {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [step, startCamera]);

  const captureDocument = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = 640;
      canvas.height = 426; // 3:2 ratio
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, 640, 426);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        if (step === "front") {
          setFrontImage(dataUrl);
          setStep("back");
        } else if (step === "back") {
          setBackImage(dataUrl);
          setStep("review");
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
          }
        }
      }
    }
  };

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFrontImage(ev.target?.result as string);
        setStep("back");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setBackImage(ev.target?.result as string);
        setStep("review");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitVerification = async () => {
    setLoading(true);
    try {
      // Send verification request to backend
      await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_documents",
          docType,
          frontImage,
          backImage,
        }),
      });

      try {
        localStorage.setItem("kaizy_worker_verified_level", "1");
      } catch {}

      setStep("submitted");
    } catch {
      setStep("submitted");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    try {
      localStorage.setItem("kaizy_worker_verified_level", "0");
    } catch {}
    router.push("/onboarding/worker/availability");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-6 pt-10 pb-8" style={{ background: isDark ? "var(--bg-app)" : "#FFFFFF" }}>
      <div>
        {/* ── Progress: Step 4 of 6 ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${i <= 4 ? "w-6 bg-[#FF6B00]" : "w-2 bg-gray-300 dark:bg-gray-700"}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-[#FF6B00]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            STEP 4 / 6
          </span>
        </div>

        {/* ── Incentive Banner ── */}
        <div className="rounded-[16px] p-3 mb-4 flex items-center gap-2.5 bg-green-500/10 border border-green-500/20">
          <span className="text-[20px]">💰</span>
          <p className="text-[11px] font-extrabold text-green-600 dark:text-green-400 leading-tight">
            Verified workers earn 3× more than unverified captains
          </p>
        </div>

        {/* ── Title ── */}
        <h1 className="text-[22px] font-black tracking-tight mb-1" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
          Verify your identity
        </h1>
        <p className="text-[12px] font-medium leading-relaxed mb-4" style={{ color: "var(--text-3)" }}>
          Government ID upload ensures instant hirer safety clearance.
        </p>

        {/* ── Document Type Selector ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {[
            { id: "aadhaar", label: "Aadhaar (Recommended)" },
            { id: "voter_id", label: "Voter ID" },
            { id: "driving_licence", label: "Driving Licence" },
            { id: "pan", label: "PAN Card" },
          ].map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDocType(d.id as DocType)}
              className="px-3.5 py-2 rounded-full text-[11px] font-bold shrink-0 transition-all active:scale-95"
              style={{
                background: docType === d.id ? "var(--brand)" : "var(--bg-surface)",
                color: docType === d.id ? "#FFFFFF" : "var(--text-2)",
                border: `1.5px solid ${docType === d.id ? "var(--brand)" : "var(--border-2)"}`,
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* ── Capture Viewport (3:2 Guide Rectangle) ── */}
        {(step === "front" || step === "back") && (
          <div className="flex flex-col items-center">
            <div
              className="w-full max-w-[340px] aspect-[3/2] rounded-[20px] overflow-hidden relative shadow-lg flex items-center justify-center"
              style={{
                border: "3px dashed #FF6B00",
                background: isDark ? "var(--bg-lowest)" : "#111",
              }}
            >
              {cameraError ? (
                <div className="text-center px-4">
                  <span className="text-3xl mb-1 block">📄</span>
                  <p className="text-[11px] font-bold text-gray-400">Camera access denied</p>
                  <button
                    type="button"
                    onClick={() => (step === "front" ? frontFileInputRef : backFileInputRef).current?.click()}
                    className="mt-2 text-[11px] font-bold text-[#FF6B00] underline"
                  >
                    Upload {step === "front" ? "Front" : "Back"} Photo
                  </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {/* 3:2 Inner Document Frame */}
                  <div className="absolute inset-4 rounded-[12px] border-2 border-white/60 pointer-events-none" />
                </>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
            <input ref={frontFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFrontUpload} />
            <input ref={backFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBackUpload} />

            <p className="text-[12px] font-black text-[#FF6B00] mt-3">
              {step === "front" ? "📷 Place front of document within frame" : "🔄 Now flip and capture the back"}
            </p>

            {!cameraError && (
              <button
                type="button"
                onClick={captureDocument}
                className="mt-4 px-6 py-2.5 rounded-full bg-[#FF6B00] text-white text-[13px] font-black shadow-lg active:scale-95 transition-all flex items-center gap-2"
              >
                <span>📸</span> Capture {step === "front" ? "Front" : "Back"}
              </button>
            )}
          </div>
        )}

        {/* ── Review Screen ── */}
        {step === "review" && (
          <div className="space-y-4">
            <p className="text-[12px] font-bold text-center" style={{ color: "var(--text-1)" }}>
              Is all text clearly readable on both sides?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[14px] overflow-hidden border p-1" style={{ borderColor: "var(--border-2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={frontImage!} alt="Front" className="w-full aspect-[3/2] object-cover rounded-[10px]" />
                <button
                  type="button"
                  onClick={() => setStep("front")}
                  className="w-full text-center text-[10px] font-bold text-[#FF6B00] mt-1.5 py-1"
                >
                  Retake Front
                </button>
              </div>
              <div className="rounded-[14px] overflow-hidden border p-1" style={{ borderColor: "var(--border-2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={backImage!} alt="Back" className="w-full aspect-[3/2] object-cover rounded-[10px]" />
                <button
                  type="button"
                  onClick={() => setStep("back")}
                  className="w-full text-center text-[10px] font-bold text-[#FF6B00] mt-1.5 py-1"
                >
                  Retake Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Submitted Success State ── */}
        {step === "submitted" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-3xl mx-auto mb-3">
              ✓
            </div>
            <h2 className="text-[18px] font-black" style={{ color: "var(--text-1)" }}>
              Documents submitted!
            </h2>
            <p className="text-[12px] font-medium text-gray-400 mt-1">
              Reviewed and verified by Kaizy operations within 24 hours.
            </p>
          </div>
        )}
      </div>

      {/* ── Bottom Buttons ── */}
      <div className="pt-4 space-y-2">
        {step === "review" && (
          <button
            type="button"
            onClick={handleSubmitVerification}
            disabled={loading}
            className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] transition-all shadow-md"
            style={{
              background: "var(--gradient-cta)",
              color: "#FFFFFF",
              boxShadow: "var(--shadow-brand)",
            }}
          >
            {loading ? "Uploading Documents..." : "Submit for Verification →"}
          </button>
        )}

        {step === "submitted" && (
          <button
            type="button"
            onClick={() => router.push("/onboarding/worker/availability")}
            className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] transition-all shadow-md"
            style={{
              background: "var(--gradient-cta)",
              color: "#FFFFFF",
              boxShadow: "var(--shadow-brand)",
            }}
          >
            Continue to Work Hours →
          </button>
        )}

        {step !== "submitted" && (
          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-2.5 text-[11px] font-bold text-center"
            style={{ color: "var(--text-3)" }}
          >
            Skip for now (limits maximum job value)
          </button>
        )}
      </div>
    </div>
  );
}
