"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

// Mock workers
const mockWorkers: Worker[] = [
  { id: "w1", name: "Raju Krishnan", trade: "electrician", rating: 4.8, jobs: 312, distance: 1.2, price: 400, eta: 8, verified: true, isPro: true, previouslyHired: false },
  { id: "w2", name: "Muthu S.", trade: "electrician", rating: 4.5, jobs: 89, distance: 2.1, price: 350, eta: 12, verified: true, isPro: false, previouslyHired: true },
  { id: "w3", name: "Kumar B.", trade: "plumber", rating: 4.7, jobs: 156, distance: 0.8, price: 450, eta: 5, verified: true, isPro: false, previouslyHired: false },
  { id: "w4", name: "Senthil V.", trade: "plumber", rating: 4.3, jobs: 67, distance: 3.4, price: 300, eta: 18, verified: true, isPro: false, previouslyHired: false },
  { id: "w5", name: "Arjun D.", trade: "mechanic", rating: 4.9, jobs: 540, distance: 1.5, price: 500, eta: 10, verified: true, isPro: true, previouslyHired: false },
  { id: "w6", name: "Prakash T.", trade: "ac_repair", rating: 4.6, jobs: 201, distance: 2.8, price: 600, eta: 15, verified: true, isPro: false, previouslyHired: true },
  { id: "w7", name: "Vijay R.", trade: "carpenter", rating: 4.4, jobs: 44, distance: 4.2, price: 350, eta: 22, verified: false, isPro: false, previouslyHired: false },
  { id: "w8", name: "Surya M.", trade: "painter", rating: 4.7, jobs: 98, distance: 1.9, price: 500, eta: 11, verified: true, isPro: false, previouslyHired: false },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialTrade = searchParams.get("trade") || "all";

  const [search, setSearch] = useState("");
  const [selectedTrade, setSelectedTrade] = useState(initialTrade);
  const [sortBy, setSortBy] = useState<"nearest" | "rated" | "fastest" | "cheapest">("nearest");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from API, fallback to mock
    const fetchWorkers = async () => {
      try {
        const res = await fetch(`/api/workers/nearby?trade=${selectedTrade}`);
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          setWorkers(json.data);
        } else {
          setWorkers(mockWorkers);
        }
      } catch {
        setWorkers(mockWorkers);
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

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
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
                 placeholder="Search by name or trade..."
                 className="w-full rounded-[14px] py-3 pl-11 pr-4 text-[12px] font-medium outline-none"
                 style={{ background: "var(--bg-card)", color: "var(--text-1)", border: "1px solid var(--border-1)" }} />
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
