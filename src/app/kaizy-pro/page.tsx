"use client";

import { useState } from "react";
import Link from "next/link";

// ═══════════════════════════════════════
// KAIZY PRO — Premium Worker Subscription
// Bible ref: PreLaunch Complete Bible → Part 10
// ₹299/month: 0% commission, top placement, priority alerts
// Eligibility: 100+ jobs, 4.5+ rating
// ═══════════════════════════════════════

export default function KaizyProPage() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  const plans = {
    monthly: { price: 299, per: "/month", save: null, razorpayPlan: "plan_monthly_299" },
    yearly: { price: 2499, per: "/year", save: "Save ₹1,089 (30%)", razorpayPlan: "plan_yearly_2499" },
  };

  const features = [
    { emoji: "💰", title: "0% Commission", desc: "Keep 100% of every job earning. No ₹5 deduction." },
    { emoji: "🔝", title: "Top Placement", desc: "Appear first in search results. More jobs, more earnings." },
    { emoji: "⚡", title: "Priority Alerts", desc: "Get job alerts 10 seconds before free-tier workers." },
    { emoji: "🏅", title: "KaizyPro Badge", desc: "Gold badge on your profile. Hirers trust you more." },
    { emoji: "📊", title: "Advanced Stats", desc: "Revenue trends, peak hours, demand heatmap." },
    { emoji: "📞", title: "Priority Support", desc: "Dedicated WhatsApp support line. Response in < 5 min." },
  ];

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          amount: plans[selectedPlan].price,
          razorpayPlan: plans[selectedPlan].razorpayPlan,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl;
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Gold gradient header */}
      <div
        className="px-5 pt-14 pb-10 text-center"
        style={{
          background: "linear-gradient(180deg, #2A1800 0%, var(--bg-app) 100%)",
        }}
      >
        <Link href="/settings" className="text-white/50 text-[13px] font-semibold">
          ← Back
        </Link>
        <div className="mt-6 mb-3">
          <span className="text-[48px]">👑</span>
        </div>
        <h1
          className="text-[28px] font-extrabold"
          style={{
            background: "linear-gradient(135deg, #FFD700, #FF8C00)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Kaizy Pro
        </h1>
        <p className="text-[14px] mt-2" style={{ color: "rgba(255,215,0,0.7)" }}>
          For workers who want to earn more
        </p>
      </div>

      {/* Plan selector */}
      <div className="px-5 -mt-4">
        <div className="flex gap-2 mb-5">
          {(["monthly", "yearly"] as const).map((plan) => (
            <button
              key={plan}
              onClick={() => setSelectedPlan(plan)}
              className="flex-1 rounded-[16px] py-4 text-center transition-all"
              style={{
                background: selectedPlan === plan
                  ? "linear-gradient(135deg, #FFD700, #FF8C00)"
                  : "var(--bg-card)",
                border: selectedPlan === plan
                  ? "none"
                  : "1px solid var(--border)",
              }}
            >
              <p
                className="text-[20px] font-black"
                style={{
                  color: selectedPlan === plan ? "#1C1C1E" : "var(--text-1)",
                }}
              >
                ₹{plans[plan].price}
              </p>
              <p
                className="text-[11px] font-bold"
                style={{
                  color: selectedPlan === plan ? "#1C1C1E" : "var(--text-3)",
                }}
              >
                {plans[plan].per}
              </p>
              {plans[plan].save && (
                <p
                  className="text-[10px] font-bold mt-1"
                  style={{
                    color: selectedPlan === plan ? "#1C1C1E" : "#00D084",
                  }}
                >
                  {plans[plan].save}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Features */}
        <div className="rounded-[20px] p-5 mb-5" style={{ background: "var(--bg-card)" }}>
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-4"
            style={{ color: "var(--text-3)" }}
          >
            Everything you get
          </p>
          {features.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-3"
              style={{
                borderBottom: i < features.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <span className="text-[22px] mt-0.5">{f.emoji}</span>
              <div>
                <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>
                  {f.title}
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ROI Calculator */}
        <div
          className="rounded-[20px] p-5 mb-5 text-center"
          style={{
            background: "rgba(255,215,0,0.05)",
            border: "1px solid rgba(255,215,0,0.15)",
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#FFD700" }}>
            💡 Worth it?
          </p>
          <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text-2)" }}>
            If you do <strong style={{ color: "var(--text-1)" }}>60+ jobs/month</strong>, you save:
          </p>
          <p className="text-[28px] font-black" style={{ color: "#00D084" }}>
            ₹{60 * 5 - plans[selectedPlan].price}/month
          </p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
            vs paying ₹5 per job on the free plan
          </p>
        </div>

        {/* Eligibility */}
        <div className="rounded-[20px] p-5 mb-5" style={{ background: "var(--bg-card)" }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Eligibility
          </p>
          {[
            { check: true, text: "100+ completed jobs" },
            { check: true, text: "4.5+ average rating" },
            { check: true, text: "Aadhaar verified" },
            { check: true, text: "< 5% cancellation rate" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <span className="text-[14px]">{item.check ? "✅" : "❌"}</span>
              <span className="text-[13px] font-medium" style={{ color: "var(--text-2)" }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Subscribe button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full rounded-[16px] py-4 text-[15px] font-black active:scale-[0.97] transition-all mb-4"
          style={{
            background: "linear-gradient(135deg, #FFD700, #FF8C00)",
            color: "#1C1C1E",
            boxShadow: "0 4px 20px rgba(255,140,0,0.3)",
          }}
        >
          {loading ? "Processing..." : `👑 Subscribe for ₹${plans[selectedPlan].price}${plans[selectedPlan].per}`}
        </button>

        <p className="text-[10px] text-center" style={{ color: "var(--text-3)" }}>
          Cancel anytime. No lock-in. Managed via Razorpay Subscriptions.
        </p>
      </div>
    </div>
  );
}
