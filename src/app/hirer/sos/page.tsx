"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import { useAuth } from "@/stores/AuthStore";

// ============================================================
// HIRER SOS — SCREEN 1: INSTANT EMERGENCY DISPATCH
// Auto GPS detection · Real Trade ETAs · 2×3 Emergency Grid
// ============================================================

interface EmergencyCategory {
  id: string;
  key: string;
  trade: string;
  name: string;
  icon: string;
  defaultEta: number;
}

const EMERGENCY_CATEGORIES: EmergencyCategory[] = [
  { id: "1", key: "power_failure", trade: "electrician", name: "Power Failure", icon: "⚡", defaultEta: 8 },
  { id: "2", key: "pipe_burst", trade: "plumber", name: "Pipe Burst", icon: "💧", defaultEta: 10 },
  { id: "3", key: "vehicle_breakdown", trade: "mechanic", name: "Engine Stall / Towing", icon: "🚗", defaultEta: 12 },
  { id: "4", key: "tyre_puncture", trade: "mechanic", name: "Tyre Puncture", icon: "🛞", defaultEta: 7 },
  { id: "5", key: "ac_emergency", trade: "ac_repair", name: "AC Gas Leak / Dead AC", icon: "❄️", defaultEta: 15 },
  { id: "6", key: "lock_broken", trade: "locksmith", name: "Door Lockout", icon: "🔒", defaultEta: 12 },
];

export default function HirerSosPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<EmergencyCategory>(EMERGENCY_CATEGORIES[0]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState<string>("Detecting exact GPS location...");
  const [gpsError, setGpsError] = useState(false);
  const [manualLandmark, setManualLandmark] = useState("");
  const [tradeEtas, setTradeEtas] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [noWorkersModal, setNoWorkersModal] = useState(false);
  const [notified, setNotified] = useState(false);

  // ── 1. GPS DETECTION (ON MOUNT, ZERO USER ACTION) ──
  const detectLocation = useCallback(() => {
    setGpsError(false);
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          setLat(latitude);
          setLng(longitude);

          // Reverse geocode
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16`,
              { headers: { "Accept-Language": "en", "User-Agent": "Kaizy-App/1.0" } }
            );
            const data = await res.json();
            const addr =
              data.display_name?.split(",").slice(0, 3).join(",") ||
              `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setAddress(addr);
          } catch {
            setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        },
        () => {
          setGpsError(true);
          setAddress("");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsError(true);
    }
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // ── 2. QUERY REAL ETAS FROM NEAREST WORKERS ──
  useEffect(() => {
    const fetchEtas = async () => {
      const currentLat = lat || 11.0168;
      const currentLng = lng || 76.9558;

      const etas: Record<string, number> = {};
      try {
        await Promise.all(
          ["electrician", "plumber", "mechanic", "ac_repair", "locksmith"].map(async (trade) => {
            const res = await fetch(
              `/api/workers/nearby?trade=${trade}&lat=${currentLat}&lng=${currentLng}&radius=15&limit=1`
            );
            const json = await res.json();
            if (json.success && json.data?.workers?.length > 0) {
              etas[trade] = json.data.workers[0].eta || Math.ceil(json.data.workers[0].distance / 0.5);
            }
          })
        );
        setTradeEtas(etas);
      } catch {
        // Use defaults if query fails
      }
    };

    fetchEtas();
  }, [lat, lng]);

  // ── 3. DISPATCH SOS ACTION ──
  const handleFindHelpNow = async () => {
    const finalAddress = address.trim() || manualLandmark.trim();
    if (!lat && !manualLandmark.trim()) {
      setGpsError(true);
      return;
    }

    setLoading(true);

    try {
      if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);

      const res = await fetch("/api/dispatch/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: lat || 11.0168,
          lng: lng || 76.9558,
          address: finalAddress || "Coimbatore Emergency Location",
          problemType: selectedCategory.key,
          trade: selectedCategory.trade,
          hirerId: user?.id,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.status === "no_workers") {
          setNoWorkersModal(true);
        } else {
          router.push(`/hirer/sos/searching?jobId=${data.jobId}`);
        }
      } else {
        setNoWorkersModal(true);
      }
    } catch {
      setNoWorkersModal(true);
    } finally {
      setLoading(false);
    }
  };

  const isButtonEnabled = (lat !== null || manualLandmark.trim().length >= 3) && !loading;

  return (
    <div
      className="min-h-screen flex flex-col justify-between px-5 pt-8 pb-8 relative"
      style={{ background: isDark ? "var(--bg-app)" : "#FFFFFF" }}
    >
      <div>
        {/* ── Top Bar ── */}
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[13px] font-bold"
            style={{ color: "var(--text-3)" }}
          >
            ← Back Home
          </Link>
          <span className="text-[11px] font-black px-3 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
            EMERGENCY SOS
          </span>
        </div>

        {/* ── Heading ── */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px] bg-red-500 text-white shadow-lg shadow-red-500/30">
            🆘
          </div>
          <div>
            <h1
              className="text-[24px] font-black tracking-tight"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
            >
              Emergency Assistance
            </h1>
            <p className="text-[12px] font-semibold text-red-500">
              Immediate dispatch to verified nearby captains
            </p>
          </div>
        </div>

        {/* ── GPS Address Banner ── */}
        <div
          className="rounded-[18px] p-3.5 mt-4 mb-6 border flex items-center gap-3"
          style={{
            background: gpsError ? "rgba(239,68,68,0.06)" : "var(--bg-surface)",
            borderColor: gpsError ? "rgba(239,68,68,0.3)" : "var(--border-2)",
          }}
        >
          <div className="w-3 h-3 rounded-full bg-green-500 online-dot shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Your Incident Location
            </p>
            {gpsError ? (
              <input
                type="text"
                value={manualLandmark}
                onChange={(e) => setManualLandmark(e.target.value)}
                placeholder="Describe where you are (street, landmark, area)..."
                className="w-full text-[13px] font-bold outline-none bg-transparent mt-0.5"
                style={{ color: "var(--text-1)" }}
                autoFocus
              />
            ) : (
              <p className="text-[12px] font-extrabold truncate" style={{ color: "var(--text-1)" }}>
                📍 {address || "Locating via GPS..."}
              </p>
            )}
          </div>
          {gpsError && (
            <button
              type="button"
              onClick={detectLocation}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FF6B00]/10 text-[#FF6B00] shrink-0"
            >
              Retry GPS
            </button>
          )}
        </div>

        {/* ── 2×3 Problem Type Grid with Real ETAs ── */}
        <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
          Select Emergency Incident:
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {EMERGENCY_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.key === cat.key;
            const eta = tradeEtas[cat.trade] || cat.defaultEta;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className="rounded-[20px] p-4 text-left active:scale-[0.97] transition-all flex flex-col justify-between"
                style={{
                  height: 108,
                  background: isSelected ? "rgba(239, 68, 68, 0.12)" : "var(--bg-surface)",
                  border: `2px solid ${isSelected ? "#EF4444" : "transparent"}`,
                  boxShadow: isSelected ? "0 0 0 4px rgba(239,68,68,0.12)" : "var(--shadow-sm)",
                }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[28px]">{cat.icon}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
                    ~{eta} min
                  </span>
                </div>
                <div>
                  <p className="text-[13px] font-black leading-snug" style={{ color: "var(--text-1)" }}>
                    {cat.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div>
        <button
          type="button"
          onClick={handleFindHelpNow}
          disabled={!isButtonEnabled}
          className="w-full rounded-[18px] py-4 text-[16px] font-black text-white active:scale-[0.98] disabled:opacity-40 transition-all shadow-xl flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg, #EF4444, #DC2626)",
            boxShadow: "0 8px 28px rgba(239, 68, 68, 0.4)",
          }}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 rounded-full border-white border-t-transparent animate-spin" />
              <span>Finding nearest captains...</span>
            </>
          ) : (
            <>
              <span>🚨</span>
              <span>FIND HELP NOW →</span>
            </>
          )}
        </button>
      </div>

      {/* ── No Workers Modal ── */}
      {noWorkersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/70 backdrop-blur-sm anim-fade">
          <div
            className="w-full max-w-sm rounded-[24px] p-6 text-center anim-spring"
            style={{ background: isDark ? "var(--bg-card)" : "#FFFFFF" }}
          >
            <span className="text-[36px] block mb-2">🌙</span>
            <h3 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>
              No captains available right now
            </h3>
            <p className="text-[12px] font-medium text-gray-400 mt-1 mb-5">
              All {selectedCategory.name} captains are currently engaged or offline.
            </p>

            {notified ? (
              <div className="p-3 rounded-[16px] bg-green-500/10 text-green-500 text-[11px] font-bold mb-4">
                ✓ We will ping your WhatsApp the moment a captain becomes free
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setNotified(true)}
                className="w-full rounded-[16px] py-3 text-[12px] font-black bg-[#FF6B00] text-white mb-2.5 active:scale-95"
              >
                🔔 Notify me when available
              </button>
            )}

            <button
              type="button"
              onClick={() => setNoWorkersModal(false)}
              className="w-full rounded-[16px] py-3 text-[12px] font-bold"
              style={{ background: "var(--bg-surface)", color: "var(--text-1)" }}
            >
              Try different problem
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
