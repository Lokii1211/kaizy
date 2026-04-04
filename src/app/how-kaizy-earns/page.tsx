"use client";

import { useTheme } from "@/stores/ThemeStore";
import Link from "next/link";

// ═══════════════════════════════════════
// HOW KAIZY EARNS — Transparency Page
// Bible ref: PreLaunch Bible Final → PROMPT PAY-MODEL-01 Task 6
// "Build 'How Kaizy earns' page — transparency is non-negotiable"
// ═══════════════════════════════════════

export default function HowKaizyEarnsPage() {
  const { isDark } = useTheme();

  const steps = [
    {
      emoji: "💼",
      title: "You earn ₹600 for a job",
      sub: "Full job amount charged to the customer",
      color: "#FFB800",
    },
    {
      emoji: "🤝",
      title: "You share ₹5 with Kaizy",
      sub: "Flat ₹5 platform contribution — less than a chai",
      color: "#FF6B00",
    },
    {
      emoji: "💰",
      title: "You receive ₹595 in 2 minutes",
      sub: "Instantly to your UPI. Same day. Every time.",
      color: "#00D084",
    },
  ];

  const faqs = [
    {
      q: "Why ₹5?",
      a: "Kaizy finds you customers, verifies them, holds payment safely, and pays you instantly. ₹5 keeps all of this free for you. Urban Company takes 20-25%. We take ₹5.",
    },
    {
      q: "What if I don't pay?",
      a: "New job alerts pause until cleared. One tap to pay and resume. No hidden charges, no penalties.",
    },
    {
      q: "Is this the same for all jobs?",
      a: "Yes — whether you earn ₹200 or ₹2,000, you share just ₹5 with Kaizy. Flat rate, always transparent.",
    },
    {
      q: "How does Kaizy make money?",
      a: "We charge the customer a small service fee (10%). Plus ₹5 from each job. That's it. No hidden charges on either side.",
    },
    {
      q: "Can I see all my deductions?",
      a: "Yes! Every job shows a full breakdown: what you earned, the ₹5 contribution, and what you received. Check your Earnings page anytime.",
    },
    {
      q: "What about KaizyPro?",
      a: "Workers with 100+ jobs and 4.5+ rating can subscribe for ₹299/month — that gets you 0% commission, top placement, priority alerts, and the KaizyPro badge.",
    },
  ];

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: "var(--bg-app)" }}
    >
      {/* Header */}
      <div
        className="px-4 pt-14 pb-8"
        style={{
          background: "linear-gradient(180deg, var(--brand) 0%, transparent 100%)",
        }}
      >
        <Link
          href="/settings"
          className="text-white/70 text-[13px] font-semibold"
        >
          ← Back
        </Link>
        <h1
          className="text-[28px] font-extrabold mt-4"
          style={{ color: "#fff" }}
        >
          How Kaizy Earns 💡
        </h1>
        <p className="text-[14px] text-white/70 mt-1">
          Full transparency. No hidden fees. Ever.
        </p>
      </div>

      {/* 3-Step Flow */}
      <div className="px-4 -mt-4">
        <div
          className="rounded-[20px] p-5"
          style={{ background: "var(--bg-card)" }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-wider mb-5"
            style={{ color: "var(--text-3)" }}
          >
            How it works — every single job
          </p>

          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 mb-6 last:mb-0">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-[24px]"
                  style={{
                    background: `${step.color}20`,
                    border: `2px solid ${step.color}`,
                  }}
                >
                  {step.emoji}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="w-[2px] h-8 mt-2"
                    style={{ background: "var(--border)" }}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pt-1">
                <p
                  className="text-[16px] font-extrabold"
                  style={{ color: step.color }}
                >
                  {step.title}
                </p>
                <p
                  className="text-[13px] mt-1"
                  style={{ color: "var(--text-2)" }}
                >
                  {step.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Card */}
      <div className="px-4 mt-4">
        <div
          className="rounded-[20px] p-5"
          style={{ background: "var(--bg-card)" }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-wider mb-4"
            style={{ color: "var(--text-3)" }}
          >
            Compare with other platforms
          </p>

          {[
            { name: "Urban Company", fee: "20-25%", amount: "₹120-₹150", color: "#FF3B3B" },
            { name: "JustDial", fee: "15%", amount: "₹90", color: "#FF8C00" },
            { name: "Contractor", fee: "30-50%", amount: "₹180-₹300", color: "#FF3B3B" },
            { name: "Kaizy", fee: "₹5 flat", amount: "₹5", color: "#00D084" },
          ].map((platform, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3"
              style={{
                borderBottom: i < 3 ? "1px solid var(--border)" : "none",
              }}
            >
              <div>
                <p
                  className="text-[14px] font-bold"
                  style={{
                    color:
                      platform.name === "Kaizy"
                        ? "var(--brand)"
                        : "var(--text-1)",
                  }}
                >
                  {platform.name}
                  {platform.name === "Kaizy" && " ⭐"}
                </p>
                <p
                  className="text-[12px]"
                  style={{ color: "var(--text-3)" }}
                >
                  Commission: {platform.fee}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-[16px] font-extrabold"
                  style={{ color: platform.color }}
                >
                  {platform.amount}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--text-3)" }}
                >
                  per ₹600 job
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 mt-4">
        <div
          className="rounded-[20px] p-5"
          style={{ background: "var(--bg-card)" }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-wider mb-4"
            style={{ color: "var(--text-3)" }}
          >
            Frequently Asked Questions
          </p>

          {faqs.map((faq, i) => (
            <details
              key={i}
              className="mb-3 last:mb-0"
              style={{
                borderBottom: i < faqs.length - 1 ? "1px solid var(--border)" : "none",
                paddingBottom: 12,
              }}
            >
              <summary
                className="text-[14px] font-bold cursor-pointer"
                style={{ color: "var(--text-1)" }}
              >
                {faq.q}
              </summary>
              <p
                className="text-[13px] mt-2 leading-relaxed"
                style={{ color: "var(--text-2)" }}
              >
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Trust badge */}
      <div className="px-4 mt-4 mb-8">
        <div
          className="rounded-[20px] p-5 text-center"
          style={{
            background: isDark
              ? "rgba(255,107,0,0.08)"
              : "rgba(255,107,0,0.05)",
            border: "1px solid rgba(255,107,0,0.2)",
          }}
        >
          <p className="text-[24px] mb-2">🤝</p>
          <p
            className="text-[15px] font-extrabold"
            style={{ color: "var(--brand)" }}
          >
            Kaizy&apos;s Promise
          </p>
          <p
            className="text-[13px] mt-2 leading-relaxed"
            style={{ color: "var(--text-2)" }}
          >
            We will never silently increase the ₹5 fee.
            <br />
            Any changes will be announced 30 days in advance.
            <br />
            Your earnings are your earnings. Always.
          </p>
        </div>
      </div>
    </div>
  );
}
