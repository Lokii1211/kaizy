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
// WORKER ACTIVE JOB SCREEN — /worker/job/[bookingId]
// 6 States: Accepted → En Route → Arrived → Quote Sent → Working → Completed
// Realtime Sync · Live GPS Tracking · Diagnosis & Parts Form · Photo Uploads
// ============================================================

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface BookingData {
  id: string;
  status: "accepted" | "en_route" | "arrived" | "quote_sent" | "quote_approved" | "working" | "in_progress" | "completed" | "confirmed" | "cancelled";
  otp: string;
  worker_id: string;
  visit_charge: number;
  hirer_price: number;
  worker_quote?: number;
  parts_cost?: number;
  total_amount?: number;
  net_to_worker?: number;
  worker_diagnosis?: string;
  before_photos?: string[];
  after_photos?: string[];
  started_at?: string;
  completed_at?: string;
  job: {
    id: string;
    trade: string;
    problem_type: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    hirer_name: string;
    hirer_phone: string;
  };
}

interface PartItem {
  id: string;
  name: string;
  cost: number;
}

export default function WorkerActiveJobPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  // Worker current GPS
  const [workerGps, setWorkerGps] = useState<{ lat: number; lng: number }>({
    lat: 11.022,
    lng: 76.962,
  });

  // State 3: Diagnosis form
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [diagnosisNote, setDiagnosisNote] = useState<string>("");
  const [labourQuote, setLabourQuote] = useState<number>(350);
  const [partsNeeded, setPartsNeeded] = useState<boolean>(false);
  const [partsList, setPartsList] = useState<PartItem[]>([
    { id: "p1", name: "", cost: 0 },
  ]);
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // State 5: Working timer & After photos
  const [workingSeconds, setWorkingSeconds] = useState<number>(0);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [completingJob, setCompletingJob] = useState(false);

  // Toast / notification
  const [toast, setToast] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workerMarkerRef = useRef<any>(null);

  const supabase = useMemo(() => getSupabase(), []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── 1. FETCH INITIAL BOOKING ──
  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, jobs(*, users(*))")
        .eq("id", bookingId)
        .single();

      if (!error && data) {
        const hirerUser = data.jobs?.users || {};
        const jobRec = data.jobs || {};

        const bData: BookingData = {
          id: data.id,
          status: data.status || "accepted",
          otp: data.otp || "4821",
          worker_id: data.worker_id,
          visit_charge: Number(data.visit_charge) || 49,
          hirer_price: Number(data.hirer_price) || 299,
          worker_quote: Number(data.worker_quote) || 0,
          parts_cost: Number(data.parts_cost) || 0,
          total_amount: Number(data.total_amount) || 0,
          net_to_worker: Number(data.net_to_worker) || 0,
          worker_diagnosis: data.worker_diagnosis || "",
          before_photos: data.before_photos || [],
          after_photos: data.after_photos || [],
          started_at: data.started_at,
          completed_at: data.completed_at,
          job: {
            id: jobRec.id,
            trade: jobRec.trade || "electrician",
            problem_type: jobRec.problem_type || "General Service",
            description: jobRec.description || "Service request",
            address: jobRec.address || "Coimbatore Customer Location",
            latitude: Number(jobRec.latitude) || 11.0168,
            longitude: Number(jobRec.longitude) || 76.9558,
            hirer_name: hirerUser.name || "Customer",
            hirer_phone: hirerUser.phone || "+919876500000",
          },
        };

        setBooking(bData);
        setLabourQuote(bData.hirer_price || 350);
        setDiagnosisNote(
          bData.worker_diagnosis ||
            `Inspected ${bData.job.problem_type.replace(/_/g, " ")}. Repair & component test required.`
        );

        if (bData.status === "confirmed") {
          router.replace(
            `/worker/payment-received?amount=${bData.net_to_worker || 345}&bookingId=${bData.id}`
          );
        }
      }
    } catch (err) {
      console.error("[fetchBooking err]", err);
    } finally {
      setLoading(false);
    }
  }, [bookingId, supabase, router]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // ── 2. REALTIME BOOKING CHANGES SUBSCRIPTION ──
  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`active-job-${bookingId}`)
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
          if (updated) {
            setBooking((prev) => (prev ? { ...prev, ...updated } : null));

            if (updated.status === "quote_approved") {
              showToast("Quote approved! You can now start the work.");
              if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
            } else if (updated.status === "confirmed") {
              router.replace(
                `/worker/payment-received?amount=${updated.net_to_worker || 345}&bookingId=${bookingId}`
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, supabase, showToast, router]);

  // ── 3. LIVE GPS BROADCAST WHILE EN ROUTE (every 10s) ──
  useEffect(() => {
    if (!bookingId || !booking || booking.status !== "en_route") return;

    const trackLocation = () => {
      if (typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const heading = pos.coords.heading || 0;
            setWorkerGps({ lat, lng });

            // Push to worker_locations table for hirer live map
            await supabase.from("worker_locations").insert({
              booking_id: bookingId,
              worker_id: booking.worker_id,
              latitude: lat,
              longitude: lng,
              heading,
              speed: pos.coords.speed || 0,
              created_at: new Date().toISOString(),
            });

            if (workerMarkerRef.current) {
              workerMarkerRef.current.setLngLat([lng, lat]);
            }
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    };

    trackLocation();
    const interval = setInterval(trackLocation, 10000);
    return () => clearInterval(interval);
  }, [bookingId, booking?.status, booking?.worker_id, supabase]);

  // ── 4. LIVE WORKING TIMER (State 5) ──
  useEffect(() => {
    if (!booking || (booking.status !== "working" && booking.status !== "in_progress")) {
      return;
    }

    const timer = setInterval(() => {
      setWorkingSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [booking?.status]);

  // ── 5. INITIALIZE MAPBOX (States 1 & 2) ──
  useEffect(() => {
    if (!mapContainerRef.current || !booking) return;
    if (booking.status !== "accepted" && booking.status !== "en_route") return;

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
            center: [booking.job.longitude, booking.job.latitude],
            zoom: 14,
            attributionControl: false,
          });

          map.on("load", () => {
            if (isCancelled) return;

            // Worker Pin
            const workerEl = document.createElement("div");
            workerEl.innerHTML = `
              <div style="width:36px;height:36px;border-radius:50%;background:#FF6B00;border:3px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;box-shadow:0 4px 14px rgba(0,0,0,0.5)">
                🛵
              </div>
            `;
            workerMarkerRef.current = new mapboxgl.Marker({ element: workerEl })
              .setLngLat([workerGps.lng, workerGps.lat])
              .addTo(map);

            // Job Destination Pin
            const destEl = document.createElement("div");
            destEl.innerHTML = `
              <div style="width:32px;height:32px;border-radius:50%;background:#10B981;border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px">
                📍
              </div>
            `;
            new mapboxgl.Marker({ element: destEl })
              .setLngLat([booking.job.longitude, booking.job.latitude])
              .addTo(map);

            // Fit bounds
            map.fitBounds(
              [
                [Math.min(workerGps.lng, booking.job.longitude), Math.min(workerGps.lat, booking.job.latitude)],
                [Math.max(workerGps.lng, booking.job.longitude), Math.max(workerGps.lat, booking.job.latitude)],
              ],
              { padding: 50, maxZoom: 15 }
            );
          });

          mapRef.current = map;
        }
      } catch (err) {
        console.error(err);
      }
    };

    initMap();

    return () => {
      isCancelled = true;
    };
  }, [booking, workerGps.lat, workerGps.lng]);

  // ── STATE 1: DEPARTING ACTION ──
  const handleDepart = async () => {
    if (!booking) return;

    try {
      await fetch("/api/dispatch/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: "en_route" }),
      });

      setBooking((prev) => (prev ? { ...prev, status: "en_route" } : null));

      // Open Google Maps navigation
      window.open(
        `https://maps.google.com/?daddr=${booking.job.latitude},${booking.job.longitude}`,
        "_blank"
      );
    } catch {
      showToast("Failed to update departure status");
    }
  };

  // ── STATE 2: ARRIVED ACTION ──
  const handleArrived = async () => {
    if (!booking) return;

    try {
      await fetch("/api/dispatch/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: "arrived" }),
      });

      setBooking((prev) => (prev ? { ...prev, status: "arrived" } : null));
      showToast("Arrived! Take before photos to send diagnosis quote.");
    } catch {
      showToast("Failed to update arrival status");
    }
  };

  // Photo helpers
  const handleBeforePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      urls.push(URL.createObjectURL(files[i]));
    }
    setBeforePhotos((prev) => [...prev, ...urls].slice(0, 4));
  };

  const handleAfterPhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      urls.push(URL.createObjectURL(files[i]));
    }
    setAfterPhotos((prev) => [...prev, ...urls].slice(0, 4));
  };

  // Parts List helpers
  const handleAddPartRow = () => {
    setPartsList((prev) => [
      ...prev,
      { id: `p${Date.now()}`, name: "", cost: 0 },
    ]);
  };

  const handleRemovePartRow = (id: string) => {
    setPartsList((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePartChange = (id: string, field: "name" | "cost", val: string | number) => {
    setPartsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const totalPartsCost = partsNeeded
    ? partsList.reduce((sum, p) => sum + (Number(p.cost) || 0), 0)
    : 0;
  const quoteTotal = Number(labourQuote || 0) + totalPartsCost;
  const workerReceives = Math.max(0, quoteTotal - 5);

  // ── STATE 3: SUBMIT QUOTE ACTION ──
  const handleSendQuote = async () => {
    if (!booking) return;
    if (beforePhotos.length < 2) {
      showToast("Please capture at least 2 before photos");
      return;
    }
    if (!labourQuote || labourQuote <= 0) {
      showToast("Please enter a valid labour charge");
      return;
    }

    setSubmittingQuote(true);

    try {
      const res = await fetch("/api/dispatch/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          workerQuote: labourQuote,
          partsCost: totalPartsCost,
          diagnosisNote: diagnosisNote.trim(),
          beforePhotos,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                status: "quote_sent",
                worker_quote: labourQuote,
                parts_cost: totalPartsCost,
                total_amount: json.totalAmount,
                net_to_worker: json.netToWorker,
                worker_diagnosis: diagnosisNote,
              }
            : null
        );
        showToast("Quote sent to customer for approval!");
      }
    } catch {
      showToast("Failed to send quote. Please retry.");
    } finally {
      setSubmittingQuote(false);
    }
  };

  // ── STATE 4: START WORK ACTION ──
  const handleStartWork = async () => {
    if (!booking) return;

    try {
      await fetch("/api/dispatch/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: "working" }),
      });

      setBooking((prev) => (prev ? { ...prev, status: "working" } : null));
    } catch {
      showToast("Failed to start work timer");
    }
  };

  // ── STATE 5: COMPLETE JOB ACTION ──
  const handleConfirmComplete = async () => {
    if (!booking) return;
    if (afterPhotos.length < 2) {
      showToast("Please capture at least 2 after photos to finish");
      return;
    }

    setCompletingJob(true);

    try {
      await fetch("/api/dispatch/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          status: "completed",
          afterPhotos,
        }),
      });

      setBooking((prev) => (prev ? { ...prev, status: "completed" } : null));
      setShowCompleteDialog(false);
    } catch {
      showToast("Failed to complete job");
    } finally {
      setCompletingJob(false);
    }
  };

  if (loading || !booking) {
    return <LoadingShell />;
  }

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins < 10 ? `0${mins}` : mins}:${s < 10 ? `0${s}` : s}`;
  };

  const status = booking.status;

  return (
    <div
      className="min-h-screen pb-24 select-none flex flex-col justify-between"
      style={{ background: isDark ? "var(--bg-app)" : "#F9FAFB" }}
    >
      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 p-3.5 rounded-[16px] bg-[#FF6B00] text-white text-[12px] font-black text-center shadow-2xl anim-up">
          {toast}
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div
        className="px-5 pt-6 pb-3 border-b flex justify-between items-center sticky top-0 z-30 backdrop-blur-md"
        style={{
          background: isDark ? "rgba(10,10,10,0.92)" : "rgba(255,255,255,0.95)",
          borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
        }}
      >
        <Link
          href="/dashboard/worker"
          className="w-9 h-9 rounded-full flex items-center justify-center border font-bold"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          ←
        </Link>
        <div className="text-center">
          <span className="text-[12px] font-black uppercase text-[#FF6B00] tracking-wider block">
            Active Job · {status.replace(/_/g, " ")}
          </span>
          <span className="text-[14px] font-black" style={{ color: "var(--text-1)" }}>
            {booking.job.problem_type.replace(/_/g, " ")}
          </span>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1">
        {/* ══════════════════════════════
            STATE 1 & 2: ACCEPTED / EN ROUTE
        ══════════════════════════════ */}
        {(status === "accepted" || status === "en_route") && (
          <div className="space-y-4">
            {/* Map Preview */}
            <div className="w-full h-[240px] relative border-b border-white/10">
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>

            {/* Job Details Card */}
            <div className="px-5 space-y-3">
              <div
                className="rounded-[22px] p-4 border shadow-sm space-y-3"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[15px] font-black" style={{ color: "var(--text-1)" }}>
                      {booking.job.problem_type.replace(/_/g, " ")}
                    </h3>
                    <p className="text-[12px] font-semibold text-gray-400">
                      Customer: {booking.job.hirer_name}
                    </p>
                  </div>
                  <span className="text-[16px] font-black text-green-600 dark:text-green-400 font-mono">
                    {formatPrice(booking.hirer_price)}
                  </span>
                </div>

                <div className="p-3 rounded-[14px] bg-black/5 dark:bg-white/5 flex items-center gap-2 text-[12px]">
                  <span>📍</span>
                  <span className="font-bold flex-1 truncate" style={{ color: "var(--text-1)" }}>
                    {status === "en_route"
                      ? booking.job.address
                      : `${booking.job.address.split(",")[0]}, Coimbatore (Full address unlocks on departure)`}
                  </span>
                </div>

                {status === "en_route" && (
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        `https://maps.google.com/?daddr=${booking.job.latitude},${booking.job.longitude}`,
                        "_blank"
                      )
                    }
                    className="w-full py-3 rounded-[14px] border text-[12px] font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
                    style={{
                      background: "var(--bg-surface)",
                      borderColor: "var(--border-2)",
                      color: "var(--text-1)",
                    }}
                  >
                    <span>🧭</span>
                    <span>Open Google Maps Navigation</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            STATE 3: ARRIVED (DIAGNOSIS FORM)
        ══════════════════════════════ */}
        {status === "arrived" && (
          <div className="px-5 pt-4 space-y-4">
            <div
              className="p-4 rounded-[22px] border space-y-4 shadow-sm"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
            >
              <div className="border-b pb-3" style={{ borderColor: "var(--border-2)" }}>
                <h3 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>
                  📸 Assessment & Diagnosis Quote
                </h3>
                <p className="text-[11px] font-medium text-gray-400">
                  Take at least 2 photos before inspecting the problem.
                </p>
              </div>

              {/* 1. Before Photos (min 2) */}
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                  Before Photos ({beforePhotos.length}/2 required):
                </span>
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {beforePhotos.map((url, i) => (
                    <div
                      key={i}
                      className="w-20 h-20 rounded-[14px] overflow-hidden border relative shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Before" className="w-full h-full object-cover" />
                      <button
                        onClick={() =>
                          setBeforePhotos((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {beforePhotos.length < 4 && (
                    <label className="w-20 h-20 rounded-[14px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer active:scale-95 shrink-0">
                      <span className="text-[20px]">📷</span>
                      <span className="text-[9px] font-black text-gray-400 mt-1">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleBeforePhotoAdd}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* 2. Problem Found Description */}
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                  Diagnosis & Findings:
                </span>
                <textarea
                  value={diagnosisNote}
                  onChange={(e) => setDiagnosisNote(e.target.value)}
                  placeholder="What is the root cause? (e.g. coil burnt, pipe seal worn out)..."
                  rows={2}
                  className="w-full p-3 rounded-[14px] text-[12px] font-medium border outline-none resize-none"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border-2)",
                    color: "var(--text-1)",
                  }}
                />
              </div>

              {/* 3. Labour Charge */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                    Labour Charge:
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">Standard: ₹250–₹500</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-[14px] font-black text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={labourQuote}
                    onChange={(e) => setLabourQuote(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-[14px] text-[15px] font-black font-mono border outline-none"
                    style={{
                      background: "var(--bg-surface)",
                      borderColor: "var(--border-2)",
                      color: "var(--text-1)",
                    }}
                  />
                </div>
              </div>

              {/* 4. Parts Needed Toggle */}
              <div className="pt-2 border-t" style={{ borderColor: "var(--border-2)" }}>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-[13px] font-black" style={{ color: "var(--text-1)" }}>
                      Replacement Parts Required?
                    </h4>
                    <p className="text-[10px] font-medium text-gray-400">
                      Add costs for items you need to buy
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPartsNeeded(!partsNeeded)}
                    className="w-12 h-7 rounded-full transition-all relative"
                    style={{
                      background: partsNeeded ? "#10B981" : "var(--bg-elevated)",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white absolute top-1 transition-all"
                      style={{ left: partsNeeded ? 24 : 4 }}
                    />
                  </button>
                </div>

                {partsNeeded && (
                  <div className="mt-3 space-y-2">
                    {partsList.map((p) => (
                      <div key={p.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => handlePartChange(p.id, "name", e.target.value)}
                          placeholder="Part name (e.g. 16A MCB Switch)"
                          className="flex-1 p-2.5 rounded-[12px] text-[12px] font-bold border outline-none"
                          style={{
                            background: "var(--bg-surface)",
                            borderColor: "var(--border-2)",
                            color: "var(--text-1)",
                          }}
                        />
                        <div className="w-24 relative">
                          <span className="absolute left-2.5 top-2.5 text-[11px] font-black text-gray-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={p.cost || ""}
                            onChange={(e) =>
                              handlePartChange(p.id, "cost", Number(e.target.value))
                            }
                            placeholder="0"
                            className="w-full pl-6 pr-2 py-2 rounded-[12px] text-[12px] font-black font-mono border outline-none"
                            style={{
                              background: "var(--bg-surface)",
                              borderColor: "var(--border-2)",
                              color: "var(--text-1)",
                            }}
                          />
                        </div>
                        {partsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePartRow(p.id)}
                            className="text-red-500 text-[14px] p-1 font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddPartRow}
                      className="text-[11px] font-black text-[#FF6B00] pt-1"
                    >
                      + Add another part
                    </button>
                  </div>
                )}
              </div>

              {/* 5. Total Calculation Summary */}
              <div
                className="p-3.5 rounded-[16px] space-y-1.5 text-[12px]"
                style={{ background: "var(--bg-surface)" }}
              >
                <div className="flex justify-between font-bold text-gray-400">
                  <span>Labour: ₹{labourQuote} + Parts: ₹{totalPartsCost}</span>
                  <span>= ₹{quoteTotal}</span>
                </div>
                <div className="flex justify-between font-black text-green-600 dark:text-green-400 text-[13px] pt-1 border-t border-black/10 dark:border-white/10">
                  <span>Your Net Payout:</span>
                  <span className="font-mono">₹{workerReceives}</span>
                </div>
                <span className="text-[9px] text-gray-400 block text-right">
                  (after ₹5 Kaizy platform contribution)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            STATE 4: QUOTE SENT (WAITING OR APPROVED)
        ══════════════════════════════ */}
        {status === "quote_sent" && (
          <div className="px-5 pt-8 text-center space-y-4">
            <div
              className="p-6 rounded-[24px] border shadow-sm"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
            >
              <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto mb-3" />
              <h3 className="text-[17px] font-black" style={{ color: "var(--text-1)" }}>
                Waiting for customer to approve quote...
              </h3>
              <p className="text-[12px] font-medium text-gray-400 mt-1 mb-4">
                We sent ₹{booking.total_amount || quoteTotal} diagnosis to {booking.job.hirer_name}.
              </p>

              <div className="p-3.5 rounded-[14px] bg-black/5 dark:bg-white/5 text-[12px] text-left space-y-1">
                <p className="text-gray-400 font-medium">
                  <strong>Findings:</strong> {booking.worker_diagnosis || diagnosisNote}
                </p>
                <p className="font-mono font-black text-green-600 dark:text-green-400">
                  Total Quoted: ₹{booking.total_amount || quoteTotal}
                </p>
              </div>
            </div>
          </div>
        )}

        {status === "quote_approved" && (
          <div className="px-5 pt-8 text-center space-y-4">
            <div
              className="p-6 rounded-[24px] border shadow-sm"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
            >
              <span className="text-[40px] block mb-2">🎉</span>
              <h3 className="text-[18px] font-black text-green-500">
                Quote Approved by Customer!
              </h3>
              <p className="text-[12px] font-medium text-gray-400 mt-1 mb-5">
                Approved Amount: ₹{booking.total_amount || quoteTotal}. You can start work now.
              </p>

              <button
                type="button"
                onClick={handleStartWork}
                className="w-full py-4 rounded-[18px] text-[15px] font-black text-white active:scale-95 shadow-xl"
                style={{ background: "#10B981" }}
              >
                Start Work Now ⚡
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            STATE 5: WORKING / IN PROGRESS
        ══════════════════════════════ */}
        {(status === "working" || status === "in_progress") && (
          <div className="px-5 pt-6 space-y-4">
            <div
              className="p-6 rounded-[24px] border text-center shadow-sm space-y-4"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
            >
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#FF6B00] block mb-1">
                  Job In Progress
                </span>
                <span
                  className="text-[44px] font-black font-mono"
                  style={{ color: "var(--text-1)" }}
                >
                  {formatTimer(workingSeconds)}
                </span>
                <p className="text-[12px] font-bold text-gray-400 mt-0.5">
                  Approved Total: ₹{booking.total_amount || 350}
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/chat?bookingId=${booking.id}`}
                  className="flex-1 py-3 rounded-[14px] text-[12px] font-black border text-center"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border-2)",
                    color: "var(--text-1)",
                  }}
                >
                  💬 Chat with Customer
                </Link>
                <a
                  href={`tel:${booking.job.hirer_phone}`}
                  className="flex-1 py-3 rounded-[14px] text-[12px] font-black border text-center"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border-2)",
                    color: "var(--text-1)",
                  }}
                >
                  📞 Call Customer
                </a>
              </div>
            </div>

            {/* Complete Job Confirmation Box */}
            <div
              className="p-5 rounded-[22px] border space-y-3"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
            >
              <h3 className="text-[14px] font-black" style={{ color: "var(--text-1)" }}>
                Ready to finish?
              </h3>
              <p className="text-[11px] font-medium text-gray-400">
                Take at least 2 after photos to verify completed work.
              </p>

              {/* After Photos Upload */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {afterPhotos.map((url, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded-[12px] overflow-hidden border relative shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="After" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setAfterPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 text-white text-[9px] flex items-center justify-center font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {afterPhotos.length < 4 && (
                  <label className="w-16 h-16 rounded-[12px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer active:scale-95 shrink-0">
                    <span className="text-[16px]">📸</span>
                    <span className="text-[8px] font-black text-gray-400 mt-0.5">After</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAfterPhotoAdd}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <button
                type="button"
                onClick={handleConfirmComplete}
                disabled={afterPhotos.length < 2 || completingJob}
                className="w-full py-3.5 rounded-[16px] text-[13px] font-black text-white active:scale-95 disabled:opacity-50 transition-all shadow-md"
                style={{ background: "#10B981" }}
              >
                {completingJob ? "Submitting..." : "Confirm Work Complete ✓"}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            STATE 6: COMPLETED (WAITING CONFIRMATION)
        ══════════════════════════════ */}
        {status === "completed" && (
          <div className="px-5 pt-8 text-center space-y-4">
            <div
              className="p-6 rounded-[24px] border shadow-sm"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
            >
              <span className="text-[40px] block mb-2">⏳</span>
              <h3 className="text-[17px] font-black" style={{ color: "var(--text-1)" }}>
                Waiting for customer confirmation...
              </h3>
              <p className="text-[12px] font-medium text-gray-400 mt-1 mb-4">
                Payout of{" "}
                <strong className="text-green-500 font-mono text-[14px]">
                  ₹{booking.net_to_worker || 345}
                </strong>{" "}
                will be released immediately when the customer confirms.
              </p>

              <div className="p-3 rounded-[12px] bg-black/5 dark:bg-white/5 text-[10px] text-gray-400">
                🛡️ Auto-released in 48 hours if customer doesn&apos;t respond.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════
          FIXED BOTTOM ACTION BUTTONS
      ══════════════════════════════ */}
      {status === "accepted" && (
        <div
          className="fixed bottom-0 left-0 right-0 p-5 border-t z-30"
          style={{
            background: isDark ? "rgba(10,10,10,0.95)" : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
          }}
        >
          <button
            type="button"
            onClick={handleDepart}
            className="w-full py-4 rounded-[18px] text-[15px] font-black text-white active:scale-98 transition-all shadow-xl flex items-center justify-center gap-2"
            style={{ background: "var(--brand)" }}
          >
            <span>🛵 I&apos;m Departing Now →</span>
          </button>
        </div>
      )}

      {status === "en_route" && (
        <div
          className="fixed bottom-0 left-0 right-0 p-5 border-t z-30"
          style={{
            background: isDark ? "rgba(10,10,10,0.95)" : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
          }}
        >
          <button
            type="button"
            onClick={handleArrived}
            className="w-full py-4 rounded-[18px] text-[15px] font-black text-white active:scale-98 transition-all shadow-xl flex items-center justify-center gap-2"
            style={{ background: "#10B981" }}
          >
            <span>📍 I&apos;ve Arrived at Customer Location</span>
          </button>
        </div>
      )}

      {status === "arrived" && (
        <div
          className="fixed bottom-0 left-0 right-0 p-5 border-t z-30"
          style={{
            background: isDark ? "rgba(10,10,10,0.95)" : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
          }}
        >
          <button
            type="button"
            onClick={handleSendQuote}
            disabled={beforePhotos.length < 2 || submittingQuote}
            className="w-full py-4 rounded-[18px] text-[15px] font-black text-white active:scale-98 disabled:opacity-40 transition-all shadow-xl flex items-center justify-center gap-2"
            style={{ background: "var(--brand)" }}
          >
            {submittingQuote ? "Sending Diagnosis..." : "Send Quote to Hirer →"}
          </button>
        </div>
      )}
    </div>
  );
}
