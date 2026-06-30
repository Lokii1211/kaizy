"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/stores/AuthStore";

// ============================================================
// MY BOOKINGS v12.0 — Stitch "Digital Artisan" Design
// Active bookings at top with live status, completed below
// Review link for completed bookings without reviews
// ============================================================

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};
const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  accepted: { label: "Accepted", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  scheduled: { label: "Scheduled", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  en_route: { label: "En Route", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
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
  scheduled_for?: string;
  booking_type?: string;
  has_review?: boolean;
}

const tabs = ["Upcoming", "Active", "Completed", "Cancelled"];

export default function MyBookingsPage() {
  const { userType } = useAuth();
  const [activeTab, setActiveTab] = useState(1);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/bookings?hirerId=me&limit=50");
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
            scheduled_for: b.scheduled_for,
            booking_type: b.booking_type,
            has_review: b.has_review || false,
          })));
        }
      } catch (e) { console.error("[my-bookings]", e); }
      finally { setLoading(false); }
    };
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: string, status: string) => {
    let feeWarning = "";
    if (["en_route"].includes(status)) feeWarning = "\n\nA cancellation fee of Rs.25 applies (worker already dispatched).";
    else if (["arrived", "in_progress"].includes(status)) feeWarning = "\n\n50% cancellation fee applies (worker has arrived/started).";
    const confirmed = window.confirm(`Are you sure you want to cancel this booking?${feeWarning}\n\nThis action cannot be undone.`);
    if (!confirmed) return;
    setCancellingId(bookingId);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, cancelledBy: userType, reason: "User cancelled" }),
      });
      const json = await res.json();
      if (json.success) { setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b)); }
      else { alert(json.error || "Failed to cancel"); }
    } catch { alert("Network error. Please try again."); }
    finally { setCancellingId(null); }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 0) return b.booking_type === "scheduled" || b.status === "scheduled";
    if (activeTab === 1) return ["pending", "accepted", "en_route", "in_progress"].includes(b.status);
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

  const activeCount = bookings.filter(b => ["pending", "accepted", "en_route", "in_progress"].includes(b.status)).length;

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" aria-label="Go back" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">&#8592;</span>
          </Link>
          <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            My Bookings
          </h1>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
                    className="px-4 py-2 rounded-full text-[10px] font-bold transition-all active:scale-95 shrink-0"
                    style={{ background: activeTab === i ? "var(--brand)" : "var(--bg-surface)", color: activeTab === i ? "#FFDBCC" : "var(--text-3)" }}>
              {tab}
              {i === 1 && activeCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[7px] bg-white" style={{ color: "var(--brand)" }}>
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-3">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2.5">
            {[1,2,3].map(i => <div key={i} className="rounded-[16px] skeleton" style={{ height: 100 }} />)}
          </div>
        )}

        {/* Empty state with CTA */}
        {!loading && filteredBookings.length === 0 && (
          <div className="text-center py-16 rounded-[20px]" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
            <p className="text-[48px] mb-3">
              {activeTab === 0 ? "📅" : activeTab === 1 ? "🔍" : activeTab === 2 ? "✅" : "🚫"}
            </p>
            <p className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
              {activeTab === 0 ? "No upcoming bookings" : activeTab === 1 ? "No active bookings" : activeTab === 2 ? "No completed bookings" : "No cancelled bookings"}
            </p>
            <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--text-3)" }}>
              {activeTab <= 1 ? "Book a worker to get started!" : `No ${tabs[activeTab].toLowerCase()} bookings yet`}
            </p>
            <Link href="/booking" className="inline-block mt-6 rounded-[16px] px-6 py-3.5 text-[12px] font-bold text-white active:scale-95 transition-transform"
                  style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
              Book a Worker
            </Link>
          </div>
        )}

        {/* Booking list grouped by date */}
        {!loading && Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-5">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>{date}</p>
            <div className="space-y-2.5">
              {items.map(b => {
                const st = statusBadge[b.status] || statusBadge.pending;
                const icon = tradeIcons[b.trade] || "🔧";
                const time = new Date(b.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
                const isActive = ["pending", "accepted", "en_route", "in_progress"].includes(b.status);
                const isTrackable = ["accepted", "en_route", "in_progress"].includes(b.status);

                return (
                  <div key={b.id} className="rounded-[16px] p-4 active:scale-[0.98] transition-all"
                       style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
                    <Link href={`/booking/${b.id}`} className="block">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[18px] relative shrink-0"
                             style={{ background: "var(--bg-surface)" }}>
                          {icon}
                          {/* Live pulse indicator for active bookings */}
                          {isActive && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full online-dot"
                                 style={{ background: "var(--success)", border: "2px solid var(--bg-card)" }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-1)" }}>
                              {b.trade?.replace('_', ' ')} &mdash; {b.worker_name}
                            </p>
                            <span className="text-[8px] font-bold shrink-0 ml-2 px-2 py-0.5 rounded-full"
                                  style={{ background: st.bg, color: st.color }}>{st.label}</span>
                          </div>
                          <p className="text-[10px] truncate font-medium" style={{ color: "var(--text-3)" }}>
                            {b.description || "General service"}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[8px] font-bold" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>{time}</span>
                            <span className="text-[13px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
                              {b.hirer_price > 0 ? `₹${b.hirer_price}` : "TBD"}
                            </span>
                          </div>
                        </div>
                        <span className="text-[14px] shrink-0" style={{ color: "var(--text-3)" }}>&rsaquo;</span>
                      </div>
                    </Link>

                    {/* Completed booking actions */}
                    {b.status === "completed" && (
                      <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: "1px solid var(--border-1)" }}>
                        {!b.has_review && (
                          <Link href={`/review/${b.id}`} className="flex-1 text-center text-[10px] font-bold py-2 rounded-[12px]"
                                style={{ background: "var(--success-tint)", color: "var(--success)" }}>
                            Rate Worker
                          </Link>
                        )}
                        <Link href={`/booking?trade=${b.trade}&workerId=${b.worker_id}`}
                              className="flex-1 text-center text-[10px] font-bold py-2 rounded-[12px]"
                              style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
                          Book Again
                        </Link>
                        <Link href={`/booking/${b.id}`} className="text-center text-[10px] font-bold py-2 px-4 rounded-[12px]"
                              style={{ background: "var(--bg-surface)", color: "var(--text-2)" }}>
                          Receipt
                        </Link>
                      </div>
                    )}

                    {/* Active booking actions */}
                    {isActive && (
                      <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: "1px solid var(--border-1)" }}
                           onClick={(e) => e.stopPropagation()}>
                        {isTrackable && (
                          <Link href={`/tracking/${b.id}`}
                                className="flex-1 text-center text-[10px] font-bold py-2 rounded-[12px] text-white"
                                style={{ background: "var(--info)" }}>
                            Track Live
                          </Link>
                        )}
                        <button onClick={() => handleCancel(b.id, b.status)} disabled={cancellingId === b.id}
                                className="text-center text-[10px] font-bold py-2 px-4 rounded-[12px] active:scale-95 transition-transform"
                                style={{
                                  background: "var(--danger-tint)", color: "var(--danger)",
                                  opacity: cancellingId === b.id ? 0.5 : 1,
                                  flex: isTrackable ? undefined : 1,
                                }}>
                          {cancellingId === b.id ? "Cancelling..." : "Cancel"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
