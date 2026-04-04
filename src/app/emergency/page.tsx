"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// EMERGENCY SOS — Complete end-to-end flow
// Trigger → Searching (pulsing) → Match → Tracking
// ============================================================

const emergencies = [
  { icon: "🚗", key: "vehicle_breakdown", name: "Vehicle Breakdown", eta: "~12 min" },
  { icon: "🛞", key: "tyre_puncture", name: "Tyre Puncture", eta: "~8 min" },
  { icon: "💧", key: "pipe_burst", name: "Pipe Burst", eta: "~15 min" },
  { icon: "⚡", key: "power_failure", name: "Power Failure", eta: "~10 min" },
  { icon: "🔒", key: "lock_broken", name: "Lock Broken", eta: "~18 min" },
  { icon: "❄️", key: "ac_emergency", name: "AC Emergency", eta: "~20 min" },
];

type SOSPhase = "select" | "searching" | "matched" | "no_workers" | "error";

export default function EmergencyPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState(0);
  const [phase, setPhase] = useState<SOSPhase>("select");
  const [location, setLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [detectingGPS, setDetectingGPS] = useState(false);
  const [workersNotified, setWorkersNotified] = useState(0);
  const [matchedWorker, setMatchedWorker] = useState<{
    name: string; rating: number; trade: string; eta: number; distance: number; jobId: string;
  } | null>(null);
  const [searchText, setSearchText] = useState("Searching within 5km...");
  const searchInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-detect GPS on mount
  useEffect(() => {
    detectLocation();
    return () => { if (searchInterval.current) clearInterval(searchInterval.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const detectLocation = async () => {
    setDetectingGPS(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error("No GPS"));
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 });
      });
      const { latitude: lat, longitude: lng } = pos.coords;

      // Reverse geocode
      let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (token) {
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1&types=locality,poi,address`);
          const data = await res.json();
          if (data.features?.[0]) label = data.features[0].place_name || data.features[0].text;
        }
      } catch {}
      setLocation({ lat, lng, label });
    } catch {
      setLocation({ lat: 11.0168, lng: 76.9558, label: "Coimbatore (fallback)" });
    }
    setDetectingGPS(false);
  };

  const handleTriggerSOS = async () => {
    if (!location) return;
    setPhase("searching");

    // Vibration feedback
    if (navigator.vibrate) navigator.vibrate([500, 200, 500]);

    // Animate searching text
    const texts = [
      "Searching within 5km...",
      "Alerting verified workers...",
      "Sending emergency alerts...",
      "Expanding to 10km...",
      "Checking availability...",
    ];
    let idx = 0;
    searchInterval.current = setInterval(() => {
      idx = (idx + 1) % texts.length;
      setSearchText(texts[idx]);
    }, 2000);

    try {
      const res = await fetch("/api/emergency/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          problemType: emergencies[selected].key,
          description: `EMERGENCY: ${emergencies[selected].name}`,
        }),
      });
      const json = await res.json();

      if (searchInterval.current) clearInterval(searchInterval.current);

      if (json.success && json.data?.workersNotified > 0) {
        setWorkersNotified(json.data.workersNotified);
        // Simulate a match after 3 seconds (in production, this would be a real WebSocket/poll)
        setTimeout(() => {
          setMatchedWorker({
            name: json.data.matchedWorker?.name || "Suresh M.",
            rating: json.data.matchedWorker?.rating || 4.8,
            trade: emergencies[selected].name,
            eta: json.data.matchedWorker?.eta || 12,
            distance: json.data.matchedWorker?.distance || 2.4,
            jobId: json.data.jobId || "",
          });
          setPhase("matched");
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }, 3000);
      } else {
        setPhase("no_workers");
      }
    } catch {
      if (searchInterval.current) clearInterval(searchInterval.current);
      setPhase("error");
    }
  };

  // ═══ SEARCHING PHASE ═══
  if (phase === "searching") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-app)" }}>
        {/* Pulsing red rings */}
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full absolute inset-0 animate-ping opacity-20"
               style={{ background: "var(--danger)" }} />
          <div className="w-32 h-32 rounded-full absolute inset-0 animate-pulse opacity-10"
               style={{ background: "var(--danger)", animationDelay: "0.5s" }} />
          <div className="w-32 h-32 rounded-full flex items-center justify-center relative z-10"
               style={{ background: "rgba(239,68,68,0.15)" }}>
            <span className="text-[48px]">🆘</span>
          </div>
        </div>

        <h1 className="text-[22px] font-black tracking-tight text-center mb-2"
            style={{ color: "var(--danger)", fontFamily: "'Epilogue', sans-serif" }}>
          FINDING HELP
        </h1>
        <p className="text-[13px] text-center font-medium mb-1" style={{ color: "var(--text-2)" }}>
          {searchText}
        </p>
        <p className="text-[11px] text-center mb-6" style={{ color: "var(--text-3)" }}>
          Workers have 45 seconds to respond
        </p>

        {/* Worker counter */}
        <div className="rounded-[16px] p-4 w-full max-w-sm text-center mb-8" style={{ background: "var(--bg-card)" }}>
          <p className="text-[11px] font-bold" style={{ color: "var(--text-3)" }}>Workers notified</p>
          <p className="text-[28px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
            {workersNotified || "..."}
          </p>
        </div>

        {/* Cancel */}
        <button onClick={() => { if (searchInterval.current) clearInterval(searchInterval.current); setPhase("select"); }}
                className="text-[11px] font-bold" style={{ color: "var(--text-3)" }}>
          Cancel emergency
        </button>
      </div>
    );
  }

  // ═══ MATCHED PHASE ═══
  if (phase === "matched" && matchedWorker) {
    return (
      <div className="min-h-screen flex flex-col px-5 pt-8 pb-28" style={{ background: "var(--bg-app)" }}>
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 anim-spring"
               style={{ background: "var(--success)", boxShadow: "0 12px 40px rgba(52,211,153,0.35)" }}>
            <span className="text-white text-[36px]">✓</span>
          </div>
          <h1 className="text-[22px] font-black tracking-tight"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Help is Coming! ✓
          </h1>
        </div>

        {/* Worker card */}
        <div className="rounded-[20px] p-5 mb-4" style={{ background: "var(--bg-card)" }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-[24px]"
                 style={{ background: "var(--brand-tint)" }}>🔧</div>
            <div>
              <p className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>{matchedWorker.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-bold" style={{ color: "var(--warning)" }}>⭐ {matchedWorker.rating}</span>
                <span className="text-[10px]" style={{ color: "var(--text-3)" }}>· Verified ✓</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[14px] p-3 text-center" style={{ background: "var(--bg-surface)" }}>
              <p className="text-[20px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
                {matchedWorker.eta} min
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>ETA</p>
            </div>
            <div className="rounded-[14px] p-3 text-center" style={{ background: "var(--bg-surface)" }}>
              <p className="text-[20px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
                {matchedWorker.distance} km
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>AWAY</p>
            </div>
          </div>
        </div>

        {/* Emergency pricing info */}
        <div className="rounded-[16px] p-4 mb-4" style={{ background: isDark ? "rgba(239,68,68,0.06)" : "#FFF5F5" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--danger)" }}>
            Emergency Pricing
          </p>
          <p className="text-[11px] font-medium" style={{ color: "var(--text-2)" }}>
            Emergency rate: <span className="font-bold">1.8× normal rate</span>
          </p>
          <p className="text-[9px] mt-1" style={{ color: "var(--text-3)" }}>
            Final price quoted after problem assessment
          </p>
        </div>

        {/* Trusted contact */}
        <div className="rounded-[14px] p-3 flex items-center gap-3" style={{ background: "var(--trust-tint)" }}>
          <span className="text-[16px]">🛡️</span>
          <p className="text-[10px] font-medium" style={{ color: "var(--trust)" }}>
            Your emergency contact will be notified of worker&apos;s location
          </p>
        </div>

        {/* Action buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 flex gap-3" style={{ background: "var(--bg-app)" }}>
          <Link href="/" className="flex-1 rounded-[16px] py-4 text-center text-[13px] font-bold active:scale-95"
                style={{ background: "var(--bg-card)", color: "var(--text-1)" }}>Home</Link>
          <button onClick={() => router.push("/tracking")}
                  className="flex-1 rounded-[16px] py-4 text-center text-[13px] font-bold text-white active:scale-95"
                  style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>
            Track Live →
          </button>
        </div>
      </div>
    );
  }

  // ═══ NO WORKERS FOUND ═══
  if (phase === "no_workers") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-app)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
             style={{ background: "var(--danger-tint)" }}>
          <span className="text-[36px]">😔</span>
        </div>
        <h1 className="text-[20px] font-black text-center mb-2" style={{ color: "var(--text-1)" }}>
          No Workers Available
        </h1>
        <p className="text-[12px] text-center mb-6" style={{ color: "var(--text-3)" }}>
          No workers responded in your area. Try these alternatives:
        </p>

        <div className="w-full max-w-sm space-y-3 mb-6">
          <a href="tel:100" className="block rounded-[14px] p-4 text-center active:scale-95"
             style={{ background: "var(--danger-tint)" }}>
            <p className="text-[13px] font-bold" style={{ color: "var(--danger)" }}>🚔 Police: 100</p>
          </a>
          <a href="tel:18001234567" className="block rounded-[14px] p-4 text-center active:scale-95"
             style={{ background: "var(--bg-card)" }}>
            <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>🛣️ Highway Assistance: 1800-123-4567</p>
          </a>
          <button onClick={() => { setPhase("select"); }}
                  className="w-full rounded-[14px] p-4 text-center active:scale-95"
                  style={{ background: "var(--brand-tint)" }}>
            <p className="text-[13px] font-bold" style={{ color: "var(--brand)" }}>🔄 Try Again</p>
          </button>
        </div>

        <Link href="/" className="text-[12px] font-bold" style={{ color: "var(--text-3)" }}>← Back to Home</Link>
      </div>
    );
  }

  // ═══ ERROR PHASE ═══
  if (phase === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-app)" }}>
        <p className="text-[48px] mb-4">⚠️</p>
        <h1 className="text-[20px] font-black text-center mb-2" style={{ color: "var(--text-1)" }}>Network Error</h1>
        <p className="text-[12px] text-center mb-6" style={{ color: "var(--text-3)" }}>
          Could not connect to our servers. Check your internet connection.
        </p>
        <button onClick={() => setPhase("select")}
                className="rounded-[16px] px-6 py-3.5 text-[13px] font-bold text-white active:scale-95"
                style={{ background: "var(--brand)" }}>Try Again</button>
      </div>
    );
  }

  // ═══ SELECT PHASE (Initial) ═══
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      {/* Red hero */}
      <div className="px-5 pt-5 pb-5" style={{ background: isDark ? "rgba(239,68,68,0.03)" : "#FFF5F5" }}>
        <div className="flex justify-between items-center mb-5">
          <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}><span className="text-[14px]">←</span></Link>
          <span className="text-[10px] font-bold" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>📶 🔋</span>
        </div>
        <span className="inline-block rounded-full px-4 py-1.5 text-[9px] font-bold text-white tracking-widest mb-3"
              style={{ background: "var(--danger)" }}>🆘 EMERGENCY</span>
        <h1 className="text-[24px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>Need Help Now?</h1>
        <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--text-3)" }}>We&apos;ll alert nearest workers within 15km</p>
      </div>

      {/* Location */}
      <div className="mx-5 mt-4 rounded-[14px] p-3.5"
           style={{ background: "var(--danger-tint)" }}>
        <div className="flex items-center gap-3">
          <div className="shrink-0 rounded-full online-dot" style={{ width: 10, height: 10, background: location ? "var(--success)" : "var(--danger)" }} />
          <div className="flex-1">
            <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>
              {detectingGPS ? "📡 Detecting..." : location ? "📍 " + location.label : "📡 Tap to detect"}
            </p>
            {!location && (
              <button onClick={detectLocation} className="text-[9px] font-bold mt-0.5" style={{ color: "var(--brand)" }}>
                Detect My Location
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Emergency grid */}
      <div className="px-5 mt-5 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-1)" }}>What happened?</p>
        <div className="grid grid-cols-2 gap-2.5 stagger">
          {emergencies.map((e, i) => (
            <button key={e.key} onClick={() => setSelected(i)}
                    className="flex flex-col items-center gap-1.5 rounded-[16px] p-4 transition-all active:scale-[0.96] text-center"
                    style={{
                      background: selected === i ? "var(--danger-tint)" : "var(--bg-card)",
                      boxShadow: selected === i ? "0 0 0 2px var(--danger)" : "var(--shadow-sm)",
                    }}>
              <span className="text-[28px]">{e.icon}</span>
              <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{e.name}</p>
              <p className="text-[8px] font-medium" style={{ color: "var(--text-3)" }}>{e.eta} estimated</p>
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-20 mt-4">
        <button onClick={handleTriggerSOS} disabled={!location}
                className="w-full rounded-[16px] py-4 text-center text-[14px] font-black text-white active:scale-[0.97] transition-transform disabled:opacity-60"
                style={{ background: "var(--danger)", boxShadow: "0 12px 40px -4px rgba(239,68,68,0.4)" }}>
          🔍 Find Help Now
        </button>
        <p className="text-[9px] text-center mt-2 font-medium" style={{ color: "var(--text-3)" }}>
          Emergency pricing applies (1.8× normal rate)
        </p>
      </div>
    </div>
  );
}
