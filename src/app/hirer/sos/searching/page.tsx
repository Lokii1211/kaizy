"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import LoadingShell from "@/components/LoadingShell";

// ============================================================
// HIRER SOS — SCREEN 2: REAL-TIME SEARCHING & SONAR RADAR
// Full screen Mapbox GL · 3 Expanding Orange Sonar Rings · Realtime Alert Dots
// ============================================================

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface AlertMarker {
  id: string;
  workerId: string;
  lat: number;
  lng: number;
  trade: string;
}

function SosSearchingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") || "";

  const [job, setJob] = useState<{
    id: string;
    trade: string;
    latitude: number;
    longitude: number;
    address: string;
    expires_at: string;
    status: string;
  } | null>(null);

  const [alertsCount, setAlertsCount] = useState<number>(1);
  const [countdown, setCountdown] = useState<number>(45);
  const [isExpanding, setIsExpanding] = useState(false);
  const [noWorkers, setNoWorkers] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const supabase = useMemo(() => getSupabase(), []);

  // ── 1. FETCH INITIAL JOB DETAILS ──
  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (!error && data) {
        setJob({
          id: data.id,
          trade: data.trade,
          latitude: Number(data.latitude) || 11.0168,
          longitude: Number(data.longitude) || 76.9558,
          address: data.address || "Emergency Location",
          expires_at: data.expires_at || new Date(Date.now() + 45000).toISOString(),
          status: data.status,
        });

        const secondsLeft = Math.max(
          0,
          Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000)
        );
        setCountdown(secondsLeft > 0 ? secondsLeft : 45);

        // Check if already booked
        if (data.status === "booked" || data.status === "accepted") {
          const { data: booking } = await supabase
            .from("bookings")
            .select("id")
            .eq("job_id", jobId)
            .maybeSingle();

          router.replace(`/hirer/tracking/${booking?.id || jobId}`);
        }
      }
    };

    fetchJob();
  }, [jobId, supabase, router]);

  // ── 2. REALTIME SUBSCRIPTION ON JOB_ALERTS (Worker Dots Appear on Map) ──
  useEffect(() => {
    if (!jobId || !job) return;

    // Fetch existing alerts
    const fetchExistingAlerts = async () => {
      const { data: alerts } = await supabase
        .from("job_alerts")
        .select("*, worker_profiles(latitude, longitude, trade, trade_primary)")
        .eq("job_id", jobId);

      if (alerts && alerts.length > 0) {
        setAlertsCount(alerts.length);
        renderWorkerMarkers(alerts);
      }
    };

    fetchExistingAlerts();

    const channel = supabase
      .channel(`sos-alerts-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_alerts",
          filter: `job_id=eq.${jobId}`,
        },
        () => {
          fetchExistingAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, job, supabase]);

  // ── 3. REALTIME SUBSCRIPTION ON JOBS TABLE (Watch for 'booked' status) ──
  useEffect(() => {
    if (!jobId) return;

    const channel = supabase
      .channel(`sos-job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${jobId}`,
        },
        async (payload) => {
          const updated = payload.new;
          if (updated) {
            if (updated.status === "booked" || updated.status === "accepted") {
              // Find matching booking
              const { data: booking } = await supabase
                .from("bookings")
                .select("id")
                .eq("job_id", jobId)
                .maybeSingle();

              router.replace(`/hirer/tracking/${booking?.id || jobId}`);
            } else if (updated.status === "no_workers") {
              setNoWorkers(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, supabase, router]);

  // ── 4. COUNTDOWN & AUTO-EXPAND SEARCH (after 45s) ──
  useEffect(() => {
    if (countdown <= 0) {
      // Auto-expand search to 15km
      if (!isExpanding && !noWorkers) {
        setIsExpanding(true);
        fetch("/api/dispatch/expand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.newlyNotified > 0) {
              setCountdown(45);
              setIsExpanding(false);
            } else {
              setNoWorkers(true);
            }
          })
          .catch(() => {
            setNoWorkers(true);
          });
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isExpanding, noWorkers, jobId]);

  // ── 5. INITIALIZE MAPBOX WITH RADAR SONAR RINGS ──
  useEffect(() => {
    if (!mapContainerRef.current || !job) return;

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
            center: [job.longitude, job.latitude],
            zoom: 14,
            attributionControl: false,
          });

          map.on("load", () => {
            if (isCancelled) return;

            // ── User Pin with 3 Expanding Orange Sonar Rings ──
            const userEl = document.createElement("div");
            userEl.className = "sos-user-radar";
            userEl.innerHTML = `
              <div style="position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center">
                <!-- 3 Expanding Sonar Rings -->
                <div class="sonar-ring-1" style="position:absolute;inset:0;border-radius:50%;border:2px solid #FF6B00;background:rgba(255,107,0,0.12)"></div>
                <div class="sonar-ring-2" style="position:absolute;inset:0;border-radius:50%;border:2px solid #FF6B00;background:rgba(255,107,0,0.12)"></div>
                <div class="sonar-ring-3" style="position:absolute;inset:0;border-radius:50%;border:2px solid #FF6B00;background:rgba(255,107,0,0.12)"></div>
                <!-- Center Blue Pin -->
                <div style="width:20px;height:20px;border-radius:50%;background:#3B82F6;border:3px solid #FFFFFF;box-shadow:0 0 16px rgba(59,130,246,0.8);position:relative;z-index:3"></div>
              </div>
            `;

            new mapboxgl.Marker({ element: userEl })
              .setLngLat([job.longitude, job.latitude])
              .addTo(map);
          });

          mapRef.current = map;
        }
      } catch (err) {
        console.error("[searching mapbox err]", err);
      }
    };

    initMap();

    return () => {
      isCancelled = true;
    };
  }, [job]);

  // Render newly popped worker dots on Mapbox
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderWorkerMarkers = async (alerts: any[]) => {
    if (!mapRef.current || !job) return;

    try {
      const mapboxgl = (await import("mapbox-gl")).default;
      const map = mapRef.current;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      alerts.forEach((a, idx) => {
        const wp = a.worker_profiles;
        const wLat = wp?.latitude || job.latitude + (Math.sin(idx * 1.5) * 0.008);
        const wLng = wp?.longitude || job.longitude + (Math.cos(idx * 1.5) * 0.008);

        const dotEl = document.createElement("div");
        dotEl.className = "pop-in";
        dotEl.innerHTML = `
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #FF6B00;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            color: #FFFFFF;
            border: 2px solid #FFFFFF;
            box-shadow: 0 0 14px rgba(255,107,0,0.6);
          ">
            ⚡
          </div>
        `;

        const marker = new mapboxgl.Marker({ element: dotEl })
          .setLngLat([wLng, wLat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    } catch (e) {
      console.error("[renderWorkerMarkers]", e);
    }
  };

  const handleCancelJob = async () => {
    try {
      await supabase.from("jobs").update({ status: "cancelled" }).eq("id", jobId);
      router.replace("/");
    } catch {
      router.replace("/");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black select-none">
      {/* ── FULL SCREEN MAPBOX MAP WITH 3 SONAR RINGS ── */}
      <div ref={mapContainerRef} className="fixed inset-0 w-full h-full z-0" />

      {/* ── TOP SOS STATUS CHIP ── */}
      <div className="fixed top-6 left-0 right-0 z-20 flex justify-center px-4">
        <div className="rounded-full px-4 py-2 bg-black/80 backdrop-blur-md border border-red-500/40 shadow-2xl flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 online-dot" />
          <span className="text-[12px] font-black text-white">
            EMERGENCY RADAR ACTIVE
          </span>
        </div>
      </div>

      {/* ── FIXED BOTTOM SHEET ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 px-6 pt-5 pb-8 border-t border-white/10 rounded-t-[28px]"
        style={{
          background: "rgba(10, 10, 10, 0.94)",
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
        }}
      >
        {!noWorkers ? (
          <div className="text-center">
            <h2
              className="text-[18px] font-black text-white mb-1"
              style={{ fontFamily: "'Epilogue', sans-serif" }}
            >
              {isExpanding ? "Expanding search area..." : "Finding captains near you..."}
            </h2>
            <p className="text-[12px] font-medium text-white/70 mb-4">
              Alerted nearest verified captains to your location.
            </p>

            {/* 5 Worker Notification Dots */}
            <div className="flex justify-center items-center gap-2.5 mb-4">
              {[1, 2, 3, 4, 5].map((i) => {
                const isFilled = i <= alertsCount;
                return (
                  <div
                    key={i}
                    className="w-3.5 h-3.5 rounded-full transition-all"
                    style={{
                      background: isFilled ? "#FF6B00" : "rgba(255,255,255,0.15)",
                      boxShadow: isFilled ? "0 0 10px rgba(255,107,0,0.8)" : "none",
                      transform: isFilled ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                );
              })}
            </div>

            {/* Countdown Badge */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 text-[12px] font-bold text-white mb-4">
              <span>⏱️</span>
              <span>
                Captains have{" "}
                <strong className="text-[#FF6B00]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  0:{countdown < 10 ? `0${countdown}` : countdown}
                </strong>{" "}
                to respond
              </span>
            </div>

            {/* Cancel Button */}
            <div>
              <button
                type="button"
                onClick={handleCancelJob}
                className="text-[11px] font-bold text-white/50 hover:text-white underline transition-colors"
              >
                Cancel Request
              </button>
            </div>
          </div>
        ) : (
          /* ── NO WORKERS STATE ── */
          <div className="text-center">
            <span className="text-[32px] block mb-2">🌙</span>
            <h2 className="text-[16px] font-black text-white mb-1">
              No captains responded in time
            </h2>
            <p className="text-[12px] font-medium text-white/60 mb-5">
              All nearby captains are currently occupied on active jobs.
            </p>
            <div className="space-y-2">
              <Link
                href="/hirer/sos"
                className="block w-full rounded-[16px] py-3.5 text-[13px] font-black bg-[#FF6B00] text-white active:scale-95 transition-transform"
              >
                Try Again →
              </Link>
              <Link
                href="/"
                className="block w-full rounded-[16px] py-3 text-[12px] font-bold text-white/70 bg-white/10"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SosSearchingPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <SosSearchingContent />
    </Suspense>
  );
}
