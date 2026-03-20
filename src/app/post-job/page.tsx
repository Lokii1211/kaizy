"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Clock, IndianRupee, Camera, Mic,
  Zap, Calendar, Building2, ChevronRight, Check, Star,
  Search, BadgeCheck, ArrowRight,
} from "lucide-react";

// ============================================================
// Kaizy — Post a Job (Bible §P1.1 Layer 2)
// KaamNow / KaamLater / KaizyProject modes
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
  const [selectedDate, setSelectedDate] = useState("Tomorrow");
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [duration, setDuration] = useState("1 day");
  const [isPosted, setIsPosted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const dates = ["Today", "Tomorrow", "Wed 19", "Thu 20", "Fri 21", "Sat 22", "Sun 23"];
  const times = ["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "2 PM", "3 PM", "4 PM", "5 PM"];
  const durations = ["1 day", "2 days", "3 days", "1 week", "2 weeks", "1 month", "Custom"];

  if (isPosted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8">
        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-5 shadow-xl shadow-green-500/30 animate-scale-in">
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </div>
        <h1 className="text-[24px] font-black text-gray-900 text-center animate-slide-up">Job Posted! 🚀</h1>
        <p className="text-[14px] text-gray-400 mt-2 text-center animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {mode === "instant" ? "Finding workers near you..." : "Your job has been posted. Workers will respond shortly."}
        </p>

        <div className="w-full bg-gray-50 rounded-2xl p-5 mt-6 border border-gray-100 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[13px] text-gray-400">Trade</span>
              <span className="text-[13px] font-bold text-gray-900">{trades.find(t => t.id === selectedTrade)?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-gray-400">Mode</span>
              <span className="text-[13px] font-bold text-[#FF6B2C]">
                {mode === "instant" ? "⚡ KaamNow" : mode === "scheduled" ? "📅 KaamLater" : "🏗️ KaizyProject"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-gray-400">Location</span>
              <span className="text-[13px] font-bold text-gray-900">{location}</span>
            </div>
            {budget && (
              <div className="flex justify-between">
                <span className="text-[13px] text-gray-400">Budget</span>
                <span className="text-[13px] font-bold text-gray-900">₹{budget}</span>
              </div>
            )}
          </div>
        </div>

        {mode === "instant" && (
          <div className="w-full mt-4 bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="w-5 h-5 border-2 border-[#FF6B2C] border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-[12px] text-orange-700 font-semibold">Matching you with the nearest available worker...</p>
          </div>
        )}

        <div className="w-full mt-6 space-y-3">
          <Link href="/marketplace" className="w-full bg-gradient-to-r from-[#FF6B2C] to-[#E55A1B] text-white rounded-2xl py-4 text-[15px] font-black flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-transform">
            {mode === "instant" ? "View Matching Workers" : "View Responses"} <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/" className="w-full text-center block py-3 text-[13px] font-semibold text-gray-400">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft className="w-4.5 h-4.5 text-gray-700" />
          </Link>
          <h1 className="text-[18px] font-black text-gray-900">Post a Job</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Job Mode — Bible: KaamNow / KaamLater / KaizyProject */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[14px] font-black text-gray-900 mb-3">Booking Mode</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "instant" as JobMode, icon: "⚡", name: "KaamNow", desc: "Get worker\nin < 2 min", color: "#FF6B2C" },
              { key: "scheduled" as JobMode, icon: "📅", name: "KaamLater", desc: "Schedule\nfor later", color: "#3B82F6" },
              { key: "project" as JobMode, icon: "🏗️", name: "KaizyProject", desc: "Multi-day\nproject", color: "#8B5CF6" },
            ].map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`p-3.5 rounded-2xl text-center transition-all active:scale-95 border-2 ${
                  mode === m.key
                    ? "border-[#FF6B2C] bg-orange-50 shadow-md shadow-orange-500/10"
                    : "border-gray-100 bg-white"
                }`}
              >
                <span className="text-[24px] block">{m.icon}</span>
                <p className="text-[12px] font-black text-gray-900 mt-1">{m.name}</p>
                <p className="text-[9px] text-gray-400 mt-0.5 whitespace-pre-line leading-tight">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Select Trade */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[14px] font-black text-gray-900 mb-3">What skill do you need?</p>
          <div className="grid grid-cols-5 gap-2">
            {trades.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTrade(t.id)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all active:scale-95 ${
                  selectedTrade === t.id
                    ? "bg-[#FF6B2C]/10 ring-2 ring-[#FF6B2C]"
                    : "bg-gray-50"
                }`}
              >
                <span className="text-[20px]">{t.icon}</span>
                <span className="text-[9px] font-bold text-gray-700">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Describe the problem — Bible: Voice + Text */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[14px] font-black text-gray-900 mb-3">Describe the job</p>

          {/* Voice button */}
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl mb-3 transition-all active:scale-[0.98] ${
              isRecording
                ? "bg-red-500 text-white shadow-xl shadow-red-500/30 animate-pulse"
                : "bg-orange-50 text-[#FF6B2C] border border-orange-100"
            }`}
          >
            <Mic className="w-5 h-5" />
            <span className="text-[13px] font-bold">{isRecording ? "Recording... Tap to stop" : "Describe in voice (Hindi/Tamil/English)"}</span>
          </button>

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g., Kitchen tap is leaking, need urgent repair..."
            className="w-full bg-gray-50 rounded-xl p-3.5 text-[13px] text-gray-700 placeholder-gray-400 border border-gray-100 focus:border-[#FF6B2C] focus:ring-1 focus:ring-[#FF6B2C]/20 outline-none resize-none h-20 transition-all"
          />

          {/* Add photo */}
          <button className="flex items-center gap-2 mt-3 text-[12px] text-[#FF6B2C] font-bold active:scale-95 transition-transform">
            <Camera className="w-4 h-4" /> Add problem photo / video
          </button>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[14px] font-black text-gray-900 mb-3">Job Location</p>
          <button className="w-full flex items-center gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-100 active:bg-gray-100 transition-colors text-left">
            <MapPin className="w-5 h-5 text-[#FF6B2C] shrink-0" />
            <div className="flex-1">
              <p className="text-[13px] font-bold text-gray-900">{location}</p>
              <p className="text-[10px] text-green-600 font-semibold">● GPS detected</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Schedule (for KaamLater) */}
        {mode === "scheduled" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm animate-slide-up">
            <p className="text-[14px] font-black text-gray-900 mb-3">When?</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
              {dates.map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`px-4 py-2.5 rounded-xl text-[12px] font-bold shrink-0 transition-all active:scale-95 ${
                    selectedDate === d ? "bg-[#FF6B2C] text-white shadow-md" : "bg-gray-50 text-gray-600"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {times.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`px-3 py-2 rounded-lg text-[11px] font-bold shrink-0 transition-all active:scale-95 ${
                    selectedTime === t ? "bg-[#FF6B2C] text-white" : "bg-gray-50 text-gray-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Duration (for KaizyProject) */}
        {mode === "project" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm animate-slide-up">
            <p className="text-[14px] font-black text-gray-900 mb-3">Project Duration</p>
            <div className="flex gap-2 flex-wrap">
              {durations.map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-95 ${
                    duration === d ? "bg-[#FF6B2C] text-white shadow-md" : "bg-gray-50 text-gray-600"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Budget */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[14px] font-black text-gray-900 mb-3">Budget (optional)</p>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 focus-within:border-[#FF6B2C] focus-within:ring-1 focus-within:ring-[#FF6B2C]/20 transition-all">
            <IndianRupee className="w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="Enter your budget"
              className="flex-1 bg-transparent text-[14px] font-semibold text-gray-900 placeholder-gray-400 outline-none"
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Avg rate for {trades.find(t => t.id === selectedTrade)?.name || "services"} in Coimbatore: ₹400-800/hr</p>
        </div>
      </div>

      {/* Sticky Post Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 z-50">
        <button
          onClick={() => setIsPosted(true)}
          disabled={!selectedTrade}
          className="w-full bg-gradient-to-r from-[#FF6B2C] to-[#E55A1B] text-white rounded-2xl py-4 text-[15px] font-black flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:shadow-none"
        >
          {mode === "instant" ? "⚡ Find Worker Now" : mode === "scheduled" ? "📅 Post Scheduled Job" : "🏗️ Post Project"}
        </button>
      </div>
    </div>
  );
}
