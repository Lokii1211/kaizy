"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useTheme } from "@/stores/ThemeStore";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

// ============================================================
// WORKER ONBOARDING — SCREEN 5: AVAILABILITY & SERVICE RADIUS
// GPS home base · Radius slider · Working hours · Night jobs toggle
// ============================================================

const DAYS = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

export default function WorkerAvailabilityOnboardingPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 11.0168, lng: 76.9558 });
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]));
  const [fromTime, setFromTime] = useState("08:00");
  const [toTime, setToTime] = useState("20:00");
  const [nightAvailable, setNightAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  const toggleDay = (dayId: string) => {
    const next = new Set(selectedDays);
    if (next.has(dayId)) {
      if (next.size > 1) next.delete(dayId);
    } else {
      next.add(dayId);
    }
    setSelectedDays(next);
  };

  const handleContinue = async () => {
    if (selectedDays.size === 0) {
      setError("Please select at least 1 working day");
      return;
    }

    setLoading(true);
    setError("");

    try {
      try {
        localStorage.setItem("kaizy_worker_lat", String(coords.lat));
        localStorage.setItem("kaizy_worker_lng", String(coords.lng));
        localStorage.setItem("kaizy_worker_radius", String(radiusKm));
        localStorage.setItem("kaizy_worker_days", JSON.stringify(Array.from(selectedDays)));
        localStorage.setItem("kaizy_worker_hours", JSON.stringify({ from: fromTime, to: toTime }));
        localStorage.setItem("kaizy_worker_night", String(nightAvailable));
      } catch {}

      // Update worker_profiles
      await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: coords.lat,
          lng: coords.lng,
          service_radius_km: radiusKm,
          availability_days: Array.from(selectedDays),
          available_from: fromTime,
          available_to: toTime,
          night_available: nightAvailable,
        }),
      });

      router.push("/onboarding/worker/payment");
    } catch {
      router.push("/onboarding/worker/payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-6 pt-10 pb-8" style={{ background: isDark ? "var(--bg-app)" : "#FFFFFF" }}>
      <div>
        {/* ── Progress: Step 5 of 6 ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${i <= 5 ? "w-6 bg-[#FF6B00]" : "w-2 bg-gray-300 dark:bg-gray-700"}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-[#FF6B00]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            STEP 5 / 6
          </span>
        </div>

        {/* ── Title ── */}
        <h1 className="text-[22px] font-black tracking-tight mb-1" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
          Where and when do you work?
        </h1>
        <p className="text-[12px] font-medium leading-relaxed mb-4" style={{ color: "var(--text-3)" }}>
          Set your operating zone and schedule for instant dispatch matchmaking.
        </p>

        {/* ── Map & Radius Slider ── */}
        <div className="rounded-[20px] overflow-hidden mb-3 border shadow-sm" style={{ height: 180, borderColor: "var(--border-2)" }}>
          <LiveMap center={coords} userPos={coords} isDark={isDark} className="w-full h-full" zoom={14} />
        </div>

        {/* Radius Slider */}
        <div className="rounded-[16px] p-3.5 mb-4" style={{ background: "var(--bg-surface)" }}>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>
              Service Radius
            </label>
            <span className="text-[12px] font-black text-[#FF6B00]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {radiusKm} km
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={30}
            step={1}
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseInt(e.target.value))}
            className="w-full accent-[#FF6B00] cursor-pointer"
          />
          <p className="text-[10px] font-medium text-gray-400 mt-1">
            You&apos;ll see jobs within {radiusKm}km of your base location
          </p>
        </div>

        {/* ── Availability Days (7 Chips) ── */}
        <div className="mb-4">
          <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: "var(--text-2)" }}>
            Working Days
          </label>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map(d => {
              const isSelected = selectedDays.has(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDay(d.id)}
                  className="py-2.5 rounded-[12px] text-[11px] font-bold transition-all active:scale-95 text-center"
                  style={{
                    background: isSelected ? "var(--brand)" : "var(--bg-surface)",
                    color: isSelected ? "#FFFFFF" : "var(--text-3)",
                    border: `1.5px solid ${isSelected ? "var(--brand)" : "var(--border-2)"}`,
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Working Hours ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: "var(--text-3)" }}>
              From Time
            </label>
            <input
              type="time"
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              className="w-full rounded-[14px] p-3 text-[13px] font-bold outline-none"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-1)",
                border: "1.5px solid var(--border-2)",
              }}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: "var(--text-3)" }}>
              To Time
            </label>
            <input
              type="time"
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              className="w-full rounded-[14px] p-3 text-[13px] font-bold outline-none"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-1)",
                border: "1.5px solid var(--border-2)",
              }}
            />
          </div>
        </div>

        {/* ── Night Jobs Toggle ── */}
        <label
          onClick={() => setNightAvailable(!nightAvailable)}
          className="flex items-center justify-between p-3.5 rounded-[16px] cursor-pointer transition-all active:scale-[0.99]"
          style={{
            background: nightAvailable ? "rgba(255,107,0,0.08)" : "var(--bg-surface)",
            border: `1.5px solid ${nightAvailable ? "var(--brand)" : "var(--border-2)"}`,
          }}
        >
          <div className="flex-1 pr-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px]">🌙</span>
              <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>
                Accept emergency night jobs (9pm–6am)?
              </p>
            </div>
            {nightAvailable && (
              <p className="text-[10px] font-bold text-[#FF6B00] mt-0.5">
                +₹50–₹100 night premium on each job
              </p>
            )}
          </div>
          <div
            className="w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5"
            style={{ background: nightAvailable ? "var(--brand)" : "var(--bg-elevated)" }}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${nightAvailable ? "translate-x-5" : "translate-x-0"}`}
            />
          </div>
        </label>

        {error && <p className="text-[11px] font-bold text-red-500 mt-2">{error}</p>}
      </div>

      {/* ── Continue Button ── */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading || selectedDays.size === 0}
          className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all shadow-md"
          style={{
            background: "var(--gradient-cta)",
            color: "#FFFFFF",
            boxShadow: "var(--shadow-brand)",
          }}
        >
          {loading ? "Saving Schedule..." : "Set Payout Details →"}
        </button>
      </div>
    </div>
  );
}
