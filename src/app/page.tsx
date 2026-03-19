"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// KAIZY HOME — Mapbox Map-First + Real Supabase Workers
// ============================================================

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

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

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || mapRef.current) return;
    let cancelled = false;

    const initMap = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        // Inject CSS via link tag instead of import
        if (!document.getElementById('mapbox-css')) {
          const link = document.createElement('link');
          link.id = 'mapbox-css';
          link.rel = 'stylesheet';
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
          document.head.appendChild(link);
        }
        if (cancelled || !mapContainer.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapboxgl as any).accessToken = MAPBOX_TOKEN;

        const map = new mapboxgl.Map({
          container: mapContainer.current,
          style: isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v12",
          center: [76.9558, 11.0168], // Coimbatore
          zoom: 13,
          attributionControl: false,
          pitch: 20,
        });

        map.on("load", () => {
          if (cancelled) return;
          // User marker
          const userEl = document.createElement("div");
          userEl.innerHTML = `<div style="position:relative;width:34px;height:34px">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(96,165,250,0.15);animation:map-pulse 2s ease-out infinite"></div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 0 8px rgba(59,130,246,0.4)"></div>
          </div>`;
          new mapboxgl.Marker({ element: userEl }).setLngLat([76.9558, 11.0168]).addTo(map);
        });

        mapRef.current = map;
      } catch (e) {
        console.error("[mapbox home]", e);
      }
    };
    initMap();
    return () => { cancelled = true; };
  }, [isDark]);

  // Add worker markers to map when workers change
  useEffect(() => {
    if (!mapRef.current || workers.length === 0) return;

    const addMarkers = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = mapRef.current as any;

        // Remove old markers
        markersRef.current.forEach((m: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (m as any).remove();
        });
        markersRef.current = [];

        // Spread workers around Coimbatore if no real coordinates
        const positions = [
          [76.945, 11.025], [76.965, 11.010], [76.950, 11.020],
          [76.960, 11.015], [76.942, 11.012], [76.970, 11.022],
          [76.955, 11.028], [76.948, 11.008], [76.962, 11.018],
          [76.940, 11.020],
        ];

        workers.forEach((w, i) => {
          const color = tradeColors[w.trade] || "#FF6B00";
          const icon = tradeIcons[w.trade] || "🔧";
          const pos = positions[i % positions.length];

          const el = document.createElement("div");
          el.innerHTML = `
            <div style="cursor:pointer;display:flex;flex-direction:column;align-items:center">
              <div style="width:36px;height:36px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:16px;border:2.5px solid white;box-shadow:0 2px 8px ${color}60">${icon}</div>
            </div>
          `;
          el.title = `${w.name} · ★${w.rating} · ₹${w.rate}/hr`;

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([pos[0], pos[1]])
            .addTo(map);
          markersRef.current.push(marker);
        });
      } catch (e) {
        console.error("[markers]", e);
      }
    };
    addMarkers();
  }, [workers]);

  // Fetch REAL workers
  const fetchWorkers = async (trade?: string) => {
    try {
      setLoading(true);
      const url = `/api/workers/nearby?trade=${trade || ''}&lat=11.0168&lng=76.9558&radius=10&limit=10`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data?.workers) setWorkers(json.data.workers);
    } catch (e) { console.error('[fetch]', e); }
    finally { setLoading(false); }
  };

  // Fetch REAL online count
  const fetchOnlineCount = async () => {
    try {
      const res = await fetch('/api/workers/toggle');
      const json = await res.json();
      if (json.success) setOnlineCount(json.data.onlineCount);
    } catch {}
  };

  useEffect(() => {
    fetchWorkers();
    fetchOnlineCount();
    const id = setInterval(() => { fetchWorkers(activeTrade >= 0 ? trades[activeTrade].key : undefined); fetchOnlineCount(); }, 30000);
    return () => clearInterval(id);
  }, []);

  const handleTradeClick = (i: number) => {
    if (activeTrade === i) { setActiveTrade(-1); fetchWorkers(); }
    else { setActiveTrade(i); fetchWorkers(trades[i].key); }
  };

  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg-app)" }}>
      {/* ── MAPBOX MAP ── */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        {MAPBOX_TOKEN ? (
          <div ref={mapContainer} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />
        ) : (
          <div className="absolute inset-0" style={{ background: "var(--map-bg)" }}>
            {[18,35,52,70,85].map((t,i) => <div key={`h${i}`} className="map-road-h" style={{ top:`${t}%`, opacity: 0.3 + i*0.05 }} />)}
            {[20,40,60,80].map((l,i) => <div key={`v${i}`} className="map-road-v" style={{ left:`${l}%`, opacity: 0.25 + i*0.05 }} />)}
          </div>
        )}
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

      {/* ── SOS ── */}
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
                    className="flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-[12px] font-semibold active:scale-95 transition-all shadow-md"
                    style={{
                      background: activeTrade === i ? t.color : (isDark ? "rgba(255,255,255,0.9)" : "#FFFFFF"),
                      color: activeTrade === i ? "#FFF" : "#333",
                    }}>
              <span className="text-[15px]">{t.icon}</span>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── BOTTOM SHEET ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 anim-up" style={{ paddingBottom: 72 }}>
        <div style={{ height: 48, background: `linear-gradient(transparent, var(--bg-app))` }} />
        <div style={{ background: "var(--bg-app)" }}>
          <div className="flex justify-between items-center px-4 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Nearby Workers</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full live-badge"
                    style={{ background: "var(--success-tint)", color: "var(--success)" }}>LIVE</span>
            </div>
            <Link href="/marketplace" className="text-[12px] font-semibold" style={{ color: "var(--brand)" }}>See All →</Link>
          </div>

          {loading && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
              {[1,2,3].map(i => <div key={i} className="shrink-0 rounded-2xl p-3.5 skeleton" style={{ width: 172, height: 130 }} />)}
            </div>
          )}

          {!loading && workers.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-[32px] mb-2">😔</p>
              <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No workers online right now</p>
              <Link href="/booking" className="inline-block mt-4 rounded-xl px-6 py-3 text-[13px] font-bold text-white active:scale-95"
                    style={{ background: "var(--brand)" }}>Post Job Anyway →</Link>
            </div>
          )}

          {!loading && workers.length > 0 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2 stagger">
              {workers.map(w => {
                const color = tradeColors[w.trade] || "#FF6B00";
                const icon = tradeIcons[w.trade] || "🔧";
                return (
                  <Link key={w.id} href="/booking"
                        className="shrink-0 rounded-2xl p-3.5 active:scale-[0.97] transition-all"
                        style={{ width: 172, background: "var(--bg-card)", border: "1px solid var(--border-1)", boxShadow: "var(--shadow-sm)" }}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="relative shrink-0">
                        <div className="flex items-center justify-center rounded-full text-[14px] font-bold text-white"
                             style={{ width: 40, height: 40, background: color }}>{w.name?.[0] || "?"}</div>
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
                      <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}><span className="text-[9px] font-normal" style={{ color: "var(--text-3)" }}>from </span>₹{w.rate}<span className="text-[9px] font-normal" style={{ color: "var(--text-3)" }}>/hr</span></p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: "100vh" }} />

      <style jsx global>{`
        @keyframes map-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .mapboxgl-ctrl-attrib { display: none !important; }
        .mapboxgl-ctrl-logo { display: none !important; }
      `}</style>
    </div>
  );
}
