"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import UserAvatar from "@/components/UserAvatar";
import { WorkerListSkeleton } from "@/components/Skeletons";
import { formatPrice } from "@/lib/formatters";

// ============================================================
// HIRER BROWSE — SCREEN 1: DISCOVER & SCHEDULE CAPTAINS
// Filter bar · Sort row · Mapbox GPS Search · Real Pricing
// ============================================================

interface BrowseWorker {
  id: string;
  name: string;
  photo?: string | null;
  trade: string;
  rating: number;
  totalJobs: number;
  distance: number;
  eta: number;
  starting_price: number;
  is_online: boolean;
  verified: boolean;
  top_rated: boolean;
  avail_text: string;
}

const TRADES = [
  { key: "all", name: "All Trades", icon: "✨" },
  { key: "electrician", name: "Electrician", icon: "⚡" },
  { key: "plumber", name: "Plumber", icon: "🔧" },
  { key: "mechanic", name: "Mechanic", icon: "🚗" },
  { key: "ac_repair", name: "AC Repair", icon: "❄️" },
  { key: "carpenter", name: "Carpenter", icon: "🪚" },
  { key: "painter", name: "Painter", icon: "🎨" },
  { key: "mason", name: "Mason", icon: "⚒️" },
  { key: "locksmith", name: "Locksmith", icon: "🔒" },
];

const AVAILABILITY_CHIPS = [
  { key: "now", label: "Available Now" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This Week" },
];

function HirerBrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTrade = searchParams.get("trade") || "all";

  const { isDark } = useTheme();

  const [selectedTrade, setSelectedTrade] = useState<string>(initialTrade);
  const [availability, setAvailability] = useState<string>("now");
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "price">("distance");
  const [searchLocation, setSearchLocation] = useState<string>("Coimbatore (GPS)");
  const [lat, setLat] = useState<number>(11.0168);
  const [lng, setLng] = useState<number>(76.9558);

  const [workers, setWorkers] = useState<BrowseWorker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // Auto-detect GPS coordinates
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Fetch workers from API
  const fetchWorkers = useCallback(
    async (targetPage: number = 1, append: boolean = false) => {
      try {
        if (!append) setLoading(true);
        const queryParams = new URLSearchParams({
          trade: selectedTrade,
          availability,
          sortBy,
          lat: String(lat),
          lng: String(lng),
          page: String(targetPage),
          limit: "20",
        });

        const res = await fetch(`/api/workers/browse?${queryParams.toString()}`);
        const json = await res.json();

        if (json.success && json.data?.workers) {
          if (append) {
            setWorkers((prev) => [...prev, ...json.data.workers]);
          } else {
            setWorkers(json.data.workers);
          }
          setHasMore(Boolean(json.data.hasMore));
          setPage(targetPage);
        } else {
          if (!append) setWorkers([]);
        }
      } catch (e) {
        console.error("[fetchWorkers error]", e);
        if (!append) setWorkers([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedTrade, availability, sortBy, lat, lng]
  );

  useEffect(() => {
    fetchWorkers(1, false);
  }, [fetchWorkers]);

  const handleLoadMore = () => {
    fetchWorkers(page + 1, true);
  };

  return (
    <div
      className="min-h-screen pb-28 select-none"
      style={{ background: isDark ? "var(--bg-app)" : "#F9FAFB" }}
    >
      {/* ── TOP SEARCH & HEADER ── */}
      <div
        className="px-5 pt-6 pb-4 border-b sticky top-0 z-30"
        style={{
          background: isDark ? "rgba(10,10,10,0.92)" : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-full flex items-center justify-center border font-bold"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
          >
            ←
          </Link>
          <div className="flex-1">
            <h1
              className="text-[18px] font-black tracking-tight leading-tight"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
            >
              Browse & Schedule Captains
            </h1>
          </div>
        </div>

        {/* Location search bar */}
        <div
          className="flex items-center gap-2.5 rounded-[16px] px-3.5 py-2.5 border shadow-sm mb-3"
          style={{
            background: isDark ? "var(--bg-card)" : "#FFFFFF",
            borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
          }}
        >
          <span className="text-[14px]">📍</span>
          <input
            type="text"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            placeholder="Search address or area in Coimbatore..."
            className="w-full text-[12px] font-bold outline-none bg-transparent"
            style={{ color: "var(--text-1)" }}
          />
        </div>

        {/* ── Trade Categories horizontal scroll ── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TRADES.map((t) => {
            const isSelected = selectedTrade === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelectedTrade(t.key)}
                className="flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold active:scale-95 transition-all"
                style={{
                  background: isSelected ? "var(--brand)" : "var(--bg-card)",
                  color: isSelected ? "#FFFFFF" : "var(--text-1)",
                  border: isSelected ? "none" : "1px solid var(--border-2)",
                }}
              >
                <span>{t.icon}</span>
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FILTER & SORT CONTROLS ── */}
      <div className="px-5 py-3 space-y-2.5">
        {/* Availability chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {AVAILABILITY_CHIPS.map((chip) => {
            const isSelected = availability === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setAvailability(chip.key)}
                className="shrink-0 rounded-full px-3 py-1 text-[11px] font-black transition-all"
                style={{
                  background: isSelected ? "#10B981" : "var(--bg-surface)",
                  color: isSelected ? "#FFFFFF" : "var(--text-2)",
                  border: isSelected ? "none" : "1px solid var(--border-2)",
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Sort Row */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            Sort by:
          </span>
          <div className="flex gap-1.5">
            {(["distance", "rating", "price"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSortBy(s)}
                className="px-2.5 py-1 rounded-full text-[10px] font-black capitalize transition-all"
                style={{
                  background: sortBy === s ? "var(--brand)" : "transparent",
                  color: sortBy === s ? "#FFFFFF" : "var(--text-3)",
                  border: sortBy === s ? "none" : "1px solid var(--border-2)",
                }}
              >
                {s === "distance" ? "Nearest" : s === "rating" ? "Rating" : "Price"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── WORKER CARDS LIST ── */}
      <div className="px-5 space-y-3 mt-1">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <WorkerListSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && workers.length === 0 && (
          <div
            className="rounded-[22px] p-8 text-center border mt-4"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
          >
            <span className="text-[36px] block mb-2">🔍</span>
            <h3 className="text-[15px] font-black" style={{ color: "var(--text-1)" }}>
              No captains matched your filters
            </h3>
            <p className="text-[12px] font-medium text-gray-400 mt-1 mb-4">
              Try switching trade or changing availability to &ldquo;This Week&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedTrade("all");
                setAvailability("week");
              }}
              className="px-5 py-2.5 rounded-full bg-[#FF6B00] text-white text-[12px] font-black"
            >
              Reset Filters
            </button>
          </div>
        )}

        {!loading &&
          workers.map((w) => (
            <div
              key={w.id}
              className="rounded-[22px] p-4 border transition-all shadow-sm"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-2)",
              }}
            >
              <div className="flex gap-3.5 items-start">
                <UserAvatar name={w.name} size={52} />

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2
                          className="text-[14px] font-black truncate"
                          style={{ color: "var(--text-1)" }}
                        >
                          {w.name}
                        </h2>
                        {w.verified && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500">
                            ✓ Aadhaar
                          </span>
                        )}
                        {w.top_rated && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600">
                            ⭐ Top
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-[#FF6B00] capitalize mt-0.5">
                        {w.trade.replace(/_/g, " ")}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className="text-[14px] font-black text-green-600 dark:text-green-400"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        from {formatPrice(w.starting_price)}
                      </p>
                      <p className="text-[9px] font-semibold text-gray-400">{w.avail_text}</p>
                    </div>
                  </div>

                  {/* Rating + Distance bar */}
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-gray-400">
                    <span className="text-amber-500 font-black">★ {w.rating.toFixed(1)}</span>
                    <span>({w.totalJobs} jobs)</span>
                    <span>·</span>
                    <span>{w.distance} km away</span>
                    <span>·</span>
                    <span>~{w.eta}m</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Link
                      href={`/hirer/worker/${w.id}`}
                      className="flex-1 py-2.5 rounded-[14px] text-center text-[12px] font-bold border active:scale-95 transition-all"
                      style={{
                        background: "var(--bg-surface)",
                        borderColor: "var(--border-2)",
                        color: "var(--text-1)",
                      }}
                    >
                      View Profile
                    </Link>
                    <Link
                      href={`/hirer/book/${w.id}`}
                      className="flex-1 py-2.5 rounded-[14px] text-center text-[12px] font-black text-white active:scale-95 transition-all shadow-md"
                      style={{ background: "var(--brand)" }}
                    >
                      Book / Schedule →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}

        {hasMore && !loading && (
          <button
            type="button"
            onClick={handleLoadMore}
            className="w-full py-3.5 rounded-[16px] text-[12px] font-black border text-center active:scale-95 transition-all"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-2)",
              color: "var(--brand)",
            }}
          >
            Load More Captains ↓
          </button>
        )}
      </div>
    </div>
  );
}

export default function HirerBrowsePage() {
  return (
    <Suspense fallback={<WorkerListSkeleton />}>
      <HirerBrowseContent />
    </Suspense>
  );
}
