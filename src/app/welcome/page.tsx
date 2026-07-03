"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

// ============================================================
// ONBOARDING v12.0 — Full-screen illustration layout
// Reference: Swiggy / Rapido / Urban Company onboarding
// 3-zone: Illustration (50%) · Content (30%) · Nav (20%)
// ============================================================

const slides = [
  {
    id: 0,
    headline: "Skilled Workers,",
    headlineLine2: "Near You",
    subtitle: "Book verified electricians, plumbers, mechanics & more — in minutes, not hours.",
    bg: "linear-gradient(160deg, #FF6B00 0%, #C84B00 100%)",
    accent: "#FFD4B8",
    stats: [
      { value: "50K+", label: "Jobs Done" },
      { value: "4.8★", label: "Rating" },
      { value: "15 min", label: "Avg ETA" },
    ],
    floating: [
      { emoji: "⚡", top: "12%", left: "8%", size: 42, delay: "0s" },
      { emoji: "🔧", top: "8%", right: "10%", size: 48, delay: "0.3s" },
      { emoji: "❄️", top: "55%", left: "5%", size: 36, delay: "0.6s" },
      { emoji: "🪚", top: "60%", right: "6%", size: 38, delay: "0.9s" },
      { emoji: "🎨", top: "30%", left: "3%", size: 32, delay: "1.2s" },
    ],
    centerEmoji: "👷",
    centerBg: "rgba(255,255,255,0.2)",
  },
  {
    id: 1,
    headline: "Track in",
    headlineLine2: "Real-Time",
    subtitle: "See your worker moving live on the map. Know exactly when they'll arrive.",
    bg: "linear-gradient(160deg, #3B82F6 0%, #1D4ED8 100%)",
    accent: "#BFDBFE",
    stats: [
      { value: "Live", label: "GPS Track" },
      { value: "2 min", label: "Update" },
      { value: "100+", label: "Cities" },
    ],
    floating: [
      { emoji: "📍", top: "10%", left: "10%", size: 44, delay: "0s" },
      { emoji: "🗺️", top: "8%", right: "8%", size: 46, delay: "0.4s" },
      { emoji: "📱", top: "58%", left: "6%", size: 36, delay: "0.7s" },
      { emoji: "⏱️", top: "55%", right: "7%", size: 40, delay: "1s" },
      { emoji: "🔔", top: "28%", right: "4%", size: 32, delay: "1.3s" },
    ],
    centerEmoji: "📍",
    centerBg: "rgba(255,255,255,0.2)",
  },
  {
    id: 2,
    headline: "Verified &",
    headlineLine2: "Safe",
    subtitle: "Every worker is government ID verified, face-matched, and skill-tested. Your safety first.",
    bg: "linear-gradient(160deg, #10B981 0%, #047857 100%)",
    accent: "#A7F3D0",
    stats: [
      { value: "100%", label: "ID Checked" },
      { value: "₹5L", label: "Insured" },
      { value: "5★", label: "Guaranteed" },
    ],
    floating: [
      { emoji: "🛡️", top: "10%", left: "8%", size: 46, delay: "0s" },
      { emoji: "✅", top: "8%", right: "9%", size: 44, delay: "0.35s" },
      { emoji: "🆔", top: "56%", left: "5%", size: 38, delay: "0.65s" },
      { emoji: "🔒", top: "60%", right: "6%", size: 36, delay: "0.95s" },
      { emoji: "⭐", top: "30%", left: "4%", size: 34, delay: "1.25s" },
    ],
    centerEmoji: "🛡️",
    centerBg: "rgba(255,255,255,0.2)",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const next = () => {
    if (current < slides.length - 1) setCurrent(c => c + 1);
    else finish();
  };
  const prev = () => { if (current > 0) setCurrent(c => c - 1); };
  const finish = () => {
    localStorage.setItem("kaizy_onboarded", "true");
    router.push("/login");
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const delta = touchStartX.current - touchEndX.current;
    if (delta > 50) next();
    else if (delta < -50) prev();
    touchStartX.current = 0; touchEndX.current = 0;
  };

  const slide = slides[current];

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden select-none"
      style={{ background: slide.bg, transition: "background 0.6s ease" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar: Skip */}
      <div className="px-5 pt-safe-top pt-6 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
            <span className="text-white font-black text-[11px]">K</span>
          </div>
          <span className="text-white font-black text-[13px]" style={{ fontFamily: "'Epilogue', sans-serif" }}>Kaizy</span>
        </div>
        <button
          onClick={finish}
          className="px-4 py-2 rounded-full text-[11px] font-bold transition-transform active:scale-95"
          style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)" }}
        >
          Skip
        </button>
      </div>

      {/* Illustration Zone — fills 52% of viewport height */}
      <div className="relative flex-shrink-0" style={{ height: "52vh", minHeight: 200, maxHeight: 420 }}>
        {/* Concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-full" style={{ width: "70%", paddingBottom: "70%", background: "rgba(255,255,255,0.05)", position: "relative" }}>
            <div className="absolute inset-[12%] rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="absolute inset-[15%] rounded-full" style={{ background: "rgba(255,255,255,0.09)" }} />
            </div>
          </div>
        </div>

        {/* Floating icons */}
        {slide.floating.map((f, i) => (
          <div
            key={`${slide.id}-${i}`}
            className="absolute rounded-2xl flex items-center justify-center anim-float"
            style={{
              width: f.size, height: f.size,
              top: f.top,
              left: ("left" in f) ? f.left : undefined,
              right: ("right" in f) ? (f as {right: string}).right : undefined,
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              animationDelay: f.delay,
              fontSize: f.size * 0.45,
            }}
          >
            {f.emoji}
          </div>
        ))}

        {/* Center hero icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            key={`center-${slide.id}`}
            className="rounded-3xl flex items-center justify-center anim-spring"
            style={{ width: 88, height: 88, background: slide.centerBg, backdropFilter: "blur(20px)", border: "1.5px solid rgba(255,255,255,0.25)" }}
          >
            <span style={{ fontSize: 44 }}>{slide.centerEmoji}</span>
          </div>
        </div>
      </div>

      {/* Content Zone — grows to fill space */}
      <div className="flex-1 flex flex-col justify-between px-6 pt-4 pb-8">
        {/* Text block */}
        <div>
          <h1
            key={`h-${slide.id}`}
            className="text-[36px] font-black leading-[1.08] mb-3 anim-up"
            style={{ color: "#fff", fontFamily: "'Epilogue', sans-serif", letterSpacing: "-0.02em" }}
          >
            {slide.headline}<br />{slide.headlineLine2}
          </h1>
          <p
            key={`p-${slide.id}`}
            className="text-[14px] font-medium leading-relaxed anim-up"
            style={{ color: slide.accent, animationDelay: "0.08s", maxWidth: 300 }}
          >
            {slide.subtitle}
          </p>

          {/* Stats row */}
          <div className="flex gap-4 mt-5">
            {slide.stats.map((s, i) => (
              <div key={i} className="flex flex-col">
                <span
                  className="text-[20px] font-black leading-none"
                  style={{ color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {s.value}
                </span>
                <span className="text-[10px] font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom nav: dots + CTA */}
        <div>
          {/* Dots */}
          <div className="flex items-center gap-2 mb-4">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="rounded-full transition-all active:scale-90"
                style={{
                  width: i === current ? 28 : 8,
                  height: 8,
                  background: i === current ? "#fff" : "rgba(255,255,255,0.3)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={next}
            className="w-full rounded-[18px] py-[17px] text-[15px] font-black active:scale-[0.97] transition-transform"
            style={{
              background: "rgba(255,255,255,0.18)",
              color: "#fff",
              backdropFilter: "blur(12px)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              letterSpacing: "-0.01em",
            }}
          >
            {current < slides.length - 1 ? "Continue →" : "Get Started 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}
