"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ============================================================
// POST-JOB REVIEW — Stars + Tags + Comment + Confetti
// "How was Raju's work today?" (personal, not generic)
// Reference: Swiggy post-order · Urban Company review
// ============================================================

const reviewTags = [
  { id: "on_time", label: "On Time", icon: "⏰" },
  { id: "clean_work", label: "Clean Work", icon: "✨" },
  { id: "polite", label: "Polite", icon: "😊" },
  { id: "fair_price", label: "Fair Price", icon: "💰" },
  { id: "professional", label: "Professional", icon: "👔" },
  { id: "skilled", label: "Skilled", icon: "🔧" },
  { id: "fast", label: "Fast", icon: "⚡" },
  { id: "neat", label: "Neat & Tidy", icon: "🧹" },
];

const negativeTags = [
  { id: "late", label: "Arrived Late", icon: "⏳" },
  { id: "overcharged", label: "Overcharged", icon: "💸" },
  { id: "poor_quality", label: "Poor Quality", icon: "👎" },
  { id: "rude", label: "Rude Behavior", icon: "😤" },
  { id: "incomplete", label: "Incomplete Work", icon: "❌" },
  { id: "messy", label: "Left Mess", icon: "🗑️" },
];

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const jobId = searchParams.get("jobId") || "";
  const workerName = searchParams.get("worker") || "the worker";
  const trade = searchParams.get("trade") || "worker";
  const amount = searchParams.get("amount") || "0";

  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);

  const firstName = workerName.split(" ")[0];
  const tradeIcon = tradeIcons[trade.toLowerCase()] || "🔧";

  const toggleTag = (id: string) => {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);

    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          rating,
          tags: selectedTags,
          comment: comment.trim(),
          tip_amount: tipAmount,
        }),
      });
    } catch {}

    setSubmitted(true);
    // Redirect after celebration
    setTimeout(() => router.push("/"), 2500);
  };

  // ── SUBMITTED: Confetti celebration ──
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
           style={{ background: "var(--bg-app)" }}>
        {/* Confetti particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="absolute"
                 style={{
                   left: `${Math.random() * 100}%`,
                   top: "-10px",
                   width: `${8 + Math.random() * 8}px`,
                   height: `${8 + Math.random() * 8}px`,
                   background: ["#FF6B00", "#34D399", "#FBBF24", "#3B82F6", "#EF4444", "#8B5CF6"][i % 6],
                   borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                   animation: `confetti ${1.5 + Math.random() * 2}s ease-out forwards`,
                   animationDelay: `${Math.random() * 0.5}s`,
                 }} />
          ))}
        </div>

        <div className="anim-spring text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
               style={{ background: "var(--success-tint)" }}>
            <span className="text-[48px]">✅</span>
          </div>
          <h1 className="text-[22px] font-black tracking-tight mb-2"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Thank you!
          </h1>
          <p className="text-[13px] font-medium" style={{ color: "var(--text-3)" }}>
            {rating >= 4
              ? `${firstName} has been notified of your ${rating}-star review ⭐`
              : "Your feedback helps us improve Kaizy"}
          </p>
          {tipAmount > 0 && (
            <p className="text-[12px] font-bold mt-2" style={{ color: "var(--success)" }}>
              ₹{tipAmount} tip sent to {firstName} 💚
            </p>
          )}
        </div>
      </div>
    );
  }

  // Rating labels
  const ratingLabels = ["", "Terrible", "Poor", "Okay", "Good", "Excellent!"];
  const ratingColors = ["", "var(--danger)", "var(--danger)", "var(--warning)", "var(--success)", "var(--success)"];

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <button onClick={() => router.back()}
                className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
          <span className="text-[14px]">←</span>
        </button>
      </div>

      {/* Worker hero */}
      <div className="text-center px-5 pb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-[32px] mx-auto mb-3"
             style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
          {tradeIcon}
        </div>
        <h1 className="text-[18px] font-black tracking-tight"
            style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
          How was {firstName}&apos;s work?
        </h1>
        <p className="text-[11px] font-medium mt-1" style={{ color: "var(--text-3)" }}>
          {tradeIcon} {trade} · ₹{parseInt(amount).toLocaleString("en-IN")}
        </p>
      </div>

      {/* Star rating */}
      <div className="text-center px-5 mb-6">
        <div className="flex justify-center gap-3 mb-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button key={star} onClick={() => setRating(star)}
                    className="active:scale-125 transition-all"
                    style={{ transform: rating >= star ? "scale(1.1)" : "scale(1)" }}>
              <span className="text-[36px]"
                    style={{ filter: rating >= star ? "none" : "grayscale(1) opacity(0.3)" }}>
                ⭐
              </span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-[14px] font-black anim-scale"
             style={{ color: ratingColors[rating] }}>
            {ratingLabels[rating]}
          </p>
        )}
      </div>

      {/* Tags */}
      {rating > 0 && (
        <div className="px-5 mb-5 anim-up">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
             style={{ color: "var(--text-3)" }}>
            {rating >= 4 ? "What went well?" : "What went wrong?"}
          </p>
          <div className="flex flex-wrap gap-2">
            {(rating >= 4 ? reviewTags : negativeTags).map(tag => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button key={tag.id} onClick={() => toggleTag(tag.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold active:scale-95 transition-all"
                        style={{
                          background: isSelected ? "var(--brand)" : "var(--bg-card)",
                          color: isSelected ? "#fff" : "var(--text-2)",
                        }}>
                  <span className="text-[12px]">{tag.icon}</span>
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Comment */}
      {rating > 0 && (
        <div className="px-5 mb-5 anim-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
             style={{ color: "var(--text-3)" }}>
            Add a comment {rating < 4 ? "(required)" : "(optional)"}
          </p>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
                    placeholder={rating >= 4 ? `Tell others about ${firstName}...` : "What can be improved?"}
                    rows={3}
                    className="w-full rounded-[16px] px-4 py-3 text-[13px] font-medium resize-none outline-none"
                    style={{ background: "var(--bg-card)", color: "var(--text-1)", border: "1px solid var(--border-1)" }} />
        </div>
      )}

      {/* Tip (only for 4+ stars) */}
      {rating >= 4 && (
        <div className="px-5 mb-5 anim-up" style={{ animationDelay: "0.15s" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
             style={{ color: "var(--text-3)" }}>
            💚 Tip {firstName}?
          </p>
          <div className="flex gap-2">
            {[0, 20, 50, 100].map(amt => (
              <button key={amt} onClick={() => setTipAmount(amt)}
                      className="flex-1 rounded-[14px] py-2.5 text-[12px] font-bold text-center active:scale-95 transition-all"
                      style={{
                        background: tipAmount === amt ? "var(--success)" : "var(--bg-card)",
                        color: tipAmount === amt ? "#fff" : "var(--text-2)",
                      }}>
                {amt === 0 ? "No tip" : `₹${amt}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit button */}
      {rating > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-5 z-40"
             style={{ background: "var(--bg-app)" }}>
          <button onClick={handleSubmit}
                  disabled={submitting || (rating < 4 && !comment.trim())}
                  className="w-full rounded-[16px] py-4 text-[14px] font-black active:scale-[0.97] disabled:opacity-40 transition-all"
                  style={{ background: "var(--gradient-cta)", color: "#FFDBCC", boxShadow: "var(--shadow-brand)" }}>
            {submitting ? "Submitting..." : `Submit Review${tipAmount > 0 ? ` + ₹${tipAmount} Tip` : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}
