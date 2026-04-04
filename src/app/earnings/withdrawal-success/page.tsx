"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ============================================================
// WITHDRAWAL SUCCESS — Stitch "Withdrawal Success" Screen
// ============================================================

function WithdrawalContent() {
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount") || "0";
  const method = searchParams.get("method") || "upi";
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-app)" }}>
      {/* Confetti particles */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i}
                 className="absolute w-2 h-2 rounded-full"
                 style={{
                   background: ['#FF6B00', '#34D399', '#3B82F6', '#F59E0B', '#EC4899'][i % 5],
                   left: `${Math.random() * 100}%`,
                   top: `-5%`,
                   animation: `confetti-fall ${2 + Math.random() * 2}s ease-out forwards`,
                   animationDelay: `${Math.random() * 0.5}s`,
                 }} />
          ))}
        </div>
      )}

      {/* Success icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full flex items-center justify-center"
             style={{
               background: "var(--success)",
               boxShadow: "0 16px 48px rgba(52,211,153,0.35)",
               animation: "bounce-in 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)",
             }}>
          <span className="text-white text-[42px]">✓</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
             style={{ background: "var(--brand)" }}>
          <span className="text-[16px]">💰</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-[24px] font-black tracking-tight text-center mb-1"
          style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
        Withdrawal Successful! 🎉
      </h1>
      <p className="text-[12px] font-medium text-center mb-6" style={{ color: "var(--text-3)" }}>
        Your money is on its way
      </p>

      {/* Amount card */}
      <div className="w-full max-w-sm rounded-[20px] p-5 mb-4" style={{ background: "var(--bg-card)" }}>
        <p className="text-[9px] font-bold uppercase tracking-widest text-center mb-2" style={{ color: "var(--text-3)" }}>
          Amount Transferred
        </p>
        <p className="text-[36px] font-black text-center mb-3"
           style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
          ₹{parseInt(amount).toLocaleString("en-IN")}
        </p>
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-[14px]">{method === "upi" ? "📱" : "🏦"}</span>
          <span className="text-[11px] font-bold" style={{ color: "var(--text-2)" }}>
            {method === "upi" ? "UPI Transfer" : "Bank Transfer"}
          </span>
        </div>
        <div className="rounded-[14px] p-3 flex items-center justify-between" style={{ background: "var(--bg-surface)" }}>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Transaction ID</p>
            <p className="text-[11px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
              TXN{Date.now().toString().slice(-8)}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>ETA</p>
            <p className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>
              {method === "upi" ? "Instant" : "1-2 hours"}
            </p>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="w-full max-w-sm rounded-[14px] p-3 flex items-start gap-3 mb-6" style={{ background: "var(--trust-tint)" }}>
        <span className="text-[14px] mt-0.5">ℹ️</span>
        <div>
          <p className="text-[10px] font-bold" style={{ color: "var(--trust)" }}>Processing Info</p>
          <p className="text-[9px] mt-0.5" style={{ color: "var(--text-3)" }}>
            {method === "upi"
              ? "UPI transfers are usually instant. If not received in 30 mins, contact support."
              : "Bank transfers take 1-2 business hours. Weekend transfers may take up to 24 hours."}
          </p>
        </div>
      </div>

      {/* Actions */}
      <Link href="/earnings"
            className="w-full max-w-sm rounded-[16px] py-4 text-[14px] font-black text-center active:scale-[0.97] transition-transform"
            style={{ background: "var(--gradient-cta)", color: "#FFDBCC", boxShadow: "var(--shadow-brand)" }}>
        View Earnings →
      </Link>
      <Link href="/dashboard/worker"
            className="mt-3 text-[12px] font-bold" style={{ color: "var(--text-3)" }}>
        Back to Dashboard
      </Link>
    </div>
  );
}

export default function WithdrawalSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
      <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
    </div>}>
      <WithdrawalContent />
    </Suspense>
  );
}
