"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// MY BOOKINGS v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · JetBrains Mono pricing · Tonal surfaces
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
  id: string; status: string; created_at: string; hirer_price: number;
  trade: string; description: string; worker_name: string; worker_id: string;
}

const tabs = ["All", "Active", "Completed", "Cancelled"];

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("hirer");

  useEffect(() => {
    const c = document.cookie.split(';').find(c => c.trim().startsWith('kaizy_user_type='));
    if (c) setUserType(c.split('=')[1]?.trim() || 'hirer');
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/bookings?limit=50");
        const json = await res.json();
        if (json.success && json.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setBookings(json.data.map((b: any) => ({
            id: b.id, status: b.status || "pending", created_at: b.created_at,
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

  const handleCancel = async (bookingId: string, status: string) => {
    let feeWarning = "";
    if (["en_route"].includes(status)) feeWarning = "\n\n⚠️ ₹25 cancellation fee applies (worker already dispatched).";
    else if (["arrived", "in_progress"].includes(status)) feeWarning = "\n\n⚠️ 50% cancellation fee applies (worker has arrived/started).";
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
    if (activeTab === 0) return true;
    if (activeTab === 1) return ["pending", "accepted", "in_progress"].includes(b.status);
    if (activeTab === 2) return b.status === "completed";
    if (activeTab === 3) return b.status === "cancelled";
    return true;
  });

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
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            My Bookings
          </h1>
        </div>
        <div className="flex gap-2">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
                    className="px-4 py-2 rounded-full text-[10px] font-bold transition-all active:scale-95"
                    style={{ background: activeTab === i ? "var(--brand)" : "var(--bg-surface)", color: activeTab === i ? "#FFDBCC" : "var(--text-3)" }}>
              {tab}
              {i === 1 && bookings.filter(b => ["pending", "accepted", "in_progress"].includes(b.status)).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[7px] bg-white" style={{ color: "var(--brand)" }}>
                  {bookings.filter(b => ["pending", "accepted", "in_progress"].includes(b.status)).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-3">
        {loading && <div className="space-y-2.5">{[1,2,3].map(i => <div key={i} className="rounded-[16px] skeleton" style={{ height: 100 }} />)}</div>}

        {!loading && filteredBookings.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[48px] mb-3">📋</p>
            <p className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>No bookings yet</p>
            <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--text-3)" }}>
              {activeTab === 0 ? "Book your first worker to get started!" : `No ${tabs[activeTab].toLowerCase()} bookings`}
            </p>
            <Link href="/booking" className="inline-block mt-6 rounded-[16px] px-6 py-3.5 text-[12px] font-bold text-white active:scale-95 transition-transform"
                  style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
              Book Now →
            </Link>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-5">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>{date}</p>
            <div className="space-y-2.5">
              {items.map(b => {
                const st = statusBadge[b.status] || statusBadge.pending;
                const icon = tradeIcons[b.trade] || "🔧";
                const time = new Date(b.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

                return (
                  <Link key={b.id} href={`/booking/${b.id}`}
                        className="block rounded-[16px] p-4 active:scale-[0.98] transition-all"
                        style={{ background: "var(--bg-card)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[18px]"
                           style={{ background: "var(--bg-surface)" }}>{icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-1)" }}>
                            {b.trade?.replace('_', ' ')} — {b.worker_name}
                          </p>
                          <span className="text-[8px] font-bold shrink-0 ml-2 px-2 py-0.5 rounded-full"
                                style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                        <p className="text-[10px] truncate font-medium" style={{ color: "var(--text-3)" }}>
                          {b.description || "General service"}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[8px] font-bold" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>{time}</span>
                          <span className="text-[13px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>₹{b.hirer_price}</span>
                        </div>
                      </div>
                      <span className="text-[14px] shrink-0" style={{ color: "var(--text-3)" }}>›</span>
                    </div>

                    {b.status === "completed" && (
                      <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <span className="flex-1 text-center text-[10px] font-bold py-2 rounded-[12px]"
                              style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>🔄 Book Again</span>
                        <span className="text-center text-[10px] font-bold py-2 px-4 rounded-[12px]"
                              style={{ background: "var(--bg-surface)", color: "var(--text-2)" }}>🧾 Receipt</span>
                      </div>
                    )}

                    {["pending", "accepted", "en_route", "in_progress"].includes(b.status) && (
                      <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                           onClick={(e) => e.preventDefault()}>
                        {["accepted", "en_route", "in_progress"].includes(b.status) && (
                          <span className="flex-1 text-center text-[10px] font-bold py-2 rounded-[12px] text-white"
                                style={{ background: "var(--info)" }}
                                onClick={() => window.location.href = "/tracking"}>🗺️ Track Live</span>
                        )}
                        <button onClick={() => handleCancel(b.id, b.status)} disabled={cancellingId === b.id}
                                className="text-center text-[10px] font-bold py-2 px-4 rounded-[12px] active:scale-95 transition-transform"
                                style={{
                                  background: "var(--danger-tint)", color: "var(--danger)",
                                  opacity: cancellingId === b.id ? 0.5 : 1,
                                  flex: ["accepted", "en_route", "in_progress"].includes(b.status) ? undefined : 1,
                                }}>
                          {cancellingId === b.id ? "⏳" : "✕"} Cancel
                        </button>
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
