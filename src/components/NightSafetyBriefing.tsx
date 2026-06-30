"use client";

import { useState } from "react";

/**
 * ═══ NIGHT JOB SAFETY BRIEFING ═══
 * Shown before worker accepts night jobs (9pm–6am).
 * Must acknowledge all 3 checkpoints before accepting.
 * Bible ref: Challenges Bible → SOLUTION 3 (Late Night Safety Protocol)
 */

interface NightSafetyBriefingProps {
  onAccept: () => void;
  onDecline: () => void;
  jobDetails?: {
    trade?: string;
    distance?: number;
    earnings?: number;
    area?: string;
  };
}

export default function NightSafetyBriefing({
  onAccept,
  onDecline,
  jobDetails,
}: NightSafetyBriefingProps) {
  const [checks, setChecks] = useState([false, false, false]);

  const allChecked = checks.every(Boolean);

  const toggleCheck = (index: number) => {
    const newChecks = [...checks];
    newChecks[index] = !newChecks[index];
    setChecks(newChecks);
  };

  const checkpoints = [
    {
      emoji: "📍",
      text: "I have shared my live location with a trusted contact",
    },
    {
      emoji: "📞",
      text: "I have the Kaizy emergency number saved (1800-KAIZY)",
    },
    {
      emoji: "🚪",
      text: "I understand I can cancel this job if I feel unsafe — no penalty",
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        zIndex: 9998,
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
          padding: 28,
          maxWidth: 380,
          width: "100%",
          animation: "anim-scale-in 0.3s ease-out",
        }}
      >
        {/* Icon + Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              fontSize: 48,
              marginBottom: 8,
              animation: "live-blink 2s infinite",
            }}
          >
            🌙
          </div>
          <h2
            style={{
              color: "#FFB800",
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            Night Job Safety Briefing
          </h2>
          <p
            style={{
              color: "var(--text-2, #A1A1AA)",
              fontSize: 13,
              marginTop: 4,
            }}
          >
            This job is between 9 PM – 6 AM
          </p>
        </div>

        {/* Job details (if provided) */}
        {jobDetails && (
          <div
            style={{
              background: "rgba(255,184,0,0.08)",
              borderRadius: 14,
              padding: 14,
              marginBottom: 18,
              border: "1px solid rgba(255,184,0,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "var(--text-2)",
              }}
            >
              <span>{jobDetails.trade || "Service"}</span>
              <span>{jobDetails.distance ? `${jobDetails.distance} km` : ""}</span>
            </div>
            {jobDetails.area && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-3)",
                  marginTop: 4,
                }}
              >
                📍 Area: {jobDetails.area} (Residential)
              </p>
            )}
            {jobDetails.earnings && (
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#00D084",
                  marginTop: 4,
                }}
              >
                ₹{jobDetails.earnings} + night bonus
              </p>
            )}
          </div>
        )}

        {/* Checkpoints */}
        <div style={{ marginBottom: 20 }}>
          {checkpoints.map((cp, i) => (
            <button
              key={i}
              onClick={() => toggleCheck(i)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                width: "100%",
                padding: "12px 0",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                borderBottom:
                  i < checkpoints.length - 1
                    ? "1px solid var(--border, rgba(255,255,255,0.08))"
                    : "none",
              }}
            >
              {/* Checkbox */}
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  border: checks[i]
                    ? "none"
                    : "2px solid var(--text-3, #52525B)",
                  background: checks[i]
                    ? "var(--success, #00D084)"
                    : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                  transition: "all 0.2s",
                }}
              >
                {checks[i] && (
                  <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>
                    ✓
                  </span>
                )}
              </div>

              {/* Text */}
              <div>
                <span style={{ fontSize: 14, marginRight: 6 }}>{cp.emoji}</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: checks[i]
                      ? "var(--text-1, #fff)"
                      : "var(--text-2, #A1A1AA)",
                  }}
                >
                  {cp.text}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Buttons */}
        <button
          onClick={allChecked ? onAccept : undefined}
          disabled={!allChecked}
          style={{
            width: "100%",
            padding: "16px 0",
            borderRadius: 16,
            border: "none",
            background: allChecked
              ? "var(--success, #00D084)"
              : "var(--bg-elevated, #242428)",
            color: allChecked ? "#fff" : "var(--text-3)",
            fontSize: 16,
            fontWeight: 800,
            cursor: allChecked ? "pointer" : "not-allowed",
            marginBottom: 10,
            transition: "all 0.2s",
          }}
        >
          {allChecked ? "✅ Accept Night Job" : "Check all items to continue"}
        </button>

        <button
          onClick={onDecline}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 16,
            border: "1px solid var(--border, rgba(255,255,255,0.08))",
            background: "transparent",
            color: "var(--text-2, #A1A1AA)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Decline — No penalty for night jobs
        </button>
      </div>
    </div>
  );
}
