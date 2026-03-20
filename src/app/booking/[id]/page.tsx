"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// BOOKING DETAIL — Like Uber Ride Receipt / Swiggy Order Detail
// Shows: Worker info, job details, pricing, rating, re-book
// ============================================================

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};
const statusStyles: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: "Pending", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", icon: "⏳" },
  accepted: { label: "Accepted", color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: "✅" },
  in_progress: { label: "In Progress", color: "#FF6B00", bg: "rgba(255,107,0,0.1)", icon: "🔧" },
  completed: { label: "Completed", color: "#22C55E", bg: "rgba(34,197,94,0.1)", icon: "✓" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: "✕" },
};

interface BookingDetail {
  id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  hirer_price: number;
  worker_payout: number;
  platform_fee: number;
  payment_status: string;
  otp: string;
  trade: string;
  description: string;
  worker_name: string;
  worker_phone: string;
  worker_rating: number;
  worker_trade: string;
  worker_id: string;
  review_rating: number | null;
  review_tags: string[];
  address: string;
}

export default function BookingDetailPage() {
  const { isDark } = useTheme();
  const params = useParams();
  const bookingId = params?.id as string;
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        const json = await res.json();
        if (json.success && json.data) setBooking(json.data);
      } catch (e) { console.error("[booking detail]", e); }
      finally { setLoading(false); }
    };
    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8" style={{ background: "var(--bg-app)" }}>
        <p className="text-[40px] mb-4">📋</p>
        <p className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Booking not found</p>
        <Link href="/my-bookings" className="mt-4 text-[13px] font-bold" style={{ color: "var(--brand)" }}>← View all bookings</Link>
      </div>
    );
  }

  const st = statusStyles[booking.status] || statusStyles.pending;
  const icon = tradeIcons[booking.trade] || "🔧";
  const createdDate = new Date(booking.created_at);
  const completedDate = booking.completed_at ? new Date(booking.completed_at) : null;
  const durationMin = completedDate ? Math.round((completedDate.getTime() - createdDate.getTime()) / 60000) : null;

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-1)" }}>
        <Link href="/my-bookings" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
              style={{ background: "var(--bg-elevated)" }}>
          <span className="text-[14px]">←</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>Booking Details</h1>
          <p className="text-[10px] font-mono" style={{ color: "var(--text-3)" }}>#{booking.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="rounded-full px-3 py-1 text-[10px] font-bold" style={{ background: st.bg, color: st.color }}>
          {st.icon} {st.label}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {/* Worker Card */}
        <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-black text-white"
                 style={{ background: "var(--brand)" }}>
              {booking.worker_name?.[0] || "W"}
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-black" style={{ color: "var(--text-1)" }}>{booking.worker_name || "Worker"}</p>
              <p className="text-[12px] font-semibold" style={{ color: "var(--brand)" }}>{icon} {booking.worker_trade || booking.trade}</p>
              {booking.worker_rating > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[11px]" style={{ color: "var(--warning)" }}>★ {booking.worker_rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            {booking.worker_phone && (
              <a href={`tel:${booking.worker_phone}`}
                 className="w-10 h-10 rounded-full flex items-center justify-center"
                 style={{ background: "var(--success)" }}>
                <span className="text-white text-[16px]">📞</span>
              </a>
            )}
          </div>

          {/* Re-book button */}
          {booking.status === "completed" && (
            <Link href={`/booking?rebook=${booking.worker_id}&trade=${booking.trade}`}
                  className="block w-full rounded-xl py-3 text-center text-[13px] font-bold text-white active:scale-[0.98]"
                  style={{ background: "var(--brand)" }}>
              🔄 Book {booking.worker_name} Again
            </Link>
          )}
        </div>

        {/* Job Details */}
        <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <p className="text-[11px] font-bold mb-2" style={{ color: "var(--text-3)" }}>JOB DETAILS</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[12px]" style={{ color: "var(--text-2)" }}>Service</span>
              <span className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{icon} {booking.trade?.replace('_', ' ')}</span>
            </div>
            {booking.description && (
              <div className="flex justify-between">
                <span className="text-[12px]" style={{ color: "var(--text-2)" }}>Description</span>
                <span className="text-[12px] font-bold text-right max-w-[60%]" style={{ color: "var(--text-1)" }}>{booking.description}</span>
              </div>
            )}
            {booking.address && (
              <div className="flex justify-between">
                <span className="text-[12px]" style={{ color: "var(--text-2)" }}>Location</span>
                <span className="text-[12px] font-bold text-right max-w-[60%]" style={{ color: "var(--text-1)" }}>📍 {booking.address}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[12px]" style={{ color: "var(--text-2)" }}>Booked on</span>
              <span className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>
                {createdDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {createdDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {completedDate && (
              <div className="flex justify-between">
                <span className="text-[12px]" style={{ color: "var(--text-2)" }}>Completed</span>
                <span className="text-[12px] font-bold" style={{ color: "var(--success)" }}>
                  {completedDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} ({durationMin} min)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-[11px] font-bold" style={{ color: "var(--text-3)" }}>PAYMENT SUMMARY</p>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                  style={{
                    background: booking.payment_status === "paid" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                    color: booking.payment_status === "paid" ? "#22C55E" : "#F59E0B"
                  }}>
              {booking.payment_status === "paid" ? "✓ Paid" : "⏳ Pending"}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[12px]">
              <span style={{ color: "var(--text-2)" }}>Worker&apos;s charge</span>
              <span className="font-bold" style={{ color: "var(--text-1)" }}>₹{booking.hirer_price || 0}</span>
            </div>
            {booking.platform_fee > 0 && (
              <div className="flex justify-between text-[12px]">
                <span style={{ color: "var(--text-2)" }}>Platform fee</span>
                <span className="font-bold" style={{ color: "var(--text-1)" }}>₹{booking.platform_fee}</span>
              </div>
            )}
            <div className="h-px" style={{ background: "var(--border-1)" }} />
            <div className="flex justify-between text-[14px]">
              <span className="font-bold" style={{ color: "var(--text-1)" }}>Total</span>
              <span className="font-black" style={{ color: "var(--brand)" }}>₹{(booking.hirer_price || 0) + (booking.platform_fee || 0)}</span>
            </div>
          </div>
        </div>

        {/* Review (if completed) */}
        {booking.review_rating && (
          <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <p className="text-[11px] font-bold mb-2" style={{ color: "var(--text-3)" }}>YOUR REVIEW</p>
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map(s => (
                <span key={s} className="text-[18px]">{s <= (booking.review_rating || 0) ? "⭐" : "☆"}</span>
              ))}
              <span className="text-[12px] font-bold ml-1" style={{ color: "var(--text-1)" }}>{booking.review_rating}/5</span>
            </div>
            {booking.review_tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {booking.review_tags.map(tag => (
                  <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "var(--success-tint)", color: "var(--success)" }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Digital Invoice */}
        <button onClick={() => setShowInvoice(!showInvoice)}
                className="w-full rounded-2xl p-4 text-left active:scale-[0.98]"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[18px]">🧾</span>
              <div>
                <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>Digital Invoice</p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>View or download receipt</p>
              </div>
            </div>
            <span className="text-[14px]" style={{ color: "var(--text-3)" }}>{showInvoice ? "▲" : "▼"}</span>
          </div>
        </button>

        {showInvoice && (
          <div className="rounded-2xl p-5 space-y-3 border-2" style={{ background: isDark ? "#1a1a2e" : "#FAFAFA", borderColor: "var(--brand)" }}>
            <div className="text-center mb-4">
              <p className="text-[20px] font-black" style={{ color: "var(--brand)" }}>KAIZY</p>
              <p className="text-[10px]" style={{ color: "var(--text-3)" }}>Digital Tax Invoice</p>
            </div>
            <div className="h-px" style={{ background: "var(--border-1)" }} />
            <div className="flex justify-between text-[11px]">
              <span style={{ color: "var(--text-3)" }}>Invoice No</span>
              <span className="font-mono font-bold" style={{ color: "var(--text-1)" }}>KZ-{booking.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span style={{ color: "var(--text-3)" }}>Date</span>
              <span className="font-bold" style={{ color: "var(--text-1)" }}>{createdDate.toLocaleDateString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span style={{ color: "var(--text-3)" }}>Service Provider</span>
              <span className="font-bold" style={{ color: "var(--text-1)" }}>{booking.worker_name}</span>
            </div>
            <div className="h-px" style={{ background: "var(--border-1)" }} />
            <div className="flex justify-between text-[11px]">
              <span style={{ color: "var(--text-3)" }}>Service: {booking.trade?.replace('_', ' ')}</span>
              <span className="font-bold" style={{ color: "var(--text-1)" }}>₹{booking.hirer_price}</span>
            </div>
            {booking.platform_fee > 0 && (
              <div className="flex justify-between text-[11px]">
                <span style={{ color: "var(--text-3)" }}>Platform fee</span>
                <span className="font-bold" style={{ color: "var(--text-1)" }}>₹{booking.platform_fee}</span>
              </div>
            )}
            <div className="h-px" style={{ background: "var(--border-1)" }} />
            <div className="flex justify-between text-[14px]">
              <span className="font-bold" style={{ color: "var(--text-1)" }}>Grand Total</span>
              <span className="font-black" style={{ color: "var(--brand)" }}>₹{(booking.hirer_price || 0) + (booking.platform_fee || 0)}</span>
            </div>
            <p className="text-center text-[8px] mt-2" style={{ color: "var(--text-3)" }}>This is a computer-generated invoice · Kaizy Platform</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-2">
          {booking.status === "completed" && (
            <Link href={`/booking?rebook=${booking.worker_id}&trade=${booking.trade}`}
                  className="flex-1 rounded-xl py-3.5 text-center text-[13px] font-bold text-white active:scale-95"
                  style={{ background: "var(--brand)" }}>
              🔄 Re-book
            </Link>
          )}
          <Link href="/help"
                className="flex-1 rounded-xl py-3.5 text-center text-[13px] font-bold active:scale-95"
                style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
            🛟 Get Help
          </Link>
          {booking.status !== "completed" && booking.status !== "cancelled" && (
            <Link href="/dispute"
                  className="flex-1 rounded-xl py-3.5 text-center text-[13px] font-bold active:scale-95"
                  style={{ background: "var(--danger-tint)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
              ⚠️ Report Issue
            </Link>
          )}
        </div>

        {/* Save Worker + Job Photos */}
        <div className="flex gap-2 mt-2">
          <button onClick={() => {
            try {
              const saved = JSON.parse(localStorage.getItem("kaizy_saved_workers") || "[]");
              const exists = saved.some((w: {id: string}) => w.id === booking.worker_id);
              if (!exists) {
                saved.push({
                  id: booking.worker_id,
                  name: booking.worker_name,
                  trade: booking.worker_trade || booking.trade,
                  rating: booking.worker_rating,
                  jobs: 0,
                  kaizyScore: 0,
                  savedAt: new Date().toISOString(),
                  initials: (booking.worker_name || "W").split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 2),
                });
                localStorage.setItem("kaizy_saved_workers", JSON.stringify(saved));
                alert("❤️ Worker saved to favorites!");
              } else {
                alert("Already in your saved workers!");
              }
            } catch { alert("Could not save"); }
          }}
                  className="flex-1 rounded-xl py-3.5 text-center text-[13px] font-bold active:scale-95"
                  style={{ background: "var(--bg-card)", color: "var(--danger)", border: "1px solid var(--border-1)" }}>
            ❤️ Save Worker
          </button>
          <Link href="/job-photos"
                className="flex-1 rounded-xl py-3.5 text-center text-[13px] font-bold active:scale-95"
                style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
            📸 Job Photos
          </Link>
        </div>
      </div>
    </div>
  );
}
