"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Gift, Copy, Share2, CheckCircle2, Users, IndianRupee,
  MessageSquare, ChevronRight, Crown, TrendingUp, Award,
} from "lucide-react";

const referralTiers = [
  { tier: "Bronze", min: 1, max: 5, reward: "₹100", icon: "🥉", active: false },
  { tier: "Silver", min: 6, max: 15, reward: "₹150", icon: "🥈", active: true },
  { tier: "Gold", min: 16, max: 50, reward: "₹200", icon: "🥇", active: false },
  { tier: "Platinum", min: 51, max: 999, reward: "₹300", icon: "💎", active: false },
];

const history = [
  { name: "Vijay R", skill: "Electrician", status: "completed", reward: 150, date: "Mar 12", avatar: "VR" },
  { name: "Deepa K", skill: "Painter", status: "completed", reward: 150, date: "Mar 10", avatar: "DK" },
  { name: "Manoj S", skill: "Plumber", status: "pending", reward: 0, date: "Mar 14", avatar: "MS" },
  { name: "Asha D", skill: "Carpenter", status: "completed", reward: 150, date: "Mar 8", avatar: "AD" },
  { name: "Sunil M", skill: "Welder", status: "completed", reward: 100, date: "Mar 5", avatar: "SM" },
];

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const referralCode = "RAJU-KON-7821";

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://konnecton.in/r/${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = `🧡 KonnectOn pe register karo — FREE hai!\n\nMain already ₹48,000+ kama chuka hoon. Verified jobs, same-day UPI payment.\n\nMera code: ${referralCode}\n👉 https://konnecton.in/r/${referralCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500 to-purple-600 pt-3 pb-8 px-5 rounded-b-[28px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -mr-10 -mt-10" />

        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <span className="text-white font-bold text-sm">Refer & Earn</span>
          <div className="w-9" />
        </div>

        {/* Stats */}
        <div className="text-center mb-5">
          <p className="text-5xl font-extrabold text-white mb-1">₹1,650</p>
          <p className="text-sm text-white/60">Total earned from referrals</p>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <p className="text-lg font-extrabold text-white">12</p>
            <p className="text-[9px] text-white/50">Referrals</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <p className="text-lg font-extrabold text-white">🥈</p>
            <p className="text-[9px] text-white/50">Silver Tier</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
            <p className="text-lg font-extrabold text-white">₹150</p>
            <p className="text-[9px] text-white/50">Per Referral</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 mt-5">
        {/* Referral Code Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">YOUR CODE</p>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 font-mono font-extrabold text-lg tracking-[0.15em] text-center border border-dashed border-gray-200">
              {referralCode}
            </div>
            <button onClick={handleCopy} className={`w-12 h-12 rounded-xl flex items-center justify-center active:scale-90 transition-all ${copied ? "bg-green-500 text-white" : "bg-gray-100"}`}>
              {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5 text-gray-500" />}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleWhatsApp} className="flex items-center justify-center gap-2 bg-green-500 text-white py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-transform">
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </button>
            <button className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-transform">
              <Share2 className="w-4 h-4" /> More
            </button>
          </div>
        </div>

        {/* Tier Progress */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">TIER PROGRESS</p>
          <div className="flex gap-2 mb-3">
            {referralTiers.map(t => (
              <div key={t.tier} className={`flex-1 rounded-xl p-2.5 text-center transition-all ${
                t.active ? "bg-purple-50 border-2 border-purple-400 shadow-sm" : "bg-gray-50 border border-gray-100"
              }`}>
                <span className="text-xl block mb-0.5">{t.icon}</span>
                <p className={`text-[10px] font-bold ${t.active ? "text-purple-700" : "text-gray-400"}`}>{t.tier}</p>
                <p className={`text-[9px] font-bold ${t.active ? "text-purple-500" : "text-gray-300"}`}>{t.reward}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
            <span>Progress to Gold</span>
            <span className="font-bold">12/16</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: "75%" }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5"><span className="text-purple-600 font-bold">4 more</span> to unlock ₹200/referral!</p>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-3">HOW IT WORKS</p>
          <div className="space-y-3">
            {[
              { num: "1", text: "Share your code with any skilled worker", icon: Share2 },
              { num: "2", text: "They register & complete first job", icon: CheckCircle2 },
              { num: "3", text: "You get ₹100-₹300 in UPI within 24 hrs", icon: IndianRupee },
            ].map(s => (
              <div key={s.num} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-extrabold text-purple-600 shadow-sm shrink-0">{s.num}</div>
                <p className="text-xs text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-sm">Your Referrals</h3>
            <span className="text-[10px] text-gray-400">{history.length} total</span>
          </div>
          <div className="space-y-2">
            {history.map((ref, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">{ref.avatar}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{ref.name}</p>
                  <p className="text-[10px] text-gray-400">{ref.skill} • Joined {ref.date}</p>
                </div>
                <div className="text-right">
                  {ref.status === "completed" ? (
                    <>
                      <p className="text-sm font-extrabold text-green-600">+₹{ref.reward}</p>
                      <span className="text-[8px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Paid</span>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-gray-400">Pending</p>
                      <span className="text-[8px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">1st Job</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
