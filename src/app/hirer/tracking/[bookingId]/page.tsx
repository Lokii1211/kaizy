"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import { getSupabase } from "@/lib/supabase";
import UserAvatar from "@/components/UserAvatar";
import LoadingShell from "@/components/LoadingShell";
import { formatPrice } from "@/lib/formatters";

// ============================================================
// HIRER LIVE GPS TRACKING — /hirer/tracking/[bookingId]
// Mapbox Dark-v11 (65%) · Smooth Live Worker Pin · 35% Bottom Sheet
// Realtime Worker Locations · Quote Approval Modal · Cancel/Chat
// ============================================================

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const tradeColors: Record<string, string> = {
  electrician: "#FF6B00",
  plumber: "#3B82F6",
  mechanic: "#8B5CF6",
  ac_repair: "#06B6D4",
  carpenter: "#F59E0B",
  painter: "#10B981",
  mason: "#EF4444",
  locksmith: "#64748B",
};

const tradeIcons: Record<string, string> = {
  electrician: "⚡",
  plumber: "🔧",
  mechanic: "🚗",
  ac_repair: "❄️",
  carpenter: "🪚",
  painter: "🎨",
  mason: "⚒️",
  locksmith: "🔒",
};

interface BookingDetail {
  id: string;
  status: "accepted" | "en_route" | "arrived" | "quote_sent" | "in_progress" | "completed" | "cancelled";
  otp: string;
  visit_charge: number;
  hirer_price: number;
  total_quoted?: number;
  worker_diagnosis?: string;
  parts_cost?: number;
  parts_list?: { name: string; cost: number }[];
  worker: {
    id: string;
    name: string;
    phone: string;
    trade: string;
    rating: number;
    profile_photo?: string | null;
  };
  hirer: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export default function HirerLiveTrackingPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState<number>(8);
  const [workerPos, setWorkerPos] = useState<{ lat: number; lng: number; heading: number }>({
    lat: 11.022,
    lng: 76.962,
    heading: 45,
  });

  const [toastMessage, setToastMessage] = useState<{ text: string; type: "info" | "success" | "brand" } | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [quoteProcessing, setQuoteProcessing] = useState(false);
  const [jobCompleted, setJobCompleted] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workerMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeMarkerRef = useRef<any>(null);

  const supabase = useMemo(() => getSupabase(), []);

  const showToast = useCallback((text: string, type: "info" | "success" | "brand" = "info", duration = 4000) => {
    setToastMessage({ text, type });
    if (duration > 0) {
      setTimeout(() => setToastMessage(null), duration);
    }
  }, []);

  // ── 1. FETCH INITIAL BOOKING & WORKER DETAILS ──
  useEffect(() => {
    if (!bookingId) return;

    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        const json = await res.json();

        if (json.success && json.data) {
          const b = json.data;
          const userObj = b.worker_profiles?.users || b.worker_profiles || {};

          const hLat = Number(b.jobs?.latitude) || 11.0168;
          const hLng = Number(b.jobs?.longitude) || 76.9558;
          const wLat = Number(b.worker_profiles?.latitude) || hLat + 0.008;
          const wLng = Number(b.worker_profiles?.longitude) || hLng + 0.007;

          const detail: BookingDetail = {
            id: b.id,
            status: b.status || "en_route",
            otp: b.otp || "4821",
            visit_charge: Number(b.visit_charge) || 49,
            hirer_price: Number(b.hirer_price) || 299,
            total_quoted: Number(b.total_quoted) || 0,
            worker_diagnosis: b.worker_diagnosis || "",
            parts_cost: Number(b.parts_cost) || 0,
            parts_list: b.parts_list || [],
            worker: {
              id: b.worker_id,
              name: userObj.name || "Suresh Kumar",
              phone: userObj.phone || "+919876543210",
              trade: b.worker_profiles?.trade_primary || b.worker_profiles?.trade || "electrician",
              rating: Number(b.worker_profiles?.avg_rating) || 4.9,
              profile_photo: userObj.profile_photo || null,
            },
            hirer: {
              latitude: hLat,
              longitude: hLng,
              address: b.jobs?.address || "Gandhipuram, Coimbatore",
            },
          };

          setBooking(detail);
          setWorkerPos({ lat: wLat, lng: wLng, heading: 45 });

          if (detail.status === "quote_sent") {
            setShowQuoteModal(true);
            showToast(`${detail.worker.name} has sent a diagnosis quote`, "brand", 0);
          } else if (detail.status === "arrived") {
            showToast(`${detail.worker.name} has arrived at your location!`, "success", 5000);
          } else if (detail.status === "completed") {
            setJobCompleted(true);
          }
        }
      } catch (err) {
        console.error("[fetchBooking err]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, showToast]);

  // ── 2. REALTIME WORKER LOCATION SUBSCRIPTION ──
  useEffect(() => {
    if (!bookingId || !booking) return;

    const channel = supabase
      .channel(`tracking-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "worker_locations",
          filter: `booking_id=eq.${bookingId}`,
        },
        async (payload) => {
          const loc = payload.new;
          if (loc && loc.latitude && loc.longitude) {
            const newLat = Number(loc.latitude);
            const newLng = Number(loc.longitude);
            const newHeading = Number(loc.heading) || 0;

            setWorkerPos({ lat: newLat, lng: newLng, heading: newHeading });

            // Calculate distance & ETA
            const dLat = Math.abs(booking.hirer.latitude - newLat);
            const dLng = Math.abs(booking.hirer.longitude - newLng);
            const distKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
            const newEta = Math.max(1, Math.ceil(distKm / 0.5));
            setEta(newEta);

            // Update Mapbox marker position smoothly
            if (workerMarkerRef.current) {
              workerMarkerRef.current.setLngLat([newLng, newLat]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, booking, supabase]);

  // ── 3. REALTIME BOOKING STATUS SUBSCRIPTION ──
  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`booking-status-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          const updated = payload.new;
          if (updated && updated.status) {
            setBooking((prev) => (prev ? { ...prev, ...updated } : null));

            if (updated.status === "arrived") {
              showToast(`${booking?.worker.name || "Captain"} has arrived!`, "success", 5000);
              if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
            } else if (updated.status === "quote_sent") {
              setShowQuoteModal(true);
              showToast(`${booking?.worker.name || "Captain"} sent a quote`, "brand", 0);
              if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
            } else if (updated.status === "completed") {
              setJobCompleted(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, booking, supabase, showToast]);

  // ── 4. INITIALIZE MAPBOX GL MAP (65% Height) ──
  useEffect(() => {
    if (!mapContainerRef.current || !booking) return;

    let isCancelled = false;

    const initMap = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        const container = mapContainerRef.current;
        if (!container || isCancelled) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapboxgl as any).accessToken =
          MAPBOX_TOKEN || "pk.eyJ1Ijoia2FpenkiLCJhIjoiY2x6c2FmZXJ0MDAwMDJqcTE4bnNkOGpxayJ9.dev";

        if (!mapRef.current) {
          const map = new mapboxgl.Map({
            container,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [booking.hirer.longitude, booking.hirer.latitude],
            zoom: 14,
            attributionControl: false,
          });

          map.on("load", () => {
            if (isCancelled) return;

            const color = tradeColors[booking.worker.trade] || "#FF6B00";
            const icon = tradeIcons[booking.worker.trade] || "⚡";

            // 1. Worker Pin Marker (40px circle, trade color, rotates)
            const workerEl = document.createElement("div");
            workerEl.className = "tracking-worker-marker";
            workerEl.innerHTML = `
              <div style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: ${color};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                color: #FFFFFF;
                border: 3px solid #FFFFFF;
                box-shadow: 0 4px 16px rgba(0,0,0,0.5);
                transform: rotate(${workerPos.heading}deg);
                transition: transform 0.3s ease;
              ">
                ${icon}
              </div>
            `;

            workerMarkerRef.current = new mapboxgl.Marker({ element: workerEl })
              .setLngLat([workerPos.lng, workerPos.lat])
              .addTo(map);

            // 2. Hirer Home Pin Marker (Green Marker)
            const homeEl = document.createElement("div");
            homeEl.innerHTML = `
              <div style="
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #10B981;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                color: #FFFFFF;
                border: 2px solid #FFFFFF;
                box-shadow: 0 2px 10px rgba(16,185,129,0.5);
              ">
                📍
              </div>
            `;

            homeMarkerRef.current = new mapboxgl.Marker({ element: homeEl })
              .setLngLat([booking.hirer.longitude, booking.hirer.latitude])
              .addTo(map);

            // 3. Orange Route Line GeoJSON Source & Layer
            map.addSource("route", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [workerPos.lng, workerPos.lat],
                    [booking.hirer.longitude, booking.hirer.latitude],
                  ],
                },
              },
            });

            map.addLayer({
              id: "route-line",
              type: "line",
              source: "route",
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#FF6B00",
                "line-width": 4,
                "line-opacity": 0.85,
              },
            });

            // 4. Auto-fit both pins with 60px padding
            const minLng = Math.min(workerPos.lng, booking.hirer.longitude);
            const maxLng = Math.max(workerPos.lng, booking.hirer.longitude);
            const minLat = Math.min(workerPos.lat, booking.hirer.latitude);
            const maxLat = Math.max(workerPos.lat, booking.hirer.latitude);

            map.fitBounds(
              [
                [minLng, minLat],
                [maxLng, maxLat],
              ],
              { padding: 60, maxZoom: 15 }
            );
          });

          mapRef.current = map;
        }
      } catch (err) {
        console.error("[map tracking err]", err);
      }
    };

    initMap();

    return () => {
      isCancelled = true;
    };
  }, [booking, workerPos.lat, workerPos.lng, workerPos.heading]);

  // ── QUOTE APPROVE / DECLINE ACTIONS ──
  const handleApproveQuote = async () => {
    setQuoteProcessing(true);
    try {
      const res = await fetch("/api/bookings/quote", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          action: "approve",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowQuoteModal(false);
        showToast("Quote approved! Work in progress.", "success");
      }
    } catch {
      showToast("Approval failed. Please try again.", "info");
    } finally {
      setQuoteProcessing(false);
    }
  };

  const handleDeclineQuote = async () => {
    setQuoteProcessing(true);
    try {
      await fetch("/api/bookings/quote", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          action: "reject",
        }),
      });
      setShowQuoteModal(false);
      showToast("Quote declined. Discussing revision with captain.", "info");
    } catch {
      showToast("Action failed.", "info");
    } finally {
      setQuoteProcessing(false);
    }
  };

  // ── CANCEL BOOKING ACTION ──
  const handleCancelBooking = async () => {
    try {
      await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason: "Hirer cancelled from live tracking" }),
      });
      router.replace("/my-bookings");
    } catch {
      router.replace("/my-bookings");
    }
  };

  if (loading || !booking) {
    return <LoadingShell />;
  }

  const worker = booking.worker;
  const status = booking.status;
  const tradeIcon = tradeIcons[worker.trade] || "⚡";

  // Stage indicator index
  const stageIdx =
    status === "completed"
      ? 3
      : status === "arrived" || status === "quote_sent" || status === "in_progress"
      ? 2
      : status === "en_route"
      ? 1
      : 0;

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden bg-black select-none">
      {/* ── TOAST STATUS NOTIFICATIONS ── */}
      {toastMessage && (
        <div
          className="fixed top-5 left-5 right-5 z-50 p-3.5 rounded-[18px] text-[12px] font-black text-center shadow-2xl anim-up backdrop-blur-md"
          style={{
            background:
              toastMessage.type === "success"
                ? "#10B981"
                : toastMessage.type === "brand"
                ? "#FF6B00"
                : "rgba(20, 20, 20, 0.9)",
            color: "#FFFFFF",
          }}
        >
          {toastMessage.text}
        </div>
      )}

      {/* ══════════════════════════════
          MAP (65% HEIGHT)
      ══════════════════════════════ */}
      <div className="relative w-full h-[65%]">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Top Status Chip */}
        <div className="absolute top-4 left-0 right-0 z-20 flex justify-center px-4">
          <div
            className="px-4 py-2 rounded-full border flex items-center gap-2 shadow-2xl backdrop-blur-md"
            style={{
              background: "rgba(8, 8, 8, 0.85)",
              borderColor: "rgba(255,255,255,0.15)",
            }}
          >
            <span className="text-[14px]">{tradeIcon}</span>
            <span className="text-[12px] font-extrabold text-white">
              {worker.name} · {eta} min away
            </span>
          </div>
        </div>

        {/* Top Floating Back Button */}
        <Link
          href="/my-bookings"
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center font-bold"
        >
          ←
        </Link>
      </div>

      {/* ══════════════════════════════
          BOTTOM SHEET (35% FIXED)
      ══════════════════════════════ */}
      <div
        className="w-full h-[35%] px-5 pt-4 pb-6 flex flex-col justify-between border-t border-white/10 relative z-30"
        style={{
          background: isDark ? "rgba(10, 10, 10, 0.98)" : "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* ── ETA & 4-STAGE PROGRESS ROW ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span
              className="text-[36px] font-black text-[#FF6B00] leading-none font-mono"
            >
              {eta}
            </span>
            <span className="text-[13px] font-bold text-gray-400">min away</span>
          </div>

          {/* 4 Stages Progress Bar */}
          <div className="w-[180px]">
            <div className="flex justify-between mb-1 text-[8px] font-black uppercase tracking-wider text-gray-400">
              <span className={stageIdx >= 0 ? "text-[#FF6B00]" : ""}>Confirmed</span>
              <span className={stageIdx >= 1 ? "text-[#FF6B00]" : ""}>En Route</span>
              <span className={stageIdx >= 2 ? "text-[#FF6B00]" : ""}>Arrived</span>
              <span className={stageIdx >= 3 ? "text-green-500" : ""}>Done</span>
            </div>
            <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden flex gap-1 p-0.5">
              {[0, 1, 2, 3].map((s) => (
                <div
                  key={s}
                  className="flex-1 h-full rounded-full transition-all"
                  style={{
                    background:
                      s <= stageIdx
                        ? s === 3
                          ? "#10B981"
                          : "#FF6B00"
                        : "transparent",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── WORKER INFO ROW ── */}
        <div
          className="p-3 rounded-[18px] border flex items-center justify-between"
          style={{
            background: isDark ? "var(--bg-card)" : "#F9FAFB",
            borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
          }}
        >
          <div className="flex items-center gap-3">
            <UserAvatar name={worker.name} size={44} />
            <div>
              <h2 className="text-[13px] font-black" style={{ color: "var(--text-1)" }}>
                {worker.name}
              </h2>
              <p className="text-[11px] font-semibold text-gray-400 capitalize">
                {worker.trade} · ★ {worker.rating.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-black uppercase text-gray-400 block">
              Estimated
            </span>
            <span
              className="text-[14px] font-black text-green-600 dark:text-green-400 font-mono"
            >
              {formatPrice(booking.hirer_price)}
            </span>
          </div>
        </div>

        {/* ── 3 EQUAL ACTION BUTTONS ── */}
        <div className="grid grid-cols-3 gap-2.5">
          <a
            href={`tel:${worker.phone}`}
            className="py-3 rounded-[14px] text-[12px] font-black border flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-2)",
              color: "var(--text-1)",
            }}
          >
            <span>📞</span>
            <span>Call</span>
          </a>

          <Link
            href={`/chat?bookingId=${booking.id}`}
            className="py-3 rounded-[14px] text-[12px] font-black border flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-2)",
              color: "var(--text-1)",
            }}
          >
            <span>💬</span>
            <span>Chat</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="py-3 rounded-[14px] text-[12px] font-black border border-red-500/20 text-red-500 bg-red-500/10 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <span>✕</span>
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════
          QUOTE APPROVAL MODAL
      ══════════════════════════════ */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-5 anim-fade">
          <div
            className="w-full max-w-sm rounded-[24px] p-6 border shadow-2xl anim-spring"
            style={{
              background: isDark ? "var(--bg-card)" : "#FFFFFF",
              borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[22px]">📋</span>
              <h3
                className="text-[17px] font-black"
                style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
              >
                {worker.name.split(" ")[0]} sent a quote
              </h3>
            </div>

            <div className="p-3 rounded-[14px] bg-black/5 dark:bg-white/5 mb-4 text-[12px]">
              <span className="text-[10px] font-black uppercase text-gray-400 block mb-0.5">
                Captain Diagnosis:
              </span>
              <p className="font-medium leading-relaxed" style={{ color: "var(--text-1)" }}>
                {booking.worker_diagnosis || "Inspected wiring and terminal joints. Replacement of burnt circuit contact needed."}
              </p>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-[12px] mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Labour Charge</span>
                <span className="font-bold font-mono" style={{ color: "var(--text-1)" }}>
                  {formatPrice(booking.total_quoted ? booking.total_quoted - (booking.parts_cost || 0) : 300)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Parts Cost</span>
                <span className="font-bold font-mono" style={{ color: "var(--text-1)" }}>
                  {formatPrice(booking.parts_cost || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform & Insurance</span>
                <span className="font-bold font-mono" style={{ color: "var(--text-1)" }}>
                  ₹15
                </span>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-[13px]">
                <span className="font-black" style={{ color: "var(--text-1)" }}>
                  Total to Pay:
                </span>
                <span className="text-[16px] font-black text-green-600 dark:text-green-400 font-mono">
                  {formatPrice((booking.total_quoted || 350) - booking.visit_charge)}
                </span>
              </div>
              <span className="text-[9px] text-gray-400 block text-right">
                (₹{booking.visit_charge} deposit already deducted)
              </span>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleApproveQuote}
                disabled={quoteProcessing}
                className="w-full py-3.5 rounded-[16px] text-[13px] font-black text-white active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                style={{ background: "#10B981" }}
              >
                {quoteProcessing ? "Processing..." : `Approve & Authorize Work →`}
              </button>

              <button
                type="button"
                onClick={handleDeclineQuote}
                disabled={quoteProcessing}
                className="w-full py-3 rounded-[16px] text-[12px] font-bold text-red-500 bg-red-500/10 active:scale-95 transition-all"
              >
                Decline Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          CANCEL CONFIRMATION MODAL
      ══════════════════════════════ */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5 anim-fade">
          <div
            className="w-full max-w-sm rounded-[24px] p-6 text-center border shadow-2xl"
            style={{
              background: isDark ? "var(--bg-card)" : "#FFFFFF",
              borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
            }}
          >
            <span className="text-[32px] block mb-2">⚠️</span>
            <h3 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>
              Cancel this booking?
            </h3>
            <p className="text-[12px] font-medium text-gray-400 mt-1 mb-5">
              {worker.name} is already en route. Are you sure you want to cancel?
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCancelBooking}
                className="w-full py-3 rounded-[16px] text-[13px] font-black bg-red-500 text-white active:scale-95"
              >
                Yes, Cancel Booking
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="w-full py-3 rounded-[16px] text-[12px] font-bold"
                style={{ background: "var(--bg-surface)", color: "var(--text-1)" }}
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          JOB COMPLETED MODAL
      ══════════════════════════════ */}
      {jobCompleted && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-5 anim-fade">
          <div
            className="w-full max-w-sm rounded-[24px] p-6 text-center border shadow-2xl anim-spring"
            style={{
              background: isDark ? "var(--bg-card)" : "#FFFFFF",
              borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
            }}
          >
            <span className="text-[40px] block mb-2">🎉</span>
            <h3 className="text-[18px] font-black" style={{ color: "var(--text-1)" }}>
              Job Completed!
            </h3>
            <p className="text-[12px] font-medium text-gray-400 mt-1 mb-5">
              {worker.name} has finished the work. Please rate your experience.
            </p>

            <Link
              href={`/booking/review?bookingId=${booking.id}`}
              className="block w-full py-3.5 rounded-[16px] text-[13px] font-black bg-[#FF6B00] text-white active:scale-95 shadow-lg"
            >
              Rate Captain & Pay →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
