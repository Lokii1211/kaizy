"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

const stages = ["Booked","En Route","Arrived","Working","Done"];

export default function TrackingPage() {
  const { isDark } = useTheme();
  const [stage, setStage] = useState(1);
  const [eta, setEta] = useState(8);
  const [showOtp] = useState(true);

  useEffect(() => {
    const t = setInterval(() => { setEta(p => p > 0 ? p - 1 : 0); }, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      {/* Map */}
      <div className="flex-1 relative overflow-hidden" style={{ background: "var(--map-bg)", minHeight: 260 }}>
        <div className="map-road-h" style={{ top: "50%", opacity: 0.5 }} />
        <div className="map-road-v" style={{ left: "50%", opacity: 0.4 }} />
        <div className="absolute rounded-sm" style={{ top: "50%", left: "15%", right: "30%", height: 3, background: "linear-gradient(90deg, var(--brand), var(--warning))" }} />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-[20px] px-4 py-[5px] text-[11px] font-bold glass"
             style={{ color: "var(--brand)", border: "1px solid var(--brand)" }}>
          Suresh · {eta > 0 ? `${eta} min away` : "Arrived!"}
        </div>
        <div className="absolute flex items-center justify-center"
             style={{ width: 42, height: 42, background: "var(--brand)", top: "42%", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", animation: "wpin-move 4s ease-in-out infinite alternate" }}>
          <span style={{ transform: "rotate(45deg)", fontSize: 18 }}>🔧</span>
        </div>
        <div className="absolute rounded-full flex items-center justify-center text-[16px]"
             style={{ width: 36, height: 36, background: "var(--success)", top: "28%", right: "20%" }}>📍</div>
        <button className="absolute bottom-3 right-3 z-10 rounded-[10px] px-3 py-2 text-[10px] font-bold glass"
                style={{ border: "1px solid var(--danger)", color: "var(--danger)" }}>🛡️ Safety</button>
      </div>

      <div className="shrink-0 p-4 pb-20" style={{ borderTop: "1px solid var(--border-1)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div>
            <p className="text-[36px] font-black leading-none" style={{ color: "var(--brand)", fontFamily: "var(--font-syne)" }}>{eta}</p>
            <p className="text-[10px] font-semibold" style={{ color: "var(--text-3)" }}>MINUTES</p>
          </div>
          <div className="flex-1">
            <div className="rounded-sm overflow-hidden mb-[6px]" style={{ height: 5, background: "var(--bg-elevated)" }}>
              <div className="h-full rounded-sm transition-all" style={{ width: `${(stage/4)*100}%`, background: "var(--brand)" }} />
            </div>
            <div className="flex justify-between">{stages.map((s,i) => (
              <span key={s} className="text-[7px] font-bold" style={{ color: i <= stage ? "var(--brand)" : "var(--text-3)" }}>{s}</span>
            ))}</div>
          </div>
        </div>

        {showOtp && (
          <div className="rounded-[12px] p-3 mb-3 text-center animate-scale-in" style={{ background: "var(--brand-tint)", border: "1.5px solid var(--brand)" }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: "var(--brand)" }}>Share OTP with worker</p>
            <p className="text-[32px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "8px" }}>4821</p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-3 rounded-[14px] p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <div className="rounded-full flex items-center justify-center text-[18px] font-black text-white shrink-0" style={{ width: 48, height: 48, background: "#8B5CF6" }}>S</div>
          <div className="flex-1">
            <p className="text-[14px] font-extrabold" style={{ color: "var(--text-1)" }}>Suresh Murugesan</p>
            <p className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>🚗 Auto Mechanic · 15 yrs</p>
            <p className="text-[10px]" style={{ color: "var(--text-3)" }}>⭐ 4.8 · 312 jobs · Verified ✓</p>
          </div>
          <p className="text-[15px] font-black" style={{ color: "var(--brand)" }}>₹599</p>
        </div>

        <div className="flex gap-2">
          <a href="tel:+919876543210" className="flex-1 rounded-[12px] py-3 text-center text-[12px] font-extrabold text-white active:scale-95" style={{ background: "var(--success)" }}>📞 Call</a>
          <Link href="/booking" className="flex-1 rounded-[12px] py-3 text-center text-[12px] font-extrabold active:scale-95" style={{ background: "var(--bg-card)", color: "var(--text-1)", border: "1px solid var(--border-1)" }}>💬 Chat</Link>
          <Link href="/booking/review" className="flex-1 rounded-[12px] py-3 text-center text-[12px] font-extrabold active:scale-95" style={{ background: "var(--bg-card)", color: "var(--warning)", border: "1px solid var(--border-1)" }}>⭐ Review</Link>
        </div>
      </div>
    </div>
  );
}
