"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { useAuth } from "@/stores/AuthStore";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

// ============================================================
// LIVE TRACKING v13.0 — Kaizy Digital Artisan
// Leaflet maps (free, no token) · Supabase Realtime location
// Worker GPS → tracking_sessions → Realtime → Hirer map
// Full flow: en_route → arrived → OTP → working → done → pay
// ============================================================

interface TrackingData {
  status: "en_route" | "arrived" | "working" | "completed";
  worker: { id: string; name: string; lat: number; lng: number; heading?: number; speed?: number };
  destination: { lat: number; lng: number };
  eta: number;
  otp: string;
  distanceKm: number;
}

interface QuoteData {
  diagnosis: string;
  amount: number;
  partsCost: number;
  complexity: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_type?: string;
}

interface WorkerInfo {
  name: string;
  trade: string;
  rating: number;
  initials: string;
  kaizyScore: number;
  tradeIcon: string;
}

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};

const statusConfig = {
  en_route: { label: "Worker on the way", color: "var(--info)", icon: "🚗" },
  arrived:  { label: "Worker has arrived!", color: "var(--warning)", icon: "📍" },
  working:  { label: "Job in progress", color: "var(--brand)", icon: "🔧" },
  completed:{ label: "Job completed!", color: "var(--success)", icon: "✅" },
};

function TrackingContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || searchParams.get("id");
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [worker, setWorker] = useState<WorkerInfo | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [eta, setEta] = useState(0);
  const [status, setStatus] = useState<TrackingData["status"]>("en_route");
  const [loading, setLoading] = useState(true);
  const [bookingAmount, setBookingAmount] = useState(0);
  const [paymentDone, setPaymentDone] = useState(false);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [bookingStatusExt, setBookingStatusExt] = useState<string>("");
  const [quoteProcessing, setQuoteProcessing] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Load from sessionStorage fallback
  useEffect(() => {
    try {
      const loc = sessionStorage.getItem("kaizy_booking_location") || sessionStorage.getItem("kaizy_verified_location");
      if (loc) {
        const p = JSON.parse(loc);
        if (p.lat && p.lng) setUserPos({ lat: Number(p.lat), lng: Number(p.lng) });
      }
      const job = sessionStorage.getItem("kaizy_active_job");
      if (job) {
        const j = JSON.parse(job);
        if (j.pricing?.grandTotal) setBookingAmount(j.pricing.grandTotal);
      }
      const w = sessionStorage.getItem("kaizy_booked_worker");
      if (w) {
        const wk = JSON.parse(w);
        setWorker({
          name: wk.name || "Worker",
          trade: wk.trade || "technician",
          rating: Number(wk.rating) || 4.5,
          initials: (wk.name || "W").split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 2),
          kaizyScore: Number(wk.kaizyScore) || 500,
          tradeIcon: tradeIcons[wk.trade] || "🔧",
        });
      }
    } catch { /* sessionStorage may be unavailable in SSR */ }
  }, []);

  // Fetch initial tracking state + booking quote status
  const fetchTracking = useCallback(async () => {
    if (!bookingId) return;
    try {
      const [trackRes, bookingRes] = await Promise.all([
        fetch(`/api/tracking?bookingId=${bookingId}`),
        fetch(`/api/bookings/status?id=${bookingId}`),
      ]);
      const [trackJson, bookingJson] = await Promise.all([trackRes.json(), bookingRes.json()]);

      if (trackJson.success && trackJson.data) {
        const d = trackJson.data;
        setTracking(d);
        setStatus(d.status);
        setEta(d.eta || 0);
        if (d.destination?.lat && d.destination?.lng) {
          setUserPos({ lat: d.destination.lat, lng: d.destination.lng });
        }
        if (d.worker?.name) {
          setWorker(prev => ({
            name: d.worker.name,
            trade: prev?.trade || "technician",
            rating: prev?.rating || 4.5,
            initials: d.worker.name.split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 2),
            kaizyScore: prev?.kaizyScore || 500,
            tradeIcon: prev?.tradeIcon || "🔧",
          }));
        }
        if (d.status === "completed") setShowPayment(true);
      }

      // Check booking for quote status
      if (bookingJson.success && bookingJson.data) {
        const bk = bookingJson.data;
        setBookingStatusExt(bk.status || "");
        if (bk.status === "quote_sent" && bk.worker_diagnosis) {
          setQuoteData({
            diagnosis: bk.worker_diagnosis,
            amount: bk.total_quoted || bk.quoted_amount || 0,
            partsCost: bk.parts_cost || 0,
            complexity: bk.complexity_level || "medium",
          });
        }
        // Clear quote when approved/rejected
        if (bk.status === "in_progress" || bk.status === "quote_rejected") {
          setQuoteData(null);
        }
      }
    } catch {}
    setLoading(false);
  }, [bookingId]);

  useEffect(() => { fetchTracking(); }, [fetchTracking]);

  // Supabase Realtime: live worker location from tracking_sessions
  useEffect(() => {
    if (!bookingId || !supabase) return;

    const channel = supabase
      .channel(`tracking-${bookingId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "tracking_sessions",
        filter: `booking_id=eq.${bookingId}`,
      }, (payload) => {
        const row = payload.new as {
          worker_lat: number; worker_lng: number; eta_minutes: number;
          status: string; dest_lat: number; dest_lng: number;
        };
        setTracking(prev => prev ? {
          ...prev,
          worker: { ...prev.worker, lat: row.worker_lat, lng: row.worker_lng },
          eta: row.eta_minutes,
          status: row.status as TrackingData["status"],
        } : null);
        setEta(row.eta_minutes);
        setStatus(row.status as TrackingData["status"]);
        if (row.dest_lat && row.dest_lng) setUserPos({ lat: row.dest_lat, lng: row.dest_lng });
        if (row.status === "completed") setShowPayment(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bookingId]);

  // ETA countdown
  useEffect(() => {
    if (status !== "en_route") return;
    const t = setInterval(() => setEta(e => Math.max(0, e - 1)), 60000);
    return () => clearInterval(t);
  }, [status]);

  // Fallback poll every 15s
  useEffect(() => {
    if (!bookingId) return;
    pollRef.current = setInterval(fetchTracking, 15000);
    return () => clearInterval(pollRef.current);
  }, [bookingId, fetchTracking]);

  // Fetch chat messages
  const fetchMessages = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await fetch(`/api/chat?booking_id=${bookingId}&limit=50`);
      const json = await res.json();
      if (json.success && json.data) setMessages(json.data);
    } catch {}
  }, [bookingId]);

  useEffect(() => { if (showChat) fetchMessages(); }, [showChat, fetchMessages]);

  // Realtime chat messages
  useEffect(() => {
    if (!bookingId || !supabase) return;
    const ch = supabase.channel(`chat-${bookingId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${bookingId}` },
        (p) => setMessages(prev => [...prev, p.new as ChatMessage])
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [bookingId]);

  // Realtime booking status — catch quote_sent from worker
  useEffect(() => {
    if (!bookingId || !supabase) return;
    const ch = supabase.channel(`booking-status-${bookingId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${bookingId}` },
        (p) => {
          const row = p.new as { status: string; worker_diagnosis?: string; total_quoted?: number; quoted_amount?: number; parts_cost?: number; complexity_level?: string };
          setBookingStatusExt(row.status);
          if (row.status === "quote_sent" && row.worker_diagnosis) {
            setQuoteData({
              diagnosis: row.worker_diagnosis,
              amount: row.total_quoted || row.quoted_amount || 0,
              partsCost: row.parts_cost || 0,
              complexity: row.complexity_level || "medium",
            });
          }
          if (row.status === "in_progress" || row.status === "quote_rejected") setQuoteData(null);
          if (row.status === "completed") setShowPayment(true);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [bookingId]);

  // Auto-scroll chat
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const content = (text || chatInput).trim();
    if (!content) return;
    setChatInput("");
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, bookingId, senderType: "hirer" }),
      });
      fetchMessages();
    } catch {}
  };

  const handleQuoteAction = async (action: "approve" | "reject") => {
    if (!bookingId || quoteProcessing) return;
    setQuoteProcessing(true);
    try {
      await fetch("/api/bookings/quote", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action }),
      });
      setQuoteData(null);
      setBookingStatusExt(action === "approve" ? "in_progress" : "quote_rejected");
    } catch (e) {
      console.error("[quote action]", e);
    }
    setQuoteProcessing(false);
  };

  const handlePayment = async (method: "cash" | "upi") => {
    if (!bookingId) return;
    try {
      await fetch("/api/bookings/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: "paid", paymentMethod: method, paymentAmount: bookingAmount }),
      });
    } catch {}
    setPaymentDone(true);
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-app)" }}>
        <span className="text-[48px] mb-4">📍</span>
        <h1 className="text-[20px] font-black mb-2" style={{ color: "var(--text-1)", fontFamily: "'Epilogue',sans-serif" }}>No Active Booking</h1>
        <p className="text-[12px] text-center mb-6" style={{ color: "var(--text-3)" }}>Start a booking to track your worker in real time.</p>
        <Link href="/booking" className="rounded-[16px] px-8 py-3.5 text-[13px] font-black text-white" style={{ background: "var(--gradient-cta)" }}>Book Now</Link>
      </div>
    );
  }

  if (paymentDone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-app)" }}>
        <div className="text-center mb-6">
          <div className="text-[64px] mb-3">🎉</div>
          <h1 className="text-[24px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue',sans-serif" }}>Payment Done!</h1>
          <p className="text-[13px] mt-2 font-medium" style={{ color: "var(--text-3)" }}>How was {worker?.name || "the worker"}?</p>
        </div>
        <Link href={`/booking/review?bookingId=${bookingId}`}
          className="w-full max-w-xs rounded-[16px] py-4 text-center text-[14px] font-black text-white block mb-3"
          style={{ background: "var(--gradient-cta)" }}>
          Leave a Review ⭐
        </Link>
        <Link href="/my-bookings" className="text-[12px] font-bold" style={{ color: "var(--text-3)" }}>View My Bookings</Link>
      </div>
    );
  }

  const cfg = statusConfig[status] || statusConfig.en_route;
  const workerPos = tracking?.worker ? { lat: tracking.worker.lat, lng: tracking.worker.lng } : null;
  const mapCenter = userPos || workerPos || { lat: 11.0168, lng: 76.9558 };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 shrink-0">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--bg-surface)" }}>
          <span className="text-[14px]">←</span>
        </button>
        <div className="flex-1">
          <p className="text-[15px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue',sans-serif" }}>
            Live Tracking
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
            <p className="text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
          </div>
        </div>
        <button onClick={() => setShowChat(c => !c)}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: showChat ? "var(--brand)" : "var(--bg-surface)" }}>
          <span className="text-[16px]">💬</span>
        </button>
      </div>

      {/* Map — fills remaining space */}
      <div className="flex-1 relative min-h-[260px] mx-4 rounded-[20px] overflow-hidden" style={{ background: "var(--bg-surface)" }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ borderColor: "var(--brand)" }} />
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Loading map…</p>
            </div>
          </div>
        ) : (
          <LiveMap
            center={mapCenter}
            workerPos={workerPos}
            userPos={userPos}
            workerIcon={worker?.tradeIcon || "🔧"}
            isDark={isDark}
            className="w-full h-full"
            zoom={14}
          />
        )}

        {/* ETA pill overlay */}
        {status === "en_route" && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 flex items-center gap-2"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
            <span className="text-[14px]">🚗</span>
            <span className="text-[13px] font-black text-white" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              {eta} min
            </span>
            <span className="text-[10px] text-white opacity-60">away</span>
          </div>
        )}

        {/* Arrived badge */}
        {(status === "arrived" || status === "working") && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 flex items-center gap-2"
            style={{ background: status === "arrived" ? "rgba(245,158,11,0.9)" : "rgba(255,107,0,0.9)" }}>
            <span className="text-[14px]">{cfg.icon}</span>
            <span className="text-[12px] font-black text-white">{cfg.label}</span>
          </div>
        )}
      </div>

      {/* Worker card */}
      <div className="mx-4 mt-3 rounded-[20px] p-4 shrink-0" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-[18px] font-black text-white shrink-0"
            style={{ background: "var(--gradient-cta)" }}>
            {worker?.initials || "W"}
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue',sans-serif" }}>
              {worker?.name || "Worker"}
            </p>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--brand-soft)" }}>
              {worker?.tradeIcon} {worker?.trade} · ⭐ {worker?.rating?.toFixed(1) || "4.5"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono',monospace" }}>
              KS {worker?.kaizyScore || 500}
            </p>
          </div>
        </div>

        {/* OTP — always visible so hirer can share with worker */}
        {tracking?.otp && status !== "completed" && (
          <div className="mt-3 rounded-[14px] p-3 flex items-center justify-between"
            style={{ background: status === "arrived" ? "rgba(245,158,11,0.12)" : "var(--bg-surface)", border: status === "arrived" ? "1px solid rgba(245,158,11,0.3)" : "none" }}>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Job Start OTP</p>
              <p className="text-[22px] font-black tracking-[0.2em] mt-0.5"
                style={{ color: status === "arrived" ? "var(--warning)" : "var(--text-1)", fontFamily: "'JetBrains Mono',monospace" }}>
                {tracking.otp}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-right" style={{ color: "var(--text-3)" }}>
                {status === "arrived" ? "Share this with worker\nto start the job" : "Share when worker\narrives"}
              </p>
            </div>
          </div>
        )}

        {/* Distance */}
        {tracking?.distanceKm != null && status === "en_route" && (
          <p className="text-[10px] font-bold mt-2" style={{ color: "var(--text-3)" }}>
            {tracking.distanceKm} km away · arriving in {eta} min
          </p>
        )}
      </div>

      {/* Quote approval card — worker sent a diagnosis + price */}
      {quoteData && bookingStatusExt === "quote_sent" && (
        <div className="mx-4 mt-3 rounded-[20px] p-4 shrink-0 anim-up"
          style={{ background: "var(--bg-card)", border: "2px solid rgba(255,184,0,0.4)", boxShadow: "0 0 24px rgba(255,184,0,0.12)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[18px]">🔍</span>
            <div>
              <p className="text-[13px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue',sans-serif" }}>
                Worker sent a quote
              </p>
              <p className="text-[10px] font-medium" style={{ color: "var(--warning, #FFB800)" }}>
                Approve to start work
              </p>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="rounded-[14px] p-3 mb-3" style={{ background: "var(--bg-surface)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>
              Diagnosis
            </p>
            <p className="text-[12px] font-medium leading-relaxed" style={{ color: "var(--text-1)" }}>
              {quoteData.diagnosis}
            </p>
            {quoteData.complexity && (
              <span className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold"
                style={{ background: "var(--bg-elevated)", color: "var(--text-2)" }}>
                {quoteData.complexity} job
              </span>
            )}
          </div>

          {/* Price breakdown */}
          <div className="rounded-[14px] p-3 mb-4" style={{ background: "var(--brand-tint)" }}>
            <div className="flex justify-between mb-1">
              <span className="text-[11px]" style={{ color: "var(--text-2)" }}>Labour</span>
              <span className="text-[11px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono',monospace" }}>
                ₹{(quoteData.amount - quoteData.partsCost).toFixed(0)}
              </span>
            </div>
            {quoteData.partsCost > 0 && (
              <div className="flex justify-between mb-1">
                <span className="text-[11px]" style={{ color: "var(--text-2)" }}>Parts / Materials</span>
                <span className="text-[11px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono',monospace" }}>
                  ₹{quoteData.partsCost.toFixed(0)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 mt-1" style={{ borderColor: "var(--border-1)" }}>
              <span className="text-[13px] font-black" style={{ color: "var(--text-1)" }}>Total</span>
              <span className="text-[18px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono',monospace" }}>
                ₹{quoteData.amount}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuoteAction("reject")}
              disabled={quoteProcessing}
              className="rounded-[14px] py-3 text-[13px] font-black active:scale-95 transition-transform disabled:opacity-50"
              style={{ background: "var(--bg-elevated)", color: "var(--text-2)" }}>
              ✕ Reject
            </button>
            <button
              onClick={() => handleQuoteAction("approve")}
              disabled={quoteProcessing}
              className="rounded-[14px] py-3 text-[13px] font-black text-white active:scale-95 transition-transform disabled:opacity-50"
              style={{ background: quoteProcessing ? "var(--bg-elevated)" : "var(--gradient-cta)" }}>
              {quoteProcessing ? "..." : "✓ Approve"}
            </button>
          </div>
        </div>
      )}

      {/* Quote rejected — only visit fee */}
      {bookingStatusExt === "quote_rejected" && (
        <div className="mx-4 mt-3 rounded-[16px] p-4 shrink-0 text-center"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-[13px] font-bold" style={{ color: "#EF4444" }}>Quote rejected</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>Worker will charge only the visit fee.</p>
        </div>
      )}

      {/* Payment card — when completed */}
      {status === "completed" && !showPayment && (
        <div className="mx-4 mt-3 rounded-[20px] p-4 shrink-0" style={{ background: "var(--bg-card)" }}>
          <p className="text-[13px] font-black mb-3" style={{ color: "var(--text-1)", fontFamily: "'Epilogue',sans-serif" }}>Job Complete — Pay Worker</p>
          <p className="text-[24px] font-black mb-4" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono',monospace" }}>
            ₹{bookingAmount || "—"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handlePayment("cash")}
              className="rounded-[14px] py-3 text-[13px] font-black active:scale-95 transition-transform"
              style={{ background: "var(--success)", color: "white" }}>
              💵 Cash
            </button>
            <button onClick={() => handlePayment("upi")}
              className="rounded-[14px] py-3 text-[13px] font-black active:scale-95 transition-transform"
              style={{ background: "var(--gradient-cta)", color: "#FFDBCC" }}>
              📱 UPI
            </button>
          </div>
        </div>
      )}

      {/* Quick actions row */}
      <div className="mx-4 mt-3 mb-6 grid grid-cols-3 gap-2.5 shrink-0">
        <button onClick={() => setShowChat(c => !c)}
          className="rounded-[14px] py-3 flex flex-col items-center gap-1 active:scale-95 transition-transform"
          style={{ background: "var(--bg-card)" }}>
          <span className="text-[18px]">💬</span>
          <span className="text-[9px] font-bold" style={{ color: "var(--text-3)" }}>Chat</span>
        </button>
        <a href={`tel:${tracking?.worker?.id}`}
          className="rounded-[14px] py-3 flex flex-col items-center gap-1"
          style={{ background: "var(--bg-card)" }}>
          <span className="text-[18px]">📞</span>
          <span className="text-[9px] font-bold" style={{ color: "var(--text-3)" }}>Call</span>
        </a>
        <Link href="/my-bookings"
          className="rounded-[14px] py-3 flex flex-col items-center gap-1"
          style={{ background: "var(--bg-card)" }}>
          <span className="text-[18px]">📋</span>
          <span className="text-[9px] font-bold" style={{ color: "var(--text-3)" }}>Bookings</span>
        </Link>
      </div>

      {/* Chat panel — slides up */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--bg-app)" }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 pt-5 pb-3" style={{ borderBottom: "1px solid var(--border-1)" }}>
            <button onClick={() => setShowChat(false)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--bg-surface)" }}>
              <span className="text-[14px]">←</span>
            </button>
            <div>
              <p className="text-[14px] font-black" style={{ color: "var(--text-1)", fontFamily: "'Epilogue',sans-serif" }}>
                Chat with {worker?.name || "Worker"}
              </p>
              <p className="text-[10px]" style={{ color: "var(--brand)" }}>● Online</p>
            </div>
          </div>

          {/* Quick replies */}
          <div className="flex gap-2 px-4 py-2 overflow-x-auto" style={{ borderBottom: "1px solid var(--border-1)" }}>
            {["I'm ready", "Which floor?", "Gate closed?", "5 more min", "Payment done"].map(q => (
              <button key={q} onClick={() => sendMessage(q)}
                className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold active:scale-95 transition-transform"
                style={{ background: "var(--bg-surface)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-center text-[11px] py-8" style={{ color: "var(--text-3)" }}>No messages yet. Say hi!</p>
            )}
            {messages.map(m => {
              const isMe = m.sender_type === "hirer" || m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[75%] rounded-[14px] px-3.5 py-2.5"
                    style={{ background: isMe ? "var(--brand)" : "var(--bg-card)" }}>
                    <p className="text-[12px] font-medium" style={{ color: isMe ? "white" : "var(--text-1)" }}>{m.content}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: isMe ? "rgba(255,255,255,0.6)" : "var(--text-3)" }}>
                      {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="px-4 pb-8 pt-3 flex gap-2" style={{ borderTop: "1px solid var(--border-1)" }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage("")}
              placeholder="Type a message…"
              className="flex-1 rounded-[14px] px-4 py-3 text-[13px] outline-none"
              style={{ background: "var(--bg-surface)", color: "var(--text-1)", border: "1px solid var(--border-1)" }}
            />
            <button onClick={() => sendMessage("")}
              disabled={!chatInput.trim()}
              className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 active:scale-95 transition-transform"
              style={{ background: chatInput.trim() ? "var(--brand)" : "var(--bg-surface)" }}>
              <span className="text-[18px]">↑</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--brand)" }} />
      </div>
    }>
      <TrackingContent />
    </Suspense>
  );
}
