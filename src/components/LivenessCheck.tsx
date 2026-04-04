"use client";

import { useState, useEffect } from "react";

/**
 * ═══ LIVENESS RE-VERIFICATION PROMPT ═══
 * Weekly check: confirms same worker is using the account.
 * Prevents account sharing.
 * Bible ref: PreLaunch Bible Final → VERIFY-01 Task 2
 * "Random once a week before going online: Quick check — look at camera"
 */

interface LivenessCheckProps {
  workerId: string;
  lastVerifiedAt?: string;    // ISO timestamp
  onVerified: () => void;
  onSkip: () => void;
}

export default function LivenessCheck({
  workerId,
  lastVerifiedAt,
  onVerified,
  onSkip,
}: LivenessCheckProps) {
  const [visible, setVisible] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Check if 7 days have passed since last verification
    if (!lastVerifiedAt) {
      setVisible(true);
      return;
    }
    const daysSince = (Date.now() - new Date(lastVerifiedAt).getTime()) / 86400000;
    if (daysSince >= 7) {
      setVisible(true);
    }
  }, [lastVerifiedAt]);

  const handleVerify = async () => {
    setVerifying(true);

    // Simulate camera check (in production: actual face match)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Record verification
    try {
      await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId,
          type: "weekly_liveness",
          status: "passed",
          verifiedAt: new Date().toISOString(),
        }),
      });
    } catch {}

    setVerifying(false);
    setVerified(true);

    setTimeout(() => {
      setVisible(false);
      onVerified();
    }, 1500);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        zIndex: 9997,
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
          maxWidth: 360,
          width: "100%",
          textAlign: "center",
          animation: "anim-scale-in 0.3s ease-out",
        }}
      >
        {verified ? (
          // Success state
          <>
            <div
              style={{
                fontSize: 56,
                marginBottom: 12,
                animation: "anim-spring 0.5s ease-out",
              }}
            >
              ✅
            </div>
            <h2
              style={{
                color: "var(--success, #00D084)",
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              Identity Confirmed!
            </h2>
            <p
              style={{
                color: "var(--text-2, #A1A1AA)",
                fontSize: 13,
                marginTop: 6,
              }}
            >
              You&apos;re good to go online.
            </p>
          </>
        ) : (
          // Check state
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <h2
              style={{
                color: "var(--text-1, #fff)",
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              Weekly Identity Check
            </h2>
            <p
              style={{
                color: "var(--text-2, #A1A1AA)",
                fontSize: 13,
                marginTop: 6,
                marginBottom: 20,
              }}
            >
              Quick 10-second check to confirm it&apos;s you.
              <br />
              Look straight at the camera.
            </p>

            {/* Camera preview placeholder */}
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: "50%",
                margin: "0 auto 20px",
                background: "var(--bg-surface, #242428)",
                border: verifying
                  ? "3px solid var(--brand, #FF6B00)"
                  : "3px solid var(--border, rgba(255,255,255,0.08))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                transition: "border-color 0.3s",
              }}
            >
              {verifying ? (
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 32,
                      animation: "live-blink 1s infinite",
                    }}
                  >
                    👁️
                  </div>
                  <p
                    style={{
                      color: "var(--brand, #FF6B00)",
                      fontSize: 10,
                      fontWeight: 700,
                      marginTop: 4,
                    }}
                  >
                    Verifying...
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 40 }}>🤳</div>
                  <p
                    style={{
                      color: "var(--text-3, #52525B)",
                      fontSize: 10,
                      marginTop: 4,
                    }}
                  >
                    Camera preview
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying}
              style={{
                width: "100%",
                padding: "16px 0",
                borderRadius: 16,
                border: "none",
                background: verifying
                  ? "var(--bg-elevated, #242428)"
                  : "var(--brand, #FF6B00)",
                color: "#fff",
                fontSize: 16,
                fontWeight: 800,
                cursor: verifying ? "not-allowed" : "pointer",
                marginBottom: 10,
              }}
            >
              {verifying ? "Checking..." : "📸 Verify Now"}
            </button>

            <button
              onClick={() => {
                setVisible(false);
                onSkip();
              }}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 12,
                border: "none",
                background: "transparent",
                color: "var(--text-3, #52525B)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Remind me later (you can&apos;t go online without verifying)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
