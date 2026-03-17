"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import { useBooking } from "@/stores/BookingStore";

const emergencies = [
  { icon: "🚗", name: "Vehicle Breakdown", eta: "~8 min", color: "#8B5CF6" },
  { icon: "🛞", name: "Tyre Puncture", eta: "~5 min", color: "#EC4899" },
  { icon: "💧", name: "Pipe Burst", eta: "~12 min", color: "#3B8BFF" },
  { icon: "⚡", name: "Power Failure", eta: "~10 min", color: "#FF6B00" },
  { icon: "🔒", name: "Lock Broken", eta: "~15 min", color: "#F59E0B" },
  { icon: "❄️", name: "AC Emergency", eta: "~11 min", color: "#06B6D4" },
];

export default function EmergencyPage() {
  const { isDark } = useTheme();
  const { startSearch } = useBooking();
  const [selected, setSelected] = useState(0);

  const handleFind = () => {
    startSearch("All", `SOS: ${emergencies[selected].name}`);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      {/* Red hero */}
      <div className="px-4 pt-4 pb-4" style={{ background: isDark ? "#150000" : "#FFF0F0" }}>
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)" }}><span className="text-[14px]">←</span></Link>
          <span className="text-[11px] font-bold" style={{ color: "var(--text-3)" }}>📶 🔋</span>
        </div>
        <span className="inline-block rounded-[20px] px-3 py-1 text-[10px] font-extrabold text-white tracking-wider mb-2"
              style={{ background: "var(--danger)", letterSpacing: "1px" }}>🆘 EMERGENCY</span>
        <h1 className="text-[24px] font-black" style={{ color: "var(--text-1)", fontFamily: "var(--font-syne), 'Syne', sans-serif" }}>Need Help Now?</h1>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>Finding nearest expert in minutes</p>
      </div>

      {/* Location */}
      <div className="mx-4 mt-3 flex items-center gap-3 rounded-[14px] p-3"
           style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", borderLeft: "4px solid var(--brand)" }}>
        <div className="shrink-0 rounded-full" style={{ width: 10, height: 10, background: "var(--brand)", boxShadow: "var(--shadow-brand)" }} />
        <div className="flex-1">
          <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>NH-544, Near Ukkadam, CBE</p>
          <p className="text-[10px]" style={{ color: "var(--text-3)" }}>📡 Auto-detected</p>
        </div>
        <button className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>Change</button>
      </div>

      {/* Emergency grid */}
      <div className="px-4 mt-4 flex-1">
        <p className="text-[12px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>What happened?</p>
        <div className="grid grid-cols-2 gap-2">
          {emergencies.map((e, i) => (
            <button key={e.name} onClick={() => setSelected(i)}
                    className="flex items-center gap-2.5 rounded-[14px] p-3.5 transition-all active:scale-95 text-left"
                    style={{
                      background: selected === i ? "var(--brand-tint)" : "var(--bg-card)",
                      border: selected === i ? "2px solid var(--brand)" : "2px solid transparent",
                    }}>
              <span className="text-[24px]">{e.icon}</span>
              <div>
                <p className="text-[12px] font-extrabold" style={{ color: "var(--text-1)" }}>{e.name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>{e.eta}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-20 mt-3">
        <Link href="/booking" onClick={handleFind}
              className="block w-full rounded-[14px] py-4 text-center text-[14px] font-black text-white active:scale-[0.98] transition-transform"
              style={{ background: "var(--danger)", boxShadow: "0 8px 32px rgba(255,59,59,0.35)" }}>
          🔍 Find Help Now
        </Link>
      </div>
    </div>
  );
}
