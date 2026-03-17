"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// KAIZY HOME — Real-Time Map-First (Uber × Rapido × Swiggy)
// Live worker locations · Dynamic pricing · Animated
// ============================================================

const trades = [
  { icon: "⚡", name: "Electrician", color: "#FF6B00" },
  { icon: "🔧", name: "Plumber", color: "#3B82F6" },
  { icon: "🚗", name: "Mechanic", color: "#8B5CF6" },
  { icon: "🛞", name: "Puncture", color: "#EC4899" },
  { icon: "❄️", name: "AC Repair", color: "#06B6D4" },
  { icon: "🪚", name: "Carpenter", color: "#F59E0B" },
  { icon: "🎨", name: "Painter", color: "#10B981" },
  { icon: "⚒️", name: "Mason", color: "#EF4444" },
];

interface LiveWorker {
  id: number; name: string; initial: string; trade: string; icon: string;
  rating: number; dist: number; price: number; color: string;
  lat: number; lng: number; online: boolean; jobsToday: number;
  verified: boolean; eta: number; completionRate: number;
}

const WORKERS: LiveWorker[] = [
  { id:1, name:"Raju Kumar", initial:"R", trade:"Electrician", icon:"⚡", rating:4.9, dist:1.2, price:500, color:"#FF6B00", lat:28,lng:18, online:true, jobsToday:3, verified:true, eta:8, completionRate:98 },
  { id:2, name:"Meena Devi", initial:"M", trade:"Plumber", icon:"🔧", rating:4.7, dist:0.8, price:400, color:"#3B82F6", lat:42,lng:72, online:true, jobsToday:2, verified:true, eta:5, completionRate:95 },
  { id:3, name:"Suresh M.", initial:"S", trade:"Mechanic", icon:"🚗", rating:4.8, dist:2.1, price:600, color:"#8B5CF6", lat:55,lng:38, online:true, jobsToday:4, verified:true, eta:12, completionRate:97 },
  { id:4, name:"Deepa K.", initial:"D", trade:"AC Repair", icon:"❄️", rating:4.8, dist:1.1, price:650, color:"#06B6D4", lat:35,lng:65, online:true, jobsToday:1, verified:false, eta:6, completionRate:92 },
  { id:5, name:"Arun P.", initial:"A", trade:"Carpenter", icon:"🪚", rating:4.6, dist:3.2, price:550, color:"#F59E0B", lat:22,lng:55, online:true, jobsToday:2, verified:true, eta:15, completionRate:94 },
];

export default function HomePage() {
  const { isDark, toggle } = useTheme();
  const [activeTrade, setActiveTrade] = useState(-1);
  const [greeting, setGreeting] = useState("Good evening");
  const [liveCount, setLiveCount] = useState(24);
  const [workers, setWorkers] = useState(WORKERS);
  const [liveTime, setLiveTime] = useState("");

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      const h = now.getHours();
      setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Simulate live worker movement
  useEffect(() => {
    const id = setInterval(() => {
      setWorkers(prev => prev.map(w => ({
        ...w,
        dist: Math.max(0.3, w.dist + (Math.random() - 0.5) * 0.3),
        eta: Math.max(3, w.eta + Math.floor((Math.random() - 0.5) * 3)),
        lat: w.lat + (Math.random() - 0.5) * 2,
        lng: w.lng + (Math.random() - 0.5) * 2,
      })));
      setLiveCount(prev => Math.max(18, Math.min(32, prev + Math.floor((Math.random() - 0.5) * 4))));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const filtered = activeTrade === -1 ? workers : workers.filter(w => w.trade === trades[activeTrade].name);

  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg-app)" }}>
      {/* ── LIVE MAP BACKGROUND ── */}
      <div className="absolute inset-0" style={{ background: "var(--map-bg)" }}>
        {/* Grid */}
        {[18,35,52,70,85].map((t,i) => <div key={`h${i}`} className="map-road-h" style={{ top:`${t}%`, opacity: 0.3 + i*0.05 }} />)}
        {[20,40,60,80].map((l,i) => <div key={`v${i}`} className="map-road-v" style={{ left:`${l}%`, opacity: 0.25 + i*0.05 }} />)}

        {/* Live worker dots on map */}
        {workers.map(w => (
          <div key={w.id} className="map-dot absolute flex items-center justify-center"
               style={{
                 width: 34, height: 34,
                 background: "var(--bg-card)", border: `2.5px solid ${w.color}`,
                 top: `${w.lat}%`, left: `${w.lng}%`,
                 borderRadius: "50%", fontSize: 14,
                 transition: "top 3s ease, left 3s ease",
                 boxShadow: `0 0 12px ${w.color}40`,
               }}>
            {w.icon}
          </div>
        ))}

        {/* User location (center blue pulse) */}
        <div className="absolute" style={{ top: "48%", left: "48%", transform: "translate(-50%,-50%)" }}>
          <div style={{
            width: 18, height: 18, background: "var(--info)", borderRadius: "50%",
            border: "3px solid rgba(96,165,250,0.3)",
            boxShadow: "0 0 0 8px rgba(96,165,250,0.08), 0 0 20px rgba(96,165,250,0.2)",
          }} className="online-dot" />
        </div>
      </div>

      {/* ── TOP BAR (Glass) ── */}
      <div className="relative z-20 glass" style={{ padding: "10px 16px 16px" }}>
        {/* Status row */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>{liveTime}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
                    style={{ background: "var(--bg-elevated)" }}>
              <span className="text-[14px]">{isDark ? "🌙" : "☀️"}</span>
            </button>
            <Link href="/notifications" className="w-8 h-8 rounded-full flex items-center justify-center relative"
                  style={{ background: "var(--bg-elevated)" }}>
              <span className="text-[14px]">🔔</span>
              <div className="absolute -top-0.5 -right-0.5 w-[10px] h-[10px] rounded-full online-dot" style={{ background: "var(--danger)", border: "2px solid var(--bg-app)" }} />
            </Link>
          </div>
        </div>

        {/* Location + greeting */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5">
            <span style={{ color: "var(--brand)", fontSize: 14 }}>📍</span>
            <span className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Gandhipuram, Coimbatore</span>
            <span className="text-[11px] font-semibold ml-1" style={{ color: "var(--brand)" }}>Change ▾</span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
            {greeting} · <span className="live-badge" style={{ color: "var(--success)" }}>{liveCount} workers online</span>
          </p>
        </div>

        {/* Search bar */}
        <Link href="/marketplace"
              className="flex items-center gap-3 rounded-xl px-4 py-3 active:scale-[0.98] transition-transform"
              style={{
                background: isDark ? "rgba(255,255,255,0.95)" : "#FFFFFF",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}>
          <span className="text-[18px]">🔍</span>
          <span className="text-[14px] font-medium flex-1" style={{ color: "#888" }}>
            What do you need help with?
          </span>
          <span className="text-[14px]" style={{ color: "var(--brand)" }}>🎤</span>
        </Link>
      </div>

      {/* ── SOS FLOATING BUTTON ── */}
      <Link href="/emergency" className="fixed z-30" style={{ right: 16, bottom: 100 }}>
        <div className="flex flex-col items-center justify-center rounded-full text-white sos-pulse shadow-lg"
             style={{ width: 52, height: 52, background: "var(--danger)" }}>
          <span className="text-[16px] leading-none">🆘</span>
          <span className="text-[7px] font-black tracking-wider mt-0.5">SOS</span>
        </div>
      </Link>

      {/* ── TRADE CATEGORIES (horizontal scroll) ── */}
      <div className="relative z-10" style={{ marginTop: "auto", position: "absolute", bottom: 260, left: 0, right: 0, padding: "0 16px" }}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {trades.map((t, i) => (
            <button key={t.name}
                    onClick={() => setActiveTrade(activeTrade === i ? -1 : i)}
                    className="flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-[12px] font-semibold active:scale-95 transition-all"
                    style={{
                      background: activeTrade === i ? t.color : (isDark ? "rgba(255,255,255,0.9)" : "#FFFFFF"),
                      color: activeTrade === i ? "#FFF" : "#333",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}>
              <span className="text-[15px]">{t.icon}</span>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── BOTTOM SHEET: Workers Near You ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 anim-up" style={{ paddingBottom: 72 }}>
        {/* Gradient fade */}
        <div style={{ height: 48, background: `linear-gradient(transparent, var(--bg-app))` }} />

        <div style={{ background: "var(--bg-app)" }}>
          {/* Section header */}
          <div className="flex justify-between items-center px-4 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Nearby Workers</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full live-badge"
                    style={{ background: "var(--success-tint)", color: "var(--success)" }}>
                LIVE
              </span>
            </div>
            <Link href="/marketplace" className="text-[12px] font-semibold" style={{ color: "var(--brand)" }}>See All →</Link>
          </div>

          {/* Worker cards (horizontal scroll — Swiggy style) */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2 stagger">
            {filtered.map(w => (
              <Link key={w.id} href="/booking"
                    className="shrink-0 rounded-2xl p-3.5 active:scale-[0.97] transition-all"
                    style={{
                      width: 172,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-1)",
                      boxShadow: "var(--shadow-sm)",
                    }}>
                {/* Avatar + name */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="relative shrink-0">
                    <div className="flex items-center justify-center rounded-full text-[14px] font-bold text-white"
                         style={{ width: 40, height: 40, background: w.color }}>
                      {w.initial}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 rounded-full online-dot"
                         style={{ width: 10, height: 10, background: "var(--success)", border: "2px solid var(--bg-card)" }} />
                    {w.verified && (
                      <div className="absolute -top-1 -right-1 text-[10px]">✓</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{w.name}</p>
                    <p className="text-[11px] font-medium" style={{ color: w.color }}>{w.icon} {w.trade}</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex justify-between items-end">
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[10px]" style={{ color: "var(--warning)" }}>★</span>
                      <span className="text-[11px] font-semibold" style={{ color: "var(--text-1)" }}>{w.rating}</span>
                    </div>
                    <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{w.dist.toFixed(1)} km · {w.eta}m</p>
                  </div>
                  <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>₹{w.price}<span className="text-[9px] font-normal" style={{ color: "var(--text-3)" }}>/hr</span></p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Spacer for scroll */}
      <div style={{ height: "100vh" }} />
    </div>
  );
}
