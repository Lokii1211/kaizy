"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// POST A JOB v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · Tonal surfaces · Gradient CTAs · No borders
// ============================================================

const trades = [
  { icon: "⚡", name: "Electrician", id: "electrician" },
  { icon: "🔧", name: "Plumber", id: "plumber" },
  { icon: "🚗", name: "Mechanic", id: "mechanic" },
  { icon: "❄️", name: "AC Repair", id: "ac" },
  { icon: "🪚", name: "Carpenter", id: "carpenter" },
  { icon: "🎨", name: "Painter", id: "painter" },
  { icon: "🧱", name: "Mason", id: "mason" },
  { icon: "⚒️", name: "Welder", id: "welder" },
  { icon: "✂️", name: "Tailor", id: "tailor" },
  { icon: "🔩", name: "Other", id: "other" },
];

type JobMode = "instant" | "scheduled" | "project";

export default function PostJobPage() {
  const [mode, setMode] = useState<JobMode>("instant");
  const [selectedTrade, setSelectedTrade] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("Detecting location...");
  const [isRecording, setIsRecording] = useState(false);
  const [isPosted, setIsPosted] = useState(false);
  const [selectedDate, setSelectedDate] = useState("Tomorrow");
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [duration, setDuration] = useState("1 day");

  useEffect(() => {
    if (!navigator.geolocation) { setLocation("Your area"); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (token) {
        try {
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${pos.coords.longitude},${pos.coords.latitude}.json?access_token=${token}&limit=1&types=locality,place`);
          const d = await res.json();
          if (d.features?.[0]) setLocation(d.features[0].place_name?.split(',').slice(0, 2).join(',') || d.features[0].text);
        } catch { setLocation("Your area"); }
      }
    }, () => setLocation("Location off"));
  }, []);

  const dates = ["Today", "Tomorrow", "Wed 19", "Thu 20", "Fri 21", "Sat 22", "Sun 23"];
  const times = ["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "2 PM", "3 PM", "4 PM", "5 PM"];
  const durations = ["1 day", "2 days", "3 days", "1 week", "2 weeks", "1 month", "Custom"];

  if (isPosted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-app)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
             style={{ background: "var(--success)", boxShadow: "0 8px 24px rgba(34,197,94,0.3)" }}>
          <span className="text-white text-[32px]">✓</span>
        </div>
        <h1 className="text-[22px] font-black tracking-tight text-center" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
          Job Posted! 🚀
        </h1>
        <p className="text-[12px] mt-2 text-center font-medium" style={{ color: "var(--text-3)" }}>
          {mode === "instant" ? "Finding workers near you..." : "Your job has been posted. Workers will respond shortly."}
        </p>

        <div className="w-full rounded-[18px] p-5 mt-6" style={{ background: "var(--bg-card)" }}>
          <div className="space-y-3">
            {[
              { l: "Trade", v: trades.find(t => t.id === selectedTrade)?.name || "—" },
              { l: "Mode", v: mode === "instant" ? "⚡ KaamNow" : mode === "scheduled" ? "📅 KaamLater" : "🏗️ KaizyProject" },
              { l: "Location", v: location },
              ...(budget ? [{ l: "Budget", v: `₹${budget}` }] : []),
            ].map(r => (
              <div key={r.l} className="flex justify-between">
                <span className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>{r.l}</span>
                <span className="text-[11px] font-bold" style={{ color: "var(--text-1)", fontFamily: r.l === "Budget" ? "'JetBrains Mono', monospace" : "inherit" }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {mode === "instant" && (
          <div className="w-full mt-4 rounded-[16px] p-4 flex items-center gap-3" style={{ background: "var(--brand-tint)" }}>
            <div className="w-5 h-5 border-2 rounded-full animate-spin shrink-0" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
            <p className="text-[10px] font-bold" style={{ color: "var(--brand)" }}>Matching you with the nearest available worker...</p>
          </div>
        )}

        <div className="w-full mt-6 space-y-2.5">
          <Link href="/marketplace" className="block w-full rounded-[16px] py-4 text-[13px] font-black text-white text-center active:scale-[0.97] transition-transform"
                style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
            {mode === "instant" ? "View Matching Workers →" : "View Responses →"}
          </Link>
          <Link href="/" className="block text-center py-3 text-[11px] font-bold" style={{ color: "var(--text-3)" }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>Post a Job</h1>
        </div>
      </div>

      <div className="px-5 mt-3 space-y-4">
        {/* Job Mode */}
        <div className="rounded-[18px] p-5" style={{ background: "var(--bg-card)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Booking Mode</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "instant" as JobMode, icon: "⚡", name: "KaamNow", desc: "Get worker\nin < 2 min" },
              { key: "scheduled" as JobMode, icon: "📅", name: "KaamLater", desc: "Schedule\nfor later" },
              { key: "project" as JobMode, icon: "🏗️", name: "KaizyProject", desc: "Multi-day\nproject" },
            ].map(m => (
              <button key={m.key} onClick={() => setMode(m.key)}
                      className="p-3.5 rounded-[16px] text-center transition-all active:scale-95"
                      style={{
                        background: mode === m.key ? "var(--brand-tint)" : "var(--bg-surface)",
                        boxShadow: mode === m.key ? "0 0 0 2px var(--brand)" : "none",
                      }}>
                <span className="text-[24px] block">{m.icon}</span>
                <p className="text-[11px] font-bold mt-1" style={{ color: "var(--text-1)" }}>{m.name}</p>
                <p className="text-[8px] font-medium mt-0.5 whitespace-pre-line" style={{ color: "var(--text-3)" }}>{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Select Trade */}
        <div className="rounded-[18px] p-5" style={{ background: "var(--bg-card)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>What skill do you need?</p>
          <div className="grid grid-cols-5 gap-2">
            {trades.map(t => (
              <button key={t.id} onClick={() => setSelectedTrade(t.id)}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-[12px] transition-all active:scale-95"
                      style={{
                        background: selectedTrade === t.id ? "var(--brand-tint)" : "var(--bg-surface)",
                        boxShadow: selectedTrade === t.id ? "0 0 0 2px var(--brand)" : "none",
                      }}>
                <span className="text-[20px]">{t.icon}</span>
                <span className="text-[8px] font-bold" style={{ color: "var(--text-1)" }}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Describe */}
        <div className="rounded-[18px] p-5" style={{ background: "var(--bg-card)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Describe the job</p>
          <button onClick={() => setIsRecording(!isRecording)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[14px] mb-3 transition-all active:scale-[0.98]"
                  style={{
                    background: isRecording ? "var(--danger)" : "var(--brand-tint)",
                    color: isRecording ? "#fff" : "var(--brand)",
                  }}>
            <span className="text-[14px]">🎤</span>
            <span className="text-[11px] font-bold">{isRecording ? "Recording... Tap to stop" : "Describe in voice (Hindi/Tamil/English)"}</span>
          </button>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="e.g., Kitchen tap is leaking, need urgent repair..."
                    className="w-full rounded-[14px] p-3.5 text-[12px] font-medium outline-none resize-none h-20"
                    style={{ background: "var(--bg-surface)", color: "var(--text-1)" }} />
          <button className="flex items-center gap-2 mt-3 text-[10px] font-bold active:scale-95 transition-transform"
                  style={{ color: "var(--brand)" }}>
            📷 Add problem photo / video
          </button>
        </div>

        {/* Location */}
        <div className="rounded-[18px] p-5" style={{ background: "var(--bg-card)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Job Location</p>
          <button className="w-full flex items-center gap-3 rounded-[14px] p-3.5 text-left active:scale-[0.98] transition-all"
                  style={{ background: "var(--bg-surface)" }}>
            <span className="text-[16px]">📍</span>
            <div className="flex-1">
              <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{location}</p>
              <p className="text-[9px] font-bold" style={{ color: "var(--success)" }}>● GPS detected</p>
            </div>
            <span className="text-[12px]" style={{ color: "var(--text-3)" }}>→</span>
          </button>
        </div>

        {/* Schedule (KaamLater) */}
        {mode === "scheduled" && (
          <div className="rounded-[18px] p-5" style={{ background: "var(--bg-card)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>When?</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
              {dates.map(d => (
                <button key={d} onClick={() => setSelectedDate(d)}
                        className="px-4 py-2.5 rounded-[12px] text-[10px] font-bold shrink-0 transition-all active:scale-95"
                        style={{ background: selectedDate === d ? "var(--brand)" : "var(--bg-surface)", color: selectedDate === d ? "#fff" : "var(--text-2)" }}>
                  {d}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {times.map(t => (
                <button key={t} onClick={() => setSelectedTime(t)}
                        className="px-3 py-2 rounded-[10px] text-[9px] font-bold shrink-0 transition-all active:scale-95"
                        style={{ background: selectedTime === t ? "var(--brand)" : "var(--bg-surface)", color: selectedTime === t ? "#fff" : "var(--text-2)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Duration (KaizyProject) */}
        {mode === "project" && (
          <div className="rounded-[18px] p-5" style={{ background: "var(--bg-card)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Project Duration</p>
            <div className="flex gap-2 flex-wrap">
              {durations.map(d => (
                <button key={d} onClick={() => setDuration(d)}
                        className="px-4 py-2.5 rounded-[12px] text-[10px] font-bold transition-all active:scale-95"
                        style={{ background: duration === d ? "var(--brand)" : "var(--bg-surface)", color: duration === d ? "#fff" : "var(--text-2)" }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Budget */}
        <div className="rounded-[18px] p-5" style={{ background: "var(--bg-card)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Budget (optional)</p>
          <div className="flex items-center gap-2 rounded-[14px] px-4 py-3" style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">₹</span>
            <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
                   placeholder="Enter your budget"
                   className="flex-1 bg-transparent text-[13px] font-bold outline-none"
                   style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }} />
          </div>
          <p className="text-[8px] font-medium mt-2" style={{ color: "var(--text-3)" }}>
            Avg rate for {trades.find(t => t.id === selectedTrade)?.name || "services"}: ₹400-800/hr
          </p>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 z-50"
           style={{ background: "var(--bg-app)", boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
        <button onClick={() => setIsPosted(true)} disabled={!selectedTrade}
                className="w-full rounded-[16px] py-4 text-[13px] font-black text-white active:scale-[0.97] transition-transform disabled:opacity-40"
                style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
          {mode === "instant" ? "⚡ Find Worker Now" : mode === "scheduled" ? "📅 Post Scheduled Job" : "🏗️ Post Project"}
        </button>
      </div>
    </div>
  );
}
