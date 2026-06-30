"use client";

import { useState, useEffect } from "react";

// ============================================================
// Kaizy — LIVE BOOKING BROADCAST
// Shows nearby unbooked workers a live booking alert
// Like Uber/Rapido "New ride request" notification for drivers
// ============================================================

interface LiveBooking {
  id: string;
  hirer: string;
  problem: string;
  icon: string;
  location: string;
  distance: string;
  price: number;
  urgency: "normal" | "now" | "sos";
  expiresIn: number;
  color: string;
}

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨",
};

export default function LiveBookingFeed() {
  const [bookings, setBookings] = useState<LiveBooking[]>([]);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [declined, setDeclined] = useState<string[]>([]);

  // Fetch real job alerts from API
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/notifications?limit=5");
        const json = await res.json();
        if (json.success && json.data?.length) {
          const alerts: LiveBooking[] = json.data
            .filter((n: { type: string }) => n.type === "JOB_ALERT" || n.type === "EMERGENCY_ALERT")
            .slice(0, 4)
            .map((n: { id: string; data: Record<string, unknown>; type: string; body: string }) => ({
              id: n.id,
              hirer: String(n.data?.hirerName || "Customer"),
              problem: String(n.data?.problemType || "Service needed"),
              icon: tradeIcons[String(n.data?.trade || "").toLowerCase()] || "🔧",
              location: String(n.data?.address || "Nearby"),
              distance: `${Number(n.data?.distance || 0).toFixed(1)} km`,
              price: Number(n.data?.price || 0),
              urgency: n.type === "EMERGENCY_ALERT" ? "sos" as const : "now" as const,
              expiresIn: 45,
              color: n.type === "EMERGENCY_ALERT" ? "#EF4444" : "#FF6B00",
            }));
          setBookings(alerts);
        }
      } catch {}
    };
    fetchAlerts();
    const id = setInterval(fetchAlerts, 30000);
    return () => clearInterval(id);
  }, []);

  // Countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setBookings(prev =>
        prev.map(b => ({ ...b, expiresIn: Math.max(0, b.expiresIn - 1) }))
            .filter(b => b.expiresIn > 0)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = (id: string) => {
    setAccepted(p => [...p, id]);
    // In real app: POST to /api/bookings to accept
  };

  const handleDecline = (id: string) => {
    setDeclined(p => [...p, id]);
  };

  const activeBookings = bookings.filter(b => !accepted.includes(b.id) && !declined.includes(b.id));

  if (activeBookings.length === 0) return null;

  return (
    <div className="space-y-2 animate-stagger">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full online-pulse" style={{ background: "var(--danger)" }} />
          <p className="text-[12px] font-extrabold" style={{ color: "var(--text-1)" }}>
            Live Requests [{activeBookings.length}]
          </p>
        </div>
        <span className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>Auto-refresh</span>
      </div>

      {activeBookings.map(booking => {
        const isAccepted = accepted.includes(booking.id);
        const urgencyLabel = booking.urgency === "sos" ? "🆘 SOS" : booking.urgency === "now" ? "⚡ NOW" : "📅 Scheduled";
        const urgencyColor = booking.urgency === "sos" ? "var(--danger)" : booking.urgency === "now" ? "var(--brand)" : "var(--info)";
        const pct = Math.round((booking.expiresIn / 45) * 100);

        return (
          <div key={booking.id} className="rounded-[16px] overflow-hidden transition-all"
               style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            {/* Urgency progress bar */}
            <div style={{ height: 3, background: "var(--bg-elevated)" }}>
              <div className="h-full transition-all" style={{ width: `${pct}%`, background: urgencyColor }} />
            </div>

            <div className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[22px] shrink-0"
                     style={{ background: `${booking.color}15`, border: `1px solid ${booking.color}30` }}>
                  {booking.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>{booking.problem}</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${String(urgencyColor).replace("var(", "").replace(")", "")}`, color: "#fff",
                                   backgroundColor: booking.urgency === "sos" ? "var(--danger)" : booking.urgency === "now" ? "var(--brand)" : "var(--info)" }}>
                      {urgencyLabel}
                    </span>
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                    👤 {booking.hirer} · 📍 {booking.location} · {booking.distance}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[15px] font-black" style={{ color: "var(--brand)" }}>₹{booking.price}</p>
                  <p className="text-[9px] font-bold" style={{ color: booking.expiresIn < 10 ? "var(--danger)" : "var(--text-3)" }}>
                    {booking.expiresIn}s left
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-2.5">
                <button onClick={() => handleAccept(booking.id)}
                        className="flex-1 rounded-[10px] py-2.5 text-[12px] font-extrabold text-white active:scale-95 transition-transform"
                        style={{ background: "var(--success)", boxShadow: "0 4px 16px rgba(0,208,132,0.3)" }}>
                  ✓ Accept · ₹{booking.price}
                </button>
                <button onClick={() => handleDecline(booking.id)}
                        className="rounded-[10px] py-2.5 px-4 text-[12px] font-extrabold active:scale-95 transition-transform"
                        style={{ background: "var(--bg-elevated)", color: "var(--text-3)", border: "1px solid var(--border-1)" }}>
                  ✕
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Accepted confirmation */}
      {accepted.length > 0 && (
        <div className="rounded-[14px] p-3 text-center animate-scale-in"
             style={{ background: "var(--success-tint)", border: "1px solid var(--success)" }}>
          <p className="text-[12px] font-bold" style={{ color: "var(--success)" }}>
            ✓ {accepted.length} booking{accepted.length > 1 ? "s" : ""} accepted! Check My Jobs.
          </p>
        </div>
      )}
    </div>
  );
}
