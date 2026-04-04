"use client";

import { useState } from "react";
import Link from "next/link";

// ═══════════════════════════════════════
// DATA DELETION REQUEST — DPDP Act 2023
// Bible ref: PreLaunch Complete Bible → Part 10
// "Users can request deletion anytime"
// ═══════════════════════════════════════

export default function DeleteAccountPage() {
  const [step, setStep] = useState<"info" | "confirm" | "submitted">("info");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const reasons = [
    "I found a better service",
    "I'm not using the app anymore",
    "Privacy concerns",
    "Too many notifications",
    "Worker/hirer experience was poor",
    "Other",
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
    } catch {}
    setLoading(false);
    setStep("submitted");
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <Link href="/settings" className="text-[13px] font-semibold" style={{ color: "var(--text-3)" }}>
          ← Settings
        </Link>
        <h1 className="text-[24px] font-extrabold mt-3" style={{ color: "var(--text-1)" }}>
          Delete Account & Data
        </h1>
        <p className="text-[13px] mt-1" style={{ color: "var(--text-3)" }}>
          As per DPDP Act 2023, you have the right to request deletion of your personal data.
        </p>
      </div>

      {step === "info" && (
        <div className="px-5">
          {/* What gets deleted */}
          <div className="rounded-[20px] p-5 mb-4" style={{ background: "var(--bg-card)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--danger, #FF3B3B)" }}>
              ⚠️ What will be deleted
            </p>
            {[
              "Your profile and personal information",
              "Booking history and reviews",
              "Saved addresses and preferences",
              "KaizyScore and verification data",
              "Earnings history (if worker)",
              "All notification history",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 py-2" style={{ borderBottom: i < 5 ? "1px solid var(--border)" : "none" }}>
                <span className="text-[14px]">🗑️</span>
                <span className="text-[13px] font-medium" style={{ color: "var(--text-2)" }}>{item}</span>
              </div>
            ))}
          </div>

          {/* What's retained */}
          <div className="rounded-[20px] p-5 mb-4" style={{ background: "var(--bg-card)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
              📋 Retained for legal compliance (90 days)
            </p>
            {[
              "Financial transaction records (as per GST law)",
              "Dispute resolution records (if any pending)",
              "Anonymized analytics data (no PII)",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 py-2" style={{ borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                <span className="text-[14px]">📄</span>
                <span className="text-[12px] font-medium" style={{ color: "var(--text-3)" }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Reason */}
          <div className="rounded-[20px] p-5 mb-4" style={{ background: "var(--bg-card)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
              Help us improve — why are you leaving?
            </p>
            <div className="space-y-2">
              {reasons.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className="w-full text-left px-4 py-3 rounded-[12px] text-[13px] font-medium transition-all"
                  style={{
                    background: reason === r ? "var(--brand-tint)" : "var(--bg-surface)",
                    color: reason === r ? "var(--brand)" : "var(--text-2)",
                    border: reason === r ? "1px solid var(--brand)" : "1px solid transparent",
                  }}
                >
                  {reason === r ? "● " : "○ "}{r}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => reason && setStep("confirm")}
            disabled={!reason}
            className="w-full rounded-[16px] py-4 text-[14px] font-bold transition-all"
            style={{
              background: reason ? "var(--danger, #FF3B3B)" : "var(--bg-elevated)",
              color: reason ? "#fff" : "var(--text-3)",
              cursor: reason ? "pointer" : "not-allowed",
            }}
          >
            Continue to Deletion
          </button>
        </div>
      )}

      {step === "confirm" && (
        <div className="px-5">
          <div className="rounded-[20px] p-6 text-center" style={{ background: "var(--bg-card)" }}>
            <div className="text-[48px] mb-4">⚠️</div>
            <h2 className="text-[20px] font-extrabold mb-2" style={{ color: "var(--danger, #FF3B3B)" }}>
              This action is irreversible
            </h2>
            <p className="text-[13px] mb-6" style={{ color: "var(--text-2)" }}>
              All your data will be permanently deleted within 30 days.
              Your KaizyScore, reviews, and earnings history cannot be recovered.
            </p>

            <div className="rounded-[14px] p-4 mb-6" style={{ background: "rgba(255,59,59,0.08)", border: "1px solid rgba(255,59,59,0.2)" }}>
              <p className="text-[12px] font-bold" style={{ color: "var(--danger, #FF3B3B)" }}>
                Pending payouts will be processed before deletion.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-[16px] py-4 text-[14px] font-bold mb-3 transition-all"
              style={{ background: "var(--danger, #FF3B3B)", color: "#fff" }}
            >
              {loading ? "Processing..." : "🗑️ Permanently Delete My Account"}
            </button>

            <button
              onClick={() => setStep("info")}
              className="w-full rounded-[16px] py-3 text-[13px] font-bold"
              style={{ background: "var(--bg-surface)", color: "var(--text-2)" }}
            >
              Cancel — Keep My Account
            </button>
          </div>
        </div>
      )}

      {step === "submitted" && (
        <div className="px-5">
          <div className="rounded-[20px] p-6 text-center" style={{ background: "var(--bg-card)" }}>
            <div className="text-[48px] mb-4">📧</div>
            <h2 className="text-[20px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>
              Deletion Request Submitted
            </h2>
            <p className="text-[13px] mb-2" style={{ color: "var(--text-2)" }}>
              Your request has been received. Your data will be deleted within <strong>30 days</strong>.
            </p>
            <p className="text-[12px] mb-6" style={{ color: "var(--text-3)" }}>
              You will receive a confirmation email when deletion is complete.
              Contact <span style={{ color: "var(--brand)" }}>privacy@kaizy.in</span> for questions.
            </p>

            <Link
              href="/"
              className="block w-full rounded-[16px] py-4 text-[14px] font-bold text-center text-white"
              style={{ background: "var(--gradient-cta)" }}
            >
              Go Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
