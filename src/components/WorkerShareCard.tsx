"use client";

import { useState, useRef } from "react";

/**
 * ═══ WORKER SHARE CARD ═══
 * Generates a WhatsApp-shareable worker profile card
 * Bible ref: Challenges Bible → SOLUTION 9
 * "Let workers share a branded mini-profile via WhatsApp"
 * Contains: Name, trade, rating, KaizyScore, QR code
 */

interface WorkerShareCardProps {
  worker: {
    name: string;
    trade: string;
    tradeIcon: string;
    rating: number;
    totalJobs: number;
    kaizyScore: number;
    verified: boolean;
    city: string;
    profileId: string;
  };
  onClose: () => void;
}

export default function WorkerShareCard({ worker, onClose }: WorkerShareCardProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const profileUrl = `https://kaizy.in/worker/${worker.profileId}`;
  const whatsappText = encodeURIComponent(
    `🔧 *${worker.name}* — Verified ${worker.trade} on Kaizy\n\n` +
    `⭐ ${worker.rating}/5 rating · ${worker.totalJobs} jobs done\n` +
    `🛡️ ${worker.verified ? 'Aadhaar Verified' : 'Profile Active'}\n` +
    `📍 ${worker.city}\n\n` +
    `Book now: ${profileUrl}\n\n` +
    `Download Kaizy — India's fairest home services app 🇮🇳`
  );

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${worker.name} — ${worker.trade} on Kaizy`,
          text: `⭐ ${worker.rating}/5 · ${worker.totalJobs} jobs completed · Verified`,
          url: profileUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        ref={cardRef}
        style={{
          background: "var(--bg-card, #1C1C1E)",
          borderRadius: 24,
          padding: 28,
          maxWidth: 340,
          width: "100%",
          animation: "anim-scale-in 0.3s ease-out",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            color: "var(--text-3)",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        {/* Card Content */}
        <div style={{ textAlign: "center" }}>
          {/* Avatar */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              margin: "0 auto 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 800,
              color: "#fff",
              background: "var(--gradient-cta)",
            }}
          >
            {worker.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
          </div>

          {/* Name & Trade */}
          <h3
            style={{
              color: "var(--text-1, #fff)",
              fontSize: 20,
              fontWeight: 800,
              marginBottom: 2,
            }}
          >
            {worker.name}
          </h3>
          <p
            style={{
              color: "var(--brand, #FF6B00)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {worker.tradeIcon} {worker.trade.charAt(0).toUpperCase() + worker.trade.slice(1)}
          </p>

          {/* Verified Badge */}
          {worker.verified && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 8,
                padding: "4px 12px",
                borderRadius: 20,
                background: "rgba(0,208,132,0.1)",
                border: "1px solid rgba(0,208,132,0.2)",
              }}
            >
              <span style={{ fontSize: 12 }}>🛡️</span>
              <span
                style={{
                  color: "#00D084",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Aadhaar Verified
              </span>
            </div>
          )}

          {/* Stats Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 24,
              marginTop: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-1)", fontSize: 18, fontWeight: 800 }}>
                ⭐ {worker.rating}
              </p>
              <p style={{ color: "var(--text-3)", fontSize: 10, fontWeight: 600 }}>Rating</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-1)", fontSize: 18, fontWeight: 800 }}>
                {worker.totalJobs}
              </p>
              <p style={{ color: "var(--text-3)", fontSize: 10, fontWeight: 600 }}>Jobs</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-1)", fontSize: 18, fontWeight: 800 }}>
                {worker.kaizyScore}
              </p>
              <p style={{ color: "var(--text-3)", fontSize: 10, fontWeight: 600 }}>KaizyScore</p>
            </div>
          </div>

          <p style={{ color: "var(--text-3)", fontSize: 11, marginBottom: 16 }}>
            📍 {worker.city}
          </p>

          {/* Kaizy branding */}
          <div
            style={{
              background: "var(--bg-surface, #242428)",
              borderRadius: 12,
              padding: "8px 12px",
              marginBottom: 16,
            }}
          >
            <p style={{ color: "var(--text-3)", fontSize: 9, fontWeight: 600 }}>
              Powered by
            </p>
            <p style={{ color: "var(--brand, #FF6B00)", fontSize: 14, fontWeight: 800 }}>
              Kaizy 🇮🇳
            </p>
            <p style={{ color: "var(--text-3)", fontSize: 9 }}>
              India&apos;s Fairest Home Services
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleShare}
              style={{
                flex: 1,
                padding: "14px 0",
                borderRadius: 14,
                border: "none",
                background: "#25D366",
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              📤 Share on WhatsApp
            </button>

            <button
              onClick={handleCopyLink}
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid var(--border)",
                background: "transparent",
                color: copied ? "#00D084" : "var(--text-2)",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {copied ? "✓" : "🔗"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
