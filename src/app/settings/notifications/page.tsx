"use client";

import { useState } from "react";
import Link from "next/link";

// ============================================================
// NOTIFICATION PREFERENCES v10.0 — Stitch "Digital Artisan" Design
// Toggle switches · Tonal groups · Epilogue headlines
// ============================================================

interface PrefGroup {
  title: string;
  icon: string;
  items: { label: string; desc: string; key: string; default: boolean }[];
}

const prefGroups: PrefGroup[] = [
  {
    title: "Job Alerts", icon: "💼",
    items: [
      { label: "New job nearby", desc: "When a hirer posts a job matching your trade within 5km", key: "job_nearby", default: true },
      { label: "Urgent jobs (SOS)", desc: "Emergency roadside or urgent repair requests", key: "job_sos", default: true },
      { label: "High-value jobs", desc: "Jobs above ₹1,000 matching your specialization", key: "job_high", default: true },
    ],
  },
  {
    title: "Booking Updates", icon: "📋",
    items: [
      { label: "Booking confirmed", desc: "When a hirer confirms and pays for your service", key: "booking_confirm", default: true },
      { label: "Booking cancelled", desc: "When a booking is cancelled by the hirer", key: "booking_cancel", default: true },
      { label: "Booking reminders", desc: "30 minutes before your scheduled job", key: "booking_reminder", default: true },
      { label: "Review received", desc: "When a hirer rates your completed job", key: "booking_review", default: true },
    ],
  },
  {
    title: "Earnings & Payments", icon: "💰",
    items: [
      { label: "Payment received", desc: "When cash/UPI payment is recorded", key: "pay_received", default: true },
      { label: "Weekly earnings summary", desc: "Weekly report of earnings, jobs, and rating", key: "pay_weekly", default: true },
      { label: "Withdrawal alerts", desc: "When funds are withdrawn to your bank", key: "pay_withdraw", default: false },
    ],
  },
  {
    title: "App & Promotions", icon: "🎁",
    items: [
      { label: "Referral updates", desc: "When a friend signs up using your code", key: "promo_referral", default: true },
      { label: "Special offers", desc: "Seasonal promotions and bonus opportunities", key: "promo_offers", default: false },
      { label: "Tips & tutorials", desc: "Pro tips to increase your KaizyScore", key: "promo_tips", default: false },
    ],
  },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="w-11 h-6 rounded-full p-0.5 transition-all shrink-0"
            style={{ background: on ? "var(--brand)" : "var(--bg-elevated)" }}>
      <div className="w-5 h-5 rounded-full bg-white transition-transform"
           style={{ transform: on ? "translateX(20px)" : "translateX(0)" }} />
    </button>
  );
}

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    prefGroups.forEach(g => g.items.forEach(i => { initial[i.key] = i.default; }));
    return initial;
  });

  const toggle = (key: string) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const [channels, setChannels] = useState({ push: true, whatsapp: true, sms: false });

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/settings" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Notification Preferences
          </h1>
        </div>
      </div>

      <div className="px-5 space-y-5 mt-3">
        {/* Delivery channels */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "var(--text-3)" }}>Delivery Channels</p>
          <div className="rounded-[18px] p-1" style={{ background: "var(--bg-card)" }}>
            {[
              { key: "push" as const, icon: "🔔", label: "Push Notifications" },
              { key: "whatsapp" as const, icon: "💬", label: "WhatsApp Messages" },
              { key: "sms" as const, icon: "📱", label: "SMS Alerts" },
            ].map((ch, i) => (
              <div key={ch.key} className="flex items-center justify-between p-3.5"
                   style={{ borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div className="flex items-center gap-3">
                  <span className="text-[16px]">{ch.icon}</span>
                  <span className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{ch.label}</span>
                </div>
                <Toggle on={channels[ch.key]} onChange={() => setChannels(c => ({ ...c, [ch.key]: !c[ch.key] }))} />
              </div>
            ))}
          </div>
        </div>

        {/* Preference groups */}
        {prefGroups.map(group => (
          <div key={group.title}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[14px]">{group.icon}</span>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>{group.title}</p>
            </div>
            <div className="rounded-[18px] p-1" style={{ background: "var(--bg-card)" }}>
              {group.items.map((item, i) => (
                <div key={item.key} className="flex items-center justify-between p-3.5"
                     style={{ borderBottom: i < group.items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div className="flex-1 mr-3">
                    <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>{item.label}</p>
                    <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{item.desc}</p>
                  </div>
                  <Toggle on={prefs[item.key]} onChange={() => toggle(item.key)} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Quiet hours */}
        <div className="rounded-[18px] p-4" style={{ background: "var(--bg-card)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">🌙</span>
              <div>
                <p className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>Quiet Hours</p>
                <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>Mute non-urgent alerts</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "var(--bg-surface)", color: "var(--text-2)", fontFamily: "'JetBrains Mono', monospace" }}>
              10 PM — 7 AM
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
