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

const mockBookings: LiveBooking[] = [
  { id: "LB-001", hirer: "Vinod A.", problem: "MCB Tripping", icon: "⚡", location: "RS Puram, CBE", distance: "1.2 km", price: 500, urgency: "now", expiresIn: 30, color: "#FF6B00" },
  { id: "LB-002", hirer: "Anita S.", problem: "Pipe Leak", icon: "🔧", location: "Peelamedu, CBE", distance: "0.8 km", price: 400, urgency: "sos", expiresIn: 20, color: "#3B8BFF" },
  { id: "LB-003", hirer: "Kumar P.", problem: "Car Breakdown", icon: "🚗", location: "Ukkadam, CBE", distance: "2.3 km", price: 600, urgency: "sos", expiresIn: 15, color: "#8B5CF6" },
  { id: "LB-004", hirer: "Deepa K.", problem: "AC Not Cooling", icon: "❄️", location: "Saibaba Colony", distance: "1.8 km", price: 700, urgency: "normal", expiresIn: 45, color: "#06B6D4" },
];

export default function LiveBookingFeed() {
  const [bookings, setBookings] = useState<LiveBooking[]>([]);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [declined, setDeclined] = useState<string[]>([]);

  // Simulate new bookings arriving
  useEffect(() => {
    // Initial load
    setBookings(mockBookings.slice(0, 2));

    // Add more bookings over time
    const timers = [
      setTimeout(() => setBookings(prev => [...prev, mockBookings[2]]), 8000),
      setTimeout(() => setBookings(prev => [...prev, mockBookings[3]]), 18000),
    ];

    return () => timers.forEach(clearTimeout);
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
