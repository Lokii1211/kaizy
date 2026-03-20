"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// MY BOOKINGS — Like Uber "Your Trips" / Swiggy "My Orders"
// Real data from Supabase, clickable cards → detail page
// ============================================================

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};
const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  accepted: { label: "Accepted", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  in_progress: { label: "In Progress", color: "#FF6B00", bg: "rgba(255,107,0,0.1)" },
  completed: { label: "Completed", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

interface BookingItem {
  id: string;
  status: string;
  created_at: string;
  hirer_price: number;
  trade: string;
  description: string;
  worker_name: string;
  worker_id: string;
}

const tabs = ["All", "Active", "Completed", "Cancelled"];

export default function MyBookingsPage() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/bookings?limit=50");
        const json = await res.json();
        if (json.success && json.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setBookings(json.data.map((b: any) => ({
            id: b.id,
            status: b.status || "pending",
            created_at: b.created_at,
            hirer_price: b.hirer_price || b.total_amount || 0,
            trade: b.jobs?.trade || b.trade || "",
            description: b.jobs?.description || b.description || "",
            worker_name: b.worker_profiles?.users?.name || "Worker",
            worker_id: b.worker_id || "",
          })));
        }
      } catch (e) { console.error("[my-bookings]", e); }
      finally { setLoading(false); }
    };
    fetchBookings();
  }, []);

  // Filter by tab
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return ["pending", "accepted", "in_progress"].includes(b.status);
    if (activeTab === 2) return b.status === "completed";
    if (activeTab === 3) return b.status === "cancelled";
    return true;
  });

  // Group by date
  const grouped: Record<string, BookingItem[]> = {};
  filteredBookings.forEach(b => {
    const d = new Date(b.created_at);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);
    let key: string;
    if (d.toDateString() === today.toDateString()) key = "Today";
    else if (d.toDateString() === yesterday.toDateString()) key = "Yesterday";
    else key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  });

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-1)" }}>
        <div className="flex items-center gap-3 mb-3">
          <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-elevated)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[18px] font-black" style={{ color: "var(--text-1)" }}>My Bookings</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
                    className="px-4 py-2 rounded-full text-[12px] font-bold transition-all active:scale-95"
                    style={{
                      background: activeTab === i ? "var(--brand)" : "var(--bg-elevated)",
                      color: activeTab === i ? "#fff" : "var(--text-2)",
                    }}>
              {tab}
              {i === 1 && bookings.filter(b => ["pending", "accepted", "in_progress"].includes(b.status)).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[8px] bg-white" style={{ color: "var(--brand)" }}>
                  {bookings.filter(b => ["pending", "accepted", "in_progress"].includes(b.status)).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-4">
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="rounded-2xl p-4 skeleton" style={{ height: 100 }} />)}
          </div>
        )}

        {!loading && filteredBookings.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[48px] mb-3">📋</p>
            <p className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>No bookings yet</p>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>
              {activeTab === 0 ? "Book your first worker to get started!" : `No ${tabs[activeTab].toLowerCase()} bookings`}
            </p>
            <Link href="/booking" className="inline-block mt-6 rounded-xl px-6 py-3 text-[13px] font-bold text-white"
                  style={{ background: "var(--brand)" }}>
              Book Now →
            </Link>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-5">
            <p className="text-[11px] font-bold mb-2 px-1" style={{ color: "var(--text-3)" }}>{date}</p>
            <div className="space-y-2">
              {items.map(b => {
                const st = statusBadge[b.status] || statusBadge.pending;
                const icon = tradeIcons[b.trade] || "🔧";
                const time = new Date(b.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

                return (
                  <Link key={b.id} href={`/booking/${b.id}`}
                        className="block rounded-2xl p-4 active:scale-[0.98] transition-all"
                        style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-[18px]"
                           style={{ background: "var(--brand-tint)" }}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-[13px] font-bold truncate" style={{ color: "var(--text-1)" }}>
                            {b.trade?.replace('_', ' ')} — {b.worker_name}
                          </p>
                          <span className="text-[10px] font-bold shrink-0 ml-2 px-2 py-0.5 rounded-full"
                                style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                        <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
                          {b.description || "General service"}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{time}</span>
                          <span className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>₹{b.hirer_price}</span>
                        </div>
                      </div>
                      <span className="text-[14px] shrink-0" style={{ color: "var(--text-3)" }}>›</span>
                    </div>

                    {/* Re-book button for completed */}
                    {b.status === "completed" && (
                      <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: "1px solid var(--border-1)" }}>
                        <span className="flex-1 text-center text-[11px] font-bold py-2 rounded-lg"
                              style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
                          🔄 Book Again
                        </span>
                        <span className="text-center text-[11px] font-bold py-2 px-4 rounded-lg"
                              style={{ background: "var(--bg-elevated)", color: "var(--text-2)" }}>
                          🧾 Receipt
                        </span>
                      </div>
                    )}

                    {/* Track button for active */}
                    {["accepted", "in_progress"].includes(b.status) && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-1)" }}>
                        <span className="block text-center text-[11px] font-bold py-2 rounded-lg text-white"
                              style={{ background: "#3B82F6" }}>
                          🗺️ Track Worker Live
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
