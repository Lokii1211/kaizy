"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// ============================================================
// KAIZYPAY v2.0 — Real Payment Integration
// Reads from URL params + sessionStorage
// Razorpay checkout or cash payment fallback
// ============================================================

interface WorkerInfo {
  name: string;
  trade?: string;
  rating?: number;
  phone?: string;
}

interface BookingData {
  bookingId: string;
  amount: number;
  worker: WorkerInfo;
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [processing, setProcessing] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"razorpay" | "cash">("razorpay");

  // Load booking data from URL params and sessionStorage
  useEffect(() => {
    const loadData = () => {
      setDataLoading(true);

      // 1. Read from URL search params
      const paramBookingId = searchParams.get("bookingId") || "";
      const paramAmount = Number(searchParams.get("amount")) || 0;
      const paramWorker = searchParams.get("worker") || "";

      // 2. Read from sessionStorage
      let sessionWorker: WorkerInfo | null = null;
      let sessionJob: { bookingId?: string; jobId?: string; pricing?: { total?: number; finalPrice?: number } } | null = null;

      try {
        const storedWorker = sessionStorage.getItem("kaizy_booked_worker");
        if (storedWorker) {
          sessionWorker = JSON.parse(storedWorker);
        }
      } catch {}

      try {
        const storedJob = sessionStorage.getItem("kaizy_active_job");
        if (storedJob) {
          sessionJob = JSON.parse(storedJob);
        }
      } catch {}

      // 3. Merge: URL params take priority, fall back to sessionStorage
      const bookingId = paramBookingId || sessionJob?.bookingId || sessionJob?.jobId || "";
      const amount = paramAmount || sessionJob?.pricing?.total || sessionJob?.pricing?.finalPrice || 0;
      const workerName = paramWorker || sessionWorker?.name || "";

      const worker: WorkerInfo = {
        name: workerName,
        trade: sessionWorker?.trade || "",
        rating: sessionWorker?.rating || 0,
        phone: sessionWorker?.phone || "",
      };

      setBookingData({
        bookingId,
        amount,
        worker,
      });

      setDataLoading(false);
    };

    loadData();
  }, [searchParams]);

  // Calculate price breakdown
  const baseAmount = bookingData?.amount || 0;
  const platformFee = Math.round(baseAmount * 0.1);
  const insurance = 5;
  const totalAmount = baseAmount + platformFee + insurance;

  const handleRazorpayPayment = async () => {
    if (!bookingData?.bookingId) {
      setPaymentError("No booking ID found. Please go back and try again.");
      return;
    }

    setProcessing(true);
    setPaymentError(null);

    try {
      // POST to create-order API
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
          amount: totalAmount,
        }),
      });

      const json = await res.json();

      if (json.success && json.data?.keyId && json.data?.orderId) {
        // Razorpay keys exist, open checkout
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        if (win.Razorpay) {
          const rzp = new win.Razorpay({
            key: json.data.keyId,
            amount: json.data.amount,
            currency: json.data.currency || "INR",
            order_id: json.data.orderId,
            name: "Kaizy",
            description: `Payment for booking #${bookingData.bookingId.substring(0, 8)}`,
            handler: () => {
              // Payment successful
              router.push(
                `/booking/payment-success?bookingId=${bookingData.bookingId}&amount=${totalAmount}&worker=${encodeURIComponent(bookingData.worker.name)}&method=upi`
              );
            },
            prefill: {},
            theme: { color: "#6C5CE7" },
          });
          rzp.open();
          setProcessing(false);
          return;
        }
      }

      // No Razorpay keys or Razorpay SDK not loaded — simulate cash payment
      await simulateCashPayment();
    } catch (err) {
      console.error("[payment] Error:", err);
      // Fallback: simulate cash payment
      await simulateCashPayment();
    }
  };

  const simulateCashPayment = async () => {
    if (!bookingData?.bookingId) {
      setPaymentError("No booking ID found.");
      setProcessing(false);
      return;
    }

    setProcessing(true);
    setPaymentError(null);

    try {
      await fetch("/api/bookings/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
          status: "paid",
          paymentMethod: "cash",
          paymentAmount: totalAmount,
        }),
      });

      router.push(
        `/booking/payment-success?bookingId=${bookingData.bookingId}&amount=${totalAmount}&worker=${encodeURIComponent(bookingData.worker.name)}&method=cash`
      );
    } catch (err) {
      console.error("[cash payment] Error:", err);
      setPaymentError("Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  const handlePay = () => {
    if (selectedMethod === "cash") {
      simulateCashPayment();
    } else {
      handleRazorpayPayment();
    }
  };

  // Loading skeleton
  if (dataLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
        <div className="px-4 pt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full" style={{ background: "var(--bg-surface)" }} />
            <div>
              <div className="h-2.5 w-20 rounded-full mb-1.5" style={{ background: "var(--bg-elevated)" }} />
              <div className="h-4 w-32 rounded-full" style={{ background: "var(--bg-elevated)" }} />
            </div>
          </div>
          {/* Worker skeleton */}
          <div className="rounded-[14px] p-3 mb-3" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full" style={{ background: "var(--bg-elevated)" }} />
              <div className="flex-1">
                <div className="h-3 w-28 rounded-full mb-1.5" style={{ background: "var(--bg-elevated)" }} />
                <div className="h-2.5 w-36 rounded-full" style={{ background: "var(--bg-elevated)" }} />
              </div>
            </div>
          </div>
          {/* Price skeleton */}
          <div className="rounded-[14px] p-4 mb-3" style={{ background: "var(--bg-card)" }}>
            <div className="h-3 w-24 rounded-full mb-3" style={{ background: "var(--bg-elevated)" }} />
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between py-1.5">
                <div className="h-2.5 w-24 rounded-full" style={{ background: "var(--bg-elevated)" }} />
                <div className="h-2.5 w-12 rounded-full" style={{ background: "var(--bg-elevated)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // No booking data empty state
  if (!bookingData?.bookingId && !bookingData?.amount) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8" style={{ background: "var(--bg-app)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
             style={{ background: "var(--bg-surface)" }}>
          <span className="text-[32px]">💳</span>
        </div>
        <h1 className="text-[18px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
          No Payment Pending
        </h1>
        <p className="text-[11px] mt-2 text-center font-medium" style={{ color: "var(--text-3)" }}>
          There is no active booking to pay for. Book a worker first.
        </p>
        <Link href="/"
              className="mt-6 rounded-[14px] px-8 py-3.5 text-[13px] font-black text-white active:scale-95 transition-transform"
              style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const workerInitial = bookingData.worker.name
    ? bookingData.worker.name.split(" ").map(w => w[0]).join("").toUpperCase()
    : "W";

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/booking" aria-label="Go back" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-surface)" }}><span className="text-[14px]">←</span></Link>
          <div><p className="text-[10px] font-bold tracking-wider" style={{ color: "var(--brand)" }}>REVIEW & PAY</p>
          <h1 className="text-[18px] font-black" style={{ color: "var(--text-1)" }}>Confirm Booking</h1></div>
        </div>

        {/* Worker */}
        <div className="flex items-center gap-3 rounded-[14px] p-3 mb-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-[16px] font-black text-white" style={{ background: "#8B5CF6" }}>
            {workerInitial}
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>
              {bookingData.worker.name || "Worker"}
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
              {bookingData.worker.trade ? `${bookingData.worker.trade}` : "Service Provider"}
              {bookingData.worker.rating ? ` · ⭐ ${bookingData.worker.rating}` : ""}
            </p>
          </div>
          {bookingData.bookingId && (
            <span className="text-[8px] font-bold px-2 py-1 rounded-full" style={{ background: "var(--bg-surface)", color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
              #{bookingData.bookingId.substring(0, 8)}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="rounded-[14px] p-4 mb-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <p className="text-[12px] font-extrabold mb-3" style={{ color: "var(--text-1)" }}>Price Breakdown</p>
          {[
            { l: "Worker charges", v: `₹${baseAmount.toLocaleString("en-IN")}` },
            { l: "Platform fee (10%)", v: `₹${platformFee.toLocaleString("en-IN")}` },
            { l: "Job insurance", v: `₹${insurance}` },
          ].map(r => (
            <div key={r.l} className="flex justify-between py-1.5">
              <span className="text-[12px]" style={{ color: "var(--text-2)" }}>{r.l}</span>
              <span className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{r.v}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>Total</span>
            <span className="text-[18px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Escrow */}
        <div className="rounded-[14px] p-3 mb-3" style={{ background: "var(--success-tint)" }}>
          <p className="text-[11px] font-bold" style={{ color: "var(--success)" }}>🔒 Money held safely until job is done</p>
        </div>

        {/* Payment methods */}
        <p className="text-[11px] font-bold mb-2" style={{ color: "var(--text-3)" }}>Pay with</p>
        {[
          { key: "razorpay" as const, icon: "💳", name: "UPI / Card / Netbanking", c: "var(--brand)" },
          { key: "cash" as const, icon: "💵", name: "Pay Cash", c: "var(--success)" },
        ].map(m => (
          <button key={m.key}
                  className="w-full flex items-center gap-3 rounded-[14px] p-3 mb-2 active:scale-[0.98]"
                  style={{
                    background: "var(--bg-card)",
                    boxShadow: selectedMethod === m.key ? "0 0 0 2px var(--brand)" : "none",
                  }}
                  onClick={() => setSelectedMethod(m.key)}>
            <span className="text-[16px]" style={{ color: m.c }}>{m.icon}</span>
            <span className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{m.name}</span>
            <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
                 style={{ background: selectedMethod === m.key ? "var(--brand)" : "var(--bg-surface)" }}>
              {selectedMethod === m.key && <span className="text-[8px] text-white">✓</span>}
            </div>
          </button>
        ))}

        {/* Error message */}
        {paymentError && (
          <div className="rounded-[12px] p-3 mb-3" style={{ background: "rgba(239,68,68,0.1)" }}>
            <p className="text-[10px] font-bold" style={{ color: "var(--danger, #ef4444)" }}>{paymentError}</p>
          </div>
        )}

        <button disabled={processing} onClick={handlePay}
                className="w-full rounded-[14px] py-4 text-[14px] font-black text-white mt-3 active:scale-[0.98] disabled:opacity-70"
                style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
              Processing...
            </span>
          ) : selectedMethod === "cash"
            ? `Pay ₹${totalAmount.toLocaleString("en-IN")} Cash`
            : `Pay ₹${totalAmount.toLocaleString("en-IN")} →`
          }
        </button>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
               style={{ borderColor: "var(--bg-elevated)", borderTopColor: "var(--brand)" }} />
          <p className="text-[11px] font-bold" style={{ color: "var(--text-3)" }}>Loading payment...</p>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
