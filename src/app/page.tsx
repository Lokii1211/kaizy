"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// KAIZY HOME — Real-Time Map-First (Uber × Rapido × Swiggy)
// Live worker data from Supabase · Dynamic pricing
// ============================================================

const trades = [
  { icon: "⚡", name: "Electrician", key: "electrician", color: "#FF6B00" },
  { icon: "🔧", name: "Plumber", key: "plumber", color: "#3B82F6" },
  { icon: "🚗", name: "Mechanic", key: "mechanic", color: "#8B5CF6" },
  { icon: "❄️", name: "AC Repair", key: "ac_repair", color: "#06B6D4" },
  { icon: "🪚", name: "Carpenter", key: "carpenter", color: "#F59E0B" },
  { icon: "🎨", name: "Painter", key: "painter", color: "#10B981" },
];

const tradeColors: Record<string, string> = {
  electrician: "#FF6B00", plumber: "#3B82F6", mechanic: "#8B5CF6",
  ac_repair: "#06B6D4", carpenter: "#F59E0B", painter: "#10B981", mason: "#EF4444",
};
const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};

interface RealWorker {
  id: string; name: string; trade: string; rating: number;
  distance: number; rate: number; eta: number; kaizyScore: number;
  verified: boolean; experience: number; totalJobs: number;
  lat: number; lng: number;
}

export default function HomePage() {
  const { isDark, toggle } = useTheme();
  const [activeTrade, setActiveTrade] = useState(-1);
  const [greeting, setGreeting] = useState("Good evening");
  const [onlineCount, setOnlineCount] = useState(0);
  const [workers, setWorkers] = useState<RealWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveTime, setLiveTime] = useState("");

  // Live clock + greeting
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

  // Fetch REAL workers from Supabase via API
  const fetchWorkers = async (trade?: string) => {
    try {
      setLoading(true);
      const tradeParam = trade || '';
      const url = `/api/workers/nearby?trade=${tradeParam}&lat=11.0168&lng=76.9558&radius=10&limit=10`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data?.workers) {
        setWorkers(json.data.workers);
      }
    } catch (e) {
      console.error('[fetch workers]', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch REAL online count
  const fetchOnlineCount = async () => {
    try {
      const res = await fetch('/api/workers/toggle');
      const json = await res.json();
      if (json.success) setOnlineCount(json.data.onlineCount);
    } catch {}
  };

  // Initial fetch
  useEffect(() => {
    fetchWorkers();
    fetchOnlineCount();
    // Refresh every 30 seconds
    const id = setInterval(() => { fetchWorkers(activeTrade >= 0 ? trades[activeTrade].key : undefined); fetchOnlineCount(); }, 30000);
    return () => clearInterval(id);
  }, []);

  // Filter by trade
  const handleTradeClick = (i: number) => {
    if (activeTrade === i) {
      setActiveTrade(-1);
      fetchWorkers();
    } else {
      setActiveTrade(i);
      fetchWorkers(trades[i].key);
    }
  };

  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg-app)" }}>
      {/* ── LIVE MAP BACKGROUND ── */}
      <div className="absolute inset-0" style={{ background: "var(--map-bg)" }}>
        {[18,35,52,70,85].map((t,i) => <div key={`h${i}`} className="map-road-h" style={{ top:`${t}%`, opacity: 0.3 + i*0.05 }} />)}
        {[20,40,60,80].map((l,i) => <div key={`v${i}`} className="map-road-v" style={{ left:`${l}%`, opacity: 0.25 + i*0.05 }} />)}

        {/* Real worker dots on map */}
        {workers.map((w, i) => {
          const color = tradeColors[w.trade] || "#FF6B00";
          const icon = tradeIcons[w.trade] || "🔧";
          // Spread workers across map area based on index
          const positions = [
            { top: 25, left: 20 }, { top: 45, left: 72 }, { top: 55, left: 35 },
            { top: 30, left: 58 }, { top: 60, left: 55 }, { top: 40, left: 15 },
            { top: 20, left: 45 }, { top: 50, left: 80 }, { top: 35, left: 30 },
            { top: 65, left: 42 },
          ];
          const pos = positions[i % positions.length];
          return (
            <div key={w.id} className="map-dot absolute flex items-center justify-center"
                 style={{
                   width: 34, height: 34,
                   background: "var(--bg-card)", border: `2.5px solid ${color}`,
                   top: `${pos.top}%`, left: `${pos.left}%`,
                   borderRadius: "50%", fontSize: 14,
                   boxShadow: `0 0 12px ${color}40`,
                   transition: "all 1s ease",
                 }}>
              {icon}
            </div>
          );
        })}

        {/* User location blue dot */}
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
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>{liveTime}</span>
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

        <div className="mb-3">
          <div className="flex items-center gap-1.5">
            <span style={{ color: "var(--brand)", fontSize: 14 }}>📍</span>
            <span className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Gandhipuram, Coimbatore</span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
            {greeting} · <span className="live-badge" style={{ color: "var(--success)" }}>{onlineCount} workers online</span>
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
          <span className="text-[14px] font-medium flex-1" style={{ color: "#888" }}>What do you need help with?</span>
          <span className="text-[14px]" style={{ color: "var(--brand)" }}>🎤</span>
        </Link>
      </div>

      {/* ── SOS FLOATING ── */}
      <Link href="/emergency" className="fixed z-30" style={{ right: 16, bottom: 100 }}>
        <div className="flex flex-col items-center justify-center rounded-full text-white sos-pulse shadow-lg"
             style={{ width: 52, height: 52, background: "var(--danger)" }}>
          <span className="text-[16px] leading-none">🆘</span>
          <span className="text-[7px] font-black tracking-wider mt-0.5">SOS</span>
        </div>
      </Link>

      {/* ── TRADE CATEGORIES ── */}
      <div className="relative z-10" style={{ position: "absolute", bottom: 260, left: 0, right: 0, padding: "0 16px" }}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {trades.map((t, i) => (
            <button key={t.key} onClick={() => handleTradeClick(i)}
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

      {/* ── BOTTOM SHEET: Real Workers ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 anim-up" style={{ paddingBottom: 72 }}>
        <div style={{ height: 48, background: `linear-gradient(transparent, var(--bg-app))` }} />

        <div style={{ background: "var(--bg-app)" }}>
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

          {/* Loading state */}
          {loading && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
              {[1,2,3].map(i => (
                <div key={i} className="shrink-0 rounded-2xl p-3.5 skeleton" style={{ width: 172, height: 130 }} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && workers.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-[32px] mb-2">😔</p>
              <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No workers online right now</p>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>Post a job and we&apos;ll notify workers when they come online</p>
              <Link href="/booking" className="inline-block mt-4 rounded-xl px-6 py-3 text-[13px] font-bold text-white active:scale-95"
                    style={{ background: "var(--brand)" }}>Post Job Anyway →</Link>
            </div>
          )}

          {/* Real worker cards */}
          {!loading && workers.length > 0 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2 stagger">
              {workers.map(w => {
                const color = tradeColors[w.trade] || "#FF6B00";
                const icon = tradeIcons[w.trade] || "🔧";
                const initial = w.name?.[0] || "?";
                return (
                  <Link key={w.id} href="/booking"
                        className="shrink-0 rounded-2xl p-3.5 active:scale-[0.97] transition-all"
                        style={{
                          width: 172,
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-1)",
                          boxShadow: "var(--shadow-sm)",
                        }}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="relative shrink-0">
                        <div className="flex items-center justify-center rounded-full text-[14px] font-bold text-white"
                             style={{ width: 40, height: 40, background: color }}>
                          {initial}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full online-dot"
                             style={{ width: 10, height: 10, background: "var(--success)", border: "2px solid var(--bg-card)" }} />
                        {w.verified && (
                          <div className="absolute -top-1 -right-1 text-[9px] bg-blue-500 text-white rounded-full w-[14px] h-[14px] flex items-center justify-center">✓</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{w.name}</p>
                        <p className="text-[11px] font-medium" style={{ color }}>{icon} {w.trade.replace('_',' ')}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[10px]" style={{ color: "var(--warning)" }}>★</span>
                          <span className="text-[11px] font-semibold" style={{ color: "var(--text-1)" }}>{w.rating}</span>
                          <span className="text-[9px]" style={{ color: "var(--text-3)" }}>({w.totalJobs})</span>
                        </div>
                        <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{w.distance}km · {w.eta}m</p>
                      </div>
                      <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>₹{w.rate}<span className="text-[9px] font-normal" style={{ color: "var(--text-3)" }}>/hr</span></p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: "100vh" }} />
    </div>
  );
}
