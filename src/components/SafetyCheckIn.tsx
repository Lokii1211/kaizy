"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * ═══ SAFETY CHECK-IN COMPONENT ═══
 * 10-minute silent timer. After worker marks "I've Arrived",
 * prompts "Are you safe?" If no response in 5 more minutes,
 * triggers ops team alert.
 * 
 * Bible ref: Challenges Bible → SOLUTION 2 (Live Safety Tracking)
 * Inspired by Uber's RideCheck feature.
 */

interface SafetyCheckInProps {
  bookingId: string;
  workerId: string;
  isWorkerArrived: boolean;
  isNightJob?: boolean;
  onSOS?: () => void;
}

export default function SafetyCheckIn({
  bookingId,
  workerId,
  isWorkerArrived,
  isNightJob = false,
  onSOS,
}: SafetyCheckInProps) {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInCountdown, setCheckInCountdown] = useState(300); // 5 min to respond
  const [isSafe, setIsSafe] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Safety check interval: 10 min normally, 30 min for night jobs (per Bible)
  const CHECK_INTERVAL = isNightJob ? 30 * 60 * 1000 : 10 * 60 * 1000;

  const triggerOpsAlert = useCallback(async () => {
    try {
      await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SAFETY_CHECK_FAILED",
          bookingId,
          workerId,
          isNightJob,
          message: "Worker did not respond to safety check-in within 5 minutes",
        }),
      });
    } catch (e) {
      console.error("[safety alert]", e);
    }
    if (onSOS) onSOS();
  }, [bookingId, workerId, isNightJob, onSOS]);

  const handleSafeConfirm = useCallback(() => {
    setShowCheckIn(false);
    setIsSafe(true);
    setCheckInCountdown(300);

    // Clear countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    // Reset for next check
    setTimeout(() => setIsSafe(false), 3000);
  }, []);

  const handleNeedHelp = useCallback(() => {
    setShowCheckIn(false);
    if (onSOS) onSOS();
  }, [onSOS]);

  // Start safety timer when worker arrives
  useEffect(() => {
    if (!isWorkerArrived) return;

    timerRef.current = setInterval(() => {
      setShowCheckIn(true);
      setCheckInCountdown(300);

      // Start 5-minute countdown
      countdownRef.current = setInterval(() => {
        setCheckInCountdown((prev) => {
          if (prev <= 1) {
            // No response — trigger ops
            triggerOpsAlert();
            if (countdownRef.current) clearInterval(countdownRef.current);
            setShowCheckIn(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, CHECK_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isWorkerArrived, CHECK_INTERVAL, triggerOpsAlert]);

  // Safe confirmation toast
  if (isSafe) {
    return (
      <div
        style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--success, #00D084)",
          color: "#fff",
          padding: "12px 24px",
          borderRadius: 16,
          fontSize: 14,
          fontWeight: 700,
          zIndex: 10000,
          animation: "anim-slide-up 0.3s ease-out",
          boxShadow: "0 4px 20px rgba(0,208,132,0.3)",
        }}
      >
        ✅ Safety confirmed — Stay safe!
      </div>
    );
  }

  // Safety check-in modal
  if (!showCheckIn) return null;

  const minutes = Math.floor(checkInCountdown / 60);
  const seconds = checkInCountdown % 60;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--bg-card, #1C1C1E)",
          borderRadius: 24,
          padding: 32,
          maxWidth: 360,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>

        <h2
          style={{
            color: "var(--text-1, #fff)",
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Safety Check-In
        </h2>

        <p
          style={{
            color: "var(--text-2, #A1A1AA)",
            fontSize: 14,
            marginBottom: 4,
          }}
        >
          Are you okay? Tap to confirm.
        </p>

        <p
          style={{
            color: "var(--text-3, #52525B)",
            fontSize: 12,
            marginBottom: 24,
          }}
        >
          Auto-alert to ops team in{" "}
          <span style={{ color: "var(--danger, #FF3B3B)", fontWeight: 700 }}>
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </p>

        {/* Safe button */}
        <button
          onClick={handleSafeConfirm}
          style={{
            width: "100%",
            padding: "16px 0",
            borderRadius: 16,
            border: "none",
            background: "var(--success, #00D084)",
            color: "#fff",
            fontSize: 18,
            fontWeight: 800,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          ✅ I&apos;m Safe
        </button>

        {/* Need help button */}
        <button
          onClick={handleNeedHelp}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 16,
            border: "2px solid var(--danger, #FF3B3B)",
            background: "transparent",
            color: "var(--danger, #FF3B3B)",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          🆘 Need Help
        </button>
      </div>
    </div>
  );
}
