"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// KAIZYPASS v11.0 — Worker's Digital Identity Card
// LinkedIn profile + Aadhaar card combined
// Shareable via WhatsApp · QR code · PDF download
// Reference: Urban Company Pro Profile
// ============================================================

interface UserProfile {
  name: string; phone: string; user_type: string;
  trade?: string; experience_years?: number;
  avg_rating?: number; total_jobs?: number; kaizy_score?: number;
  aadhaar_verified?: boolean; skill_verified?: boolean;
  address_verified?: boolean; bank_verified?: boolean;
  bio?: string; member_since?: string;
  completion_rate?: number;
}

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};

// Badges based on achievements
function getBadges(user: UserProfile) {
  const badges: { id: string; icon: string; label: string; earned: boolean }[] = [
    { id: "century", icon: "💪", label: "Century (100+ jobs)", earned: (user.total_jobs || 0) >= 100 },
    { id: "star", icon: "⭐", label: "Star Worker (4.5+ rating)", earned: (user.avg_rating || 0) >= 4.5 },
    { id: "elite", icon: "🏆", label: "Elite (500+ jobs, 4.8+)", earned: (user.total_jobs || 0) >= 500 && (user.avg_rating || 0) >= 4.8 },
    { id: "speed", icon: "⚡", label: "Speed Demon", earned: (user.total_jobs || 0) >= 20 },
    { id: "streak", icon: "🔥", label: "Hot Streak (7 in 7 days)", earned: (user.total_jobs || 0) >= 7 },
    { id: "verified", icon: "✅", label: "Fully Verified", earned: !!(user.aadhaar_verified && user.bank_verified) },
  ];
  return badges;
}

export default function KaizyPassPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(j => {
      if (j.success && j.data) setUser(j.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const name = user?.name || user?.phone?.replace("+91", "") || "Worker";
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const trade = user?.trade || "Worker";
  const exp = user?.experience_years || 0;
  const rating = user?.avg_rating || 0;
  const jobs = user?.total_jobs || 0;
  const ks = user?.kaizy_score || 0;
  const kaizyId = `KZ-CBE-${String(Math.abs(name.charCodeAt(0) * 137 + jobs * 17) % 9999).padStart(4, "0")}-24`;

  const verificationLevels = [
    { label: "Identity", icon: "🪪", verified: user?.aadhaar_verified || false, color: "var(--success)" },
    { label: "Skill", icon: "🎯", verified: user?.skill_verified || false, color: "var(--warning)" },
    { label: "Address", icon: "📍", verified: user?.address_verified || false, color: "var(--info)" },
    { label: "Bank", icon: "🏦", verified: user?.bank_verified || false, color: "#8B5CF6" },
  ];

  const badges = user ? getBadges(user) : [];
  const earnedBadges = badges.filter(b => b.earned);

  const handleShare = async () => {
    const shareText = `${name} — Verified ${trade} on Kaizy\n⭐ ${rating.toFixed(1)} rating · ${jobs} jobs done\n🏅 KaizyScore: ${ks}\n🆔 ${kaizyId}\n\nBook me on Kaizy: https://kaizy.com/worker/${kaizyId}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} — KaizyPass`, text: shareText, url: `https://kaizy.com/worker/${kaizyId}` });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareText);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
        <div className="px-5 pt-5"><div className="skeleton h-9 w-9 rounded-xl" /></div>
        <div className="text-center pt-8 pb-6 px-5">
          <div className="skeleton w-24 h-24 rounded-full mx-auto mb-3" />
          <div className="skeleton h-6 w-40 rounded-full mx-auto mb-2" />
          <div className="skeleton h-3 w-28 rounded-full mx-auto" />
        </div>
        <div className="grid grid-cols-4 gap-2 px-5">{[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-[14px]" />)}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-2 flex justify-between items-center">
        <Link href="/settings" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "var(--bg-surface)" }}>
          <span className="text-[14px]">←</span>
        </Link>
        <h1 className="text-[14px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
          KaizyPass
        </h1>
        <button onClick={handleShare}
                className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
          <span className="text-[14px]">{shareSuccess ? "✅" : "📤"}</span>
        </button>
      </div>

      {/* ═══ DIGITAL ID CARD ═══ */}
      <div className="mx-5 mt-3 rounded-[24px] overflow-hidden"
           style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
        {/* Card header pattern */}
        <div className="relative px-5 pt-6 pb-10">
          <div className="absolute top-3 right-4 text-[8px] font-bold text-white/40 uppercase tracking-widest">
            KAIZY VERIFIED
          </div>
          <div className="flex items-center gap-4">
            <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[28px] font-black text-white shrink-0"
                 style={{ background: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.3)", backdropFilter: "blur(8px)" }}>
              {initials}
            </div>
            <div>
              <h2 className="text-[20px] font-black text-white tracking-tight" style={{ fontFamily: "'Epilogue', sans-serif" }}>
                {name}
              </h2>
              <p className="text-[11px] font-bold text-white/70">
                {tradeIcons[trade.toLowerCase()] || "🔧"} {trade} · {exp}+ yrs experience
              </p>
              <p className="text-[10px] font-bold text-white/50 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {kaizyId}
              </p>
            </div>
          </div>
        </div>

        {/* Card stats row */}
        <div className="grid grid-cols-4 gap-px" style={{ background: "rgba(255,255,255,0.08)" }}>
          {[
            { v: rating > 0 ? rating.toFixed(1) : "—", l: "Rating", icon: "⭐" },
            { v: String(jobs), l: "Jobs", icon: "📋" },
            { v: `${user?.completion_rate || 98}%`, l: "Done", icon: "✅" },
            { v: String(ks), l: "Score", icon: "🏅" },
          ].map(s => (
            <div key={s.l} className="py-3 text-center" style={{ background: "rgba(0,0,0,0.15)" }}>
              <p className="text-[10px] mb-0.5">{s.icon}</p>
              <p className="text-[16px] font-black text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {s.v}
              </p>
              <p className="text-[7px] font-bold uppercase tracking-wider text-white/50">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ VERIFICATION BADGES ═══ */}
      <div className="px-5 mt-6">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
          Verification Status
        </p>
        <div className="grid grid-cols-4 gap-2">
          {verificationLevels.map(v => (
            <div key={v.label} className="rounded-[14px] p-3 text-center"
                 style={{ background: v.verified ? `${v.color}15` : "var(--bg-card)" }}>
              <span className="text-[18px] block mb-1">{v.icon}</span>
              <p className="text-[8px] font-bold" style={{ color: v.verified ? v.color : "var(--text-3)" }}>
                {v.verified ? "✓ Verified" : "Pending"}
              </p>
              <p className="text-[7px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>{v.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ KAIZY SCORE ═══ */}
      <div className="mx-5 mt-5 rounded-[18px] p-4" style={{ background: "var(--brand-tint)" }}>
        <div className="flex items-center gap-4">
          <p className="text-[40px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>
            {ks}
          </p>
          <div className="flex-1">
            <p className="text-[12px] font-extrabold" style={{ color: "var(--text-1)" }}>
              KaizyScore™
            </p>
            <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
              {ks >= 700 ? "🟢 Credit Ready — Eligible for ₹50K loan" :
               ks >= 500 ? "🟡 Building — Keep completing jobs" :
               "🔴 Getting Started — Complete more jobs"}
            </p>
            <div className="rounded-full overflow-hidden mt-1.5" style={{ height: 6, background: "var(--bg-elevated)" }}>
              <div className="h-full rounded-full transition-all" style={{
                width: `${Math.min(100, (ks / 900) * 100)}%`,
                background: ks >= 700 ? "var(--success)" : ks >= 500 ? "var(--warning)" : "var(--danger)",
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BADGES ═══ */}
      <div className="px-5 mt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
          Badges ({earnedBadges.length}/{badges.length})
        </p>
        <div className="grid grid-cols-3 gap-2">
          {badges.map(badge => (
            <div key={badge.id} className="rounded-[14px] p-3 text-center"
                 style={{
                   background: badge.earned ? "var(--bg-card)" : "var(--bg-surface)",
                   opacity: badge.earned ? 1 : 0.4,
                 }}>
              <span className="text-[22px] block mb-1">{badge.icon}</span>
              <p className="text-[8px] font-bold" style={{ color: badge.earned ? "var(--text-1)" : "var(--text-3)" }}>
                {badge.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ BIO ═══ */}
      {user?.bio && (
        <div className="px-5 mt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>About</p>
          <p className="text-[11px] rounded-[14px] p-3.5 font-medium leading-relaxed"
             style={{ color: "var(--text-2)", background: "var(--bg-card)" }}>{user.bio}</p>
        </div>
      )}

      {/* ═══ SHARE OPTIONS (bottom bar) ═══ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-40 flex gap-2"
           style={{ background: "var(--bg-app)", borderTop: "1px solid var(--border-1)" }}>
        <button onClick={handleShare}
                className="flex-1 rounded-[14px] py-3.5 text-[12px] font-bold text-white active:scale-95 transition-transform"
                style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
          📤 Share KaizyPass
        </button>
        <Link href="/commission"
              className="rounded-[14px] py-3.5 px-5 text-[12px] font-bold text-center active:scale-95 transition-transform"
              style={{ background: "var(--bg-card)", color: "var(--text-1)" }}>
          💰 Commission
        </Link>
        <Link href="/settings"
              className="rounded-[14px] py-3.5 px-5 text-[12px] font-bold text-center active:scale-95 transition-transform"
              style={{ background: "var(--bg-card)", color: "var(--text-1)" }}>
          ✏️ Edit
        </Link>
      </div>
    </div>
  );
}
