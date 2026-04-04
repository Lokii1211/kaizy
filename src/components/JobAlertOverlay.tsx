"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================
// JOB ALERT v11.0 — Full-screen worker job notification
// Reference: Rapido captain full-screen alert
// 45-second countdown · Accept/Decline · Voice readout
// The most critical moment in the entire app
// ============================================================

export interface JobAlert {
  id: string;
  trade: string;
  tradeIcon: string;
  problem: string;
  distance: number;
  eta: number;
  earnings: number;
  hirerRating: number;
  hirerName: string;
  duration: string;
  isEmergency: boolean;
  address: string;
}

interface JobAlertOverlayProps {
  alert: JobAlert;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export default function JobAlertOverlay({ alert, onAccept, onDecline }: JobAlertOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(45);
  const [declining, setDeclining] = useState(false);

  // 45-second countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      onDecline(alert.id);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, alert.id, onDecline]);

  // Vibration pattern: long-short-short
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }, []);

  const handleDecline = useCallback(() => setDeclining(true), []);

  const confirmDecline = () => onDecline(alert.id);

  const urgencyMultiplier = alert.isEmergency ? 1.8 : 1;
  const displayEarnings = Math.round(alert.earnings * urgencyMultiplier);
  const progress = (timeLeft / 45) * 100;

  const declineReasons = ["Too far away", "Currently busy", "Don't have tools", "Taking a break", "Other"];

  if (declining) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end" style={{ background: "rgba(0,0,0,0.85)" }}>
        <div className="w-full rounded-t-[28px] p-6 anim-up" style={{ background: "var(--bg-card)" }}>
          <h3 className="text-[16px] font-black mb-4" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Why are you declining?
          </h3>
          <div className="space-y-2 mb-4">
            {declineReasons.map(reason => (
              <button key={reason} onClick={confirmDecline}
                      className="w-full text-left rounded-[14px] p-3.5 text-[12px] font-bold active:scale-[0.98] transition-transform"
                      style={{ background: "var(--bg-surface)", color: "var(--text-1)" }}>
                {reason}
              </button>
            ))}
          </div>
          <button onClick={() => setDeclining(false)}
                  className="w-full rounded-[14px] py-3 text-[12px] font-bold"
                  style={{ background: "var(--bg-surface)", color: "var(--text-3)" }}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "#0A0A0A" }}>
      {/* Countdown bar */}
      <div className="w-full h-1" style={{ background: "var(--bg-elevated)" }}>
        <div className="h-full rounded-r-full transition-all"
             style={{ width: `${progress}%`, background: timeLeft <= 10 ? "var(--danger)" : "var(--brand)", transition: "width 1s linear" }} />
      </div>

      {/* Timer */}
      <div className="text-center pt-6 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
           style={{ color: timeLeft <= 10 ? "var(--danger)" : "var(--text-3)" }}>
          {alert.isEmergency ? "🆘 EMERGENCY JOB ALERT" : "NEW JOB ALERT"}
        </p>
        <p className="text-[48px] font-black"
           style={{ color: timeLeft <= 10 ? "var(--danger)" : "var(--brand)", fontFamily: "'JetBrains Mono', monospace",
                    animation: timeLeft <= 10 ? "live-blink 1s ease-in-out infinite" : "none" }}>
          {timeLeft}<span className="text-[16px] font-bold" style={{ color: "var(--text-3)" }}>s</span>
        </p>
      </div>

      {/* Job details */}
      <div className="flex-1 px-5 overflow-auto">
        {alert.isEmergency && (
          <div className="rounded-[14px] p-3 mb-3 text-center"
               style={{ background: "var(--danger-tint)", border: "1px solid var(--danger)" }}>
            <p className="text-[12px] font-bold" style={{ color: "var(--danger)" }}>
              🆘 Emergency · 1.8× pay · Nearest worker priority
            </p>
          </div>
        )}

        <div className="rounded-[24px] p-5 mb-4" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-float)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-[18px] flex items-center justify-center text-[28px]"
                 style={{ background: "var(--brand-tint)" }}>{alert.tradeIcon}</div>
            <div className="flex-1">
              <p className="text-[16px] font-black capitalize" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
                {alert.trade.replace("_", " ")}
              </p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>{alert.problem}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { v: `${alert.distance}`, u: "km", l: "Distance", c: "var(--text-1)", bg: "var(--bg-surface)" },
              { v: `₹${displayEarnings}`, u: "", l: "Earnings", c: alert.isEmergency ? "var(--danger)" : "var(--brand)", bg: alert.isEmergency ? "var(--danger-tint)" : "var(--brand-tint)" },
              { v: `${alert.eta}`, u: "min", l: "ETA", c: "var(--text-1)", bg: "var(--bg-surface)" },
            ].map(s => (
              <div key={s.l} className="rounded-[14px] p-3 text-center" style={{ background: s.bg }}>
                <p className="text-[20px] font-black" style={{ color: s.c, fontFamily: "'JetBrains Mono', monospace" }}>
                  {s.v}{s.u && <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{s.u}</span>}
                </p>
                <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{s.l}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[14px] p-3 flex items-center gap-3" style={{ background: "var(--bg-surface)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-black text-white shrink-0"
                 style={{ background: "var(--gradient-cta)" }}>
              {alert.hirerName.split(" ").map(w => w[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{alert.hirerName}</p>
              <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>⭐ {alert.hirerRating} · ~{alert.duration}</p>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2">
            <span className="text-[12px] mt-0.5">📍</span>
            <p className="text-[10px] font-medium leading-relaxed" style={{ color: "var(--text-3)" }}>{alert.address}</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-5 pb-8 pt-4 flex gap-3" style={{ background: "linear-gradient(180deg, transparent, #0A0A0A 30%)" }}>
        <button onClick={handleDecline}
                className="rounded-[16px] py-4 px-5 text-[13px] font-bold active:scale-95 transition-transform"
                style={{ width: "35%", background: "transparent", color: "var(--danger)", border: "2px solid var(--danger)" }}>
          ✕ Decline
        </button>
        <button onClick={() => onAccept(alert.id)}
                className="flex-1 rounded-[16px] py-4 text-[14px] font-black text-white active:scale-95 transition-transform"
                style={{ background: "var(--success)", boxShadow: "0 8px 24px -4px rgba(52,211,153,0.4)" }}>
          ✓ ACCEPT · ₹{displayEarnings}
        </button>
      </div>
    </div>
  );
}
