"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ════════════════════════════════════════════════════════════
// REFER & EARN — Real Supabase-backed referral system
// Like Uber's referral: Unique code → Share → Track → Earn
// Milestone bonuses + tiered rewards + leaderboard
// ════════════════════════════════════════════════════════════

interface Referral {
  referred_name: string; referred_phone: string; referred_skill: string;
  status: string; reward: number; created_at: string;
}
interface Milestone {
  count: number; bonus: number; badge: string; achieved: boolean;
}
interface ReferralData {
  code: string | null; tier: string; referrals: Referral[];
  totalEarned: number; completedCount: number; pendingCount: number;
  nextTierTarget: number | null;
  nextMilestone: { count: number; bonus: number; badge: string } | null;
  incentives: Milestone[];
}

const TIERS = [
  { tier: "Bronze", min: 1, max: 5, reward: "₹100", icon: "🥉" },
  { tier: "Silver", min: 6, max: 15, reward: "₹150", icon: "🥈" },
  { tier: "Gold", min: 16, max: 50, reward: "₹200", icon: "🥇" },
  { tier: "Platinum", min: 51, max: 999, reward: "₹300", icon: "💎" },
];

export default function ReferralPage() {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<"overview" | "incentives" | "leaderboard">("overview");
  const [data, setData] = useState<ReferralData>({
    code: null, tier: "bronze", referrals: [], totalEarned: 0,
    completedCount: 0, pendingCount: 0, nextTierTarget: 6,
    nextMilestone: null, incentives: [],
  });

  // Fetch real referral data from API
  const fetchStats = useCallback(async (userId: string) => {
    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stats", userId }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(prev => ({ ...prev, ...json.data }));
      }
    } catch {}
    setLoading(false);
  }, []);

  // Get or generate referral code
  const generateCode = useCallback(async () => {
    setGenerating(true);
    try {
      // Get user info from auth
      const authRes = await fetch("/api/auth/me");
      const authJson = await authRes.json();
      const userId = authJson.data?.id || authJson.data?.phone || "guest";
      const name = authJson.data?.name || authJson.data?.phone || "User";
      const phone = authJson.data?.phone || "";

      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_code", userId, name, phone }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(prev => ({ ...prev, ...json.data }));
      }
    } catch {}
    setGenerating(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await fetch("/api/auth/me");
        const authJson = await authRes.json();
        const userId = authJson.data?.id || authJson.data?.phone;
        if (userId) {
          await fetchStats(userId);
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };
    init();
  }, [fetchStats]);

  const handleCopy = () => {
    if (!data.code) return;
    const url = `https://kaizyy.vercel.app/join?ref=${data.code}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (platform: "whatsapp" | "native") => {
    if (!data.code) return;
    const url = `https://kaizyy.vercel.app/join?ref=${data.code}`;
    const text = `🧡 Kaizy pe register karo — FREE hai!\n\nVerified workers, instant booking, same-day payment.\n\nMera code: ${data.code}\n👉 ${url}`;

    if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      try {
        await navigator.share({ title: "Join Kaizy", text, url });
      } catch {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const currentTierIdx = TIERS.findIndex(t => t.tier.toLowerCase() === data.tier);
  const progressTarget = data.nextTierTarget || (currentTierIdx >= 0 ? TIERS[currentTierIdx].max : 5);
  const progressPct = Math.min((data.completedCount / progressTarget) * 100, 100);

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* ── Header ── */}
      <div className="relative pt-3 pb-8 px-5 rounded-b-[28px] overflow-hidden"
           style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6, #6366F1)" }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full -mr-10 -mt-10" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full -ml-8 -mb-8" style={{ background: "rgba(255,255,255,0.03)" }} />

        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90" 
                style={{ background: "rgba(255,255,255,0.15)" }}>
            <span className="text-white text-[14px]">←</span>
          </Link>
          <span className="text-white font-bold text-sm">Refer & Earn</span>
          <div className="w-9" />
        </div>

        {/* Stats */}
        <div className="text-center mb-5">
          <p className="text-[42px] font-black text-white leading-none" style={{ fontFamily: "var(--font-syne, 'Syne'), sans-serif" }}>
            ₹{data.totalEarned.toLocaleString()}
          </p>
          <p className="text-[12px] text-white/60 mt-1">Total earned from referrals</p>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.1)" }}>
            <p className="text-lg font-black text-white">{data.completedCount}</p>
            <p className="text-[9px] text-white/50">Completed</p>
          </div>
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.1)" }}>
            <p className="text-lg text-white">{TIERS[currentTierIdx >= 0 ? currentTierIdx : 0]?.icon}</p>
            <p className="text-[9px] text-white/50">{data.tier.charAt(0).toUpperCase() + data.tier.slice(1)} Tier</p>
          </div>
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.1)" }}>
            <p className="text-lg font-black text-white">{data.pendingCount}</p>
            <p className="text-[9px] text-white/50">Pending</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mx-4 mt-4 rounded-xl p-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
        {(["overview", "incentives", "leaderboard"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
                  className="flex-1 rounded-lg py-2 text-[11px] font-bold transition-all"
                  style={{
                    background: tab === t ? "var(--brand)" : "transparent",
                    color: tab === t ? "#fff" : "var(--text-3)",
                  }}>
            {t === "overview" ? "📊 Overview" : t === "incentives" ? "🎁 Incentives" : "🏆 Leaderboard"}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
          </div>
        ) : tab === "overview" ? (
          <>
            {/* ── Referral Code Card ── */}
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "var(--text-3)" }}>YOUR UNIQUE CODE</p>
              
              {data.code ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 rounded-xl px-4 py-3 font-mono font-black text-lg tracking-[0.15em] text-center"
                         style={{ background: "var(--bg-elevated)", border: "2px dashed var(--brand)", color: "var(--text-1)" }}>
                      {data.code}
                    </div>
                    <button onClick={handleCopy}
                            className="w-12 h-12 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                            style={{ background: copied ? "var(--success)" : "var(--bg-elevated)", color: copied ? "#fff" : "var(--text-2)" }}>
                      {copied ? "✓" : "📋"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleShare("whatsapp")}
                            className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[12px] text-white active:scale-95"
                            style={{ background: "#25D366" }}>
                      💬 WhatsApp
                    </button>
                    <button onClick={() => handleShare("native")}
                            className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[12px] active:scale-95"
                            style={{ background: "var(--bg-elevated)", color: "var(--text-1)", border: "1px solid var(--border-1)" }}>
                      📤 Share Link
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={generateCode} disabled={generating}
                        className="w-full rounded-xl py-4 text-[14px] font-black text-white active:scale-95 disabled:opacity-60"
                        style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>
                  {generating ? "Generating..." : "🎯 Get Your Unique Referral Code"}
                </button>
              )}
            </div>

            {/* ── Tier Progress ── */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "var(--text-3)" }}>TIER PROGRESS</p>
              <div className="flex gap-2 mb-3">
                {TIERS.map((t, i) => (
                  <div key={t.tier} className="flex-1 rounded-xl p-2.5 text-center transition-all"
                       style={{
                         background: i === currentTierIdx ? "var(--brand-tint)" : "var(--bg-elevated)",
                         border: i === currentTierIdx ? "2px solid var(--brand)" : "1px solid var(--border-1)",
                       }}>
                    <span className="text-xl block mb-0.5">{t.icon}</span>
                    <p className="text-[10px] font-bold" style={{ color: i === currentTierIdx ? "var(--brand)" : "var(--text-3)" }}>{t.tier}</p>
                    <p className="text-[9px] font-bold" style={{ color: i === currentTierIdx ? "var(--brand)" : "var(--text-3)" }}>{t.reward}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] mb-1.5" style={{ color: "var(--text-3)" }}>
                <span>Progress to next tier</span>
                <span className="font-bold">{data.completedCount}/{progressTarget}</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #EC4899, #8B5CF6)" }} />
              </div>
              {data.nextTierTarget && (
                <p className="text-[10px] mt-1.5" style={{ color: "var(--text-3)" }}>
                  <span className="font-bold" style={{ color: "var(--brand)" }}>{data.nextTierTarget - data.completedCount} more</span> to unlock higher rewards!
                </p>
              )}
            </div>

            {/* ── How It Works ── */}
            <div className="rounded-2xl p-4" style={{ background: "var(--brand-tint)", border: "1px solid var(--brand)" }}>
              <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "var(--brand)" }}>HOW IT WORKS</p>
              <div className="space-y-3">
                {[
                  { num: "1", text: "Share your unique code or link with anyone" },
                  { num: "2", text: "They register on Kaizy using your code" },
                  { num: "3", text: "After their first job, you BOTH get rewards" },
                  { num: "4", text: "Amount paid via UPI within 24 hours" },
                ].map(s => (
                  <div key={s.num} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                         style={{ background: "var(--brand)", color: "#fff" }}>{s.num}</div>
                    <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Referral History ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-black" style={{ color: "var(--text-1)" }}>Your Referrals</h3>
                <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{data.referrals.length} total</span>
              </div>

              {data.referrals.length === 0 ? (
                <div className="rounded-2xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
                  <p className="text-[32px] mb-2">🎯</p>
                  <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>No referrals yet</p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
                    Share your code and start earning!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.referrals.map((ref, i) => {
                    const initials = ref.referred_name?.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
                    return (
                      <div key={i} className="rounded-2xl p-4 flex items-center gap-3" 
                           style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold"
                             style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>{initials}</div>
                        <div className="flex-1">
                          <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{ref.referred_name}</p>
                          <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                            {ref.referred_skill} · {new Date(ref.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <div className="text-right">
                          {ref.status === "completed" ? (
                            <>
                              <p className="text-[13px] font-black" style={{ color: "var(--success)" }}>+₹{ref.reward}</p>
                              <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "var(--success)" }}>Paid ✓</span>
                            </>
                          ) : (
                            <>
                              <p className="text-[12px] font-bold" style={{ color: "var(--text-3)" }}>Pending</p>
                              <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>1st Job</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : tab === "incentives" ? (
          <>
            {/* ── Milestone Bonuses ── */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: "var(--text-3)" }}>MILESTONE BONUSES</p>
              <p className="text-[11px] mb-4" style={{ color: "var(--text-3)" }}>
                Hit referral milestones to earn massive bonuses!
              </p>
              <div className="space-y-3">
                {[
                  { count: 5, bonus: 250, badge: "🎯 First Five", desc: "Get 5 referrals" },
                  { count: 10, bonus: 500, badge: "🔥 On Fire", desc: "Get 10 referrals" },
                  { count: 25, bonus: 1000, badge: "⭐ Star Referrer", desc: "Get 25 referrals" },
                  { count: 50, bonus: 2500, badge: "💎 Legend", desc: "Get 50 referrals" },
                  { count: 100, bonus: 5000, badge: "👑 Champion", desc: "Get 100 referrals" },
                ].map(m => {
                  const achieved = data.completedCount >= m.count;
                  const progress = Math.min((data.completedCount / m.count) * 100, 100);
                  return (
                    <div key={m.count} className="rounded-xl p-4" 
                         style={{ 
                           background: achieved ? "var(--success-tint)" : "var(--bg-elevated)",
                           border: achieved ? "1px solid var(--success)" : "1px solid var(--border-1)",
                           opacity: achieved ? 1 : 0.85,
                         }}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[24px]">{m.badge.split(" ")[0]}</span>
                        <div className="flex-1">
                          <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>
                            {m.badge.split(" ").slice(1).join(" ")}
                          </p>
                          <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{m.desc}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[15px] font-black" style={{ color: achieved ? "var(--success)" : "var(--brand)" }}>
                            +₹{m.bonus}
                          </p>
                          {achieved && <span className="text-[8px] font-bold" style={{ color: "var(--success)" }}>CLAIMED ✓</span>}
                        </div>
                      </div>
                      {!achieved && (
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-1)" }}>
                          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "var(--brand)" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Referral Perks ── */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "var(--text-3)" }}>REFERRAL PERKS</p>
              <div className="space-y-2">
                {[
                  { icon: "🤝", title: "Both Earn", desc: "You AND your referral get rewards" },
                  { icon: "⚡", title: "Instant UPI", desc: "Rewards credited within 24 hours" },
                  { icon: "📈", title: "Tier Upgrades", desc: "More referrals = higher per-referral rewards" },
                  { icon: "🏆", title: "Leaderboard", desc: "Top referrers get featured & bonus rewards" },
                  { icon: "🎁", title: "Surprise Bonuses", desc: "Random extra rewards on special occasions" },
                  { icon: "💳", title: "No Limit", desc: "Refer unlimited people, earn unlimited" },
                ].map(perk => (
                  <div key={perk.title} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--bg-elevated)" }}>
                    <span className="text-[20px]">{perk.icon}</span>
                    <div>
                      <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{perk.title}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{perk.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* ── Leaderboard Tab ── */
          <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: "var(--text-3)" }}>TOP REFERRERS</p>
            <p className="text-[11px] mb-4" style={{ color: "var(--text-3)" }}>
              Top referrers this month — updated in real-time
            </p>
            <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-elevated)" }}>
              <p className="text-[32px] mb-2">🏆</p>
              <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Leaderboard</p>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
                Be the first to top the leaderboard!<br/>
                Share your code and start referring.
              </p>
              <p className="text-[10px] mt-3 font-bold" style={{ color: "var(--brand)" }}>
                🥇 1st place gets ₹2,000 monthly bonus<br/>
                🥈 2nd place gets ₹1,000 monthly bonus<br/>
                🥉 3rd place gets ₹500 monthly bonus
              </p>
            </div>
            <p className="text-center text-[10px] mt-3" style={{ color: "var(--text-3)" }}>
              Leaderboard populates when referrals start coming in 🏆
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
