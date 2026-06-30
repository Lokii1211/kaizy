"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// WORKER SCHEDULE v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · Tonal surfaces · No borders · JetBrains Mono
// Syncs with Supabase via /api/auth/me + /api/auth/profile
// ============================================================

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT_DAYS: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
  Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  return { value: i, label: `${h}:00 ${i < 12 ? "AM" : "PM"}` };
});

interface DaySchedule { day: string; enabled: boolean; startHour: number; endHour: number; }

function parseHourString(s: string | undefined | null, fallback: number): number {
  if (!s) return fallback;
  const parts = s.split(":");
  return parseInt(parts[0], 10) || fallback;
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map(day => ({ day, enabled: !["Sunday"].includes(day), startHour: 8, endHour: 20 }))
  );
  const [nightAvailable, setNightAvailable] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load schedule: localStorage cache first, then fetch from API
  useEffect(() => {
    // 1. Instant display from cache
    try {
      const s = JSON.parse(localStorage.getItem("kaizy_worker_schedule") || "null");
      if (s && Array.isArray(s)) setSchedule(s);
      const n = localStorage.getItem("kaizy_worker_night");
      if (n !== null) setNightAvailable(n === "true");
    } catch {}

    // 2. Fetch from API
    const fetchSchedule = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();

        if (json.success && json.data?.worker_profile) {
          const wp = json.data.worker_profile;

          // Parse availability_days (e.g., ["Mon","Tue","Wed","Thu","Fri"])
          const apiDays: string[] = wp.availability_days || [];
          const apiStart = parseHourString(wp.available_from, 8);
          const apiEnd = parseHourString(wp.available_to, 20);
          const apiNight = wp.night_available || false;

          if (apiDays.length > 0) {
            const newSchedule = DAYS.map(day => {
              const shortDay = SHORT_DAYS[day];
              return {
                day,
                enabled: apiDays.includes(shortDay) || apiDays.includes(day),
                startHour: apiStart,
                endHour: apiEnd,
              };
            });

            setSchedule(newSchedule);
            setNightAvailable(apiNight);

            // Update cache
            localStorage.setItem("kaizy_worker_schedule", JSON.stringify(newSchedule));
            localStorage.setItem("kaizy_worker_night", String(apiNight));
          }
        }
      } catch (err) {
        console.error("[schedule] fetch error:", err);
        setError("Could not load schedule from server. Showing cached data.");
        setTimeout(() => setError(null), 4000);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const toggleDay = (i: number) => setSchedule(p => p.map((s, j) => j === i ? { ...s, enabled: !s.enabled } : s));
  const updateHour = (i: number, f: "startHour" | "endHour", v: number) => setSchedule(p => p.map((s, j) => j === i ? { ...s, [f]: v } : s));

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    // 1. Save to localStorage immediately
    localStorage.setItem("kaizy_worker_schedule", JSON.stringify(schedule));
    localStorage.setItem("kaizy_worker_night", String(nightAvailable));

    // 2. Sync to API
    try {
      const enabledDays = schedule.filter(s => s.enabled).map(s => SHORT_DAYS[s.day]);
      // Use the earliest start and latest end across all enabled days
      const enabledSchedules = schedule.filter(s => s.enabled);
      const startHour = enabledSchedules.length > 0
        ? Math.min(...enabledSchedules.map(s => s.startHour))
        : 8;
      const endHour = enabledSchedules.length > 0
        ? Math.max(...enabledSchedules.map(s => s.endHour))
        : 20;

      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availability_days: enabledDays,
          available_from: formatHour(startHour),
          available_to: formatHour(endHour),
          night_available: nightAvailable,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError("Schedule saved locally but could not sync to server.");
        setTimeout(() => setError(null), 4000);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      console.error("[schedule] save error:", err);
      setError("Schedule saved locally but could not sync to server.");
      setTimeout(() => setError(null), 4000);
      // Still show saved since localStorage worked
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const totalHours = schedule.filter(s => s.enabled).reduce((sum, s) => sum + Math.max(0, s.endHour - s.startHour), 0);
  const activeDays = schedule.filter(s => s.enabled).length;

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/settings" aria-label="Go back" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            My Schedule
          </h1>
        </div>
      </div>

      {/* Success toast */}
      {saved && (
        <div className="fixed top-4 left-4 right-4 z-50 rounded-[14px] p-3 text-center text-[11px] font-bold text-white"
             style={{ background: "var(--success)" }}>
          Schedule saved successfully!
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 rounded-[14px] p-3 text-center text-[11px] font-bold"
             style={{ background: "var(--warning-tint, #fff3cd)", color: "var(--warning, #856404)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="px-5 space-y-3">
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="skeleton h-20 rounded-[16px]" />
            <div className="skeleton h-20 rounded-[16px]" />
            <div className="skeleton h-20 rounded-[16px]" />
          </div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton h-14 rounded-[16px]" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary card */}
          <div className="px-5 mb-4">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-[16px] p-3.5 text-center" style={{ background: "var(--brand-tint)" }}>
                <p className="text-[22px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>{activeDays}</p>
                <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Days/Week</p>
              </div>
              <div className="rounded-[16px] p-3.5 text-center" style={{ background: "var(--brand-tint)" }}>
                <p className="text-[22px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>{totalHours}</p>
                <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Hrs/Week</p>
              </div>
              <div className="rounded-[16px] p-3.5 text-center" style={{ background: "var(--bg-surface)" }}>
                <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>
                  {totalHours >= 40 ? "Full" : totalHours >= 20 ? "Part" : "Flex"}
                </p>
                <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                  {totalHours >= 40 ? "Full-time" : totalHours >= 20 ? "Part-time" : "Flexible"}
                </p>
              </div>
            </div>
          </div>

          {/* Day schedules */}
          <div className="px-5 space-y-2">
            {schedule.map((s, i) => (
              <div key={s.day} className="rounded-[16px] p-3.5" style={{ background: "var(--bg-card)", opacity: s.enabled ? 1 : 0.5 }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleDay(i)} className="w-11 h-6 rounded-full relative transition-all shrink-0"
                          style={{ background: s.enabled ? "var(--brand)" : "var(--bg-elevated)" }}>
                    <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
                         style={{ left: s.enabled ? 22 : 2 }} />
                  </button>
                  <p className="text-[12px] font-bold flex-1" style={{ color: "var(--text-1)" }}>{s.day}</p>
                  {s.enabled && (
                    <p className="text-[10px] font-bold" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {Math.max(0, s.endHour - s.startHour)}h
                    </p>
                  )}
                </div>

                {s.enabled && (
                  <div className="flex items-center gap-2 mt-2.5 pl-14">
                    <select value={s.startHour} onChange={e => updateHour(i, "startHour", Number(e.target.value))}
                            className="flex-1 rounded-[10px] px-2 py-1.5 text-[10px] font-bold outline-none appearance-none text-center"
                            style={{ background: "var(--bg-surface)", color: "var(--text-1)" }}>
                      {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                    <span className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>to</span>
                    <select value={s.endHour} onChange={e => updateHour(i, "endHour", Number(e.target.value))}
                            className="flex-1 rounded-[10px] px-2 py-1.5 text-[10px] font-bold outline-none appearance-none text-center"
                            style={{ background: "var(--bg-surface)", color: "var(--text-1)" }}>
                      {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Night availability toggle */}
          <div className="px-5 mt-3">
            <div className="rounded-[16px] p-3.5 flex items-center gap-3" style={{ background: "var(--bg-card)" }}>
              <button onClick={() => setNightAvailable(!nightAvailable)} className="w-11 h-6 rounded-full relative transition-all shrink-0"
                      style={{ background: nightAvailable ? "var(--brand)" : "var(--bg-elevated)" }}>
                <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
                     style={{ left: nightAvailable ? 22 : 2 }} />
              </button>
              <div className="flex-1">
                <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>Night Availability</p>
                <p className="text-[9px]" style={{ color: "var(--text-3)" }}>Accept emergency jobs after hours</p>
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="px-5 mt-4">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Quick Presets</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "Full Day (8AM-8PM)", start: 8, end: 20 },
                { label: "Morning (6AM-12PM)", start: 6, end: 12 },
                { label: "Evening (2PM-10PM)", start: 14, end: 22 },
                { label: "24/7", start: 0, end: 23 },
              ].map(preset => (
                <button key={preset.label}
                        onClick={() => setSchedule(prev => prev.map(s => ({ ...s, enabled: true, startHour: preset.start, endHour: preset.end })))}
                        className="px-3 py-1.5 rounded-[10px] text-[9px] font-bold active:scale-95 transition-transform"
                        style={{ background: "var(--bg-card)", color: "var(--text-2)" }}>
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="px-5 mt-6">
            <button onClick={handleSave} disabled={saving}
                    className="w-full rounded-[16px] py-4 text-[13px] font-black text-white active:scale-[0.97] transition-transform"
                    style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : "Save Schedule"}
            </button>
            <p className="text-center text-[9px] mt-2 font-medium" style={{ color: "var(--text-3)" }}>
              You&apos;ll only receive job alerts during your scheduled hours
            </p>
          </div>
        </>
      )}
    </div>
  );
}
