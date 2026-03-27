"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// LIVE TRACKING v10.0 — Stitch "Digital Artisan" Design
// Glassmorphism overlays · JetBrains Mono · Gradient CTAs
// ============================================================

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface WorkerInfo {
  name: string; trade: string; rating: number;
  initials: string; kaizyScore: number; phone: string;
}

const tradeIcons: Record<string, string> = {
  electrician: "⚡", electrical: "⚡", plumber: "🔧", plumbing: "🔧",
  mechanic: "🚗", ac_repair: "❄️", carpenter: "🪚", painter: "🎨", technician: "🔧",
};

export default function TrackingPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const workerMarkerRef = useRef<unknown>(null);
  const routeDataRef = useRef<[number, number][]>([]);
  const routeStepRef = useRef(0);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [workerPos, setWorkerPos] = useState<{ lat: number; lng: number } | null>(null);
  const [worker, setWorker] = useState<WorkerInfo | null>(null);
  const [eta, setEta] = useState(0);
  const [status, setStatus] = useState<"en_route" | "arrived" | "working" | "completed">("en_route");
  const [otp] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [mapLoaded, setMapLoaded] = useState(false);
  const [distanceKm, setDistanceKm] = useState("");
  const [gpsReady, setGpsReady] = useState(false);
  const [hasBooking, setHasBooking] = useState(false);
  const initialEtaRef = useRef(0);

  // 1. Load REAL booking data — redirect if none
  useEffect(() => {
    let foundBooking = false;
    let gotLocation = false;

    // Load worker data from sessionStorage (set during booking)
    try {
      const stored = sessionStorage.getItem("kaizy_booked_worker");
      if (stored) {
        const w = JSON.parse(stored);
        if (w.name && w.name !== "Worker") {
          setWorker({
            name: w.name,
            trade: w.trade || "Technician",
            rating: w.rating || 4.5,
            initials: w.name.split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 2),
            kaizyScore: w.kaizyScore || 500,
            phone: w.phone || "",
          });
          if (w.lat && w.lng) {
            setWorkerPos({ lat: Number(w.lat), lng: Number(w.lng) });
          }
          foundBooking = true;
        }
      }
    } catch {}

    // Check kaizy_active_job (set by BookingStore v8.0)
    try {
      const activeJob = sessionStorage.getItem("kaizy_active_job");
      if (activeJob) {
        const job = JSON.parse(activeJob);
        if (job.jobId) {
          foundBooking = true;
        }
      }
    } catch {}

    // Load verified booking location (multiple storage keys for compatibility)
    const locationKeys = ["kaizy_booking_location", "kaizy_verified_location"];
    for (const key of locationKeys) {
      if (gotLocation) break;
      try {
        const storedLoc = sessionStorage.getItem(key);
        if (storedLoc) {
          const loc = JSON.parse(storedLoc);
          if (loc.lat && loc.lng) {
            setUserPos({ lat: Number(loc.lat), lng: Number(loc.lng) });
            setGpsReady(true);
            gotLocation = true;
            foundBooking = true;
          }
        }
      } catch {}
    }

    // If no booking data, show notice
    if (!foundBooking) {
      setWorker({
        name: "No Active Booking",
        trade: "—",
        rating: 0,
        initials: "?",
        kaizyScore: 0,
        phone: "",
      });
    }

    setHasBooking(foundBooking);

    // Fallback: Get GPS if no booking location was loaded
    if (!gotLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setGpsReady(true);
          },
          () => {
            setUserPos({ lat: 11.0168, lng: 76.9558 });
            setGpsReady(true);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        setUserPos({ lat: 11.0168, lng: 76.9558 });
        setGpsReady(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch real route from Mapbox Directions API
  const fetchRoute = useCallback(async (wLng: number, wLat: number, uLng: number, uLat: number) => {
    if (!MAPBOX_TOKEN) return null;
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${wLng},${wLat};${uLng},${uLat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.routes?.[0]) {
        const route = json.routes[0];
        const coords = route.geometry.coordinates as [number, number][];
        const durationMin = Math.round(route.duration / 60);
        const distKm = (route.distance / 1000).toFixed(1);
        setEta(durationMin);
        initialEtaRef.current = durationMin;
        setDistanceKm(`${distKm} km`);
        return { coords, duration: durationMin };
      }
    } catch (e) { console.error('[directions]', e); }
    return null;
  }, []);

  // 2. Initialize Mapbox ONLY AFTER GPS is ready
  useEffect(() => {
    if (!gpsReady || !userPos || !mapContainer.current || !MAPBOX_TOKEN || mapRef.current) return;
    let cancelled = false;

    const initMap = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
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

        // Use worker position if available, otherwise just show user location
        const wPos = workerPos || { lat: userPos.lat + 0.01, lng: userPos.lng + 0.01 };
        const centerLng = (userPos.lng + wPos.lng) / 2;
        const centerLat = (userPos.lat + wPos.lat) / 2;

        const map = new mapboxgl.Map({
          container: mapContainer.current,
          style: isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v12",
          center: [centerLng, centerLat],
          zoom: 14,
          attributionControl: false,
          pitch: 45,
          bearing: -10,
        });

        map.on("load", async () => {
          if (cancelled) return;

          // User marker
          const userEl = document.createElement("div");
          userEl.innerHTML = `<div style="position:relative;width:44px;height:56px;display:flex;flex-direction:column;align-items:center">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#2563EB);border:3px solid white;box-shadow:0 4px 12px rgba(59,130,246,0.4);display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </div>
            <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #2563EB;margin-top:-2px"></div>
            <div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(59,130,246,0.2);animation:track-pulse 2s ease-out infinite"></div>
            <div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);background:#2563EB;color:white;padding:2px 6px;border-radius:6px;font-size:9px;font-weight:700;white-space:nowrap">You</div>
          </div>`;
          new mapboxgl.Marker({ element: userEl, anchor: 'bottom' })
            .setLngLat([userPos.lng, userPos.lat])
            .addTo(map);

          // Worker marker — only if we have real worker data
          if (workerPos && worker && hasBooking) {
            const tradeIcon = tradeIcons[worker.trade.toLowerCase()] || "🔧";
            const workerEl = document.createElement("div");
            workerEl.id = "worker-tracker";
            workerEl.innerHTML = `<div style="position:relative;display:flex;flex-direction:column;align-items:center">
              <div style="position:absolute;inset:-10px;border-radius:50%;background:rgba(255,107,0,0.1);animation:track-pulse 2s ease-out infinite"></div>
              <div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#FF6B00,#E85D00);display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 16px rgba(255,107,0,0.5);border:3px solid white;position:relative;z-index:2">${tradeIcon}</div>
              <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid #FF6B00;margin-top:-3px;position:relative;z-index:1"></div>
              <div style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);background:#FF6B00;color:white;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.15)">${worker.name}</div>
            </div>`;
            const workerMarker = new mapboxgl.Marker({ element: workerEl, anchor: 'bottom' })
              .setLngLat([workerPos.lng, workerPos.lat])
              .addTo(map);
            workerMarkerRef.current = workerMarker;

            // Fetch route
            const routeResult = await fetchRoute(workerPos.lng, workerPos.lat, userPos.lng, userPos.lat);
            if (routeResult) {
              routeDataRef.current = routeResult.coords;
              routeStepRef.current = 0;
              map.addSource("route", {
                type: "geojson",
                data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: routeResult.coords } },
              });
              map.addLayer({ id: "route-shadow", type: "line", source: "route",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#000", "line-width": 7, "line-opacity": 0.08, "line-blur": 3 },
              });
              map.addLayer({ id: "route", type: "line", source: "route",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#FF6B00", "line-width": 5, "line-opacity": 0.9 },
              });
            }

            // Fit bounds
            try {
              const bounds = new mapboxgl.LngLatBounds()
                .extend([userPos.lng, userPos.lat])
                .extend([workerPos.lng, workerPos.lat]);
              map.fitBounds(bounds, { padding: { top: 100, bottom: 300, left: 50, right: 50 } });
            } catch {}
          }

          map.addControl(new mapboxgl.NavigationControl(), "top-right");
          mapRef.current = map;
          setMapLoaded(true);
        });
      } catch (e) {
        console.error("[mapbox tracking]", e);
        setMapLoaded(true);
      }
    };

    initMap();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsReady, isDark]);

  // Animate worker along route
  const animateWorkerAlongRoute = useCallback(() => {
    if (!userPos || !workerPos) return;
    const coords = routeDataRef.current;
    if (coords.length === 0) return;

    const step = routeStepRef.current;
    const totalSteps = coords.length;
    if (step >= totalSteps - 1) {
      setStatus("arrived");
      setEta(0);
      return;
    }

    const skipSize = Math.max(1, Math.floor(totalSteps / 80));
    const nextStep = Math.min(step + skipSize, totalSteps - 1);
    routeStepRef.current = nextStep;
    const [lng, lat] = coords[nextStep];

    setWorkerPos({ lat, lng });
    if (workerMarkerRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (workerMarkerRef.current as any).setLngLat([lng, lat]);
    }

    const progress = nextStep / totalSteps;
    const remaining = Math.max(1, Math.round(initialEtaRef.current * (1 - progress)));
    setEta(remaining);

    if (mapRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = mapRef.current as any;
        const source = map.getSource("route");
        if (source) {
          source.setData({
            type: "Feature", properties: {},
            geometry: { type: "LineString", coordinates: coords.slice(nextStep) },
          });
        }
      } catch {}
    }
  }, [userPos, workerPos]);

  // Movement timer — only if real booking
  useEffect(() => {
    if (status !== "en_route" || !hasBooking) return;
    animationRef.current = setInterval(animateWorkerAlongRoute, 3000);
    return () => { if (animationRef.current) clearInterval(animationRef.current); };
  }, [status, hasBooking, animateWorkerAlongRoute]);

  const statusInfo = {
    en_route: { label: "Worker is on the way", icon: "🏍️", color: "var(--brand)", bgColor: "rgba(255,107,0,0.1)" },
    arrived: { label: "Worker has arrived!", icon: "📍", color: "var(--success)", bgColor: "rgba(34,197,94,0.1)" },
    working: { label: "Work in progress", icon: "🔧", color: "var(--info)", bgColor: "rgba(59,130,246,0.1)" },
    completed: { label: "Job completed!", icon: "✅", color: "var(--success)", bgColor: "rgba(34,197,94,0.1)" },
  };
  const info = statusInfo[status];

  // NO BOOKING — show message
  if (!hasBooking && gpsReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-app)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
             style={{ background: "var(--brand-tint)" }}>
          <span className="text-[36px]">📍</span>
        </div>
        <h1 className="text-[20px] font-black tracking-tight mb-2" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>No Active Booking</h1>
        <p className="text-[12px] text-center mb-6 font-medium" style={{ color: "var(--text-3)" }}>
          Book a worker first to see live tracking with real-time map, ETA, and route navigation.
        </p>
        <Link href="/booking"
              className="rounded-[16px] px-8 py-4 text-[14px] font-black text-white active:scale-[0.97] transition-transform"
              style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
          📋 Book a Worker
        </Link>
        <Link href="/" className="mt-3 text-[11px] font-bold" style={{ color: "var(--text-3)" }}>
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-app)" }}>
      {/* MAP */}
      <div className="relative flex-1" style={{ minHeight: "55vh" }}>
        <div ref={mapContainer} className="absolute inset-0" />

        {!mapLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
               style={{ background: isDark ? "#1a1a2e" : "#e8f4f8" }}>
            <div className="w-8 h-8 border-3 rounded-full animate-spin mb-3"
                 style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>
              {gpsReady ? "Loading map..." : "Getting your location..."}
            </p>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pt-4">
          <Link href="/" className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 shadow-lg"
                style={{ background: "var(--bg-card)" }}>
            <span className="text-[15px]">←</span>
          </Link>
          <div className="rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
               style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)" }}>
            <div className="w-2 h-2 rounded-full online-dot" style={{ background: info.color }} />
            <span className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{info.label}</span>
          </div>
          <button onClick={async () => {
            const url = window.location.href;
            if (navigator.share && worker) {
              await navigator.share({
                title: `Track ${worker.name} on Kaizy`,
                text: `${worker.name} (${worker.trade}) is on the way! ETA: ${eta} min`,
                url,
              });
            } else {
              await navigator.clipboard.writeText(url);
              alert("Tracking link copied!");
            }
          }} className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 shadow-lg"
                  style={{ background: "var(--bg-card)" }}>
            <span className="text-[15px]">📤</span>
          </button>
        </div>

        {/* ETA badge — only with real data */}
        {status === "en_route" && eta > 0 && eta < 500 && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 rounded-[16px] px-5 py-3 shadow-xl text-center"
               style={{ background: "var(--brand)" }}>
            <p className="text-[28px] font-black text-white leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{eta}</p>
            <p className="text-[8px] font-bold text-white mt-0.5 uppercase tracking-wider" style={{ opacity: 0.8 }}>min away</p>
            {distanceKm && <p className="text-[8px] text-white mt-0.5" style={{ opacity: 0.6, fontFamily: "'JetBrains Mono', monospace" }}>{distanceKm}</p>}
          </div>
        )}

        {/* Re-center button */}
        {mapLoaded && userPos && (
          <button onClick={() => {
            if (mapRef.current && userPos) {
              const wP = workerPos || userPos;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (mapRef.current as any).flyTo({ center: [(userPos.lng + wP.lng) / 2, (userPos.lat + wP.lat) / 2], zoom: 14, duration: 1000 });
            }
          }} className="absolute bottom-4 right-4 z-10 w-11 h-11 rounded-full shadow-lg flex items-center justify-center active:scale-90"
                  style={{ background: "var(--bg-card)" }}>
            <span className="text-[18px]">📍</span>
          </button>
        )}
      </div>

      {/* BOTTOM SHEET */}
      <div className="shrink-0 rounded-t-[24px] -mt-4 relative z-10 px-5 pt-5 pb-6"
           style={{ background: "var(--bg-app)", boxShadow: "0 -4px 24px rgba(0,0,0,0.06)" }}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--bg-elevated)" }} />

        {/* Worker info */}
        {worker && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold text-white"
                 style={{ background: "var(--gradient-cta)" }}>{worker.initials}</div>
            <div className="flex-1">
              <p className="text-[14px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>{worker.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>{tradeIcons[worker.trade.toLowerCase()] || "🔧"} {worker.trade}</span>
                {worker.rating > 0 && <span className="text-[10px] font-bold" style={{ color: "var(--warning)" }}>★ {worker.rating.toFixed(1)}</span>}
                {worker.kaizyScore > 0 && <span className="trust-badge">KS {worker.kaizyScore}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {worker.phone && (
                <a href={`tel:${worker.phone}`}
                   className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                   style={{ background: "var(--success)" }}>
                  <span className="text-white text-[16px]">📞</span>
                </a>
              )}
              <Link href="/chat"
                    className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: "var(--brand)" }}>
                <span className="text-white text-[16px]">💬</span>
              </Link>
            </div>
          </div>
        )}

        {/* OTP Card */}
        {status === "arrived" && (
          <div className="rounded-[16px] p-4 mb-4 text-center anim-pop"
               style={{ background: "var(--brand-tint)" }}>
            <p className="text-[10px] font-bold" style={{ color: "var(--brand)" }}>Share this OTP to start the job</p>
            <p className="text-[32px] font-black tracking-[0.3em] mt-1"
               style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>{otp}</p>
          </div>
        )}

        {/* Status timeline */}
        <div className="flex items-center gap-1 mb-4 px-1">
          {(["en_route", "arrived", "working", "completed"] as const).map((s, i) => {
            const labels = ["En Route", "Arrived", "Working", "Done"];
            const icons = ["🏍️", "📍", "🔧", "✅"];
            const isActive = ["en_route", "arrived", "working", "completed"].indexOf(status) >= i;
            const isCurrent = status === s;
            return (
              <div key={s} className="flex-1 flex items-center gap-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] ${isCurrent ? 'shadow-lg' : ''}`}
                       style={{
                         background: isActive ? "var(--brand)" : "var(--bg-elevated)",
                         color: isActive ? "#fff" : "var(--text-3)",
                         transform: isCurrent ? "scale(1.15)" : "scale(1)",
                         transition: "all 0.3s ease",
                       }}>
                    {icons[i]}
                  </div>
                  <span className="text-[8px] font-semibold mt-1" style={{ color: isActive ? "var(--brand)" : "var(--text-3)" }}>
                    {labels[i]}
                  </span>
                </div>
                {i < 3 && (
                  <div className="h-0.5 flex-1 rounded-full -mt-3"
                       style={{ background: ["en_route", "arrived", "working", "completed"].indexOf(status) > i ? "var(--brand)" : "var(--bg-elevated)" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {status === "en_route" && (
            <>
              <button onClick={() => {
                if (userPos) {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${userPos.lat},${userPos.lng}&travelmode=driving`, '_blank');
                }
              }} className="flex-1 rounded-[14px] py-3.5 text-[12px] font-bold text-white active:scale-95 transition-transform"
                      style={{ background: "var(--info)" }}>
                🗺️ Navigate
              </button>
              <button onClick={() => { setStatus("arrived"); setEta(0); }}
                      className="flex-1 rounded-[14px] py-3.5 text-[12px] font-bold text-white active:scale-95 transition-transform"
                      style={{ background: "var(--success)" }}>
                📍 Arrived
              </button>
            </>
          )}
          {status === "arrived" && (
            <button onClick={() => setStatus("working")}
                    className="flex-1 rounded-[14px] py-3.5 text-[12px] font-bold text-white active:scale-95 transition-transform"
                    style={{ background: "var(--gradient-cta)" }}>
              ▶ Start Job
            </button>
          )}
          {status === "working" && (
            <button onClick={() => setStatus("completed")}
                    className="flex-1 rounded-[14px] py-3.5 text-[12px] font-bold text-white active:scale-95 transition-transform"
                    style={{ background: "var(--success)" }}>
              ✓ Job Complete
            </button>
          )}
          {status === "completed" && (
            <Link href="/booking"
                  className="flex-1 rounded-[14px] py-3.5 text-center text-[12px] font-bold text-white active:scale-95 transition-transform"
                  style={{ background: "var(--gradient-cta)" }}>
              💵 Pay Cash & Review →
            </Link>
          )}
          <Link href="/"
                className="rounded-[14px] py-3.5 px-5 text-[12px] font-bold active:scale-95 transition-transform"
                style={{ background: "var(--bg-surface)", color: "var(--text-2)" }}>
            ✕
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes track-pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .mapboxgl-ctrl-attrib { display: none !important; }
        #worker-tracker { transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
      `}</style>
    </div>
  );
}
