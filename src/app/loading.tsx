// ============================================================
// KAIZY SPLASH SCREEN — Branded Loading
// Background: #0A0A0A · Logo fade + tagline · Max 2s
// Reference: PhonePe splash, Rapido captain app
// ============================================================

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
         style={{ background: "#0A0A0A" }}>
      {/* Ambient glow */}
      <div className="absolute w-[300px] h-[300px] rounded-full opacity-20"
           style={{ background: "radial-gradient(circle, #FF6B00 0%, transparent 70%)", filter: "blur(80px)" }} />

      {/* Logo + Wordmark */}
      <div className="relative z-10 text-center"
           style={{ animation: "fade-in 0.4s ease both" }}>
        {/* Logo mark */}
        <div className="w-20 h-20 rounded-[22px] flex items-center justify-center mx-auto mb-5"
             style={{ background: "linear-gradient(135deg, #FF6B00 0%, #A04100 100%)", boxShadow: "0 8px 32px -4px rgba(255,107,0,0.4)" }}>
          <span className="text-[36px] font-black text-white" style={{ fontFamily: "'Epilogue', sans-serif" }}>K</span>
        </div>

        {/* Wordmark */}
        <h1 className="text-[32px] font-black tracking-tight text-white mb-1"
            style={{ fontFamily: "'Epilogue', sans-serif" }}>
          Kaizy
        </h1>

        {/* Tagline */}
        <p className="text-[12px] font-medium tracking-[0.15em] uppercase"
           style={{ color: "rgba(255,182,147,0.6)", animation: "fade-in 0.4s ease 0.3s both" }}>
          Skilled hands. At your door.
        </p>
      </div>

      {/* Loading bar */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-12 h-[3px] rounded-full overflow-hidden"
           style={{ background: "rgba(255,107,0,0.15)" }}>
        <div className="h-full rounded-full"
             style={{
               background: "#FF6B00",
               animation: "loading-bar 1.2s ease-in-out infinite",
             }} />
      </div>

      {/* Version */}
      <p className="absolute bottom-6 text-[9px] font-medium"
         style={{ color: "rgba(255,255,255,0.15)" }}>
        v1.0.0
      </p>
    </div>
  );
}

