"use client";

import { useState } from "react";
import Link from "next/link";

// ============================================================
// REFER & EARN v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · JetBrains Mono data · Gradient CTAs
// ============================================================

const steps = [
  { icon: "📤", title: "Invite friends", desc: "Share your unique referral code with your inner circle via any social app." },
  { icon: "📋", title: "They book a service", desc: "Your friend joins Kaizy and completes their first professional booking." },
  { icon: "🎉", title: "You both get rewards", desc: "Instantly receive ₹500 in your Kaizy wallet, and your friend gets a welcome bonus!" },
];

const rewards = [
  { count: 3, reward: "₹1,500 + Silver Badge", unlocked: true },
  { count: 5, reward: "₹2,500 + Gold Badge", unlocked: false },
  { count: 10, reward: "₹5,000 + Platinum Badge", unlocked: false },
  { count: 25, reward: "₹15,000 + Elite Status", unlocked: false },
];

export default function ReferralPage() {
  const referralCode = "KAIZY-7X9K2";
  const [copied, setCopied] = useState(false);
  const totalEarned = 2500;
  const totalReferred = 5;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join Kaizy — Get ₹500 Free!",
        text: `Use my referral code ${referralCode} to get ₹500 off your first booking on Kaizy!`,
        url: `https://kaizy.com/invite?ref=${referralCode}`,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Gradient hero */}
      <div className="px-5 pt-5 pb-8 rounded-b-[28px]" style={{ background: "var(--gradient-cta)" }}>
        <div className="flex items-center justify-between mb-5">
          <Link href="/settings" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "rgba(255,255,255,0.15)" }}>
            <span className="text-[14px] text-white">←</span>
          </Link>
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Refer & Earn</span>
          <div className="w-9" />
        </div>

        <div className="text-center">
          <span className="text-[48px] block mb-2">🎁</span>
          <h1 className="text-[22px] font-black tracking-tight text-white" style={{ fontFamily: "'Epilogue', sans-serif" }}>
            Earn ₹500 for every friend
          </h1>
          <p className="text-[11px] mt-1 font-medium text-white/50">
            Share the Kaizy experience and unlock premium rewards together
          </p>
        </div>
      </div>

      <div className="px-5 -mt-5 space-y-4">
        {/* Referral code card */}
        <div className="rounded-[20px] p-5 text-center" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Your Referral Code</p>
          <p className="text-[28px] font-black mt-2 tracking-[0.2em]"
             style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>{referralCode}</p>

          <div className="flex gap-2.5 mt-4">
            <button onClick={handleCopy}
                    className="flex-1 rounded-[14px] py-3 text-[11px] font-bold active:scale-95 transition-all"
                    style={{ background: "var(--bg-surface)", color: "var(--text-1)" }}>
              {copied ? "✅ Copied!" : "📋 Copy Code"}
            </button>
            <button onClick={handleShare}
                    className="flex-1 rounded-[14px] py-3 text-[11px] font-bold text-white active:scale-95 transition-all"
                    style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
              📤 Share Now
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[16px] p-4 text-center" style={{ background: "var(--bg-surface)" }}>
            <p className="text-[24px] font-black" style={{ color: "var(--success)", fontFamily: "'JetBrains Mono', monospace" }}>
              ₹{totalEarned.toLocaleString("en-IN")}
            </p>
            <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>Total Earned</p>
          </div>
          <div className="rounded-[16px] p-4 text-center" style={{ background: "var(--bg-surface)" }}>
            <p className="text-[24px] font-black" style={{ color: "var(--brand)", fontFamily: "'Epilogue', sans-serif" }}>
              {totalReferred}
            </p>
            <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>Friends Referred</p>
          </div>
        </div>

        {/* How it works */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>How it Works</p>
          <div className="space-y-2.5">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-[16px] p-4" style={{ background: "var(--bg-card)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0"
                     style={{ background: "var(--bg-surface)" }}>{s.icon}</div>
                <div>
                  <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>
                    <span className="text-[10px] font-black mr-1.5" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.title}
                  </p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reward milestones */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Reward Milestones</p>
          <div className="space-y-2">
            {rewards.map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-[14px] p-3.5"
                   style={{ background: r.unlocked ? "var(--brand-tint)" : "var(--bg-surface)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px]"
                     style={{ background: r.unlocked ? "var(--brand)" : "var(--bg-card)", color: r.unlocked ? "#fff" : "var(--text-3)" }}>
                  {r.unlocked ? "✓" : `${r.count}`}
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{r.count} Referrals</p>
                  <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{r.reward}</p>
                </div>
                {r.unlocked && (
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--success)", color: "#fff" }}>Unlocked</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
