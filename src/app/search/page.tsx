"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

// ============================================================
// WORKER SEARCH v12.0 — Urban Company-style discovery
// Default: Browse by service grid · Search: live results
// Sort: Nearest | Highest rated | Fastest | Cheapest
// ============================================================

interface Worker {
  id: string; name: string; trade: string;
  rating: number; jobs: number; distance: number;
  price: number; eta: number; verified: boolean;
  isPro: boolean; previouslyHired: boolean;
}

const services = [
  { key: "electrician", icon: "⚡", label: "Electrician", color: "#FF6B00", sub: "Wiring, MCB, Fan" },
  { key: "plumber", icon: "🔧", label: "Plumber", color: "#3B82F6", sub: "Pipe, Tap, Drain" },
  { key: "mechanic", icon: "🚗", label: "Mechanic", color: "#8B5CF6", sub: "Bike, Car, Van" },
  { key: "ac_repair", icon: "❄️", label: "AC Repair", color: "#06B6D4", sub: "Service, Gas, Install" },
  { key: "carpenter", icon: "🪚", label: "Carpenter", color: "#F59E0B", sub: "Furniture, Door, Wood" },
  { key: "painter", icon: "🎨", label: "Painter", color: "#10B981", sub: "Interior, Exterior" },
  { key: "mason", icon: "⚒️", label: "Mason", color: "#EF4444", sub: "Wall, Cement, Tile" },
  { key: "puncture", icon: "🛞", label: "Puncture", color: "#78716C", sub: "Tyre, Tube repair" },
];

const tradeIcons: Record<string, string> = Object.fromEntries(services.map(s => [s.key, s.icon]));
const tradeColors: Record<string, string> = Object.fromEntries(services.map(s => [s.key, s.color]));

const ratingColor = (r: number) =>
  r >= 4.5 ? "var(--success)" : r >= 4.0 ? "var(--warning)" : r >= 3.5 ? "var(--brand)" : "var(--text-3)";

const popularSearches = ["Electrician near me", "Plumber emergency", "AC service", "Bike mechanic", "Carpenter"];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialTrade = searchParams.get("trade") || "all";
  const initialQuery = searchParams.get("q") || "";
  const { locale } = useI18n();

  const [search, setSearch] = useState(initialQuery);
  const [selectedTrade, setSelectedTrade] = useState(initialTrade);
  const [sortBy, setSortBy] = useState<"nearest" | "rated" | "fastest" | "cheapest">("nearest");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Only search when trade or search term is active
  useEffect(() => {
    if (selectedTrade === "all" && !search.trim()) {
      setWorkers([]);
      setHasSearched(false);
      return;
    }
    setHasSearched(true);
    setLoading(true);

    const fetchWorkers = async () => {
      try {
        const coords = await new Promise<{ lat: number; lng: number }>((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              () => resolve({ lat: 11.0168, lng: 76.9558 }),
              { timeout: 5000 }
            );
          } else resolve({ lat: 11.0168, lng: 76.9558 });
        });

        const tradeParam = selectedTrade !== "all" ? selectedTrade : "";
        const res = await fetch(`/api/workers/nearby?trade=${tradeParam}&lat=${coords.lat}&lng=${coords.lng}&radius=15&limit=20`);
        const json = await res.json();

        if (json.success && json.data?.workers?.length > 0) {
          const mapped: Worker[] = json.data.workers.map((w: {
            id: string; name: string; trade: string; rating: number;
            totalJobs: number; distance: number; rate: number; eta: number;
            kaizyScore: number; verified: boolean;
          }) => ({
            id: w.id, name: w.name, trade: w.trade, rating: w.rating,
            jobs: w.totalJobs, distance: w.distance, price: w.rate,
            eta: w.eta, verified: w.verified, isPro: w.kaizyScore >= 700, previouslyHired: false,
          }));
          setWorkers(mapped);
        } else setWorkers([]);
      } catch { setWorkers([]); }
      setLoading(false);
    };
    fetchWorkers();
  }, [selectedTrade, search]);

  let filtered = workers.filter(w => {
    if (selectedTrade !== "all" && w.trade !== selectedTrade) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase()) && !w.trade.toLowerCase().includes(search.toLowerCase())) return false;
    return w.rating >= 3.5;
  });

  filtered.sort((a, b) => {
    switch (sortBy) {
      case "nearest": return a.distance - b.distance;
      case "rated": return b.rating - a.rating;
      case "fastest": return a.eta - b.eta;
      case "cheapest": return a.price - b.price;
    }
  });

  const handleMicClick = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
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
      if (result.isFinal && text.trim()) { setSearch(text.trim()); setIsVoiceListening(false); }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => { console.error("[voice]", event.error); setIsVoiceListening(false); };
    recognition.onend = () => setIsVoiceListening(false);
    recognition.start();
  }, [locale]);

  const showDefaultView = !hasSearched && !loading;
  const showResults = hasSearched || loading;

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>

      {/* ── Sticky header + search ── */}
      <div className="sticky top-0 z-20 px-4 pt-5 pb-3" style={{ background: "var(--bg-app)" }}>
        <div className="flex items-center gap-3 mb-3">
          <Link href="/" aria-label="Go back"
                className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform shrink-0"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[17px] font-black tracking-tight"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Find Workers
          </h1>
        </div>

        {/* Search bar */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px]">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={isVoiceListening ? "Listening..." : "Search electrician, plumber..."}
            className="w-full rounded-[14px] py-[13px] pl-11 pr-12 text-[13px] font-medium outline-none"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-1)",
              border: `1.5px solid ${inputFocused || isVoiceListening ? "var(--brand)" : "var(--border-1)"}`,
              transition: "border 0.2s",
            }}
          />
          <button type="button" onClick={handleMicClick} aria-label="Voice search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: isVoiceListening ? "var(--brand-tint)" : "transparent" }}>
            <span className="text-[15px]" style={{ animation: isVoiceListening ? "live-blink 0.8s infinite" : undefined }}>🎤</span>
          </button>
        </div>

        {/* Popular chips — shown when no search active */}
        {!search && (
          <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1 no-scrollbar">
            {popularSearches.map(q => (
              <button key={q} onClick={() => setSearch(q)}
                      className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold active:scale-95 transition-all"
                      style={{ background: "var(--bg-surface)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════
          DEFAULT: Browse Services
      ══════════════════════════ */}
      {showDefaultView && (
        <div className="px-4 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            What do you need?
          </p>

          {/* Services grid — 2 columns with rich cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {services.map(s => (
              <button
                key={s.key}
                onClick={() => setSelectedTrade(s.key)}
                className="flex flex-col rounded-[20px] p-4 text-left active:scale-[0.97] transition-transform"
                style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[22px] mb-3"
                     style={{ background: `${s.color}15` }}>
                  {s.icon}
                </div>
                <p className="text-[13px] font-extrabold mb-0.5" style={{ color: "var(--text-1)" }}>{s.label}</p>
                <p className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>{s.sub}</p>
              </button>
            ))}
          </div>

          {/* How it works */}
          <div className="rounded-[20px] p-5 mb-4" style={{ background: "var(--brand-tint)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--brand)" }}>
              How it works
            </p>
            <div className="space-y-3">
              {[
                { step: "1", text: "Search or pick a service category" },
                { step: "2", text: "Choose from verified nearby workers" },
                { step: "3", text: "Worker arrives & gets the job done" },
              ].map(i => (
                <div key={i.step} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black text-white"
                       style={{ background: "var(--brand)" }}>
                    {i.step}
                  </div>
                  <p className="text-[12px] font-medium" style={{ color: "var(--text-1)" }}>{i.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════
          RESULTS VIEW
      ══════════════════════════ */}
      {showResults && (
        <>
          {/* Trade filter chips */}
          <div className="px-4 mb-2">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {[{ key: "all", label: "All", icon: "" }, ...services.map(s => ({ key: s.key, label: s.label, icon: s.icon }))].map(t => (
                <button key={t.key} onClick={() => { setSelectedTrade(t.key); if (t.key !== "all") setHasSearched(true); }}
                        className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-bold active:scale-95 transition-all"
                        style={{
                          background: selectedTrade === t.key ? "var(--brand)" : "var(--bg-card)",
                          color: selectedTrade === t.key ? "#fff" : "var(--text-2)",
                        }}>
                  {t.icon && <span>{t.icon}</span>}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort pills */}
          <div className="px-4 mb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "nearest" as const, label: "📍 Nearest" },
              { id: "rated" as const, label: "⭐ Top Rated" },
              { id: "fastest" as const, label: "⚡ Fastest" },
              { id: "cheapest" as const, label: "💰 Cheapest" },
            ].map(s => (
              <button key={s.id} onClick={() => setSortBy(s.id)}
                      className="shrink-0 px-3.5 py-2 rounded-full text-[10px] font-bold active:scale-95 transition-all"
                      style={{
                        background: sortBy === s.id ? "var(--brand-tint)" : "var(--bg-surface)",
                        color: sortBy === s.id ? "var(--brand)" : "var(--text-3)",
                      }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Count */}
          <div className="px-4 mb-2">
            <p className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>
              {loading ? "Searching nearby..." : `${filtered.length} workers found`}
            </p>
          </div>

          {/* Skeleton */}
          <div className="px-4 space-y-2.5">
            {loading && [1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton rounded-[18px]" style={{ height: 110 }} />
            ))}

            {/* Empty state (after search, no results) */}
            {!loading && filtered.length === 0 && (
              <div className="py-10 text-center">
                <span className="text-[48px] block mb-3">😕</span>
                <p className="text-[15px] font-black mb-1" style={{ color: "var(--text-1)" }}>No workers found nearby</p>
                <p className="text-[12px] font-medium mb-5" style={{ color: "var(--text-3)" }}>
                  Try a different service or expand your area
                </p>
                <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto mb-4">
                  {services.slice(0, 4).map(s => (
                    <button key={s.key} onClick={() => setSelectedTrade(s.key)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] text-left active:scale-95 transition-transform"
                            style={{ background: "var(--bg-card)" }}>
                      <span className="text-[16px]">{s.icon}</span>
                      <span className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{s.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { setSelectedTrade("all"); setSearch(""); setHasSearched(false); }}
                  className="text-[12px] font-bold" style={{ color: "var(--brand)" }}>
                  ← Back to Browse
                </button>
              </div>
            )}

            {/* Worker cards */}
            {!loading && filtered.map(w => {
              const icon = tradeIcons[w.trade] || "🔧";
              const color = tradeColors[w.trade] || "#FF6B00";
              return (
                <Link key={w.id} href={`/worker/${w.id}`}
                      className="flex items-center gap-3.5 rounded-[20px] p-4 active:scale-[0.98] transition-all"
                      style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[19px] font-black text-white"
                         style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
                      {w.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    {w.verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px]"
                           style={{ background: "var(--bg-app)", border: "2px solid var(--bg-app)" }}>
                        ✅
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
                    <p className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>
                      {icon} {w.trade.replace("_", " ")} · {w.jobs} jobs · {w.distance}km away
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${ratingColor(w.rating)}18`, color: ratingColor(w.rating) }}>
                        ⭐ {w.rating.toFixed(1)}
                      </span>
                      <span className="text-[10px] font-semibold" style={{ color: "var(--info)" }}>
                        ⏱ {w.eta} min
                      </span>
                      {w.previouslyHired && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>Hired Before</span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    <p className="text-[17px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
                      ₹{w.price}
                    </p>
                    <p className="text-[8px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>est.</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen px-4 pt-5" style={{ background: "var(--bg-app)" }}>
        <div className="skeleton h-9 w-9 rounded-xl mb-4" />
        <div className="skeleton h-12 w-full rounded-[14px] mb-3" />
        <div className="space-y-2.5">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton rounded-[20px]" style={{ height: 110 }} />)}</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
