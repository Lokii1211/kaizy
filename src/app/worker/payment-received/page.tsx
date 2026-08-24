"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import { getSupabase } from "@/lib/supabase";
import LoadingShell from "@/components/LoadingShell";
import { formatPrice } from "@/lib/formatters";

// ============================================================
// WORKER PAYMENT RECEIVED CELEBRATION SCREEN
// Coin animations · Net Payout Summary · Wallet / Dashboard Actions
// ============================================================

function PaymentReceivedContent() {
  const { isDark } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawAmount = searchParams.get("amount");
  const amount = rawAmount ? Number(rawAmount) : 345;
  const bookingId = searchParams.get("bookingId") || "";

  const [upiId, setUpiId] = useState<string>("worker@oksbi");

  useEffect(() => {
    // Confetti / vibration feedback
    if ("vibrate" in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col justify-between p-6 select-none text-center relative overflow-hidden"
      style={{ background: isDark ? "var(--bg-app)" : "#0A0A0A" }}
    >
      {/* ── CELEBRATION HERO ── */}
      <div className="pt-16">
        {/* Animated Coin Badge */}
        <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-[44px] text-white shadow-2xl shadow-green-500/50 relative z-10"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
          >
            💰
          </div>
        </div>

        <span className="text-[12px] font-black uppercase tracking-widest text-green-400 block mb-2">
          Payout Released!
        </span>

        <h1
          className="text-[52px] font-black text-white leading-none font-mono mb-2"
          style={{ letterSpacing: "-1px" }}
        >
          {formatPrice(amount)}
        </h1>

        <p className="text-[13px] font-bold text-gray-400">
          Credited directly to UPI (<span className="text-white font-mono">{upiId}</span>)
        </p>

        {/* Breakdown Chip */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-[11px] font-bold mt-6 border border-white/10">
          <span>✓ 100% Guaranteed Payout</span>
          <span>·</span>
          <span>0 Withdrawal Delay</span>
        </div>
      </div>

      {/* ── BOTTOM ACTIONS ── */}
      <div className="space-y-3 pt-8">
        <Link
          href="/earnings"
          className="block w-full py-4 rounded-[18px] text-center text-[14px] font-black border text-white active:scale-95 transition-all"
          style={{
            background: "rgba(255,255,255,0.08)",
            borderColor: "rgba(255,255,255,0.15)",
          }}
        >
          View Earnings & Wallet →
        </Link>

        <Link
          href="/dashboard/worker"
          className="block w-full py-4 rounded-[18px] text-center text-[15px] font-black text-white active:scale-95 transition-all shadow-2xl"
          style={{ background: "var(--brand)" }}
        >
          Next Job Available →
        </Link>
      </div>
    </div>
  );
}

export default function PaymentReceivedPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <PaymentReceivedContent />
    </Suspense>
  );
}
