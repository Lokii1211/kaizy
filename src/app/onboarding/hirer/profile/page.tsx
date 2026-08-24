"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { useAuth } from "@/stores/AuthStore";
import UserAvatar from "@/components/UserAvatar";

// ============================================================
// HIRER ONBOARDING — SCREEN 1: PROFILE
// Dot 1 of 3 · 80px dashed avatar upload · Unicode name input
// ============================================================

export default function HirerProfileOnboardingPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { user, login } = useAuth();

  const [name, setName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const storedName = localStorage.getItem("kaizy_user_name");
      if (storedName) setName(storedName);
      else if (user?.name && user.name !== "User") setName(user.name);
    } catch {}
  }, [user]);

  const isValidName = name.trim().length >= 2;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Photo size must be under 5MB");
        return;
      }
      setError("");
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
        setShowPhotoModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = async () => {
    if (!isValidName) {
      setError("Please enter your name (minimum 2 characters)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const trimmedName = name.trim();

      // Save to localStorage for instant UI persistence
      try {
        localStorage.setItem("kaizy_user_name", trimmedName);
        if (photoPreview) localStorage.setItem("kaizy_user_photo", photoPreview);
      } catch {}

      // Update backend user record
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          profile_photo: photoPreview || null,
        }),
      });

      if (user) {
        login({
          ...user,
          name: trimmedName,
        });
      }

      // Proceed to Screen 2: Location
      router.push("/onboarding/hirer/location");
    } catch {
      // Continue anyway to not block user flow
      router.push("/onboarding/hirer/location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between px-6 pt-10 pb-8"
      style={{ background: isDark ? "var(--bg-app)" : "#FFFFFF" }}
    >
      <div>
        {/* ── Progress: Dot 1 of 3 ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-2.5 rounded-full transition-all"
              style={{ background: "var(--brand)" }}
            />
            <div
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{ background: isDark ? "var(--bg-elevated)" : "#E5E7EB" }}
            />
            <div
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{ background: isDark ? "var(--bg-elevated)" : "#E5E7EB" }}
            />
          </div>
          <span
            className="text-[11px] font-bold"
            style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            STEP 1 / 3
          </span>
        </div>

        {/* ── Headline ── */}
        <h1
          className="text-[24px] font-black tracking-tight mb-2"
          style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
        >
          Create Your Profile
        </h1>
        <p className="text-[13px] font-medium leading-relaxed mb-8" style={{ color: "var(--text-3)" }}>
          Let workers and captains know who they are assisting.
        </p>

        {/* ── Circular 80px Profile Photo Upload Area ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              className="w-20 h-20 rounded-full flex flex-col items-center justify-center overflow-hidden active:scale-95 transition-all relative"
              style={{
                border: "2px dashed #FF6B00",
                background: photoPreview ? "transparent" : isDark ? "rgba(255,107,0,0.08)" : "rgba(255,107,0,0.04)",
              }}
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : name.trim() ? (
                <UserAvatar name={name} size={80} />
              ) : (
                <>
                  <span className="text-[22px]">📷</span>
                  <span className="text-[9px] font-bold text-[#FF6B00] mt-0.5">Add</span>
                </>
              )}
            </button>

            {photoPreview && (
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-[10px] font-bold shadow-md"
              >
                ✎
              </button>
            )}
          </div>

          <p className="text-[11px] font-bold text-[#FF6B00] mt-2.5">
            {photoPreview ? "Tap to retake photo" : "Upload Profile Photo (Optional)"}
          </p>
        </div>

        {/* Hidden inputs for Camera and Gallery */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* ── Name Input ── */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest block" style={{ color: "var(--text-2)" }}>
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="How should workers address you?"
            className="w-full rounded-[16px] px-4 py-4 text-[15px] font-bold outline-none transition-all"
            style={{
              background: isDark ? "var(--bg-lowest)" : "#F8F8F8",
              color: "var(--text-1)",
              border: `1.5px solid ${isValidName ? "var(--brand)" : "var(--border-2)"}`,
            }}
            autoFocus
          />
          <p className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>
            Accepts Tamil, Devanagari, English, or any local script.
          </p>
        </div>

        {error && (
          <p className="text-[11px] font-bold mt-3" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </div>

      {/* ── Continue Button ── */}
      <div className="pt-6">
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading || !isValidName}
          className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all shadow-md"
          style={{
            background: isValidName ? "var(--gradient-cta)" : "var(--bg-elevated)",
            color: isValidName ? "#FFFFFF" : "var(--text-3)",
            boxShadow: isValidName ? "var(--shadow-brand)" : "none",
          }}
        >
          {loading ? "Saving..." : "Continue to Location →"}
        </button>
      </div>

      {/* ── Photo Choice Modal Sheet ── */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm anim-fade">
          <div
            className="w-full max-w-md rounded-t-[28px] p-6 anim-up"
            style={{ background: isDark ? "var(--bg-app)" : "#FFFFFF" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-black" style={{ color: "var(--text-1)" }}>
                Upload Profile Photo
              </h3>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px]"
                style={{ background: "var(--bg-surface)", color: "var(--text-3)" }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full rounded-[16px] p-4 flex items-center gap-3 active:scale-95 transition-all text-left"
                style={{ background: "var(--bg-surface)" }}
              >
                <span className="text-[24px]">📷</span>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>Take a Selfie / Camera</p>
                  <p className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>Use your device camera</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full rounded-[16px] p-4 flex items-center gap-3 active:scale-95 transition-all text-left"
                style={{ background: "var(--bg-surface)" }}
              >
                <span className="text-[24px]">🖼️</span>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>Choose from Gallery</p>
                  <p className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>Select from your photos</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
