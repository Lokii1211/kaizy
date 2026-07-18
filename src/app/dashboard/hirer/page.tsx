"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import { useAuth } from "@/stores/AuthStore";
import PullToRefresh from "@/components/PullToRefresh";

// ============================================================
// HIRER DASHBOARD v12.0 — Urban Company + Swiggy hybrid
// Hero ETA → Services grid → Active jobs → History
// ============================================================

interface Booking {
  id: string; status: string; created_at: string;
  hirer_price: number; total_amount?: number; worker_id: string;
  trade?: string; worker_name?: string; has_review?: boolean;
  jobs: { trade: string; description: string } | null;
  worker_profiles: { users: { name: string } | null } | null;
}

const services = [
  { key: "electrician", icon: "⚡", label: "Electrician", color: "#FF6B00", popular: true },
  { key: "plumber", icon: "🔧", label: "Plumber", color: "#3B82F6", popular: true },
  { key: "mechanic", icon: "🚗", label: "Mechanic", color: "#8B5CF6", popular: false },
  { key: "ac_repair", icon: "❄️", label: "AC Repair", color: "#06B6D4", popular: true },
  { key: "carpenter", icon: "🪚", label: "Carpenter", color: "#F59E0B", popular: false },
  { key: "painter", icon: "🎨", label: "Painter", color: "#10B981", popular: false },
  { key: "mason", icon: "⚒️", label: "Mason", color: "#EF4444", popular: false },
  { key: "puncture", icon: "🛞", label: "Puncture", color: "#78716C", popular: false },
];

const tradeIcons: Record<string, string> = Object.fromEntries(services.map(s => [s.key, s.icon]));
const tradeColors: Record<string, string> = Object.fromEntries(services.map(s => [s.key, s.color]));

const statusConfig: Record<string, { label: string; color: string; pulse: boolean }> = {
  pending: { label: "Searching...", color: "var(--warning)", pulse: true },
  accepted: { label: "Accepted", color: "var(--brand)", pulse: false },
  en_route: { label: "En Route", color: "var(--info)", pulse: true },
  in_progress: { label: "In Progress", color: "var(--brand)", pulse: true },
  completed: { label: "Completed", color: "var(--success)", pulse: false },
  cancelled: { label: "Cancelled", color: "var(--danger)", pulse: false },
};

export default function HirerDashboard() {
  const { isDark, toggle } = useTheme();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [locationLabel, setLocationLabel] = useState("Detecting...");
  const [nearestEta, setNearestEta] = useState<number | null>(null);

  const userName = (user?.name || "").split(" ")[0] || "Hey!";

  const loadDashboardData = useCallback(async () => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/bookings?limit=10");
        const json = await res.json();
        if (json.success && json.data) setBookings(json.data);
      } catch {}
    };
    const fetchOnlineCount = fetch("/api/workers/toggle").then(r => r.json()).then(j => {
      if (j.success) setOnlineCount(j.data.onlineCount);
    }).catch(() => setOnlineCount(0));
    const fetchEta = fetch("/api/workers/nearby?limit=1").then(r => r.json()).then(j => {
      setNearestEta(j.success && j.data?.workers?.length > 0 ? j.data.workers[0].eta : null);
    }).catch(() => setNearestEta(null));

    await Promise.all([fetchBookings(), fetchOnlineCount, fetchEta]);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=14`,
          { headers: { "Accept-Language": "en", "User-Agent": "Kaizy-App/1.0" } }
        )
          .then(r => r.json())
          .then(d => {
            const label = [d.address?.suburb || d.address?.neighbourhood, d.address?.city || d.address?.town]
              .filter(Boolean).join(", ") || d.display_name?.split(",").slice(0, 2).join(",") || "Your area";
            setLocationLabel(label);
          })
          .catch(() => setLocationLabel("Your area"));
      }, () => setLocationLabel("Location off"));
    }
    loadDashboardData().finally(() => setLoading(false));
  }, [loadDashboardData]);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  const activeBookings = bookings.filter(b => ["pending", "accepted", "en_route", "in_progress"].includes(b.status));
  const recentBookings = bookings.filter(b => b.status === "completed").slice(0, 3);

  return (
    <PullToRefresh onRefresh={loadDashboardData}>
      <div className="min-h-screen pb-28" style={{ background: "var(--bg-app)" }}>

        {/* ══════════════════════════════
            HEADER
        ══════════════════════════════ */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex justify-between items-center mb-0.5">
            <div>
              <p className="text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>{greeting} 👋</p>
              <h1 className="text-[24px] font-black tracking-tight leading-tight"
                  style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
                {userName}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/notifications" aria-label="Notifications"
                    className="w-10 h-10 rounded-xl flex items-center justify-center relative active:scale-90 transition-transform"
                    style={{ background: "var(--bg-surface)" }}>
                <span className="text-[16px]">🔔</span>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                     style={{ background: "var(--danger)", border: "2px solid var(--bg-app)" }} />
              </Link>
              <button onClick={toggle} aria-label="Toggle theme"
                      className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                      style={{ background: "var(--bg-surface)" }}>
                <span className="text-[16px]">{isDark ? "🌙" : "☀️"}</span>
              </button>
            </div>
          </div>

          {/* Location row */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[11px]">📍</span>
            <span className="text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>{locationLabel}</span>
            <span className="text-[11px]" style={{ color: "var(--text-3)" }}>·</span>
            <span className="text-[11px] font-bold" style={{ color: "var(--success)" }}>
              {onlineCount > 0 ? `${onlineCount} workers online` : "Loading..."}
            </span>
          </div>
        </div>

        {/* ══════════════════════════════
            HERO ETA CARD
        ══════════════════════════════ */}
        <div className="px-5 mb-5">
          <div
            className="rounded-[24px] p-5 overflow-hidden relative"
            style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}
          >
            {/* Decorative circle */}
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
            <div className="absolute -right-2 top-8 w-24 h-24 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />

            <div className="relative flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Nearest Worker</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[52px] font-black text-white leading-none"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {nearestEta !== null ? nearestEta : "—"}
                  </span>
                  {nearestEta !== null && (
                    <span className="text-[18px] font-bold text-white/70 mb-1">min</span>
                  )}
                </div>
                <p className="text-[12px] font-medium text-white/65 mt-0.5">away from you right now</p>
              </div>

              <div className="flex flex-col items-end gap-2 mb-1">
                <Link href="/booking"
                      className="rounded-[14px] px-5 py-3 text-[12px] font-black active:scale-95 transition-transform"
                      style={{ background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                  Book Now →
                </Link>
                <Link href="/emergency"
                      className="rounded-[12px] px-4 py-2 text-[10px] font-bold active:scale-95 transition-transform"
                      style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }}>
                  🆘 SOS Help
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════
            SERVICES GRID
        ══════════════════════════════ */}
        <div className="px-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
              What do you need?
            </p>
            <Link href="/search" className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>
              See all →
            </Link>
          </div>

          {/* 4-col grid */}
          <div className="grid grid-cols-4 gap-2.5">
            {services.map(s => (
              <Link key={s.key} href={`/booking?trade=${s.key}`}
                    className="flex flex-col items-center gap-1.5 rounded-[18px] py-3 px-1 active:scale-95 transition-transform relative"
                    style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
                {s.popular && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                       style={{ background: "var(--brand)" }}>
                    <span className="text-[6px] font-black text-white">★</span>
                  </div>
                )}
                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[20px]"
                     style={{ background: `${s.color}15` }}>
                  {s.icon}
                </div>
                <span className="text-[9px] font-bold text-center leading-tight"
                      style={{ color: "var(--text-2)" }}>
                  {s.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════
            ACTIVE BOOKINGS (if any)
        ══════════════════════════════ */}
        {activeBookings.length > 0 && (
          <div className="px-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full online-dot" style={{ background: "var(--brand)" }} />
              <p className="text-[13px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
                Active Bookings
              </p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto"
                    style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
                {activeBookings.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {activeBookings.map(b => {
                const trade = b.jobs?.trade || "electrician";
                const color = tradeColors[trade] || "#FF6B00";
                const icon = tradeIcons[trade] || "🔧";
                const sCfg = statusConfig[b.status] || statusConfig.pending;
                const workerName = b.worker_profiles?.users?.name || "Finding worker...";
                return (
                  <Link key={b.id} href={`/tracking?bookingId=${b.id}`}
                        className="flex items-center gap-3.5 rounded-[20px] p-4 active:scale-[0.98] transition-transform"
                        style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
                    <div className="w-12 h-12 rounded-[16px] flex items-center justify-center text-[22px] shrink-0"
                         style={{ background: `${color}15` }}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate mb-0.5" style={{ color: "var(--text-1)" }}>
                        {b.jobs?.description || `${trade} job`}
                      </p>
                      <p className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>{workerName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 mb-1 justify-end">
                        <div className={`w-1.5 h-1.5 rounded-full ${sCfg.pulse ? "online-dot" : ""}`}
                             style={{ background: sCfg.color }} />
                        <span className="text-[9px] font-bold" style={{ color: sCfg.color }}>{sCfg.label}</span>
                      </div>
                      <p className="text-[15px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
                        ₹{b.hirer_price || "—"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            BOOKING HISTORY / EMPTY
        ══════════════════════════════ */}
        <div className="px-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
              Recent Bookings
            </p>
            <Link href="/my-bookings" className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>
              See all →
            </Link>
          </div>

          {loading && [1, 2, 3].map(i => (
            <div key={i} className="skeleton rounded-[16px] mb-2" style={{ height: 72 }} />
          ))}

          {!loading && bookings.length === 0 && (
            <div className="rounded-[22px] p-7 text-center" style={{ background: "var(--bg-card)" }}>
              <span className="text-[44px] block mb-3">📋</span>
              <p className="text-[15px] font-black mb-1" style={{ color: "var(--text-1)" }}>No bookings yet</p>
              <p className="text-[12px] font-medium mb-5" style={{ color: "var(--text-3)" }}>
                Book your first worker and get things done
              </p>
              <Link href="/booking"
                    className="inline-block rounded-[14px] px-8 py-3.5 text-[13px] font-black text-white active:scale-95 transition-transform"
                    style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
                Book a Worker →
              </Link>
            </div>
          )}

          {!loading && recentBookings.length > 0 && (
            <div className="space-y-2">
              {recentBookings.map(b => {
                const trade = b.jobs?.trade || b.trade || "electrician";
                const icon = tradeIcons[trade] || "🔧";
                const color = tradeColors[trade] || "#FF6B00";
                const workerName = b.worker_profiles?.users?.name || b.worker_name || "Worker";
                return (
                  <div key={b.id} className="rounded-[16px] p-3.5"
                       style={{ background: "var(--bg-surface)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[16px] shrink-0"
                           style={{ background: `${color}12` }}>{icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-1)" }}>
                          {workerName} — {trade.replace('_', ' ')}
                        </p>
                        <p className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>
                          {new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full block mb-1"
                              style={{ background: "var(--success-tint)", color: "var(--success)" }}>Done ✓</span>
                        <p className="text-[12px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
                          ₹{b.hirer_price || b.total_amount || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2.5">
                      {!b.has_review && (
                        <Link href={`/booking/review?bookingId=${b.id}`}
                              className="flex-1 text-center text-[9px] font-bold py-1.5 rounded-[10px]"
                              style={{ background: "var(--success-tint)", color: "var(--success)" }}>
                          ⭐ Rate
                        </Link>
                      )}
                      <Link href={`/booking?trade=${trade}&workerId=${b.worker_id}`}
                            className="flex-1 text-center text-[9px] font-bold py-1.5 rounded-[10px]"
                            style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
                        Book Again
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════════════════════════
            TRUST BANNER
        ══════════════════════════════ */}
        <div className="px-5 mb-5">
          <div className="rounded-[20px] p-4" style={{ background: "var(--bg-card)" }}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "🛡️", val: "ID Verified", sub: "Every worker" },
                { icon: "⭐", val: "4.8 Stars", sub: "Avg rating" },
                { icon: "💬", val: "24/7", sub: "Support" },
              ].map(t => (
                <div key={t.val} className="text-center">
                  <span className="text-[22px] block mb-1">{t.icon}</span>
                  <p className="text-[11px] font-black" style={{ color: "var(--text-1)" }}>{t.val}</p>
                  <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{t.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════
            QUICK ACCESS
        ══════════════════════════════ */}
        <div className="px-5">
          <p className="text-[13px] font-black mb-3" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Quick Access
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: "💬", label: "AI Assistant", href: "/kaizybot", color: "#8B5CF6" },
              { icon: "💳", label: "KaizyPay", href: "/kaizypay", color: "#10B981" },
              { icon: "❓", label: "Help & FAQ", href: "/help", color: "#3B82F6" },
              { icon: "📋", label: "My Bookings", href: "/my-bookings", color: "#FF6B00" },
              { icon: "⚙️", label: "Settings", href: "/settings", color: "#78716C" },
              { icon: "🎁", label: "Rewards", href: "/rewards", color: "#F59E0B" },
            ].map(a => (
              <Link key={a.label} href={a.href}
                    className="flex flex-col items-center rounded-[18px] p-3.5 active:scale-95 transition-transform"
                    style={{ background: "var(--bg-card)" }}>
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[18px] mb-2"
                     style={{ background: `${a.color}12` }}>
                  {a.icon}
                </div>
                <p className="text-[9px] font-bold text-center leading-tight" style={{ color: "var(--text-2)" }}>
                  {a.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
