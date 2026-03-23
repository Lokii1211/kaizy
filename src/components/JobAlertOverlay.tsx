"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// Kaizy — FULL-SCREEN JOB ALERT (Rapido/Uber style)
// 45-second countdown · Accept/Decline · Sound + Vibration
// Shows when worker is ONLINE and receives a JOB_ALERT
// ============================================================

interface JobAlertData {
  alertId: string;
  jobId: string;
  trade: string;
  distance: number;
  earnings: number;
  problemType?: string;
  address?: string;
  hirerName?: string;
  isEmergency?: boolean;
}

interface JobAlertProps {
  alert: JobAlertData;
  onAccept: (alertId: string) => void;
  onDecline: (alertId: string) => void;
}

const TRADE_ICONS: Record<string, string> = {
  electrician: "⚡", electrical: "⚡", plumber: "🔧", plumbing: "🔧",
  mechanic: "🚗", ac_repair: "❄️", carpenter: "🪚", painter: "🎨",
  mason: "⚒️", puncture: "🛞", technician: "🔧",
};
const TRADE_COLORS: Record<string, string> = {
  electrician: "#FF6B00", plumber: "#3B82F6", mechanic: "#8B5CF6",
  ac_repair: "#06B6D4", carpenter: "#10B981", painter: "#F59E0B",
  mason: "#6366F1", puncture: "#EF4444",
};

export default function JobAlertOverlay({ alert, onAccept, onDecline }: JobAlertProps) {
  const [timeLeft, setTimeLeft] = useState(45);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const trade = alert.trade?.toLowerCase() || "technician";
  const icon = TRADE_ICONS[trade] || "🔧";
  const color = TRADE_COLORS[trade] || "#FF6B00";

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onDecline(alert.alertId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Vibrate pattern
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }

    // Try to play alert sound (may fail on mobile without user gesture)
    try {
      audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczHjmYv9/TqVFFO3++0tu5fVY9WKjGy7JxRjttt83OuohdSl+ry8avZ0M6ZbLKxqlhQDlqtsrGpmA/OWy3ysepYkE6bLfKx6ljQTpst8rHqWNBOm23ysmqZEI7b7nLyatmQzxwuszJq2ZDO2+5y8mrZkM8cLrMyatmQztvu8vJq2dEPHG7zMmsZ0Q8crvMyaxnRDxyu8zJrGdEPHK7zMmsaEU9c7zNya1oRj50vc7KrmhGPnS9zsquaUc+db7Oyq5pRz52vs7KrmpHP3a/z8uva0hAd8DPy69sSEB3wM/Lr2xIQHfBz8uvbElBeMHP");
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {});
    } catch {}

    return () => {
      clearInterval(timerRef.current);
      audioRef.current?.pause();
    };
  }, [alert.alertId, onDecline]);

  const handleAccept = useCallback(async () => {
    setAccepting(true);
    clearInterval(timerRef.current);
    audioRef.current?.pause();
    if (navigator.vibrate) navigator.vibrate(100);
    onAccept(alert.alertId);
  }, [alert.alertId, onAccept]);

  const handleDecline = useCallback(() => {
    setDeclining(true);
    clearInterval(timerRef.current);
    audioRef.current?.pause();
    if (navigator.vibrate) navigator.vibrate(50);
    onDecline(alert.alertId);
  }, [alert.alertId, onDecline]);

  const progress = (timeLeft / 45) * 100;
  const isUrgent = timeLeft <= 10;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: "rgba(0,0,0,0.95)" }}>
      {/* Animated background pulse */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(circle at 50% 40%, ${color}22 0%, transparent 70%)`,
        animation: "pulse 2s ease-in-out infinite",
      }} />

      {/* Top countdown bar */}
      <div className="relative w-full h-1.5" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div className="h-full transition-all duration-1000 ease-linear" style={{
          width: `${progress}%`,
          background: isUrgent ? "#EF4444" : color,
          boxShadow: `0 0 12px ${isUrgent ? "#EF4444" : color}`,
        }} />
      </div>

      {/* Timer */}
      <div className="text-center pt-8 pb-4">
        <p className="text-[13px] font-bold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
          {alert.isEmergency ? "🆘 EMERGENCY JOB" : "NEW JOB ALERT"}
        </p>
        <div className="relative inline-flex items-center justify-center">
          {/* Circular timer */}
          <svg width="120" height="120" className="transform -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <circle cx="60" cy="60" r="52" fill="none" stroke={isUrgent ? "#EF4444" : color}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                    className="transition-all duration-1000 ease-linear" />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-[36px] font-black text-white" style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: isUrgent ? "#EF4444" : "#fff",
            }}>
              {timeLeft}
            </span>
            <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>SECONDS</span>
          </div>
        </div>
      </div>

      {/* Job details card */}
      <div className="flex-1 px-5 overflow-y-auto">
        <div className="rounded-2xl p-5 mb-4" style={{
          background: "rgba(255,255,255,0.08)",
          border: `1.5px solid ${color}44`,
          backdropFilter: "blur(10px)",
        }}>
          {/* Trade icon + earnings */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px]"
                   style={{ background: `${color}22`, border: `2px solid ${color}` }}>
                {icon}
              </div>
              <div>
                <p className="text-[16px] font-black text-white capitalize">{trade}</p>
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {alert.problemType?.replace(/_/g, ' ') || "General Service"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[28px] font-black" style={{ color }}>₹{alert.earnings}</p>
              <p className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>EARN</p>
            </div>
          </div>

          {/* Distance + Address */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>DISTANCE</p>
              <p className="text-[16px] font-black text-white">{alert.distance?.toFixed(1) || "?"} km</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>ETA</p>
              <p className="text-[16px] font-black text-white">~{Math.max(3, Math.round((alert.distance || 1) * 6))} min</p>
            </div>
          </div>

          {alert.address && (
            <div className="mt-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>📍 LOCATION</p>
              <p className="text-[12px] font-semibold text-white">{alert.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Accept / Decline buttons */}
      <div className="px-5 pb-8 pt-3">
        <button onClick={handleAccept} disabled={accepting}
                className="w-full rounded-2xl py-5 mb-3 active:scale-[0.97] transition-all disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}CC)`,
                  boxShadow: `0 8px 32px ${color}55`,
                }}>
          <p className="text-[18px] font-black text-white">
            {accepting ? "Accepting..." : "✓ ACCEPT JOB"}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            Earn ₹{alert.earnings} · {alert.distance?.toFixed(1)}km away
          </p>
        </button>

        <button onClick={handleDecline} disabled={declining}
                className="w-full rounded-2xl py-4 active:scale-[0.97] transition-all disabled:opacity-60"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <p className="text-[14px] font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>
            {declining ? "Declining..." : "✕ DECLINE"}
          </p>
        </button>
      </div>

      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
