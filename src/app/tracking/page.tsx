"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// LIVE TRACKING — Real Mapbox GL map + worker movement
// Reads booking data from state, uses real GPS
// ============================================================

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface WorkerInfo {
  name: string; trade: string; rating: number;
  initials: string; kaizyScore: number; phone: string;
}

const DEFAULT_WORKER: WorkerInfo = {
  name: "Worker", trade: "Technician", rating: 4.5,
  initials: "W", kaizyScore: 500, phone: "",
};

export default function TrackingPage() {
  const { isDark } = useTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const workerMarkerRef = useRef<unknown>(null);
  const userMarkerRef = useRef<unknown>(null);

  const [userPos, setUserPos] = useState({ lat: 11.0168, lng: 76.9558 });
  const [workerPos, setWorkerPos] = useState({ lat: 11.025, lng: 76.945 });
  const [worker, setWorker] = useState<WorkerInfo>(DEFAULT_WORKER);
  const [eta, setEta] = useState(8);
  const [status, setStatus] = useState<"en_route" | "arrived" | "working" | "completed">("en_route");
  const [otp] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load booking data + get real GPS
  useEffect(() => {
    // Read worker info from sessionStorage (set by BookingStore)
    try {
      const stored = sessionStorage.getItem("kaizy_booked_worker");
      if (stored) {
        const w = JSON.parse(stored);
        setWorker({
          name: w.name || "Worker",
          trade: w.trade || "Technician",
          rating: w.rating || 4.5,
          initials: (w.name || "W").split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 2),
          kaizyScore: w.kaizyScore || 500,
          phone: w.phone || "",
        });
        if (w.lat && w.lng) setWorkerPos({ lat: w.lat, lng: w.lng });
      }
    } catch {}

    // Get real GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || mapRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        // Inject CSS via link tag
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
          style: isDark
            ? "mapbox://styles/mapbox/dark-v11"
            : "mapbox://styles/mapbox/streets-v12",
          center: [
            (userPos.lng + workerPos.lng) / 2,
            (userPos.lat + workerPos.lat) / 2,
          ],
          zoom: 13.5,
          attributionControl: false,
          pitch: 30,
        });

        map.on("load", () => {
          if (cancelled) return;

          // User marker (blue pulse)
          const userEl = document.createElement("div");
          userEl.innerHTML = `
            <div style="position:relative;width:40px;height:40px">
              <div style="position:absolute;inset:0;border-radius:50%;background:rgba(96,165,250,0.15);animation:pulse 2s ease-out infinite"></div>
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:16px;height:16px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 0 10px rgba(59,130,246,0.5)"></div>
            </div>
          `;
          const userMarker = new mapboxgl.Marker({ element: userEl })
            .setLngLat([userPos.lng, userPos.lat])
            .addTo(map);

          // Worker marker (orange with icon)
          const workerEl = document.createElement("div");
          workerEl.innerHTML = `
            <div style="position:relative;display:flex;flex-direction:column;align-items:center">
              <div style="width:42px;height:42px;border-radius:50%;background:#FF6B00;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 12px rgba(255,107,0,0.4);border:3px solid white">🔧</div>
              <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #FF6B00;margin-top:-2px"></div>
            </div>
          `;
          const workerMarker = new mapboxgl.Marker({ element: workerEl })
            .setLngLat([workerPos.lng, workerPos.lat])
            .addTo(map);

          mapRef.current = map;
          workerMarkerRef.current = workerMarker;
          userMarkerRef.current = userMarker;
          setMapLoaded(true);

          // Draw route line
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: [
                  [workerPos.lng, workerPos.lat],
                  [(userPos.lng + workerPos.lng) / 2 + 0.003, (userPos.lat + workerPos.lat) / 2 + 0.002],
                  [userPos.lng, userPos.lat],
                ],
              },
            },
          });

          map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#FF6B00",
              "line-width": 4,
              "line-dasharray": [2, 2],
            },
          });

          // Add navigation controls
          map.addControl(new mapboxgl.NavigationControl(), "top-right");

          // Fit bounds
          const bounds = new mapboxgl.LngLatBounds()
            .extend([userPos.lng, userPos.lat])
            .extend([workerPos.lng, workerPos.lat]);
          map.fitBounds(bounds, { padding: 80 });
        });
      } catch (e) {
        console.error("[mapbox init]", e);
      }
    };

    initMap();
    return () => { cancelled = true; };
  }, [isDark]);

  // Simulate worker movement toward user
  const moveWorker = useCallback(() => {
    setWorkerPos((prev) => {
      const dx = (userPos.lat - prev.lat) * 0.12;
      const dy = (userPos.lng - prev.lng) * 0.12;
      const noise = () => (Math.random() - 0.5) * 0.001;
      const newPos = { lat: prev.lat + dx + noise(), lng: prev.lng + dy + noise() };

      // Update marker on map
      if (workerMarkerRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (workerMarkerRef.current as any).setLngLat([newPos.lng, newPos.lat]);
      }

      // Check if arrived (within ~200m)
      const dist = Math.sqrt(
        Math.pow(newPos.lat - userPos.lat, 2) + Math.pow(newPos.lng - userPos.lng, 2)
      );
      if (dist < 0.002) {
        setStatus("arrived");
        setEta(0);
      }

      return newPos;
    });
  }, []);

  // Movement & ETA timer
  useEffect(() => {
    if (status !== "en_route") return;

    const moveInterval = setInterval(moveWorker, 3000);
    const etaInterval = setInterval(() => {
      setEta((prev) => Math.max(0, prev - 1));
    }, 60000);

    return () => {
      clearInterval(moveInterval);
      clearInterval(etaInterval);
    };
  }, [status, moveWorker]);

  const statusInfo = {
    en_route: { label: "Worker is on the way", icon: "🏍️", color: "var(--brand)" },
    arrived: { label: "Worker has arrived!", icon: "📍", color: "var(--success)" },
    working: { label: "Work in progress", icon: "🔧", color: "var(--info)" },
    completed: { label: "Job completed!", icon: "✅", color: "var(--success)" },
  };
  const info = statusInfo[status];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-app)" }}>
      {/* ── MAP ── */}
      <div className="relative flex-1" style={{ minHeight: "55vh" }}>
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Map loading fallback */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
               style={{ background: isDark ? "#1a1a2e" : "#e8f4f8" }}>
            <div className="w-8 h-8 border-3 rounded-full animate-spin mb-3"
                 style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>Loading Mapbox...</p>
          </div>
        )}

        {/* Top bar overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-3">
          <Link href="/" className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 shadow-lg"
                style={{ background: "var(--bg-card)" }}>
            <span className="text-[15px]">←</span>
          </Link>
          <div className="rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
               style={{ background: "var(--bg-card)" }}>
            <div className="w-2 h-2 rounded-full online-dot" style={{ background: info.color }} />
            <span className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{info.label}</span>
          </div>
          <div className="w-10" />
        </div>

        {/* ETA badge */}
        {status === "en_route" && eta > 0 && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 rounded-xl px-4 py-2 shadow-lg text-center"
               style={{ background: "var(--brand)" }}>
            <p className="text-[20px] font-black text-white">{eta} min</p>
            <p className="text-[9px] font-semibold text-white" style={{ opacity: 0.7 }}>Estimated arrival</p>
          </div>
        )}
      </div>

      {/* ── BOTTOM SHEET ── */}
      <div className="shrink-0 rounded-t-3xl -mt-4 relative z-10 px-4 pt-5 pb-6"
           style={{ background: "var(--bg-app)", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
        {/* Drag indicator */}
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--bg-elevated)" }} />

        {/* Worker info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold text-white"
               style={{ background: "var(--brand)" }}>{worker.initials}</div>
          <div className="flex-1">
            <p className="text-[15px] font-black" style={{ color: "var(--text-1)" }}>{worker.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>{worker.trade}</span>
              <span className="text-[11px]" style={{ color: "var(--warning)" }}>★ {worker.rating.toFixed(1)}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white"
                    style={{ background: "var(--info)" }}>KS {worker.kaizyScore}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <a href={`tel:${worker.phone}`}
               className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90"
               style={{ background: "var(--success)" }}>
              <span className="text-white text-[16px]">📞</span>
            </a>
            <Link href="/chat"
                  className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90"
                  style={{ background: "var(--brand)" }}>
              <span className="text-white text-[16px]">💬</span>
            </Link>
          </div>
        </div>

        {/* OTP Card */}
        {status === "arrived" && (
          <div className="rounded-xl p-4 mb-4 text-center anim-pop"
               style={{ background: "var(--brand-tint)", border: "2px solid var(--brand)" }}>
            <p className="text-[11px] font-semibold" style={{ color: "var(--brand)" }}>Share this OTP to start the job</p>
            <p className="text-[32px] font-black tracking-[0.3em] mt-1"
               style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>{otp}</p>
          </div>
        )}

        {/* Status timeline */}
        <div className="flex items-center gap-2 mb-4">
          {["en_route", "arrived", "working", "completed"].map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                   style={{
                     background: ["en_route", "arrived", "working", "completed"].indexOf(status) >= i ? "var(--brand)" : "var(--bg-elevated)",
                     color: ["en_route", "arrived", "working", "completed"].indexOf(status) >= i ? "#fff" : "var(--text-3)",
                   }}>
                {i + 1}
              </div>
              {i < 3 && (
                <div className="flex-1 h-0.5 rounded-full"
                     style={{ background: ["en_route", "arrived", "working", "completed"].indexOf(status) > i ? "var(--brand)" : "var(--bg-elevated)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {status === "en_route" && (
            <button onClick={() => { setStatus("arrived"); setEta(0); }}
                    className="flex-1 rounded-xl py-3.5 text-[13px] font-bold text-white active:scale-95"
                    style={{ background: "var(--success)" }}>
              📍 Worker Arrived
            </button>
          )}
          {status === "arrived" && (
            <button onClick={() => setStatus("working")}
                    className="flex-1 rounded-xl py-3.5 text-[13px] font-bold text-white active:scale-95"
                    style={{ background: "var(--brand)" }}>
              ▶ Start Job
            </button>
          )}
          {status === "working" && (
            <button onClick={() => setStatus("completed")}
                    className="flex-1 rounded-xl py-3.5 text-[13px] font-bold text-white active:scale-95"
                    style={{ background: "var(--success)" }}>
              ✓ Job Complete
            </button>
          )}
          {status === "completed" && (
            <Link href="/booking"
                  className="flex-1 rounded-xl py-3.5 text-center text-[13px] font-bold text-white active:scale-95"
                  style={{ background: "var(--brand)" }}>
              💳 Pay & Review →
            </Link>
          )}
          <Link href="/"
                className="rounded-xl py-3.5 px-5 text-[13px] font-bold active:scale-95"
                style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
            ✕
          </Link>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .mapboxgl-ctrl-attrib { display: none !important; }
      `}</style>
    </div>
  );
}
