"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// WORKER PROFILE — Full public profile for hirers
// Hero photo · Stats · Pricing table · Reviews · Book/Schedule
// ============================================================

interface WorkerService {
  id: string; name: string; price: number; unit: string;
}

interface Review {
  id: string; name: string; rating: number; comment: string;
  date: string; tags: string[];
}

interface WorkerProfile {
  id: string; name: string; trade: string; experience: number;
  rating: number; jobs_done: number; completion_rate: number;
  verified: boolean; kaizy_score: number; is_online: boolean;
  available_from: string; distance: number;
  services: WorkerService[];
  reviews: Review[];
  photos: string[];
}

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗", ac_repair: "❄️",
  carpenter: "🪚", painter: "🎨", mason: "⚒️", puncture: "🛞",
};

const VISIT_CHARGES = [
  { range: "0–3 km", price: 49 },
  { range: "3–7 km", price: 79 },
  { range: "7+ km", price: 129 },
];

// Mock worker data (until API is connected)
const mockWorker: WorkerProfile = {
  id: "w1", name: "Suresh Murugesan", trade: "electrician", experience: 15,
  rating: 4.9, jobs_done: 312, completion_rate: 98, verified: true,
  kaizy_score: 742, is_online: true, available_from: "Available now",
  distance: 1.2,
  services: [
    { id: "s1", name: "Fan / light repair", price: 200, unit: "per job" },
    { id: "s2", name: "Switchboard / MCB", price: 280, unit: "per unit" },
    { id: "s3", name: "Wiring fault", price: 450, unit: "per job" },
    { id: "s4", name: "AC electrical work", price: 600, unit: "per unit" },
    { id: "s5", name: "Inverter / UPS", price: 700, unit: "per unit" },
    { id: "s6", name: "CCTV / Smart Home", price: 900, unit: "per setup" },
  ],
  reviews: [
    { id: "r1", name: "Priya S.", rating: 5, comment: "Excellent work! Fixed the MCB issue in 20 minutes. Very professional.", date: "2 days ago", tags: ["On time", "Clean work"] },
    { id: "r2", name: "Vinod K.", rating: 5, comment: "Great electrician. Arrived early and explained everything clearly.", date: "1 week ago", tags: ["Polite", "Fair price"] },
    { id: "r3", name: "Lakshmi R.", rating: 4, comment: "Good work. Took a bit longer than expected but quality was excellent.", date: "2 weeks ago", tags: ["Professional"] },
  ],
  photos: [],
};

export default function WorkerProfilePage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useParams();
  const workerId = params?.id as string;
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState("");
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/workers/${workerId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setWorker(json.data);
        } else {
          // Use mock data
          setWorker({ ...mockWorker, id: workerId || "w1" });
        }
      } catch {
        setWorker({ ...mockWorker, id: workerId || "w1" });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [workerId]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
        <div className="skeleton h-48 w-full" />
        <div className="px-5 mt-4 space-y-3">
          <div className="skeleton h-8 w-48 rounded-full" />
          <div className="skeleton h-4 w-32 rounded-full" />
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-[14px]" />)}
          </div>
          <div className="skeleton h-40 rounded-[16px] mt-4" />
        </div>
      </div>
    );
  }

  if (!worker) return null;

  const visitCharge = worker.distance <= 3 ? 49 : worker.distance <= 7 ? 79 : 129;
  const lowestPrice = Math.min(...worker.services.map(s => s.price));

  // Date options for scheduling
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      date: d.getDate(),
      month: d.toLocaleDateString("en-IN", { month: "short" }),
      full: d.toISOString(),
    };
  });

  const timeSlots = [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
    "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM",
  ];

  const handleBookNow = () => {
    try {
      sessionStorage.setItem("kaizy_selected_worker", JSON.stringify({
        id: worker.id, name: worker.name, trade: worker.trade,
        rating: worker.rating, distance: worker.distance,
      }));
    } catch {}
    router.push(`/booking?workerId=${worker.id}&mode=instant`);
  };

  const handleScheduleConfirm = () => {
    if (!selectedTime) return;
    try {
      sessionStorage.setItem("kaizy_schedule_booking", JSON.stringify({
        workerId: worker.id, workerName: worker.name,
        date: dateOptions[selectedDate].full,
        time: selectedTime, trade: worker.trade,
      }));
    } catch {}
    router.push(`/booking?workerId=${worker.id}&mode=scheduled&date=${dateOptions[selectedDate].full}&time=${selectedTime}`);
  };

  // Rating breakdown
  const ratingBreakdown = [
    { stars: 5, pct: 89 }, { stars: 4, pct: 8 },
    { stars: 3, pct: 2 }, { stars: 2, pct: 1 }, { stars: 1, pct: 0 },
  ];

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg-app)" }}>
      {/* Hero */}
      <div className="h-52 relative"
           style={{ background: isDark ? "linear-gradient(135deg, #1a0f09, #0d0906)" : "linear-gradient(135deg, #FFF3E0, #FFE0B2)" }}>
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 pt-4 z-10">
          <button onClick={() => router.back()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90"
                  style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(10px)" }}>
            <span className="text-white text-[14px]">←</span>
          </button>
          <button className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90"
                  style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(10px)" }}>
            <span className="text-white text-[14px]">↗️</span>
          </button>
        </div>
        {/* Trade icon in hero */}
        <div className="absolute bottom-0 left-0 right-0 h-24"
             style={{ background: "linear-gradient(transparent, var(--bg-app))" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[80px] opacity-30">{tradeIcons[worker.trade] || "🔧"}</span>
        </div>
      </div>

      {/* Profile info */}
      <div className="px-5 -mt-10 relative z-10">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
             style={{
               background: "var(--brand-tint)",
               border: "4px solid var(--bg-app)",
               boxShadow: "var(--shadow-card)",
             }}>
          <span className="text-[32px] font-black" style={{ color: "var(--brand)" }}>
            {worker.name.charAt(0)}
          </span>
        </div>

        <h1 className="text-[22px] font-black tracking-tight"
            style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
          {worker.name}
        </h1>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[12px] font-bold" style={{ color: "var(--brand-soft)" }}>
            {tradeIcons[worker.trade]} {worker.trade?.replace('_', ' ')} · {worker.experience}+ yrs
          </span>
          {worker.verified && (
            <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--trust-tint)", color: "var(--trust)" }}>✓ Verified</span>
          )}
        </div>

        {/* Availability indicator */}
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2.5 h-2.5 rounded-full ${worker.is_online ? "online-dot" : ""}`}
               style={{ background: worker.is_online ? "var(--success)" : "var(--text-3)" }} />
          <span className="text-[11px] font-bold"
                style={{ color: worker.is_online ? "var(--success)" : "var(--text-3)" }}>
            {worker.is_online ? "🟢 Available now" : worker.available_from}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>· {worker.distance} km</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 px-5 mt-5">
        {[
          { label: "Rating", value: worker.rating.toFixed(1), icon: "⭐" },
          { label: "Jobs", value: worker.jobs_done.toString(), icon: "📋" },
          { label: "Done %", value: `${worker.completion_rate}%`, icon: "✅" },
          { label: "KS", value: worker.kaizy_score.toString(), icon: "🏅" },
        ].map(stat => (
          <div key={stat.label} className="rounded-[14px] p-3 text-center"
               style={{ background: "var(--bg-card)" }}>
            <p className="text-[10px] mb-0.5">{stat.icon}</p>
            <p className="text-[16px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
              {stat.value}
            </p>
            <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ═══ PRICING SECTION ═══ */}
      <div className="px-5 mt-6">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
          {worker.name.split(" ")[0]}&apos;s Prices
        </p>
        <div className="rounded-[18px] overflow-hidden" style={{ background: "var(--bg-card)" }}>
          {worker.services.map((service, i) => (
            <div key={service.id}
                 className="flex items-center justify-between px-4 py-3"
                 style={{ borderBottom: i < worker.services.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div className="flex items-center gap-2.5">
                <span className="text-[12px]">{tradeIcons[worker.trade] || "🔧"}</span>
                <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{service.name}</p>
              </div>
              <p className="text-[13px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
                ₹{service.price.toLocaleString("en-IN")}
              </p>
            </div>
          ))}
          {/* Visit charge */}
          <div className="flex items-center justify-between px-4 py-3"
               style={{ background: "var(--bg-surface)" }}>
            <span className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>
              + Visit charge ({VISIT_CHARGES.find(v => worker.distance <= parseInt(v.range))?.range || "7+ km"})
            </span>
            <span className="text-[11px] font-bold" style={{ color: "var(--text-2)", fontFamily: "'JetBrains Mono', monospace" }}>
              ₹{visitCharge}
            </span>
          </div>
        </div>
        <p className="text-[9px] mt-2 font-medium" style={{ color: "var(--text-3)" }}>
          Final price quoted after seeing the problem. You approve before work starts.
        </p>
      </div>

      {/* ═══ REVIEWS SECTION ═══ */}
      <div className="px-5 mt-6">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
          Reviews ({worker.reviews.length})
        </p>

        {/* Rating breakdown */}
        <div className="rounded-[18px] p-4 mb-4" style={{ background: "var(--bg-card)" }}>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[36px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
                {worker.rating}
              </p>
              <div className="flex gap-0.5 justify-center mb-1">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className="text-[12px]" style={{ color: s <= Math.round(worker.rating) ? "#F59E0B" : "var(--text-3)" }}>★</span>
                ))}
              </div>
              <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{worker.jobs_done} reviews</p>
            </div>
            <div className="flex-1 space-y-1">
              {ratingBreakdown.map(r => (
                <div key={r.stars} className="flex items-center gap-2">
                  <span className="text-[9px] font-bold w-3" style={{ color: "var(--text-3)" }}>{r.stars}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                    <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: "var(--warning)" }} />
                  </div>
                  <span className="text-[8px] font-bold w-8 text-right" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>{r.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Review tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["On time", "Clean work", "Polite", "Fair price", "Professional"].map(tag => (
              <span key={tag} className="text-[9px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: "var(--success-tint)", color: "var(--success)" }}>
                ✓ {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Individual reviews */}
        {(showAllReviews ? worker.reviews : worker.reviews.slice(0, 3)).map(review => (
          <div key={review.id} className="rounded-[14px] p-3.5 mb-2" style={{ background: "var(--bg-surface)" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                   style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
                {review.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{review.name}</p>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className="text-[8px]" style={{ color: s <= review.rating ? "#F59E0B" : "var(--text-3)" }}>★</span>
                  ))}
                  <span className="text-[8px] ml-1" style={{ color: "var(--text-3)" }}>{review.date}</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] font-medium" style={{ color: "var(--text-2)" }}>{review.comment}</p>
          </div>
        ))}

        {worker.reviews.length > 3 && !showAllReviews && (
          <button onClick={() => setShowAllReviews(true)}
                  className="text-[11px] font-bold mt-1" style={{ color: "var(--brand)" }}>
            See all {worker.reviews.length} reviews →
          </button>
        )}
      </div>

      {/* ═══ SCHEDULE BOTTOM SHEET ═══ */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSchedule(false)} />
          <div className="relative w-full rounded-t-[28px] p-5 pb-8 max-h-[80vh] overflow-y-auto"
               style={{ background: "var(--bg-app)" }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--bg-elevated)" }} />
            <h2 className="text-[18px] font-black mb-4" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
              Schedule with {worker.name.split(" ")[0]}
            </h2>

            {/* Date selection */}
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Select Date</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
              {dateOptions.map((d, i) => (
                <button key={i} onClick={() => setSelectedDate(i)}
                        className="shrink-0 rounded-[14px] p-3 text-center active:scale-95 transition-all"
                        style={{
                          background: selectedDate === i ? "var(--brand)" : "var(--bg-card)",
                          minWidth: 72,
                        }}>
                  <p className="text-[9px] font-bold" style={{ color: selectedDate === i ? "#FFDBCC" : "var(--text-3)" }}>{d.day}</p>
                  <p className="text-[18px] font-black" style={{ color: selectedDate === i ? "#fff" : "var(--text-1)" }}>{d.date}</p>
                  <p className="text-[8px] font-medium" style={{ color: selectedDate === i ? "#FFDBCC" : "var(--text-3)" }}>{d.month}</p>
                </button>
              ))}
            </div>

            {/* Time selection */}
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Select Time</p>
            <div className="grid grid-cols-4 gap-2 mb-5">
              {timeSlots.map(t => (
                <button key={t} onClick={() => setSelectedTime(t)}
                        className="rounded-[12px] py-2.5 text-[10px] font-bold text-center active:scale-95 transition-all"
                        style={{
                          background: selectedTime === t ? "var(--brand)" : "var(--bg-surface)",
                          color: selectedTime === t ? "#fff" : "var(--text-2)",
                        }}>
                  {t}
                </button>
              ))}
            </div>

            <button onClick={handleScheduleConfirm} disabled={!selectedTime}
                    className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all"
                    style={{
                      background: selectedTime ? "var(--gradient-cta)" : "var(--bg-elevated)",
                      color: selectedTime ? "#FFDBCC" : "var(--text-3)",
                      boxShadow: selectedTime ? "var(--shadow-brand)" : "none",
                    }}>
              Confirm Schedule →
            </button>
          </div>
        </div>
      )}

      {/* ═══ STICKY BOTTOM BAR ═══ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-40 flex items-center gap-3"
           style={{ background: "var(--bg-app)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex-1">
          <p className="text-[16px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{lowestPrice}
          </p>
          <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>starting price</p>
        </div>
        <button onClick={() => setShowSchedule(true)}
                className="rounded-[14px] px-5 py-3.5 text-[12px] font-bold active:scale-95 transition-transform"
                style={{ background: "var(--bg-card)", color: "var(--text-1)" }}>
          📅 Schedule
        </button>
        <button onClick={handleBookNow}
                className="rounded-[14px] px-6 py-3.5 text-[12px] font-bold text-white active:scale-95 transition-transform"
                style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
          Book Now →
        </button>
      </div>
    </div>
  );
}
