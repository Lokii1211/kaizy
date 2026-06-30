"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/stores/AuthStore";

// ============================================================
// SAVED / FAVORITE WORKERS — Like Swiggy "Favourite Restaurants"
// Fetches unique workers from completed bookings + localStorage cache
// ============================================================

interface SavedWorker {
  id: string; name: string; trade: string; rating: number;
  jobs: number; kaizyScore: number; savedAt: string;
  initials: string; phone?: string;
}

const tradeIcons: Record<string, string> = {
  electrician: "⚡", electrical: "⚡", plumber: "🔧", plumbing: "🔧",
  mechanic: "🚗", ac_repair: "❄️", carpenter: "🪚", painter: "🎨",
  puncture: "🏍️", mason: "🧱", technician: "🔧",
};

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "W";
}

export default function SavedWorkersPage() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<SavedWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Show cached data instantly
    try {
      const stored = localStorage.getItem("kaizy_saved_workers");
      if (stored) setWorkers(JSON.parse(stored));
    } catch {}

    // 2. Fetch real data from completed bookings
    const fetchWorkers = async () => {
      try {
        const params = new URLSearchParams({ status: "completed", limit: "20" });
        if (user?.id) params.set("user_id", user.id);

        const res = await fetch(`/api/bookings?${params}`);
        const json = await res.json();

        if (json.success && json.data?.length > 0) {
          // Extract unique workers from completed bookings
          const workerMap = new Map<string, SavedWorker>();

          for (const booking of json.data) {
            const workerId = booking.worker_id;
            if (!workerId || workerMap.has(workerId)) continue;

            // Fetch worker details for each unique worker
            try {
              const wRes = await fetch(`/api/workers/${workerId}`);
              const wJson = await wRes.json();
              const w = wJson.data || wJson;

              workerMap.set(workerId, {
                id: workerId,
                name: w.name || w.worker_name || "Worker",
                trade: w.trade || w.trade_primary || booking.trade || "General",
                rating: w.avg_rating || w.rating || 0,
                jobs: w.total_jobs || w.jobs || 0,
                kaizyScore: w.kaizy_score || 0,
                savedAt: booking.completed_at || booking.created_at,
                initials: getInitials(w.name || w.worker_name || "W"),
                phone: w.phone || undefined,
              });
            } catch {
              // Fallback: use booking data if worker fetch fails
              workerMap.set(workerId, {
                id: workerId,
                name: booking.worker_name || "Worker",
                trade: booking.trade || "General",
                rating: 0,
                jobs: 1,
                kaizyScore: 0,
                savedAt: booking.completed_at || booking.created_at,
                initials: getInitials(booking.worker_name || "W"),
              });
            }
          }

          if (workerMap.size > 0) {
            const apiWorkers = Array.from(workerMap.values());
            setWorkers(apiWorkers);
            // Update cache
            localStorage.setItem("kaizy_saved_workers", JSON.stringify(apiWorkers));
          }
        }
      } catch (err) {
        console.error("[saved-workers] fetch error:", err);
        setError("Could not load workers. Showing cached data.");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [user?.id]);

  const removeWorker = (id: string) => {
    const updated = workers.filter(w => w.id !== id);
    setWorkers(updated);
    localStorage.setItem("kaizy_saved_workers", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href="/settings" aria-label="Go back" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <span className="text-[14px]">←</span>
        </Link>
        <h1 className="text-[18px] font-black" style={{ color: "var(--text-1)" }}>Saved Workers</h1>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full ml-auto"
              style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
          {workers.length} saved
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-3 rounded-xl p-3 text-[11px] font-bold"
             style={{ background: "var(--warning-tint, #fff3cd)", color: "var(--warning, #856404)" }}>
          {error}
        </div>
      )}

      <div className="px-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-[14px] p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-24 rounded-full" />
                    <div className="skeleton h-2.5 w-36 rounded-full" />
                    <div className="skeleton h-2 w-20 rounded-full" />
                  </div>
                  <div className="space-y-1">
                    <div className="skeleton h-7 w-16 rounded-lg" />
                    <div className="skeleton h-7 w-16 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[40px] mb-3">👷</p>
            <p className="text-[16px] font-black mb-1" style={{ color: "var(--text-1)" }}>No Workers Yet</p>
            <p className="text-[12px] mb-4 px-4" style={{ color: "var(--text-3)" }}>
              You haven&apos;t worked with any workers yet. Book your first worker to see them here.
            </p>
            <Link href="/marketplace" className="inline-block rounded-xl px-6 py-3 text-[13px] font-bold text-white active:scale-95"
                  style={{ background: "var(--brand)" }}>
              Book a Worker
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {workers.map(w => (
              <div key={w.id} className="rounded-[14px] p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold text-white"
                       style={{ background: "var(--brand)" }}>{w.initials}</div>
                  <div className="flex-1">
                    <p className="text-[14px] font-black" style={{ color: "var(--text-1)" }}>{w.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                      {tradeIcons[w.trade.toLowerCase()] || "🔧"} {w.trade} · ⭐ {w.rating} · {w.jobs} jobs
                    </p>
                    <p className="text-[9px]" style={{ color: "var(--text-3)" }}>
                      Worked {new Date(w.savedAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link href={`/booking?workerId=${w.id}`}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-center text-white active:scale-95"
                          style={{ background: "var(--brand)" }}>
                      Re-book
                    </Link>
                    <button onClick={() => removeWorker(w.id)}
                            className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-center active:scale-95"
                            style={{ background: "var(--bg-elevated)", color: "var(--danger)" }}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
