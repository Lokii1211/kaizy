"use client";
import { useState, useRef } from "react";
import Link from "next/link";

// ============================================================
// WORKER VERIFICATION — Selfie + Aadhaar Upload
// Like Rapido Captain Onboarding / Urban Company Pro Verification
// ============================================================

type Step = "selfie" | "aadhaar_front" | "aadhaar_back" | "review" | "done";

const stepLabels: Record<Step, string> = {
  selfie: "Take Selfie",
  aadhaar_front: "Aadhaar Front",
  aadhaar_back: "Aadhaar Back",
  review: "Review",
  done: "Verified!",
};

export default function VerifyPage() {
  const [step, setStep] = useState<Step>("selfie");
  const [selfieImg, setSelfieImg] = useState<string | null>(null);
  const [aadhaarFront, setAadhaarFront] = useState<string | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera
  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: step === "selfie" ? "user" : "environment", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setError("Camera access denied. Please allow camera permission.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror for selfie
    if (step === "selfie") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (step === "selfie") setSelfieImg(dataUrl);
    else if (step === "aadhaar_front") setAadhaarFront(dataUrl);
    else if (step === "aadhaar_back") setAadhaarBack(dataUrl);

    stopCamera();
  };

  // Handle file upload (alternative to camera)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (step === "selfie") setSelfieImg(result);
      else if (step === "aadhaar_front") setAadhaarFront(result);
      else if (step === "aadhaar_back") setAadhaarBack(result);
    };
    reader.readAsDataURL(file);
  };

  // Submit for verification
  const handleSubmit = async () => {
    setUploading(true);
    setError("");
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfie: selfieImg,
          aadhaarFront: aadhaarFront,
          aadhaarBack: aadhaarBack,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStep("done");
      } else {
        setError(json.error || "Upload failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setUploading(false);
    }
  };

  // Go to next step
  const nextStep = () => {
    if (step === "selfie" && selfieImg) setStep("aadhaar_front");
    else if (step === "aadhaar_front" && aadhaarFront) setStep("aadhaar_back");
    else if (step === "aadhaar_back" && aadhaarBack) setStep("review");
  };

  // Progress
  const stepIndex = ["selfie", "aadhaar_front", "aadhaar_back", "review", "done"].indexOf(step);
  const progress = ((stepIndex + 1) / 5) * 100;

  const currentImage = step === "selfie" ? selfieImg : step === "aadhaar_front" ? aadhaarFront : aadhaarBack;

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>Identity Verification</h1>
        </div>

        {/* Progress bar */}
        <div className="rounded-full overflow-hidden mb-2" style={{ height: 4, background: "var(--bg-elevated)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--brand)" }} />
        </div>
        <p className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>Step {stepIndex + 1}/5 · {stepLabels[step]}</p>
      </div>

      {/* ═══ DONE STATE ═══ */}
      {step === "done" && (
        <div className="px-4 text-center py-12">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
               style={{ background: "var(--success-tint)" }}>
            <span className="text-[40px]">✅</span>
          </div>
          <h2 className="text-[20px] font-black mb-2" style={{ color: "var(--text-1)" }}>Verification Submitted!</h2>
          <p className="text-[12px] mb-6" style={{ color: "var(--text-3)" }}>
            Your documents are being reviewed. This usually takes 2–4 hours.
            You&apos;ll get a WhatsApp notification once verified.
          </p>
          <Link href="/dashboard/worker"
                className="inline-block rounded-xl px-8 py-3.5 text-[13px] font-bold text-white active:scale-95"
                style={{ background: "var(--brand)" }}>
            Back to Dashboard →
          </Link>
        </div>
      )}

      {/* ═══ REVIEW STATE ═══ */}
      {step === "review" && (
        <div className="px-4">
          <h2 className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>Review Your Documents</h2>
          <div className="space-y-3">
            {[
              { label: "Selfie", img: selfieImg, icon: "🤳" },
              { label: "Aadhaar Front", img: aadhaarFront, icon: "🪪" },
              { label: "Aadhaar Back", img: aadhaarBack, icon: "🔄" },
            ].map(doc => (
              <div key={doc.label} className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
                <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid var(--border-1)" }}>
                  <span className="text-[14px]">{doc.icon}</span>
                  <span className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{doc.label}</span>
                  <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--success-tint)", color: "var(--success)" }}>✓ Captured</span>
                </div>
                {doc.img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doc.img} alt={doc.label} className="w-full" style={{ maxHeight: 200, objectFit: "cover" }} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-[11px] font-bold mt-3 text-center" style={{ color: "var(--danger)" }}>{error}</p>
          )}

          <button onClick={handleSubmit} disabled={uploading}
                  className="w-full mt-4 rounded-xl py-3.5 text-[14px] font-bold text-white active:scale-95 transition-transform"
                  style={{ background: "var(--brand)", opacity: uploading ? 0.6 : 1 }}>
            {uploading ? "⏳ Uploading..." : "🚀 Submit for Verification"}
          </button>

          <button onClick={() => { setStep("selfie"); setSelfieImg(null); setAadhaarFront(null); setAadhaarBack(null); }}
                  className="w-full mt-2 rounded-xl py-3 text-[12px] font-bold active:scale-95"
                  style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
            🔄 Retake All
          </button>
        </div>
      )}

      {/* ═══ CAPTURE STATE ═══ */}
      {(step === "selfie" || step === "aadhaar_front" || step === "aadhaar_back") && (
        <div className="px-4">
          {/* Instructions */}
          <div className="rounded-xl p-3 mb-4" style={{ background: "var(--brand-tint)", border: "1px solid rgba(255,107,0,0.15)" }}>
            <p className="text-[12px] font-bold" style={{ color: "var(--brand)" }}>
              {step === "selfie" ? "🤳 Take a Clear Selfie" :
               step === "aadhaar_front" ? "🪪 Aadhaar Card — Front Side" :
               "🔄 Aadhaar Card — Back Side"}
            </p>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-2)" }}>
              {step === "selfie"
                ? "Good lighting, face clearly visible, no sunglasses or mask"
                : "Place your Aadhaar on a flat surface, all 4 corners visible"
              }
            </p>
          </div>

          {/* Camera area */}
          <div className="rounded-2xl overflow-hidden mb-4 relative" style={{
            background: "#000",
            aspectRatio: step === "selfie" ? "3/4" : "16/10",
            border: "2px solid var(--border-1)",
          }}>
            {cameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted
                     className="w-full h-full object-cover"
                     style={{ transform: step === "selfie" ? "scaleX(-1)" : "none" }} />
            ) : currentImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentImage} alt="Captured" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <span className="text-[48px] mb-3">{step === "selfie" ? "🤳" : "🪪"}</span>
                <p className="text-[12px] font-bold text-white opacity-60">Tap below to start camera</p>
              </div>
            )}

            {/* Selfie guide overlay */}
            {cameraActive && step === "selfie" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-dashed border-white opacity-40 rounded-full" style={{ width: 200, height: 260 }} />
              </div>
            )}

            {/* Aadhaar guide overlay */}
            {cameraActive && step !== "selfie" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-dashed border-white opacity-40 rounded-lg" style={{ width: "85%", height: "75%" }} />
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {error && (
            <p className="text-[11px] font-bold mb-3 text-center" style={{ color: "var(--danger)" }}>{error}</p>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {!cameraActive && !currentImage && (
              <>
                <button onClick={startCamera}
                        className="w-full rounded-xl py-3.5 text-[14px] font-bold text-white active:scale-95"
                        style={{ background: "var(--brand)" }}>
                  📷 Open Camera
                </button>
                <label className="block w-full rounded-xl py-3 text-[12px] font-bold text-center active:scale-95 cursor-pointer"
                       style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
                  📁 Upload from Gallery
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </>
            )}

            {cameraActive && (
              <div className="flex gap-3">
                <button onClick={stopCamera}
                        className="flex-1 rounded-xl py-3 text-[12px] font-bold active:scale-95"
                        style={{ background: "var(--bg-card)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
                  ✕ Cancel
                </button>
                <button onClick={capturePhoto}
                        className="flex-[2] rounded-xl py-3.5 text-[14px] font-bold text-white active:scale-95"
                        style={{ background: "var(--brand)" }}>
                  📸 Capture
                </button>
              </div>
            )}

            {!cameraActive && currentImage && (
              <div className="flex gap-2">
                <button onClick={() => {
                  if (step === "selfie") setSelfieImg(null);
                  else if (step === "aadhaar_front") setAadhaarFront(null);
                  else setAadhaarBack(null);
                }}
                        className="flex-1 rounded-xl py-3 text-[12px] font-bold active:scale-95"
                        style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
                  🔄 Retake
                </button>
                <button onClick={nextStep}
                        className="flex-[2] rounded-xl py-3.5 text-[14px] font-bold text-white active:scale-95"
                        style={{ background: "var(--success)" }}>
                  ✓ Looks Good — Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
