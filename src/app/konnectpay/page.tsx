"use client";
import { useState } from "react";
import Link from "next/link";

export default function PaymentPage() {
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setDone(true); }, 2500);
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8" style={{ background: "var(--bg-app)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 animate-bounce-in"
             style={{ background: "var(--success)", boxShadow: "0 8px 32px rgba(0,208,132,0.3)" }}>
          <span className="text-white text-[32px]">✓</span>
        </div>
        <h1 className="text-[22px] font-black" style={{ color: "var(--text-1)" }}>Payment Successful! 🎉</h1>
        <p className="text-[12px] mt-2 text-center" style={{ color: "var(--text-3)" }}>₹665 held in escrow · Released on job completion</p>
        <Link href="/booking" className="mt-8 rounded-[14px] px-8 py-4 text-[14px] font-black text-white"
              style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>Track Worker →</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/booking" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}><span className="text-[14px]">←</span></Link>
          <div><p className="text-[10px] font-bold tracking-wider" style={{ color: "var(--brand)" }}>REVIEW & PAY</p>
          <h1 className="text-[18px] font-black" style={{ color: "var(--text-1)" }}>Confirm Booking</h1></div>
        </div>

        {/* Worker */}
        <div className="flex items-center gap-3 rounded-[14px] p-3 mb-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-[16px] font-black text-white" style={{ background: "#8B5CF6" }}>S</div>
          <div><p className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>Suresh Murugesan</p>
          <p className="text-[10px]" style={{ color: "var(--text-3)" }}>🚗 Auto Mechanic · Car Breakdown</p></div>
        </div>

        {/* Price */}
        <div className="rounded-[14px] p-4 mb-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <p className="text-[12px] font-extrabold mb-3" style={{ color: "var(--text-1)" }}>Price Breakdown</p>
          {[{l:"Worker charges",v:"₹600"},{l:"Platform fee (10%)",v:"₹60"},{l:"Job insurance ℹ️",v:"₹5"}].map(r => (
            <div key={r.l} className="flex justify-between py-1.5">
              <span className="text-[12px]" style={{ color: "var(--text-2)" }}>{r.l}</span>
              <span className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{r.v}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-2" style={{ borderTop: "1px solid var(--border-1)" }}>
            <span className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>Total</span>
            <span className="text-[18px] font-black" style={{ color: "var(--text-1)", fontFamily: "var(--font-syne)" }}>₹665</span>
          </div>
        </div>

        {/* Escrow */}
        <div className="rounded-[14px] p-3 mb-3" style={{ background: "var(--success-tint)", border: "1px solid var(--success)" }}>
          <p className="text-[11px] font-bold" style={{ color: "var(--success)" }}>🔒 Money held safely until job is done</p>
        </div>

        {/* Payment methods */}
        <p className="text-[11px] font-bold mb-2" style={{ color: "var(--text-3)" }}>Pay with</p>
        {[{icon:"G",name:"Google Pay",c:"#4285F4"},{icon:"📲",name:"PhonePe",c:"#5B2C8E"},{icon:"🏦",name:"UPI / Bank",c:"var(--brand)"}].map((m,i) => (
          <button key={m.name} className="w-full flex items-center gap-3 rounded-[14px] p-3 mb-2 active:scale-[0.98]"
                  style={{ background: "var(--bg-card)", border: i === 0 ? "2px solid var(--brand)" : "1px solid var(--border-1)" }}
                  onClick={handlePay}>
            <span className="text-[16px]" style={{ color: m.c }}>{m.icon}</span>
            <span className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{m.name}</span>
            <span className="ml-auto text-[12px]" style={{ color: "var(--text-3)" }}>→</span>
          </button>
        ))}

        <button disabled={processing} onClick={handlePay}
                className="w-full rounded-[14px] py-4 text-[14px] font-black text-white mt-3 active:scale-[0.98] disabled:opacity-70"
                style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
              Processing...
            </span>
          ) : "Pay ₹665 →"}
        </button>
      </div>
    </div>
  );
}
