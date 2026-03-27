"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

// ════════════════════════════════════════════════════════════
// WORKER INCENTIVES — Like Uber/Swiggy Driver Incentives
// Daily targets · Weekly streaks · Monthly milestones
// ════════════════════════════════════════════════════════════

interface Target {
  id: string; label: string; icon: string; bonus: number;
  current: number; achieved: boolean; progress: number;
  jobs?: number; streak?: number; rating?: number; earnings?: number;
}
interface IncentiveData {
  stats: { dailyJobs: number; weeklyJobs: number; monthlyJobs: number; monthlyEarnings: number; rating: number; streak: number };
  daily: { targets: Target[]; earned: number };
  weekly: { targets: Target[]; earned: number };
  monthly: { targets: Target[]; earned: number };
  special: { id: string; type: string; bonus: number; label: string; icon: string }[];
  summary: { totalEarned: number; totalPotential: number; nextTarget: string };
}

export default function IncentivesPage() {
  const { isDark } = useTheme();
  const [tab, setTab] = useState<"daily" | "weekly" | "monthly" | "special">("daily");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IncentiveData | null>(null);

  useEffect(() => {
    const fetchIncentives = async () => {
      try {
        const authRes = await fetch("/api/auth/me");
        const authJson = await authRes.json();
        const workerId = authJson.data?.id || "guest";
        
        const res = await fetch(`/api/incentives?worker_id=${workerId}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {}
      setLoading(false);
    };
    fetchIncentives();
  }, []);

  const stats = data?.stats || { dailyJobs: 0, weeklyJobs: 0, monthlyJobs: 0, monthlyEarnings: 0, rating: 0, streak: 0 };
  const summary = data?.summary || { totalEarned: 0, totalPotential: 0, nextTarget: "Loading..." };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* ── Header ── */}
      <div className="relative pt-3 pb-8 px-5 rounded-b-[28px] overflow-hidden"
           style={{ background: "linear-gradient(135deg, #FF6B00, #FF9500, #FFB800)" }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-8 -mt-8" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full -ml-6 -mb-6" style={{ background: "rgba(255,255,255,0.05)" }} />

        <div className="flex items-center justify-between mb-5">
          <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--brand-tint)" }}>
            <span className="text-white text-[14px]">←</span>
          </Link>
          <span className="text-white font-bold text-sm">Incentives & Targets</span>
          <div className="w-9" />
        </div>

        {/* Today's summary */}
        <div className="text-center mb-4">
          <p className="text-[10px] text-white/60 mb-1">TODAY&apos;S BONUS EARNED</p>
          <p className="text-[38px] font-black text-white leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ₹{summary.totalEarned.toLocaleString()}
          </p>
          <p className="text-[11px] text-white/50 mt-1">
            of ₹{summary.totalPotential.toLocaleString()} possible
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: "rgba(255,255,255,0.12)" }}>
            <p className="text-[18px] font-black text-white">{stats.dailyJobs}</p>
            <p className="text-[8px] text-white/50">Today</p>
          </div>
          <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: "rgba(255,255,255,0.12)" }}>
            <p className="text-[18px] font-black text-white">{stats.weeklyJobs}</p>
            <p className="text-[8px] text-white/50">This Week</p>
          </div>
          <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: "rgba(255,255,255,0.12)" }}>
            <p className="text-[18px] font-black text-white">{stats.streak}</p>
            <p className="text-[8px] text-white/50">Day Streak</p>
          </div>
          <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: "rgba(255,255,255,0.12)" }}>
            <p className="text-[18px] font-black text-white">⭐{stats.rating > 0 ? stats.rating.toFixed(1) : "—"}</p>
            <p className="text-[8px] text-white/50">Rating</p>
          </div>
        </div>
      </div>

      {/* ── Next Target Banner ── */}
      <div className="mx-4 mt-4 rounded-xl p-3 flex items-center gap-3"
           style={{ background: "var(--brand-tint)" }}>
        <span className="text-[24px]">🎯</span>
        <div className="flex-1">
          <p className="text-[10px] font-bold" style={{ color: "var(--brand)" }}>NEXT TARGET</p>
          <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{summary.nextTarget}</p>
        </div>
        <span className="text-[12px] font-bold" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>→</span>
      </div>

      {/* ── Period Tabs ── */}
      <div className="flex gap-1 mx-4 mt-4 rounded-xl p-1" style={{ background: "var(--bg-card)" }}>
        {(["daily", "weekly", "monthly", "special"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
                  className="flex-1 rounded-lg py-2 text-[10px] font-bold transition-all"
                  style={{
                    background: tab === t ? "var(--brand)" : "transparent",
                    color: tab === t ? "#fff" : "var(--text-3)",
                  }}>
            {t === "daily" ? "📅 Daily" : t === "weekly" ? "📊 Weekly" : t === "monthly" ? "🗓️ Monthly" : "🎁 Special"}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
          </div>
        ) : tab === "special" ? (
          /* ── Special Bonuses ── */
          <>
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)" }}>
              <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: "var(--text-3)" }}>SPECIAL BONUSES</p>
              <p className="text-[11px] mb-4" style={{ color: "var(--text-3)" }}>
                Extra rewards for exceptional performance!
              </p>
              <div className="space-y-2">
                {(data?.special || []).map(s => (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--bg-surface)" }}>
                    <span className="text-[24px]">{s.icon}</span>
                    <div className="flex-1">
                      <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{s.label}</p>
                      <p className="text-[9px]" style={{ color: "var(--text-3)" }}>One-time bonus</p>
                    </div>
                    <p className="text-[14px] font-black" style={{ color: "var(--brand)" }}>+₹{s.bonus}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips to earn more */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)" }}>
              <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "var(--text-3)" }}>💡 TIPS TO EARN MORE</p>
              <div className="space-y-2 text-[11px]" style={{ color: "var(--text-2)" }}>
                <div className="flex gap-2"><span>1.</span><p>Stay online during peak hours (8-11 AM, 5-8 PM)</p></div>
                <div className="flex gap-2"><span>2.</span><p>Accept jobs quickly — under 30 seconds gets you the Early Bird bonus</p></div>
                <div className="flex gap-2"><span>3.</span><p>Maintain 4.5+ rating for monthly rating bonus</p></div>
                <div className="flex gap-2"><span>4.</span><p>Don&apos;t cancel — zero cancellations = ₹300 extra per week</p></div>
                <div className="flex gap-2"><span>5.</span><p>Work weekends for the Weekend Warrior bonus</p></div>
                <div className="flex gap-2"><span>6.</span><p>Build streaks — 7 consecutive days = ₹1,000 bonus!</p></div>
              </div>
            </div>
          </>
        ) : (
          /* ── Target Cards ── */
          <>
            {/* Period header */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-bold tracking-widest" style={{ color: "var(--text-3)" }}>
                    {tab === "daily" ? "TODAY'S TARGETS" : tab === "weekly" ? "THIS WEEK'S TARGETS" : "THIS MONTH'S TARGETS"}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                    {tab === "daily" ? "Resets at midnight" : tab === "weekly" ? "Mon → Sun" : "Resets 1st of month"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[16px] font-black" style={{ color: "var(--success)" }}>
                    ₹{(tab === "daily" ? data?.daily.earned : tab === "weekly" ? data?.weekly.earned : data?.monthly.earned) || 0}
                  </p>
                  <p className="text-[9px]" style={{ color: "var(--text-3)" }}>earned</p>
                </div>
              </div>

              <div className="space-y-3">
                {(tab === "daily" ? data?.daily.targets : tab === "weekly" ? data?.weekly.targets : data?.monthly.targets)?.map(t => (
                  <div key={t.id} className="rounded-xl p-3.5"
                       style={{
                         background: t.achieved ? "var(--success-tint)" : "var(--bg-elevated)",
                         border: t.achieved ? "1.5px solid var(--success)" : "none",
                       }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[22px]">{t.icon}</span>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{t.label}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                          {t.achieved ? "✅ Completed!" : `${t.current}/${t.jobs || t.streak || t.rating || t.earnings || 0}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[15px] font-black" style={{ color: t.achieved ? "var(--success)" : "var(--brand)" }}>
                          +₹{t.bonus}
                        </p>
                        {t.achieved && <span className="text-[8px] font-bold" style={{ color: "var(--success)" }}>CLAIMED ✓</span>}
                      </div>
                    </div>
                    {!t.achieved && (
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                        <div className="h-full rounded-full transition-all duration-500" 
                             style={{ 
                               width: `${t.progress}%`,
                               background: t.progress > 75 ? "var(--success)" : t.progress > 40 ? "var(--warning)" : "var(--brand)",
                             }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Potential earnings card */}
            <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(255,107,0,0.08), rgba(255,149,0,0.08))" }}>
              <div className="flex items-center gap-3">
                <span className="text-[28px]">💰</span>
                <div>
                  <p className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>
                    {tab === "daily" ? "Complete all daily targets" : tab === "weekly" ? "Complete all weekly targets" : "Complete all monthly targets"}
                  </p>
                  <p className="text-[18px] font-black" style={{ color: "var(--text-1)" }}>
                    Earn up to ₹{
                      tab === "daily" ? "850" : tab === "weekly" ? "3,600" : "16,500"
                    }
                  </p>
                  <p className="text-[9px]" style={{ color: "var(--text-3)" }}>
                    Extra bonus on top of your regular earnings
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
