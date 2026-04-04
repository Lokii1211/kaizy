"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ============================================================
// ONBOARDING SLIDES v11.0 — First-time user welcome
// 3 slides · Skip option · Max 15 seconds to complete
// Reference: Rapido first open · Swiggy onboarding
// ============================================================

const slides = [
  {
    icon: "🔧",
    title: "Skilled Workers Near You",
    subtitle: "Book verified electricians, plumbers, mechanics & more — in minutes, not hours.",
    bg: "linear-gradient(135deg, #FF6B00 0%, #A04100 100%)",
    accent: "#FFD4B8",
  },
  {
    icon: "📍",
    title: "Track in Real-Time",
    subtitle: "See your worker moving live on the map. Know exactly when they'll arrive.",
    bg: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
    accent: "#BFDBFE",
  },
  {
    icon: "🛡️",
    title: "Verified & Safe",
    subtitle: "Every worker is government ID verified, face-matched, and skill-tested. Your safety is our priority.",
    bg: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    accent: "#A7F3D0",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current < slides.length - 1) {
      setCurrent(c => c + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    localStorage.setItem("kaizy_onboarded", "true");
    router.push("/login");
  };

  const slide = slides[current];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
         style={{ background: slide.bg, transition: "background 0.5s ease" }}>

      {/* Skip button */}
      <div className="px-5 pt-5 flex justify-end">
        <button onClick={finish}
                className="px-4 py-2 rounded-full text-[11px] font-bold active:scale-95 transition-transform"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)" }}>
          Skip →
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Icon */}
        <div className="w-28 h-28 rounded-full flex items-center justify-center mb-8 anim-spring"
             key={current}
             style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(16px)" }}>
          <span className="text-[56px]">{slide.icon}</span>
        </div>

        {/* Text */}
        <h1 className="text-[26px] font-black text-white tracking-tight leading-tight mb-3 anim-up"
            key={`title-${current}`}
            style={{ fontFamily: "'Epilogue', sans-serif" }}>
          {slide.title}
        </h1>
        <p className="text-[14px] font-medium leading-relaxed max-w-xs anim-up"
           key={`sub-${current}`}
           style={{ color: slide.accent, animationDelay: "0.1s" }}>
          {slide.subtitle}
        </p>
      </div>

      {/* Bottom controls */}
      <div className="px-8 pb-10">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <div key={i} className="rounded-full transition-all"
                 style={{
                   width: i === current ? 24 : 8,
                   height: 8,
                   background: i === current ? "#fff" : "rgba(255,255,255,0.3)",
                 }} />
          ))}
        </div>

        {/* CTA button */}
        <button onClick={next}
                className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] transition-transform"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
          {current < slides.length - 1 ? "Next" : "Get Started 🚀"}
        </button>
      </div>
    </div>
  );
}
