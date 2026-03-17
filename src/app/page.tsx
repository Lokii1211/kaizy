"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import { useBooking, type NearbyWorker } from "@/stores/BookingStore";

// ============================================================
// Kaizy — HOME (Uber/Rapido style map-first)
// CSS var themed · Real-time worker data · Animated
// ============================================================

const categories = [
  { icon: "⚡", name: "Electrician", count: 12 },
  { icon: "🔧", name: "Plumber", count: 8 },
  { icon: "🚗", name: "Mechanic", count: 5 },
  { icon: "🛞", name: "Puncture", count: 3 },
  { icon: "❄️", name: "AC Repair", count: 4 },
  { icon: "🪚", name: "Carpenter", count: 6 },
  { icon: "🎨", name: "Painter", count: 7 },
  { icon: "⚒️", name: "Mason", count: 2 },
];

export default function HomePage() {
  const { isDark, toggle } = useTheme();
  const { state, startSearch } = useBooking();
  const [activeCategory, setActiveCategory] = useState(0);
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg-app)" }}>
      {/* ── MAP BACKGROUND ── */}
      <div className="absolute inset-0 overflow-hidden" style={{ background: "var(--map-bg)" }}>
        <div className="map-road-h" style={{ top: "20%", opacity: 0.5 }} />
        <div className="map-road-h" style={{ top: "45%", opacity: 0.35 }} />
        <div className="map-road-h" style={{ top: "70%", opacity: 0.25 }} />
        <div className="map-road-v" style={{ left: "25%", opacity: 0.4 }} />
        <div className="map-road-v" style={{ left: "55%", opacity: 0.3 }} />
        <div className="map-road-v" style={{ left: "80%", opacity: 0.2 }} />

        {/* Worker dots */}
        <div className="map-dot absolute flex items-center justify-center text-[12px]"
             style={{ width: 32, height: 32, background: "var(--bg-card)", border: "2px solid var(--brand)", top: "28%", left: "18%", borderRadius: "50%" }}>⚡</div>
        <div className="map-dot absolute flex items-center justify-center text-[12px]"
             style={{ width: 32, height: 32, background: "var(--bg-card)", border: "2px solid var(--info)", top: "42%", right: "22%", borderRadius: "50%" }}>🔧</div>
        <div className="map-dot absolute flex items-center justify-center text-[12px]"
             style={{ width: 32, height: 32, background: "var(--bg-card)", border: "2px solid #8B5CF6", bottom: "45%", left: "38%", borderRadius: "50%" }}>🚗</div>
        <div className="map-dot absolute flex items-center justify-center text-[12px]"
             style={{ width: 32, height: 32, background: "var(--bg-card)", border: "2px solid var(--success)", top: "35%", right: "35%", borderRadius: "50%" }}>❄️</div>
        <div className="map-dot absolute flex items-center justify-center text-[10px]"
             style={{ width: 28, height: 28, background: "var(--bg-card)", border: "2px solid #EC4899", bottom: "50%", left: "60%", borderRadius: "50%" }}>🛞</div>

        {/* User blue dot */}
        <div className="absolute" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <div className="online-pulse" style={{ width: 22, height: 22, background: "var(--info)", borderRadius: "50%", border: "3px solid rgba(59,139,255,0.4)", boxShadow: "0 0 0 14px rgba(59,139,255,0.08)" }} />
        </div>
      </div>

      {/* ── TOP GRADIENT OVERLAY ── */}
      <div className="absolute top-0 left-0 right-0 z-20 glass" style={{ padding: "12px 16px 20px" }}>
        {/* Status bar */}
        <div className="flex justify-between items-center px-1 pt-1 pb-2">
          <span className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>9:41</span>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="text-[16px] active:scale-90 transition-transform">{isDark ? "🌙" : "☀️"}</button>
            <span className="text-[11px]" style={{ color: "var(--text-1)" }}>📶 🔋</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-[11px] mb-2.5">
          <span style={{ color: "var(--brand)" }}>📍</span>
          <span className="font-bold" style={{ color: "var(--text-1)" }}>Gandhipuram, Coimbatore</span>
          <button className="font-bold ml-1 text-[10px]" style={{ color: "var(--brand)" }}>Change ▾</button>
        </div>

        {/* Search bar (Uber-style "Where to?" prompt) */}
        <Link href="/marketplace"
              className="flex items-center gap-3 rounded-[14px] px-4 py-3.5 shadow-lg"
              style={{ background: isDark ? "rgba(255,255,255,0.96)" : "#FFFFFF", border: isDark ? "none" : "1px solid var(--border-2)" }}>
          <span className="text-[16px]" style={{ color: "var(--brand)" }}>🎙️</span>
          <span className="text-[13px] font-semibold flex-1" style={{ color: "#999" }}>What do you need? / क्या चाहिए?</span>
          <span className="text-[13px]" style={{ color: "#bbb" }}>⌨️</span>
        </Link>
      </div>

      {/* ── SOS BUTTON (floating) ── */}
      <Link href="/emergency" className="absolute z-20" style={{ right: 16, top: "24%" }}>
        <div className="flex flex-col items-center justify-center rounded-full sos-pulse text-white"
             style={{ width: 56, height: 56, background: "var(--danger)" }}>
          <span className="text-[18px]">🆘</span>
          <span className="text-[8px] font-black tracking-wider">SOS</span>
        </div>
      </Link>

      {/* ── CATEGORY CHIPS ── */}
      <div className="absolute z-10" style={{ bottom: 200, left: 0, right: 0, padding: "0 16px" }}>
        <p className="text-[11px] font-extrabold mb-2" style={{ color: "var(--text-1)", textShadow: isDark ? "0 2px 6px rgba(0,0,0,0.8)" : "0 1px 4px rgba(0,0,0,0.12)" }}>
          What do you need?
        </p>
        <div className="flex gap-[8px] overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(i)}
              className="flex items-center gap-1.5 shrink-0 rounded-[22px] px-3.5 py-[8px] text-[11px] font-bold active:scale-95 transition-all shadow-sm"
              style={{
                background: isDark ? "rgba(255,255,255,0.96)" : "#FFFFFF",
                color: "#111",
                border: activeCategory === i ? "2px solid var(--brand)" : "2px solid transparent",
                boxShadow: activeCategory === i ? "var(--shadow-brand)" : "var(--shadow-sm)",
              }}
            >
              <span className="text-[16px] leading-none">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── WORKERS STRIP (Bottom sheet — Swiggy/Zomato style) ── */}
      <div className="absolute bottom-0 left-0 right-0 z-15" style={{ background: `linear-gradient(0deg, var(--bg-app) 80%, transparent)`, paddingBottom: 74 }}>
        <div className="flex justify-between items-center px-4" style={{ padding: "12px 16px 8px" }}>
          <span className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>⚡ Near You</span>
          <Link href="/marketplace" className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>See All →</Link>
        </div>
        <div className="flex gap-[10px] overflow-x-auto no-scrollbar px-4 pb-[10px]">
          {[
            { id: 1, i: "R", name: "Raju K.", trade: "⚡ Electrician", rating: 4.9, dist: "1.2km", price: "₹500/hr", color: "#FF6B00", online: true },
            { id: 2, i: "M", name: "Meena D.", trade: "🔧 Plumber", rating: 4.7, dist: "0.8km", price: "₹400/hr", color: "#3B8BFF", online: true },
            { id: 3, i: "S", name: "Suresh M.", trade: "🚗 Mechanic", rating: 4.8, dist: "2.1km", price: "₹600/hr", color: "#8B5CF6", online: true },
            { id: 4, i: "D", name: "Deepa K.", trade: "❄️ AC Repair", rating: 4.8, dist: "1.1km", price: "₹650/hr", color: "#06B6D4", online: true },
          ].map(w => (
            <Link key={w.id} href="/booking" className="shrink-0 rounded-[16px] p-3 active:scale-[0.97] transition-all"
                  style={{ width: 168, background: "var(--bg-card)", border: "1px solid var(--border-1)", boxShadow: "var(--shadow-sm)" }}>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="relative shrink-0 flex items-center justify-center rounded-full text-[14px] font-black text-white"
                     style={{ width: 38, height: 38, background: w.color }}>
                  {w.i}
                  {w.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 rounded-full online-pulse"
                         style={{ width: 11, height: 11, background: "var(--success)", border: `2px solid var(--bg-card)` }} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-extrabold truncate" style={{ color: "var(--text-1)" }}>{w.name}</p>
                  <p className="text-[10px] font-bold" style={{ color: w.color }}>{w.trade}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold" style={{ color: "var(--warning)" }}>⭐ {w.rating}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{w.dist}</p>
                </div>
                <p className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>{w.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ height: "100vh" }} />
    </div>
  );
}
