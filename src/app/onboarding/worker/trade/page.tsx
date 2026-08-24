"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// WORKER ONBOARDING — SCREEN 2: TRADE & SUB-SKILLS SELECTION
// 2×4 icon grid · Expandable sub-skills chips · Secondary trades
// ============================================================

export interface TradeDef {
  key: string;
  name: string;
  icon: string;
  subSkills: { key: string; label: string; min: number; max: number }[];
}

export const TRADES: TradeDef[] = [
  {
    key: "electrician",
    name: "Electrician",
    icon: "⚡",
    subSkills: [
      { key: "fan_repair", label: "Fan / Light repair", min: 150, max: 300 },
      { key: "mcb_repair", label: "MCB / Switchboard", min: 200, max: 400 },
      { key: "wiring_fault", label: "Wiring fault", min: 300, max: 700 },
      { key: "full_wiring", label: "Full wiring", min: 1200, max: 3500 },
      { key: "ac_electrical", label: "AC electrical", min: 400, max: 900 },
      { key: "inverter", label: "Inverter / Battery", min: 500, max: 1000 },
      { key: "cctv_smart", label: "CCTV / Smart home", min: 600, max: 1500 },
    ],
  },
  {
    key: "plumber",
    name: "Plumber",
    icon: "🔧",
    subSkills: [
      { key: "tap_repair", label: "Tap repair", min: 150, max: 300 },
      { key: "pipe_leak", label: "Pipe leak", min: 250, max: 600 },
      { key: "drain_block", label: "Drain cleaning", min: 200, max: 500 },
      { key: "toilet_repair", label: "Toilet repair", min: 300, max: 700 },
      { key: "water_motor", label: "Water motor", min: 400, max: 900 },
      { key: "pipe_burst", label: "Pipe burst (emergency)", min: 500, max: 1200 },
    ],
  },
  {
    key: "mechanic",
    name: "Mechanic",
    icon: "🚗",
    subSkills: [
      { key: "puncture_bike", label: "Puncture (bike)", min: 80, max: 150 },
      { key: "puncture_car", label: "Puncture (car)", min: 150, max: 280 },
      { key: "puncture_truck", label: "Puncture (truck)", min: 250, max: 500 },
      { key: "battery_jump", label: "Battery jumpstart", min: 250, max: 400 },
      { key: "engine_stall", label: "Engine stall", min: 500, max: 1200 },
      { key: "car_towing", label: "Car towing", min: 600, max: 1500 },
      { key: "brake_issue", label: "Brake issue", min: 300, max: 700 },
    ],
  },
  {
    key: "ac_repair",
    name: "AC Repair",
    icon: "❄️",
    subSkills: [
      { key: "not_cooling", label: "Not cooling", min: 350, max: 800 },
      { key: "gas_refill", label: "Gas refill", min: 700, max: 1400 },
      { key: "cleaning", label: "Cleaning", min: 300, max: 600 },
      { key: "installation", label: "Installation", min: 800, max: 1800 },
      { key: "pcb_repair", label: "PCB repair", min: 900, max: 2200 },
    ],
  },
  {
    key: "carpenter",
    name: "Carpenter",
    icon: "🪚",
    subSkills: [
      { key: "door_window", label: "Door / Window", min: 250, max: 600 },
      { key: "furniture_repair", label: "Furniture repair", min: 300, max: 800 },
      { key: "lock_hardware", label: "Lock / Hardware", min: 200, max: 500 },
    ],
  },
  {
    key: "painter",
    name: "Painter",
    icon: "🎨",
    subSkills: [
      { key: "room_painting", label: "Room painting", min: 1500, max: 4000 },
      { key: "wall_patch", label: "Wall patch", min: 300, max: 700 },
      { key: "waterproofing_paint", label: "Waterproofing", min: 1200, max: 3000 },
    ],
  },
  {
    key: "mason",
    name: "Mason",
    icon: "⚒️",
    subSkills: [
      { key: "tile_repair", label: "Tile repair", min: 400, max: 1000 },
      { key: "waterproofing_mason", label: "Waterproofing", min: 800, max: 2000 },
      { key: "concrete_work", label: "Concrete work", min: 600, max: 1800 },
    ],
  },
  {
    key: "locksmith",
    name: "Locksmith",
    icon: "🔒",
    subSkills: [
      { key: "door_lock", label: "Door lock", min: 200, max: 500 },
      { key: "padlock", label: "Padlock", min: 150, max: 350 },
      { key: "digital_lock", label: "Digital lock", min: 500, max: 1200 },
    ],
  },
];

export default function WorkerTradeOnboardingPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [selectedTrade, setSelectedTrade] = useState<string>("electrician");
  const [selectedSubSkills, setSelectedSubSkills] = useState<Set<string>>(new Set(["fan_repair", "mcb_repair"]));
  const [secondaryTrades, setSecondaryTrades] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentTradeDef = TRADES.find(t => t.key === selectedTrade) || TRADES[0];

  const handleSelectTrade = (tradeKey: string) => {
    setSelectedTrade(tradeKey);
    // Clear previously selected sub-skills for previous trade
    setSelectedSubSkills(new Set());
    setError("");
  };

  const toggleSubSkill = (skillKey: string) => {
    const next = new Set(selectedSubSkills);
    if (next.has(skillKey)) {
      next.delete(skillKey);
    } else {
      next.add(skillKey);
    }
    setSelectedSubSkills(next);
    setError("");
  };

  const toggleSecondaryTrade = (tradeKey: string) => {
    const next = new Set(secondaryTrades);
    if (next.has(tradeKey)) {
      next.delete(tradeKey);
    } else {
      next.add(tradeKey);
    }
    setSecondaryTrades(next);
  };

  const handleContinue = async () => {
    if (selectedSubSkills.size === 0) {
      setError("Please select at least 1 sub-skill you can service");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const subSkillsArray = Array.from(selectedSubSkills);
      const secondaryArray = Array.from(secondaryTrades);

      try {
        localStorage.setItem("kaizy_worker_trade", selectedTrade);
        localStorage.setItem("kaizy_worker_subskills", JSON.stringify(subSkillsArray));
        localStorage.setItem("kaizy_worker_secondary_trades", JSON.stringify(secondaryArray));
      } catch {}

      // Update worker_profiles
      await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_services: subSkillsArray,
        }),
      });

      router.push("/onboarding/worker/pricing");
    } catch {
      router.push("/onboarding/worker/pricing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-6 pt-10 pb-8" style={{ background: isDark ? "var(--bg-app)" : "#FFFFFF" }}>
      <div>
        {/* ── Progress: Step 2 of 6 ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${i <= 2 ? "w-6 bg-[#FF6B00]" : "w-2 bg-gray-300 dark:bg-gray-700"}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-[#FF6B00]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            STEP 2 / 6
          </span>
        </div>

        {/* ── Title ── */}
        <h1 className="text-[22px] font-black tracking-tight mb-1" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
          What is your main trade?
        </h1>
        <p className="text-[12px] font-medium leading-relaxed mb-5" style={{ color: "var(--text-3)" }}>
          Choose your primary specialty to receive targeted high-ticket bookings.
        </p>

        {/* ── 2x4 Icon Grid ── */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {TRADES.map(t => {
            const isSelected = selectedTrade === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleSelectTrade(t.key)}
                className="flex flex-col items-center justify-center p-3 rounded-[16px] active:scale-95 transition-all"
                style={{
                  background: isSelected
                    ? isDark
                      ? "rgba(255,107,0,0.18)"
                      : "rgba(255,107,0,0.1)"
                    : "var(--bg-surface)",
                  border: `2px solid ${isSelected ? "var(--brand)" : "transparent"}`,
                  boxShadow: isSelected ? "0 0 0 3px rgba(255,107,0,0.1)" : "none",
                }}
              >
                <span className="text-[26px] mb-1">{t.icon}</span>
                <span className="text-[10px] font-bold text-center truncate w-full" style={{ color: isSelected ? "var(--brand)" : "var(--text-1)" }}>
                  {t.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Sub-skills Section (Expands on Trade Selection) ── */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2.5">
            <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--text-2)" }}>
              {currentTradeDef.name} Sub-Skills <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] font-bold text-[#FF6B00]">
              {selectedSubSkills.size} selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentTradeDef.subSkills.map(skill => {
              const isChecked = selectedSubSkills.has(skill.key);
              return (
                <button
                  key={skill.key}
                  type="button"
                  onClick={() => toggleSubSkill(skill.key)}
                  className="px-3.5 py-2 rounded-full text-[12px] font-bold active:scale-95 transition-all flex items-center gap-1.5"
                  style={{
                    background: isChecked
                      ? "var(--brand)"
                      : "var(--bg-surface)",
                    color: isChecked ? "#FFFFFF" : "var(--text-2)",
                    border: `1.5px solid ${isChecked ? "var(--brand)" : "var(--border-2)"}`,
                    boxShadow: isChecked ? "0 2px 8px rgba(255,107,0,0.25)" : "none",
                  }}
                >
                  <span>{isChecked ? "✓" : "+"}</span>
                  <span>{skill.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Secondary Trades (Optional) ── */}
        <div className="mb-4">
          <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: "var(--text-3)" }}>
            Can you also do other trades? (Optional)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TRADES.filter(t => t.key !== selectedTrade).map(t => {
              const isChecked = secondaryTrades.has(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => toggleSecondaryTrade(t.key)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium active:scale-95 transition-all flex items-center gap-1"
                  style={{
                    background: isChecked ? "var(--bg-elevated)" : "var(--bg-lowest)",
                    color: isChecked ? "var(--brand)" : "var(--text-3)",
                    border: `1px solid ${isChecked ? "var(--brand)" : "var(--border-2)"}`,
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-[11px] font-bold text-red-500 mt-2">{error}</p>}
      </div>

      {/* ── Continue Button ── */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading || selectedSubSkills.size === 0}
          className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all shadow-md"
          style={{
            background: selectedSubSkills.size > 0 ? "var(--gradient-cta)" : "var(--bg-elevated)",
            color: selectedSubSkills.size > 0 ? "#FFFFFF" : "var(--text-3)",
            boxShadow: selectedSubSkills.size > 0 ? "var(--shadow-brand)" : "none",
          }}
        >
          {loading ? "Saving Trades..." : "Set Your Pricing →"}
        </button>
      </div>
    </div>
  );
}
