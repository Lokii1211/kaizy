"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// WORKER SCHEDULE — Set availability hours
// Like Rapido Captain schedule / Uber Driver preferences
// ============================================================

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? "AM" : "PM";
  return { value: i, label: `${h}:00 ${ampm}` };
});

interface DaySchedule {
  day: string;
  enabled: boolean;
  startHour: number;
  endHour: number;
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map(day => ({
      day,
      enabled: !["Sunday"].includes(day),
      startHour: 8,
      endHour: 20,
    }))
  );
  const [saved, setSaved] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("kaizy_worker_schedule") || "null");
      if (stored && Array.isArray(stored)) setSchedule(stored);
    } catch {}
  }, []);

  const toggleDay = (index: number) => {
    setSchedule(prev => prev.map((s, i) =>
      i === index ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const updateHour = (index: number, field: "startHour" | "endHour", value: number) => {
    setSchedule(prev => prev.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    ));
  };

  const handleSave = () => {
    localStorage.setItem("kaizy_worker_schedule", JSON.stringify(schedule));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const totalHours = schedule
    .filter(s => s.enabled)
    .reduce((sum, s) => sum + Math.max(0, s.endHour - s.startHour), 0);

  const activeDays = schedule.filter(s => s.enabled).length;

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>⏰ My Schedule</h1>
        </div>
      </div>

      {/* Success toast */}
      {saved && (
        <div className="fixed top-4 left-4 right-4 z-50 rounded-xl p-3 text-center text-[12px] font-bold text-white"
             style={{ background: "var(--success)" }}>
          ✅ Schedule saved!
        </div>
      )}

      {/* Summary card */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl p-4 flex items-center gap-4"
             style={{ background: "var(--brand-tint)", border: "1px solid rgba(255,107,0,0.15)" }}>
          <div className="text-center">
            <p className="text-[24px] font-black" style={{ color: "var(--brand)" }}>{activeDays}</p>
            <p className="text-[9px] font-bold" style={{ color: "var(--text-3)" }}>Days/Week</p>
          </div>
          <div className="h-10 w-px" style={{ background: "var(--border-1)" }} />
          <div className="text-center">
            <p className="text-[24px] font-black" style={{ color: "var(--brand)" }}>{totalHours}</p>
            <p className="text-[9px] font-bold" style={{ color: "var(--text-3)" }}>Hrs/Week</p>
          </div>
          <div className="flex-1 text-right">
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-2)" }}>
              {totalHours >= 40 ? "💪 Full-time" : totalHours >= 20 ? "⚡ Part-time" : "🌱 Flexible"}
            </p>
            <p className="text-[9px]" style={{ color: "var(--text-3)" }}>
              More hours = more job alerts
            </p>
          </div>
        </div>
      </div>

      {/* Day schedules */}
      <div className="px-4 space-y-2">
        {schedule.map((s, i) => (
          <div key={s.day} className="rounded-xl p-3"
               style={{
                 background: "var(--bg-card)",
                 border: s.enabled ? "1px solid var(--border-1)" : "1px solid var(--border-1)",
                 opacity: s.enabled ? 1 : 0.5,
               }}>
            <div className="flex items-center gap-3">
              {/* Toggle */}
              <button onClick={() => toggleDay(i)}
                      className="w-11 h-6 rounded-full relative transition-all"
                      style={{ background: s.enabled ? "var(--brand)" : "var(--bg-elevated)" }}>
                <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
                     style={{ left: s.enabled ? 22 : 2 }} />
              </button>

              {/* Day name */}
              <p className="text-[13px] font-bold flex-1" style={{ color: "var(--text-1)" }}>{s.day}</p>

              {/* Hours */}
              {s.enabled && (
                <p className="text-[10px] font-semibold" style={{ color: "var(--brand)" }}>
                  {Math.max(0, s.endHour - s.startHour)}h
                </p>
              )}
            </div>

            {/* Time selectors */}
            {s.enabled && (
              <div className="flex items-center gap-2 mt-2 pl-14">
                <select value={s.startHour} onChange={e => updateHour(i, "startHour", Number(e.target.value))}
                        className="flex-1 rounded-lg px-2 py-1.5 text-[11px] font-bold outline-none appearance-none text-center"
                        style={{ background: "var(--bg-elevated)", color: "var(--text-1)", border: "1px solid var(--border-1)" }}>
                  {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
                <span className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>to</span>
                <select value={s.endHour} onChange={e => updateHour(i, "endHour", Number(e.target.value))}
                        className="flex-1 rounded-lg px-2 py-1.5 text-[11px] font-bold outline-none appearance-none text-center"
                        style={{ background: "var(--bg-elevated)", color: "var(--text-1)", border: "1px solid var(--border-1)" }}>
                  {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick presets */}
      <div className="px-4 mt-4">
        <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "var(--text-3)", letterSpacing: 2 }}>Quick Presets</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Full Day (8AM-8PM)", start: 8, end: 20 },
            { label: "Morning (6AM-12PM)", start: 6, end: 12 },
            { label: "Evening (2PM-10PM)", start: 14, end: 22 },
            { label: "24/7", start: 0, end: 24 },
          ].map(preset => (
            <button key={preset.label}
                    onClick={() => setSchedule(prev => prev.map(s => ({
                      ...s,
                      enabled: true,
                      startHour: preset.start,
                      endHour: preset.end === 24 ? 23 : preset.end,
                    })))}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold active:scale-95"
                    style={{ background: "var(--bg-card)", color: "var(--text-2)", border: "1px solid var(--border-1)" }}>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="px-4 mt-6">
        <button onClick={handleSave}
                className="w-full rounded-xl py-3.5 text-[14px] font-bold text-white active:scale-95"
                style={{ background: "var(--brand)" }}>
          💾 Save Schedule
        </button>
        <p className="text-center text-[9px] mt-2" style={{ color: "var(--text-3)" }}>
          You&apos;ll only receive job alerts during your scheduled hours
        </p>
      </div>
    </div>
  );
}
