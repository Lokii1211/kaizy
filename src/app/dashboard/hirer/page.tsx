"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import { supabase } from "@/lib/supabase";

// ============================================================
// HIRER DASHBOARD — Real bookings from Supabase
// ============================================================

interface Booking {
  id: string; status: string; created_at: string;
  hirer_price: number; worker_id: string;
  jobs: { trade: string; description: string } | null;
  worker_profiles: { users: { name: string } | null } | null;
}

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};
const tradeColors: Record<string, string> = {
  electrician: "#FF6B00", plumber: "#3B82F6", mechanic: "#8B5CF6",
  ac_repair: "#06B6D4", carpenter: "#F59E0B", painter: "#10B981",
};
const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "var(--warning)" },
  accepted: { label: "Accepted", color: "var(--brand)" },
  in_progress: { label: "In Progress", color: "var(--info)" },
  completed: { label: "Completed", color: "var(--success)" },
  cancelled: { label: "Cancelled", color: "var(--danger)" },
};

export default function HirerDashboard() {
  const { isDark, toggle } = useTheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await supabase
          .from("bookings")
          .select("*, jobs(trade, description)")
          .order("created_at", { ascending: false })
          .limit(10);
        if (data) setBookings(data as unknown as Booking[]);
      } catch (e) { console.error("[bookings]", e); }
      finally { setLoading(false); }
    };
    fetchBookings();

    // Online count
    fetch("/api/workers/toggle").then(r => r.json()).then(j => {
      if (j.success) setOnlineCount(j.data.onlineCount);
    }).catch(() => {});
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{greeting}</p>
            <h1 className="text-[22px] font-black" style={{ color: "var(--text-1)" }}>Hey there! 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
                    style={{ background: "var(--bg-elevated)" }}>
              <span className="text-[14px]">{isDark ? "🌙" : "☀️"}</span>
            </button>
            <Link href="/settings" className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "var(--bg-elevated)" }}>
              <span className="text-[14px]">⚙️</span>
            </Link>
          </div>
        </div>

        <p className="text-[11px] mb-3" style={{ color: "var(--text-3)" }}>
          📍 Coimbatore · <span style={{ color: "var(--success)" }}>{onlineCount} workers online</span>
        </p>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Link href="/booking" className="rounded-xl p-4 flex items-center gap-3 active:scale-95"
                style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>
            <span className="text-[24px]">📝</span>
            <div><p className="text-[13px] font-bold text-white">Book Worker</p>
            <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.6)" }}>Find workers fast</p></div>
          </Link>
          <Link href="/emergency" className="rounded-xl p-4 flex items-center gap-3 active:scale-95"
                style={{ background: "var(--danger-tint)", border: "1.5px solid var(--danger)" }}>
            <span className="text-[24px]">🆘</span>
            <div><p className="text-[13px] font-bold" style={{ color: "var(--danger)" }}>SOS Help</p>
            <p className="text-[9px]" style={{ color: "var(--text-3)" }}>Emergency</p></div>
          </Link>
        </div>

        {/* Category shortcuts */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
          {Object.entries(tradeIcons).map(([k, icon]) => (
            <Link key={k} href="/booking" className="shrink-0 flex flex-col items-center gap-1 rounded-xl p-2.5 active:scale-95"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", minWidth: 64 }}>
              <span className="text-[20px]">{icon}</span>
              <span className="text-[9px] font-medium capitalize" style={{ color: "var(--text-2)" }}>{k.replace("_", " ")}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bookings */}
      <div className="px-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>My Bookings</p>
          <Link href="/notifications" className="text-[11px] font-semibold" style={{ color: "var(--brand)" }}>History →</Link>
        </div>

        {loading && [1,2,3].map(i => <div key={i} className="skeleton rounded-xl mb-2" style={{ height: 72 }} />)}

        {!loading && bookings.length === 0 && (
          <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <p className="text-[32px] mb-2">📋</p>
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>No bookings yet</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>Book a worker to get started</p>
            <Link href="/booking" className="inline-block mt-4 rounded-xl px-6 py-3 text-[13px] font-bold text-white active:scale-95"
                  style={{ background: "var(--brand)" }}>Book Now →</Link>
          </div>
        )}

        {!loading && bookings.map(b => {
          const trade = b.jobs?.trade || "electrician";
          const color = tradeColors[trade] || "#FF6B00";
          const icon = tradeIcons[trade] || "🔧";
          const sCfg = statusConfig[b.status] || statusConfig.pending;
          return (
            <Link key={b.id} href="/tracking" className="flex items-center gap-3 rounded-xl p-3 mb-2 active:scale-[0.98]"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <div className="rounded-full flex items-center justify-center text-[16px] font-bold text-white shrink-0"
                   style={{ width: 44, height: 44, background: color }}>{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>
                  {b.jobs?.description || `${trade} job`}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                  {new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] font-bold px-2 py-1 rounded-full" style={{ background: "var(--brand-tint)", color: sCfg.color }}>{sCfg.label}</span>
                <p className="text-[14px] font-black mt-1" style={{ color: "var(--text-1)" }}>₹{b.hirer_price || "—"}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="px-4 mt-5">
        <p className="text-[12px] font-bold mb-2" style={{ color: "var(--text-3)" }}>Quick Links</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: "🔔", label: "Alerts", href: "/notifications" },
            { icon: "💬", label: "Chat", href: "/chat" },
            { icon: "🤖", label: "KaizyBot", href: "/konnectbot" },
            { icon: "⚙️", label: "Settings", href: "/settings" },
          ].map(a => (
            <Link key={a.label} href={a.href} className="rounded-xl p-3 text-center active:scale-95"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <span className="text-[18px]">{a.icon}</span>
              <p className="text-[9px] font-medium mt-1" style={{ color: "var(--text-2)" }}>{a.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
