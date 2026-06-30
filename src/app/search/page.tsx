"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

// ============================================================
// WORKER SEARCH v11.0 — Find & Browse Workers
// Reference: Urban Company provider list + Uber selection
// Sort: Nearest | Highest rated | Fastest | Cheapest
// Rating colors: Zomato model (4.5+=green, 4-4.5=yellow, etc.)
// ============================================================

interface Worker {
  id: string; name: string; trade: string;
  rating: number; jobs: number; distance: number;
  price: number; eta: number; verified: boolean;
  isPro: boolean; previouslyHired: boolean;
}

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️", puncture: "🛞",
};
const tradeColors: Record<string, string> = {
  electrician: "#FF6B00", plumber: "#3B82F6", mechanic: "#8B5CF6",
  ac_repair: "#06B6D4", carpenter: "#F59E0B", painter: "#10B981", mason: "#EF4444", puncture: "#78716C",
};

const ratingColor = (r: number) =>
  r >= 4.5 ? "var(--success)" : r >= 4.0 ? "var(--warning)" : r >= 3.5 ? "var(--brand)" : "var(--text-3)";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialTrade = searchParams.get("trade") || "all";
  const initialQuery = searchParams.get("q") || "";
  const { locale } = useI18n();

  const [search, setSearch] = useState(initialQuery);
  const [selectedTrade, setSelectedTrade] = useState(initialTrade);
  const [sortBy, setSortBy] = useState<"nearest" | "rated" | "fastest" | "cheapest">("nearest");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        // Get user's GPS coordinates
        const coords = await new Promise<{ lat: number; lng: number }>((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              () => resolve({ lat: 11.0168, lng: 76.9558 }), // Coimbatore fallback
              { timeout: 5000 }
            );
          } else {
            resolve({ lat: 11.0168, lng: 76.9558 });
          }
        });

        const tradeParam = selectedTrade !== "all" ? selectedTrade : "";
        const res = await fetch(
          `/api/workers/nearby?trade=${tradeParam}&lat=${coords.lat}&lng=${coords.lng}&radius=15&limit=20`
        );
        const json = await res.json();

        if (json.success && json.data?.workers?.length > 0) {
          // Map API fields to component's Worker interface
          const mapped: Worker[] = json.data.workers.map((w: {
            id: string; name: string; trade: string; rating: number;
            totalJobs: number; distance: number; rate: number; eta: number;
            kaizyScore: number; verified: boolean;
          }) => ({
            id: w.id,
            name: w.name,
            trade: w.trade,
            rating: w.rating,
            jobs: w.totalJobs,
            distance: w.distance,
            price: w.rate,
            eta: w.eta,
            verified: w.verified,
            isPro: w.kaizyScore >= 700,
            previouslyHired: false,
          }));
          setWorkers(mapped);
        } else {
          setWorkers([]);
        }
      } catch {
        setWorkers([]);
      }
      setLoading(false);
    };
    fetchWorkers();
  }, [selectedTrade]);

  // Filter + sort
  let filtered = workers.filter(w => {
    if (selectedTrade !== "all" && w.trade !== selectedTrade) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase()) && !w.trade.toLowerCase().includes(search.toLowerCase())) return false;
    if (w.rating < 3.5) return false; // Quality control — Bible says don't show below 3.5
    return true;
  });

  filtered.sort((a, b) => {
    switch (sortBy) {
      case "nearest": return a.distance - b.distance;
      case "rated": return b.rating - a.rating;
      case "fastest": return a.eta - b.eta;
      case "cheapest": return a.price - b.price;
    }
  });

  const trades = ["all", ...Object.keys(tradeIcons)];

  // ── Voice search (mic button on search input) ──
  const handleMicClick = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = locale === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setIsVoiceListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      if (result.isFinal && text.trim()) {
        setSearch(text.trim());
        setIsVoiceListening(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("[voice search]", event.error);
      setIsVoiceListening(false);
    };

    recognition.onend = () => setIsVoiceListening(false);

    recognition.start();
  }, [locale]);

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" aria-label="Go back" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black tracking-tight"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Find Workers
          </h1>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px]">🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                 placeholder={isVoiceListening ? "Listening..." : "Search by name or trade..."}
                 className="w-full rounded-[14px] py-3 pl-11 pr-11 text-[12px] font-medium outline-none"
                 style={{
                   background: "var(--bg-card)",
                   color: "var(--text-1)",
                   border: isVoiceListening ? "1px solid var(--brand)" : "1px solid var(--border-1)",
                   transition: "border 0.2s",
                 }} />
          <button
            type="button"
            onClick={handleMicClick}
            aria-label="Voice search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] active:scale-90 transition-transform"
            style={{
              color: "var(--brand)",
              animation: isVoiceListening ? "live-blink 0.8s infinite" : undefined,
            }}>
            🎤
          </button>
        </div>

        {/* Trade filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {trades.map(t => (
            <button key={t} onClick={() => { setSelectedTrade(t); setLoading(true); }}
                    className="shrink-0 px-3.5 py-2 rounded-full text-[10px] font-bold capitalize active:scale-95 transition-all"
                    style={{
                      background: selectedTrade === t ? "var(--brand)" : "var(--bg-card)",
                      color: selectedTrade === t ? "#fff" : "var(--text-2)",
                    }}>
              {t === "all" ? "All" : `${tradeIcons[t] || ""} ${t.replace("_", " ")}`}
            </button>
          ))}
        </div>
      </div>

      {/* Sort options */}
      <div className="px-5 mb-3 flex gap-1.5">
        {[
          { id: "nearest" as const, label: "📍 Nearest" },
          { id: "rated" as const, label: "⭐ Top Rated" },
          { id: "fastest" as const, label: "⚡ Fastest" },
          { id: "cheapest" as const, label: "💰 Cheapest" },
        ].map(s => (
          <button key={s.id} onClick={() => setSortBy(s.id)}
                  className="px-3 py-1.5 rounded-lg text-[9px] font-bold active:scale-95 transition-all"
                  style={{
                    background: sortBy === s.id ? "var(--brand-tint)" : "var(--bg-surface)",
                    color: sortBy === s.id ? "var(--brand)" : "var(--text-3)",
                  }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="px-5 mb-3">
        <p className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>
          {loading ? "Searching..." : `${filtered.length} workers found`}
        </p>
      </div>

      {/* Worker list */}
      <div className="px-5 space-y-2.5">
        {loading && [1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton rounded-[18px]" style={{ height: 110 }} />
        ))}

        {!loading && filtered.length === 0 && (
          <div className="rounded-[20px] p-8 text-center" style={{ background: "var(--bg-card)" }}>
            <span className="text-[36px] block mb-2">🔍</span>
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No workers found</p>
            <p className="text-[11px] font-medium mt-1" style={{ color: "var(--text-3)" }}>
              Try a different category or expand your search
            </p>
          </div>
        )}

        {!loading && filtered.map(w => {
          const icon = tradeIcons[w.trade] || "🔧";
          const color = tradeColors[w.trade] || "#FF6B00";
          return (
            <Link key={w.id} href={`/worker/${w.id}`}
                  className="flex items-center gap-3.5 rounded-[18px] p-4 active:scale-[0.98] transition-all"
                  style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-black text-white"
                     style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
                  {w.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                {w.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[8px]"
                       style={{ background: "var(--bg-app)", border: "2px solid var(--bg-app)" }}>
                    <span className="text-[10px]">✅</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>{w.name}</p>
                  {w.isPro && (
                    <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: "var(--gradient-cta)", color: "#fff" }}>PRO</span>
                  )}
                </div>
                <p className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>
                  {icon} {w.trade.replace("_", " ")} · {w.jobs} jobs · {w.distance} km
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${ratingColor(w.rating)}15`, color: ratingColor(w.rating) }}>
                    ⭐ {w.rating.toFixed(1)}
                  </span>
                  <span className="text-[9px] font-bold" style={{ color: "var(--info)" }}>
                    ⏱ {w.eta} min
                  </span>
                  {w.previouslyHired && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
                      Hired Before
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                <p className="text-[16px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
                  ₹{w.price}
                </p>
                <p className="text-[8px] font-bold uppercase" style={{ color: "var(--text-3)" }}>est.</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen px-5 pt-5" style={{ background: "var(--bg-app)" }}>
        <div className="skeleton h-9 w-9 rounded-xl mb-4" />
        <div className="skeleton h-11 w-full rounded-[14px] mb-3" />
        <div className="space-y-2.5">{[1,2,3,4].map(i => <div key={i} className="skeleton rounded-[18px]" style={{ height: 110 }} />)}</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
