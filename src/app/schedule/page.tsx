"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// WORKER SCHEDULE v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · Tonal surfaces · No borders · JetBrains Mono
// ============================================================

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  return { value: i, label: `${h}:00 ${i < 12 ? "AM" : "PM"}` };
});

interface DaySchedule { day: string; enabled: boolean; startHour: number; endHour: number; }

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map(day => ({ day, enabled: !["Sunday"].includes(day), startHour: 8, endHour: 20 }))
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem("kaizy_worker_schedule") || "null"); if (s && Array.isArray(s)) setSchedule(s); } catch {}
  }, []);

  const toggleDay = (i: number) => setSchedule(p => p.map((s, j) => j === i ? { ...s, enabled: !s.enabled } : s));
  const updateHour = (i: number, f: "startHour" | "endHour", v: number) => setSchedule(p => p.map((s, j) => j === i ? { ...s, [f]: v } : s));
  const handleSave = () => { localStorage.setItem("kaizy_worker_schedule", JSON.stringify(schedule)); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const totalHours = schedule.filter(s => s.enabled).reduce((sum, s) => sum + Math.max(0, s.endHour - s.startHour), 0);
  const activeDays = schedule.filter(s => s.enabled).length;

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/settings" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            My Schedule
          </h1>
        </div>
      </div>

      {saved && (
        <div className="fixed top-4 left-4 right-4 z-50 rounded-[14px] p-3 text-center text-[11px] font-bold text-white"
             style={{ background: "var(--success)" }}>✅ Schedule saved!</div>
      )}

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
              {totalHours >= 40 ? "💪" : totalHours >= 20 ? "⚡" : "🌱"}
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
        <button onClick={handleSave}
                className="w-full rounded-[16px] py-4 text-[13px] font-black text-white active:scale-[0.97] transition-transform"
                style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
          💾 Save Schedule
        </button>
        <p className="text-center text-[9px] mt-2 font-medium" style={{ color: "var(--text-3)" }}>
          You&apos;ll only receive job alerts during your scheduled hours
        </p>
      </div>
    </div>
  );
}
