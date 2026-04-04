"use client";

import { useState } from "react";

// ============================================================
// PRICE BREAKDOWN — CRED-style transparent pricing
// Bible HIRER-01: "Never surprise a hirer. Show everything upfront."
// Shows: Base + Distance + Platform fee + Insurance = Total
// ============================================================

interface PriceBreakdownProps {
  trade: string;
  basePriceRange: [number, number];
  distanceKm: number;
  isEmergency: boolean;
  isNight: boolean;
  onConfirm?: (total: number) => void;
}

export default function PriceBreakdown({
  trade = "electrician",
  basePriceRange = [400, 600],
  distanceKm = 2,
  isEmergency = false,
  isNight = false,
  onConfirm,
}: PriceBreakdownProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const basePrice = Math.round((basePriceRange[0] + basePriceRange[1]) / 2);
  const distanceCharge = Math.max(0, Math.round((distanceKm - 1) * 10)); // ₹10/km after 1km
  const subtotal = basePrice + distanceCharge;

  // Surcharges
  const nightCharge = isNight ? Math.round(subtotal * 0.5) : 0;
  const emergencyCharge = isEmergency ? Math.round(subtotal * 0.8) : 0;
  const afterSurcharge = subtotal + nightCharge + emergencyCharge;

  // Platform fees
  const platformFee = Math.round(afterSurcharge * 0.1); // 10%
  const insurance = 5; // ₹5 fixed

  const total = afterSurcharge + platformFee + insurance;

  const tooltips: Record<string, string> = {
    platform: "Platform fee covers worker verification, live tracking, dispute resolution, and 24/7 support. It keeps workers verified and your booking safe.",
    insurance: "Job insurance covers accidental damage up to ₹10,000 during the service. Powered by ACKO Insurance.",
    night: "Night charge applies between 9 PM and 7 AM due to higher operational costs.",
    emergency: "Emergency surcharge applies for urgent requests (SOS). Workers prioritize your job and arrive faster.",
  };

  return (
    <div className="rounded-[20px] overflow-hidden" style={{ background: "var(--bg-card)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          Price Breakdown
        </p>
        <p className="text-[9px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>
          {trade.replace("_", " ")} service · {distanceKm} km
        </p>
      </div>

      {/* Line items */}
      <div className="px-4 space-y-0">
        {/* Base charge */}
        <div className="flex justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-1)" }}>
          <span className="text-[12px] font-medium" style={{ color: "var(--text-2)" }}>Base charge</span>
          <span className="text-[12px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{basePrice}
          </span>
        </div>

        {/* Distance */}
        {distanceCharge > 0 && (
          <div className="flex justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-1)" }}>
            <span className="text-[12px] font-medium" style={{ color: "var(--text-2)" }}>
              Distance ({distanceKm} km)
            </span>
            <span className="text-[12px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
              ₹{distanceCharge}
            </span>
          </div>
        )}

        {/* Night surcharge */}
        {nightCharge > 0 && (
          <div className="py-2.5" style={{ borderBottom: "1px solid var(--border-1)" }}>
            <div className="flex justify-between items-center">
              <button onClick={() => setExpanded(expanded === "night" ? null : "night")}
                      className="text-[12px] font-medium flex items-center gap-1" style={{ color: "var(--warning)" }}>
                🌙 Night charge (+50%)
                <span className="text-[8px]">{expanded === "night" ? "▲" : "▼"}</span>
              </button>
              <span className="text-[12px] font-bold" style={{ color: "var(--warning)", fontFamily: "'JetBrains Mono', monospace" }}>
                +₹{nightCharge}
              </span>
            </div>
            {expanded === "night" && (
              <p className="text-[9px] font-medium mt-1.5 leading-relaxed anim-up" style={{ color: "var(--text-3)" }}>
                {tooltips.night}
              </p>
            )}
          </div>
        )}

        {/* Emergency surcharge */}
        {emergencyCharge > 0 && (
          <div className="py-2.5" style={{ borderBottom: "1px solid var(--border-1)" }}>
            <div className="flex justify-between items-center">
              <button onClick={() => setExpanded(expanded === "emergency" ? null : "emergency")}
                      className="text-[12px] font-medium flex items-center gap-1" style={{ color: "var(--danger)" }}>
                🆘 Emergency (+80%)
                <span className="text-[8px]">{expanded === "emergency" ? "▲" : "▼"}</span>
              </button>
              <span className="text-[12px] font-bold" style={{ color: "var(--danger)", fontFamily: "'JetBrains Mono', monospace" }}>
                +₹{emergencyCharge}
              </span>
            </div>
            {expanded === "emergency" && (
              <p className="text-[9px] font-medium mt-1.5 leading-relaxed anim-up" style={{ color: "var(--text-3)" }}>
                {tooltips.emergency}
              </p>
            )}
          </div>
        )}

        {/* Platform fee */}
        <div className="py-2.5" style={{ borderBottom: "1px solid var(--border-1)" }}>
          <div className="flex justify-between items-center">
            <button onClick={() => setExpanded(expanded === "platform" ? null : "platform")}
                    className="text-[12px] font-medium flex items-center gap-1" style={{ color: "var(--text-2)" }}>
              Platform fee (10%)
              <span className="text-[8px] rounded-full px-1" style={{ background: "var(--bg-surface)", color: "var(--text-3)" }}>?</span>
            </button>
            <span className="text-[12px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
              ₹{platformFee}
            </span>
          </div>
          {expanded === "platform" && (
            <p className="text-[9px] font-medium mt-1.5 leading-relaxed anim-up" style={{ color: "var(--text-3)" }}>
              {tooltips.platform}
            </p>
          )}
        </div>

        {/* Insurance */}
        <div className="py-2.5" style={{ borderBottom: "1px solid var(--border-1)" }}>
          <div className="flex justify-between items-center">
            <button onClick={() => setExpanded(expanded === "insurance" ? null : "insurance")}
                    className="text-[12px] font-medium flex items-center gap-1" style={{ color: "var(--text-2)" }}>
              Job insurance
              <span className="text-[8px] rounded-full px-1" style={{ background: "var(--bg-surface)", color: "var(--text-3)" }}>?</span>
            </button>
            <span className="text-[12px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
              ₹{insurance}
            </span>
          </div>
          {expanded === "insurance" && (
            <p className="text-[9px] font-medium mt-1.5 leading-relaxed anim-up" style={{ color: "var(--text-3)" }}>
              {tooltips.insurance}
            </p>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between py-3">
          <span className="text-[14px] font-black" style={{ color: "var(--text-1)" }}>Total</span>
          <span className="text-[18px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{total}
          </span>
        </div>
      </div>

      {/* Fair price indicator */}
      <div className="px-4 pb-3">
        <div className="rounded-[12px] p-2.5 flex items-center gap-2" style={{ background: "var(--success-tint)" }}>
          <span className="text-[12px]">✅</span>
          <p className="text-[9px] font-bold" style={{ color: "var(--success)" }}>
            Fair price · Market rate: ₹{basePriceRange[0]}–₹{basePriceRange[1]} for this service
          </p>
        </div>
      </div>

      {/* Surcharge badges */}
      {(isNight || isEmergency) && (
        <div className="px-4 pb-3 flex gap-2">
          {isNight && (
            <span className="text-[8px] font-bold px-2 py-1 rounded-full"
                  style={{ background: "var(--warning-tint)", color: "var(--warning)" }}>
              🌙 Night +50%
            </span>
          )}
          {isEmergency && (
            <span className="text-[8px] font-bold px-2 py-1 rounded-full"
                  style={{ background: "var(--danger-tint)", color: "var(--danger)" }}>
              🆘 Emergency +80%
            </span>
          )}
        </div>
      )}

      {/* Confirm button */}
      {onConfirm && (
        <div className="px-4 pb-4">
          <button onClick={() => onConfirm(total)}
                  className="w-full rounded-[14px] py-3.5 text-[13px] font-bold text-white active:scale-[0.97] transition-transform"
                  style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
            Confirm · ₹{total} →
          </button>
        </div>
      )}
    </div>
  );
}
