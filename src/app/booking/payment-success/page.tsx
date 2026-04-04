"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

// ============================================================
// PAYMENT SUCCESS — Stitch "Payment Success (P-01)" Screen
// ============================================================

function PaymentContent() {
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount") || "0";
  const workerName = searchParams.get("worker") || "Worker";
  const method = searchParams.get("method") || "cash";
  const bookingId = searchParams.get("id") || "KZ" + Date.now().toString().slice(-6);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-app)" }}>
      {/* Success animation */}
      <div className="relative mb-6">
        {/* Pulse rings */}
        <div className="absolute inset-0 -m-4 rounded-full"
             style={{ border: "2px solid rgba(52,211,153,0.2)", animation: "ring-expand 2s ease-out infinite" }} />
        <div className="absolute inset-0 -m-8 rounded-full"
             style={{ border: "2px solid rgba(52,211,153,0.1)", animation: "ring-expand 2s ease-out infinite 0.4s" }} />
        <div className="w-24 h-24 rounded-full flex items-center justify-center anim-spring"
             style={{ background: "var(--success)", boxShadow: "0 16px 48px rgba(52,211,153,0.35)" }}>
          <span className="text-white text-[42px]">✓</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-[24px] font-black tracking-tight text-center mb-1"
          style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
        Payment Confirmed! 🎉
      </h1>
      <p className="text-[12px] font-medium text-center mb-6" style={{ color: "var(--text-3)" }}>
        Thank you for using Kaizy
      </p>

      {/* Payment card */}
      <div className="w-full max-w-sm rounded-[20px] overflow-hidden mb-5" style={{ background: "var(--bg-card)" }}>
        {/* Amount section */}
        <div className="p-5 text-center" style={{ background: "var(--gradient-cta)" }}>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-1">Amount Paid</p>
          <p className="text-[36px] font-black text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{parseInt(amount).toLocaleString("en-IN")}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[10px]">{method === "cash" ? "💵" : "📱"}</span>
            <span className="text-[10px] font-bold text-white/70">
              {method === "cash" ? "Paid in Cash" : "UPI Payment"}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>Worker</span>
            <span className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{workerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>Booking ID</span>
            <span className="text-[11px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{bookingId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>Date</span>
            <span className="text-[11px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
              {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold" style={{ color: "var(--text-3)" }}>Status</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(52,211,153,0.1)", color: "var(--success)" }}>
              ✓ Confirmed
            </span>
          </div>
        </div>
      </div>

      {/* Receipt download (placeholder) */}
      <button className="w-full max-w-sm rounded-[14px] py-3 text-[11px] font-bold text-center mb-4 active:scale-95 transition-transform"
              style={{ background: "var(--bg-card)", color: "var(--text-2)" }}>
        📄 Download Receipt
      </button>

      {/* Actions */}
      <Link href="/"
            className="w-full max-w-sm rounded-[16px] py-4 text-[14px] font-black text-center active:scale-[0.97] transition-transform"
            style={{ background: "var(--gradient-cta)", color: "#FFDBCC", boxShadow: "var(--shadow-brand)" }}>
        Back to Home →
      </Link>
      <Link href="/my-bookings"
            className="mt-3 text-[12px] font-bold" style={{ color: "var(--text-3)" }}>
        View My Bookings
      </Link>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
      <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
    </div>}>
      <PaymentContent />
    </Suspense>
  );
}
