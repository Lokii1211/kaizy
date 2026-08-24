"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { useAuth } from "@/stores/AuthStore";
import { useI18n } from "@/components/I18nProvider";
import LoadingShell from "@/components/LoadingShell";
import { WorkerCardSkeleton } from "@/components/Skeletons";
import { formatPrice } from "@/lib/formatters";
import UserAvatar from "@/components/UserAvatar";
import { getSupabase } from "@/lib/supabase";

// ============================================================
// KAIZY HIRER HOME — Real Mapbox GL Map + Supabase Realtime
// Zero fake data · Real GPS location & geocoding · Live counts
// ============================================================

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const TRADES = [
  { icon: "⚡", name: "Electrician", key: "electrician", color: "#FF6B00" },
  { icon: "🔧", name: "Plumber", key: "plumber", color: "#3B82F6" },
  { icon: "🚗", name: "Mechanic", key: "mechanic", color: "#8B5CF6" },
  { icon: "❄️", name: "AC Repair", key: "ac_repair", color: "#06B6D4" },
  { icon: "🪚", name: "Carpenter", key: "carpenter", color: "#F59E0B" },
  { icon: "🎨", name: "Painter", key: "painter", color: "#10B981" },
  { icon: "⚒️", name: "Mason", key: "mason", color: "#EF4444" },
  { icon: "🔒", name: "Locksmith", key: "locksmith", color: "#64748B" },
];

const tradeColors: Record<string, string> = {
  electrician: "#FF6B00",
  plumber: "#3B82F6",
  mechanic: "#8B5CF6",
  ac_repair: "#06B6D4",
  carpenter: "#F59E0B",
  painter: "#10B981",
  mason: "#EF4444",
  locksmith: "#64748B",
};

const tradeIcons: Record<string, string> = {
  electrician: "⚡",
  plumber: "🔧",
  mechanic: "🚗",
  ac_repair: "❄️",
  carpenter: "🪚",
  painter: "🎨",
  mason: "⚒️",
  locksmith: "🔒",
};

interface RealWorker {
  id: string;
  name: string;
  profile_photo?: string | null;
  trade: string;
  trade_primary: string;
  rating: number;
  totalJobs: number;
  verification_lvl: number;
  verified: boolean;
  is_online: boolean;
  rate: number;
  starting_price: number;
  cheapest_service: string;
  distance: number;
  distance_km: number;
  eta: number;
  eta_minutes: number;
  lat: number;
  lng: number;
}

export default function HomePage() {
  const { isDark, toggle } = useTheme();
  const { userType, loading: authLoading } = useAuth();
  const { locale } = useI18n();
  const router = useRouter();

  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>("Detecting location...");
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [workers, setWorkers] = useState<RealWorker[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState<boolean>(true);
  const [highlightedWorkerId, setHighlightedWorkerId] = useState<string | null>(null);
  const [notified, setNotified] = useState<boolean>(false);
  const [liveTime, setLiveTime] = useState<string>("");
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null);

  // ── ROLE CHECK: Workers go to /dashboard/worker ──
  useEffect(() => {
    if (userType === "worker") {
      router.replace("/dashboard/worker");
    }
  }, [userType, router]);

  if (userType === "worker") {
    return <LoadingShell />;
  }

  // ── 1. REAL GPS LOCATION & REVERSE GEOCODING ──
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocation({ lat: 11.0168, lng: 76.9558 });
      setLocationName("Coimbatore");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);

        // Reverse geocode via Mapbox Places API
        if (MAPBOX_TOKEN) {
          try {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?types=neighborhood,place,locality&limit=1&access_token=${MAPBOX_TOKEN}`
            );
            const data = await res.json();
            if (data.features?.[0]?.text) {
              setLocationName(data.features[0].text);
            } else if (data.features?.[0]?.place_name) {
              setLocationName(data.features[0].place_name.split(",")[0]);
            } else {
              setLocationName("Your Location");
            }
          } catch {
            setLocationName("Your Location");
          }
        } else {
          // OpenStreetMap reverse geocode fallback
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`,
              { headers: { "Accept-Language": "en", "User-Agent": "Kaizy-App/1.0" } }
            );
            const data = await res.json();
            const sub = data.address?.neighbourhood || data.address?.suburb || data.address?.city || "Your Location";
            setLocationName(sub);
          } catch {
            setLocationName("Your Location");
          }
        }
      },
      () => {
        setLocation({ lat: 11.0168, lng: 76.9558 });
        setLocationName("Set your location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── 2. REAL LIVE ONLINE WORKER COUNT (Postgres Realtime) ──
  useEffect(() => {
    const supabase = getSupabase();

    const fetchCount = async () => {
      try {
        const { count, error } = await supabase
          .from("worker_profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_online", true);

        if (!error && count !== null) {
          setOnlineCount(count);
        }
      } catch (err) {
        console.error("[online-count error]", err);
      }
    };

    fetchCount();

    // Subscribe to realtime changes in worker_profiles
    const channel = supabase
      .channel("online-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "worker_profiles",
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── 3. REAL NEARBY WORKERS QUERY (30s auto-refresh) ──
  const fetchNearbyWorkers = useCallback(async () => {
    if (!location) return;

    try {
      setLoadingWorkers(true);
      const queryParams = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        radius: "20",
        ...(selectedTrade ? { trade: selectedTrade } : {}),
      });

      const res = await fetch(`/api/workers/nearby?${queryParams.toString()}`);
      const json = await res.json();

      if (json.success && json.data?.workers) {
        setWorkers(json.data.workers);
      } else {
        setWorkers([]);
      }
    } catch (err) {
      console.error("[fetchNearbyWorkers error]", err);
      setWorkers([]);
    } finally {
      setLoadingWorkers(false);
    }
  }, [location, selectedTrade]);

  useEffect(() => {
    fetchNearbyWorkers();
    const interval = setInterval(fetchNearbyWorkers, 30000);
    return () => clearInterval(interval);
  }, [fetchNearbyWorkers]);

  // ── 4. CATEGORY CHIPS REAL COUNTS ──
  const tradeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    workers.forEach((w) => {
      const key = w.trade_primary || w.trade;
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [workers]);

  // ── 5. REAL MAPBOX MAP INITIALIZATION (Full bleed, 0 margin, zero controls) ──
  useEffect(() => {
    if (!mapContainerRef.current || !location) return;

    let isCancelled = false;

    const initializeMapbox = async () => {
      try {
        const mapboxglModule = (await import("mapbox-gl")).default;

        // Ensure mapbox-gl css is injected
        if (!document.getElementById("mapbox-gl-css")) {
          const link = document.createElement("link");
          link.id = "mapbox-gl-css";
          link.rel = "stylesheet";
          link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
          document.head.appendChild(link);
        }

        if (isCancelled || !mapContainerRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapboxglModule as any).accessToken =
          MAPBOX_TOKEN || "pk.eyJ1Ijoia2FpenkiLCJhIjoiY2x6c2FmZXJ0MDAwMDJqcTE4bnNkOGpxayJ9.dev";

        if (!mapRef.current) {
          const map = new mapboxglModule.Map({
            container: mapContainerRef.current,
            style: isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/dark-v11",
            center: [location.lng, location.lat],
            zoom: 14,
            attributionControl: false,
          });

          map.on("load", () => {
            if (isCancelled) return;

            // ── User Pin: 16px Blue Circle with 32px Pulsing Ring ──
            const userPinEl = document.createElement("div");
            userPinEl.className = "kaizy-user-pin";
            userPinEl.innerHTML = `
              <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center">
                <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,139,255,0.3);animation:gps-ring 2s infinite ease-out"></div>
                <div style="width:16px;height:16px;border-radius:50%;background:#3B82F6;border:3px solid #FFFFFF;box-shadow:0 2px 8px rgba(0,0,0,0.35);position:relative;z-index:2"></div>
              </div>
            `;

            userMarkerRef.current = new mapboxglModule.Marker({ element: userPinEl })
              .setLngLat([location.lng, location.lat])
              .addTo(map);
          });

          mapRef.current = map;
        } else {
          // Fly to updated coordinates if location changes
          mapRef.current.flyTo({
            center: [location.lng, location.lat],
            zoom: 14,
            duration: 1500,
          });
          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([location.lng, location.lat]);
          }
        }
      } catch (e) {
        console.error("[Mapbox initialization]", e);
      }
    };

    initializeMapbox();

    return () => {
      isCancelled = true;
    };
  }, [location, isDark]);

  // ── 6. RENDER WORKER DOTS ON MAP (32px Circle + Emoji + OnTap Bottom Sheet Highlight) ──
  useEffect(() => {
    if (!mapRef.current || !location) return;

    const renderWorkerMarkers = async () => {
      try {
        const mapboxglModule = (await import("mapbox-gl")).default;
        const map = mapRef.current;

        // Clear existing markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        workers.forEach((w) => {
          const color = tradeColors[w.trade_primary || w.trade] || "#FF6B00";
          const icon = tradeIcons[w.trade_primary || w.trade] || "🔧";
          const isHighlighted = highlightedWorkerId === w.id;

          const dotEl = document.createElement("div");
          dotEl.className = "kaizy-worker-marker";
          dotEl.style.cursor = "pointer";
          dotEl.innerHTML = `
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: ${color};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 15px;
              color: #FFFFFF;
              border: 2px solid #FFFFFF;
              box-shadow: ${isHighlighted ? `0 0 0 4px ${color}, 0 4px 12px rgba(0,0,0,0.4)` : "0 2px 8px rgba(0,0,0,0.3)"};
              transition: transform 0.2s ease;
              transform: ${isHighlighted ? "scale(1.2)" : "scale(1)"};
            ">
              ${icon}
            </div>
          `;

          // On tap: highlight worker and scroll card into view
          dotEl.addEventListener("click", () => {
            setHighlightedWorkerId(w.id);
            const cardEl = document.getElementById(`worker-card-${w.id}`);
            if (cardEl) {
              cardEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }
          });

          const marker = new mapboxglModule.Marker({ element: dotEl })
            .setLngLat([w.lng, w.lat])
            .addTo(map);

          markersRef.current.push(marker);
        });
      } catch (e) {
        console.error("[worker markers error]", e);
      }
    };

    renderWorkerMarkers();
  }, [workers, highlightedWorkerId, location]);

  // Live time ticker
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Voice Search Handler
  const handleMicClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      router.push("/search");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = locale === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsVoiceListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      if (result.isFinal && text.trim()) {
        setIsVoiceListening(false);
        router.push(`/search?q=${encodeURIComponent(text.trim())}`);
      }
    };
    recognition.onerror = () => setIsVoiceListening(false);
    recognition.onend = () => setIsVoiceListening(false);
    recognition.start();
  }, [locale, router]);

  // Save notification preference for empty state
  const handleNotifyPreference = async () => {
    setNotified(true);
    try {
      await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notify_nearby: true }),
      });
    } catch {}
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black select-none">
      {/* ── FULL BLEED MAPBOX MAP (0 Margin, No Scrollbars, No Borders) ── */}
      <div
        ref={mapContainerRef}
        className="fixed inset-0 w-full h-full z-0 overflow-hidden"
        style={{ margin: 0, padding: 0, border: "none" }}
      />

      {/* ── TOP BAR (Glassmorphism overlay) ── */}
      <div
        className="relative z-20 px-5 pt-3 pb-4 border-b border-white/10"
        style={{
          background: "rgba(8, 8, 8, 0.75)",
          backdropFilter: "blur(20px) saturate(1.8)",
          WebkitBackdropFilter: "blur(20px) saturate(1.8)",
        }}
      >
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kaizy-logo.png"
              alt="Kaizy"
              className="w-7 h-7 rounded-[10px] shadow-md"
            />
            <span
              className="text-[11px] font-black tracking-wider text-white/90"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {liveTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!userType && !authLoading && (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-full text-[11px] font-bold text-white active:scale-95 transition-transform"
                style={{ background: "var(--brand)" }}
              >
                Login
              </Link>
            )}
            <button
              onClick={toggle}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[13px] text-white active:scale-90 transition-transform"
              aria-label="Toggle theme"
            >
              {isDark ? "🌙" : "☀️"}
            </button>
            <Link
              href="/notifications"
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[13px] text-white relative active:scale-90 transition-transform"
              aria-label="Notifications"
            >
              <span>🔔</span>
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-black" />
            </Link>
          </div>
        </div>

        {/* Real Location Header & Live Online Indicator */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px]">📍</span>
            <span className="text-[14px] font-black text-white tracking-tight">
              {locationName}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-green-500 online-dot" />
            <p className="text-[11px] font-bold text-green-400">
              {onlineCount} verified workers online
            </p>
          </div>
        </div>

        {/* Search Bar with Voice */}
        <div
          className="flex items-center gap-2.5 rounded-[16px] px-3.5 py-3 bg-white/10 border border-white/15 backdrop-blur-md shadow-lg"
          style={{
            borderColor: isVoiceListening ? "var(--brand)" : "rgba(255,255,255,0.15)",
          }}
        >
          <Link
            href="/search"
            className="flex items-center gap-2.5 flex-1 min-w-0 active:scale-[0.99] transition-transform"
          >
            <span className="text-[16px] opacity-80">🔍</span>
            <span className="text-[12px] font-medium text-white/70 truncate">
              {isVoiceListening ? "Listening..." : "What do you need help with?"}
            </span>
          </Link>
          <button
            type="button"
            onClick={handleMicClick}
            aria-label="Voice search"
            className="text-[15px] p-1 text-[#FF6B00] active:scale-90 transition-transform shrink-0"
          >
            🎤
          </button>
        </div>
      </div>

      {/* ── SOS Floating Emergency Button ── */}
      <Link href="/emergency" className="fixed z-30" style={{ right: 16, bottom: 220 }}>
        <div
          className="flex flex-col items-center justify-center rounded-full text-white sos-pulse shadow-2xl"
          style={{ width: 50, height: 50, background: "var(--danger)" }}
        >
          <span className="text-[16px] leading-none">🆘</span>
          <span className="text-[7px] font-black tracking-wider mt-0.5">SOS</span>
        </div>
      </Link>

      {/* ── CATEGORY CHIPS WITH REAL COUNTS ── */}
      <div className="fixed left-0 right-0 z-20" style={{ bottom: 172, padding: "0 16px" }}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setSelectedTrade(null)}
            className="flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-[11px] font-black active:scale-95 transition-all backdrop-blur-md"
            style={{
              background: selectedTrade === null ? "var(--brand)" : "rgba(20, 20, 20, 0.8)",
              color: "#FFFFFF",
              border: `1.5px solid ${selectedTrade === null ? "var(--brand)" : "rgba(255,255,255,0.15)"}`,
              boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
            }}
          >
            <span>✨</span> All ({workers.length})
          </button>

          {TRADES.map((t) => {
            const isSelected = selectedTrade === t.key;
            const count = tradeCounts[t.key] || 0;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelectedTrade(isSelected ? null : t.key)}
                className="flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-[11px] font-black active:scale-95 transition-all backdrop-blur-md"
                style={{
                  background: isSelected ? t.color : "rgba(20, 20, 20, 0.8)",
                  color: "#FFFFFF",
                  border: `1.5px solid ${isSelected ? t.color : "rgba(255,255,255,0.15)"}`,
                  boxShadow: isSelected ? `0 4px 16px ${t.color}60` : "0 4px 14px rgba(0,0,0,0.4)",
                }}
              >
                <span>{t.icon}</span>
                <span>{t.name}</span>
                <span className="opacity-80">· {count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── BOTTOM SHEET / NEARBY WORKERS STRIP ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 pt-2 pb-5 border-t border-white/10"
        style={{
          background: "rgba(10, 10, 10, 0.92)",
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
        }}
      >
        <div className="flex justify-between items-center px-5 mb-2.5">
          <div className="flex items-center gap-2">
            <span
              className="text-[13px] font-black text-white"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              Nearby Captains
            </span>
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
              DISPATCH READY
            </span>
          </div>
          <Link href="/marketplace" className="text-[11px] font-bold text-[#FF6B00]">
            See All →
          </Link>
        </div>

        {/* Loading Skeletons */}
        {loadingWorkers && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4">
            {[1, 2, 3].map((i) => (
              <WorkerCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ── 6. EMPTY STATE (No workers online) ── */}
        {!loadingWorkers && workers.length === 0 && (
          <div className="mx-4 p-4 rounded-[20px] bg-white/5 border border-white/10 text-center anim-fade">
            <span className="text-[28px] mb-1 block">🌙</span>
            <h3 className="text-[14px] font-black text-white">
              No workers online in your area right now
            </h3>
            <p className="text-[11px] font-medium text-white/60 mt-0.5 mb-3">
              Workers are usually online from 8am.
            </p>
            {notified ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-[11px] font-bold">
                <span>✓</span> We&apos;ll notify you on WhatsApp as soon as a captain goes online
              </div>
            ) : (
              <button
                type="button"
                onClick={handleNotifyPreference}
                className="px-5 py-2.5 rounded-full bg-[#FF6B00] text-white text-[12px] font-black shadow-md active:scale-95 transition-all"
              >
                🔔 Notify me when available
              </button>
            )}
          </div>
        )}

        {/* Real Workers List */}
        {!loadingWorkers && workers.length > 0 && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {workers.map((w) => {
              const color = tradeColors[w.trade_primary || w.trade] || "#FF6B00";
              const icon = tradeIcons[w.trade_primary || w.trade] || "🔧";
              const isSelected = highlightedWorkerId === w.id;

              return (
                <Link
                  key={w.id}
                  id={`worker-card-${w.id}`}
                  href={`/worker/${w.id}`}
                  className="shrink-0 rounded-[20px] p-3.5 active:scale-[0.97] transition-all relative"
                  style={{
                    width: 172,
                    background: "rgba(24, 24, 24, 0.95)",
                    border: isSelected ? `2px solid ${color}` : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: isSelected ? `0 0 16px ${color}50` : "0 4px 16px rgba(0,0,0,0.5)",
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <UserAvatar
                      name={w.name}
                      size={40}
                      badge={
                        w.verified ? (
                          <div
                            className="text-[8px] rounded-full w-[14px] h-[14px] flex items-center justify-center"
                            style={{ background: "var(--trust)", color: "#fff" }}
                          >
                            ✓
                          </div>
                        ) : null
                      }
                    />
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-white truncate">{w.name}</p>
                      <p className="text-[10px] font-semibold truncate" style={{ color }}>
                        {icon} {(w.trade_primary || w.trade)?.replace("_", " ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[10px] text-amber-400">★</span>
                        <span className="text-[11px] font-black text-white">{w.rating}</span>
                        <span className="text-[8px] text-white/50">({w.totalJobs})</span>
                      </div>
                      <p className="text-[9px] font-medium text-white/60">
                        {w.distance_km}km · {w.eta_minutes}m
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-[13px] font-black text-white"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {formatPrice(w.starting_price || w.rate)}
                      </p>
                      <p className="text-[8px] font-semibold text-green-400">Online</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
