"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { TRADES, TradeDef } from "../trade/page";

// ============================================================
// WORKER ONBOARDING — SCREEN 3: DYNAMIC PRICING TABLE
// Min/Max bound checks (0.70x to 1.30x) · Charge Type Selection
// ============================================================

interface PriceRow {
  problem_type: string;
  display_name: string;
  price_min: number;
  price_max: number;
  market_min: number;
  market_max: number;
  error?: string;
}

export default function WorkerPricingOnboardingPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [trade, setTrade] = useState<string>("electrician");
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [chargeType, setChargeType] = useState<"per_job" | "per_hour" | "both">("per_job");
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    let savedTrade = "electrician";
    let savedSubSkills: string[] = [];

    try {
      const t = localStorage.getItem("kaizy_worker_trade");
      const s = localStorage.getItem("kaizy_worker_subskills");
      if (t) savedTrade = t;
      if (s) savedSubSkills = JSON.parse(s);
    } catch {}

    setTrade(savedTrade);
    const tradeDef = TRADES.find(t => t.key === savedTrade) || TRADES[0];

    const selectedSkills = tradeDef.subSkills.filter(
      skill => savedSubSkills.length === 0 || savedSubSkills.includes(skill.key)
    );

    const initialRows: PriceRow[] = (selectedSkills.length > 0 ? selectedSkills : tradeDef.subSkills.slice(0, 3)).map(
      skill => ({
        problem_type: skill.key,
        display_name: skill.label,
        price_min: skill.min,
        price_max: skill.max,
        market_min: skill.min,
        market_max: skill.max,
      })
    );

    setRows(initialRows);
  }, []);

  const handlePriceChange = (index: number, field: "price_min" | "price_max", valStr: string) => {
    const val = parseInt(valStr.replace(/\D/g, "") || "0", 10);
    const next = [...rows];
    next[index][field] = val;

    // Validate bounds
    const row = next[index];
    const allowedMin = Math.floor(row.market_min * 0.70);
    const allowedMax = Math.ceil(row.market_max * 1.30);

    if (row.price_min < allowedMin) {
      row.error = `Min cannot be below ₹${allowedMin}`;
    } else if (row.price_max > allowedMax) {
      row.error = `Max cannot exceed ₹${allowedMax}`;
    } else if (row.price_min >= row.price_max) {
      row.error = "Min must be less than Max";
    } else {
      row.error = undefined;
    }

    setRows(next);
    setGlobalError("");
  };

  const handleSavePrices = async () => {
    // Validate all rows
    let hasError = false;
    const validated = rows.map(r => {
      const allowedMin = Math.floor(r.market_min * 0.70);
      const allowedMax = Math.ceil(r.market_max * 1.30);
      let error: string | undefined;

      if (r.price_min < allowedMin) {
        error = `Min must be ≥ ₹${allowedMin}`;
        hasError = true;
      } else if (r.price_max > allowedMax) {
        error = `Max must be ≤ ₹${allowedMax}`;
        hasError = true;
      } else if (r.price_min >= r.price_max) {
        error = "Min must be < Max";
        hasError = true;
      }

      return { ...r, error };
    });

    if (hasError) {
      setRows(validated);
      setGlobalError("Please resolve price validation errors above");
      return;
    }

    setLoading(true);
    setGlobalError("");

    try {
      try {
        localStorage.setItem("kaizy_worker_pricing_rows", JSON.stringify(rows));
        localStorage.setItem("kaizy_worker_charge_type", chargeType);
      } catch {}

      // Batch save to backend
      await fetch("/api/workers/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade,
          services: rows.map(r => ({
            problem_type: r.problem_type,
            price_min: r.price_min,
            price_max: r.price_max,
          })),
        }),
      });

      router.push("/onboarding/worker/verification");
    } catch {
      router.push("/onboarding/worker/verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-6 pt-10 pb-8" style={{ background: isDark ? "var(--bg-app)" : "#FFFFFF" }}>
      <div>
        {/* ── Progress: Step 3 of 6 ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${i <= 3 ? "w-6 bg-[#FF6B00]" : "w-2 bg-gray-300 dark:bg-gray-700"}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-[#FF6B00]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            STEP 3 / 6
          </span>
        </div>

        {/* ── Title ── */}
        <h1 className="text-[22px] font-black tracking-tight mb-1" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
          Set your prices
        </h1>
        <p className="text-[12px] font-medium leading-relaxed mb-6" style={{ color: "var(--text-3)" }}>
          Hirers see these estimated rates before booking. You receive 100% of the agreed amount.
        </p>

        {/* ── Dynamic Pricing Table ── */}
        <div className="space-y-3 mb-6">
          {rows.map((row, idx) => (
            <div
              key={row.problem_type}
              className="rounded-[18px] p-4 transition-all"
              style={{
                background: "var(--bg-surface)",
                border: `1.5px solid ${row.error ? "var(--danger)" : "var(--border-2)"}`,
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-[13px] font-extrabold truncate" style={{ color: "var(--text-1)" }}>
                  {row.display_name}
                </p>
                <p className="text-[10px] font-semibold text-gray-400">
                  Market: ₹{row.market_min}–₹{row.market_max}
                </p>
              </div>

              {/* Price Inputs */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center rounded-[12px] px-3 py-2 bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-800">
                  <span className="text-[12px] font-bold text-gray-400 mr-1">₹</span>
                  <input
                    type="tel"
                    value={row.price_min}
                    onChange={e => handlePriceChange(idx, "price_min", e.target.value)}
                    className="w-full text-[14px] font-bold outline-none bg-transparent"
                    style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}
                    placeholder="Min"
                  />
                </div>

                <span className="text-[12px] font-bold text-gray-400">—</span>

                <div className="flex-1 flex items-center rounded-[12px] px-3 py-2 bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-800">
                  <span className="text-[12px] font-bold text-gray-400 mr-1">₹</span>
                  <input
                    type="tel"
                    value={row.price_max}
                    onChange={e => handlePriceChange(idx, "price_max", e.target.value)}
                    className="w-full text-[14px] font-bold outline-none bg-transparent"
                    style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}
                    placeholder="Max"
                  />
                </div>
              </div>

              {row.error && (
                <p className="text-[10px] font-bold text-red-500 mt-1.5">{row.error}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Charge Type Selection ── */}
        <div className="mb-4">
          <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: "var(--text-2)" }}>
            How do you prefer to charge?
          </label>
          <div className="space-y-2">
            {[
              { id: "per_job", title: "Per job (quoted after seeing problem)", badge: "Recommended" },
              { id: "per_hour", title: "Per hour (₹X/hr regardless of work)" },
              { id: "both", title: "Both (I decide per job)" },
            ].map(opt => (
              <label
                key={opt.id}
                onClick={() => setChargeType(opt.id as "per_job" | "per_hour" | "both")}
                className="flex items-center justify-between p-3 rounded-[14px] cursor-pointer transition-all active:scale-[0.99]"
                style={{
                  background: chargeType === opt.id ? "rgba(255,107,0,0.08)" : "var(--bg-lowest)",
                  border: `1.5px solid ${chargeType === opt.id ? "var(--brand)" : "var(--border-2)"}`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: chargeType === opt.id ? "var(--brand)" : "var(--text-3)" }}
                  >
                    {chargeType === opt.id && <div className="w-2 h-2 rounded-full bg-[#FF6B00]" />}
                  </div>
                  <span className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>
                    {opt.title}
                  </span>
                </div>
                {opt.badge && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B00]/10 text-[#FF6B00]">
                    {opt.badge}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {globalError && <p className="text-[11px] font-bold text-red-500 mt-2">{globalError}</p>}
      </div>

      {/* ── Continue Button ── */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleSavePrices}
          disabled={loading || rows.length === 0}
          className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all shadow-md"
          style={{
            background: "var(--gradient-cta)",
            color: "#FFFFFF",
            boxShadow: "var(--shadow-brand)",
          }}
        >
          {loading ? "Saving Prices..." : "Set My Prices & Verify ID →"}
        </button>
      </div>
    </div>
  );
}
