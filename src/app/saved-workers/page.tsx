"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// SAVED / FAVORITE WORKERS — Like Swiggy "Favourite Restaurants"
// Users can save workers they liked and rebook quickly
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

export default function SavedWorkersPage() {
  const { isDark } = useTheme();
  const [workers, setWorkers] = useState<SavedWorker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kaizy_saved_workers");
      if (stored) setWorkers(JSON.parse(stored));
    } catch {}
    setLoading(false);
  }, []);

  const removeWorker = (id: string) => {
    const updated = workers.filter(w => w.id !== id);
    setWorkers(updated);
    localStorage.setItem("kaizy_saved_workers", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <span className="text-[14px]">←</span>
        </Link>
        <h1 className="text-[18px] font-black" style={{ color: "var(--text-1)" }}>Saved Workers</h1>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full ml-auto"
              style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
          {workers.length} saved
        </span>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[40px] mb-3">❤️</p>
            <p className="text-[16px] font-black mb-1" style={{ color: "var(--text-1)" }}>No Saved Workers Yet</p>
            <p className="text-[12px] mb-4" style={{ color: "var(--text-3)" }}>
              After a job, tap ❤️ to save workers you liked for quick re-booking
            </p>
            <Link href="/marketplace" className="inline-block rounded-xl px-6 py-3 text-[13px] font-bold text-white active:scale-95"
                  style={{ background: "var(--brand)" }}>
              Browse Workers
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
                      Saved {new Date(w.savedAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link href={`/booking?worker=${w.id}`}
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
