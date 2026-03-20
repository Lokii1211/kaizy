"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// MARKETPLACE — Browse & search real workers from Supabase
// ============================================================

const categories = [
  { key: "", icon: "🔥", name: "All", color: "#FF6B00" },
  { key: "electrician", icon: "⚡", name: "Electrician", color: "#FF6B00" },
  { key: "plumber", icon: "🔧", name: "Plumber", color: "#3B82F6" },
  { key: "mechanic", icon: "🚗", name: "Mechanic", color: "#8B5CF6" },
  { key: "ac_repair", icon: "❄️", name: "AC Repair", color: "#06B6D4" },
  { key: "carpenter", icon: "🪚", name: "Carpenter", color: "#F59E0B" },
  { key: "painter", icon: "🎨", name: "Painter", color: "#10B981" },
];

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};
const tradeColors: Record<string, string> = {
  electrician: "#FF6B00", plumber: "#3B82F6", mechanic: "#8B5CF6",
  ac_repair: "#06B6D4", carpenter: "#F59E0B", painter: "#10B981",
};

interface Worker {
  id: string; name: string; trade: string; rating: number;
  distance: number; rate: number; eta: number;
  verified: boolean; experience: number; totalJobs: number;
  kaizyScore: number;
}

export default function MarketplacePage() {
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState(0);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "price">("distance");
  const [gpsLat, setGpsLat] = useState(11.0168);
  const [gpsLng, setGpsLng] = useState(76.9558);

  // Get GPS on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setGpsLat(pos.coords.latitude); setGpsLng(pos.coords.longitude); },
        () => {}, { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const fetchWorkers = async (trade?: string) => {
    setLoading(true);
    try {
      const url = `/api/workers/nearby?trade=${trade || ''}&lat=${gpsLat}&lng=${gpsLng}&radius=15&limit=20`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data?.workers) setWorkers(json.data.workers);
    } catch (e) { console.error("[marketplace]", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWorkers(); }, [gpsLat, gpsLng]);

  const handleCategoryClick = (i: number) => {
    setActiveCategory(i);
    fetchWorkers(categories[i].key);
  };

  // Filter by search query
  const filtered = workers.filter(w =>
    !searchQuery || w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.trade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "price") return a.rate - b.rate;
    return a.distance - b.distance;
  });

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[18px] font-black" style={{ color: "var(--text-1)" }}>Browse Workers</h1>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3"
               style={{ background: isDark ? "rgba(255,255,255,0.95)" : "#fff", border: "1px solid var(--border-2)" }}>
            <span className="text-[14px]">🔍</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                   className="flex-1 py-2.5 text-[13px] font-medium outline-none bg-transparent"
                   style={{ color: "#111" }}
                   placeholder="Search by name or trade..." />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
          {categories.map((c, i) => (
            <button key={c.key} onClick={() => handleCategoryClick(i)}
                    className="shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold active:scale-95"
                    style={{
                      background: activeCategory === i ? c.color : "var(--bg-card)",
                      color: activeCategory === i ? "#fff" : "var(--text-2)",
                      border: "1px solid var(--border-1)",
                    }}>
              <span className="text-[14px]">{c.icon}</span>{c.name}
            </button>
          ))}
        </div>

        {/* Sort bar */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>Sort:</span>
          {(["distance", "rating", "price"] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg active:scale-95"
                    style={{
                      background: sortBy === s ? "var(--brand)" : "var(--bg-elevated)",
                      color: sortBy === s ? "#fff" : "var(--text-3)",
                    }}>
              {s === "distance" ? "📍 Nearest" : s === "rating" ? "⭐ Top Rated" : "💰 Cheapest"}
            </button>
          ))}
          <span className="text-[10px] ml-auto" style={{ color: "var(--text-3)" }}>{sorted.length} results</span>
        </div>
      </div>

      {/* Worker list */}
      <div className="px-4 space-y-2">
        {loading && [1,2,3,4].map(i => <div key={i} className="skeleton rounded-xl" style={{ height: 90 }} />)}

        {!loading && sorted.length === 0 && (
          <div className="text-center py-12 rounded-xl" style={{ background: "var(--bg-card)" }}>
            <p className="text-[32px] mb-2">🔍</p>
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No workers found</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>Try a different category or widen your search</p>
          </div>
        )}

        {!loading && sorted.map(w => {
          const color = tradeColors[w.trade] || "#FF6B00";
          const icon = tradeIcons[w.trade] || "🔧";
          return (
            <Link key={w.id} href="/booking"
                  className="flex items-center gap-3 rounded-xl p-3.5 active:scale-[0.98] transition-all"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <div className="relative shrink-0">
                <div className="flex items-center justify-center rounded-full text-[16px] font-bold text-white"
                     style={{ width: 48, height: 48, background: color }}>{w.name?.[0] || "?"}</div>
                <div className="absolute -bottom-0.5 -right-0.5 rounded-full online-dot"
                     style={{ width: 12, height: 12, background: "var(--success)", border: "2px solid var(--bg-card)" }} />
                {w.verified && (
                  <div className="absolute -top-1 -right-1 text-[10px] bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">✓</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold truncate" style={{ color: "var(--text-1)" }}>{w.name}</p>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${color}20`, color }}>{icon} {w.trade.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--warning)" }}>★ {w.rating}</span>
                  <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{w.totalJobs} jobs</span>
                  <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{w.experience}yr exp</span>
                  <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{w.distance}km</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px]" style={{ color: "var(--text-3)" }}>starts</p>
                <p className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>₹{w.rate}<span className="text-[9px] font-normal" style={{ color: "var(--text-3)" }}>/hr</span></p>
                <p className="text-[9px] font-semibold mt-0.5" style={{ color: "var(--success)" }}>~{w.eta}m ETA</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
