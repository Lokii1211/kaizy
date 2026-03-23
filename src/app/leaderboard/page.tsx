"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// LEADERBOARD — Top Workers by KaizyScore
// Gamification to drive quality and competition
// ============================================================

interface LeaderEntry {
  id: string; name: string; trade: string;
  kaizy_score: number; avg_rating: number;
  total_jobs: number; rank: number;
}

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};
const tradeColors: Record<string, string> = {
  electrician: "#FF6B00", plumber: "#3B82F6", mechanic: "#8B5CF6",
  ac_repair: "#06B6D4", carpenter: "#F59E0B", painter: "#10B981",
};
const rankMedals = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(0);
  const [myScore, setMyScore] = useState(0);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/workers?limit=20&sort=kaizy_score");
        const json = await res.json();
        if (json.success && json.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ranked = json.data.map((w: any, i: number) => ({
            id: w.id,
            name: w.name || "Worker",
            trade: w.trade || "worker",
            kaizy_score: w.kaizy_score || 0,
            avg_rating: w.avg_rating || 0,
            total_jobs: w.total_jobs || 0,
            rank: i + 1,
          }));
          setLeaders(ranked);
        }
      } catch (e) {
        console.error("[leaderboard]", e);
      } finally {
        setLoading(false);
      }
    };

    // Fetch my own score
    const fetchMyScore = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.success && json.data) {
          setMyScore(json.data.kaizy_score || 0);
        }
      } catch {}
    };

    fetchLeaderboard();
    fetchMyScore();
  }, []);

  // Find my rank
  useEffect(() => {
    if (myScore > 0 && leaders.length > 0) {
      const idx = leaders.findIndex(l => l.kaizy_score <= myScore);
      setMyRank(idx >= 0 ? idx + 1 : leaders.length + 1);
    }
  }, [myScore, leaders]);

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-5" style={{ background: "linear-gradient(180deg, rgba(255,107,0,0.08) 0%, var(--bg-app) 100%)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard/worker" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>🏆 Leaderboard</h1>
        </div>

        {/* My rank card */}
        {myScore > 0 && (
          <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: "var(--bg-card)", border: "2px solid var(--brand)" }}>
            <div className="text-center">
              <p className="text-[28px] font-black" style={{ color: "var(--brand)" }}>#{myRank || "—"}</p>
              <p className="text-[9px] font-bold" style={{ color: "var(--text-3)" }}>Your Rank</p>
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>Your KaizyScore</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[24px] font-black" style={{ color: "var(--brand)" }}>{myScore}</p>
                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: "var(--bg-elevated)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (myScore / 900) * 100)}%`, background: "linear-gradient(90deg, var(--brand), var(--warning))" }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard list */}
      <div className="px-4">
        {loading && [1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton rounded-xl mb-2" style={{ height: 64 }} />
        ))}

        {!loading && leaders.length === 0 && (
          <div className="text-center py-12 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <p className="text-[40px] mb-2">🏆</p>
            <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Leaderboard building...</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>Complete jobs to climb the ranks!</p>
          </div>
        )}

        {!loading && leaders.map((w, i) => {
          const isTop3 = i < 3;
          const color = tradeColors[w.trade] || "#FF6B00";
          const icon = tradeIcons[w.trade] || "🔧";

          return (
            <div key={w.id} className="flex items-center gap-3 rounded-xl p-3 mb-2"
                 style={{
                   background: isTop3 ? `${color}08` : "var(--bg-card)",
                   border: isTop3 ? `1.5px solid ${color}30` : "1px solid var(--border-1)",
                 }}>
              {/* Rank */}
              <div className="w-8 text-center shrink-0">
                {isTop3 ? (
                  <span className="text-[20px]">{rankMedals[i]}</span>
                ) : (
                  <span className="text-[14px] font-black" style={{ color: "var(--text-3)" }}>#{w.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0"
                   style={{ background: color }}>
                {w.name[0]?.toUpperCase() || "?"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-1)" }}>{w.name}</p>
                <p className="text-[10px]" style={{ color }}>
                  {icon} {w.trade.replace("_", " ")} · ⭐ {w.avg_rating.toFixed(1)} · {w.total_jobs} jobs
                </p>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <p className="text-[16px] font-black" style={{ color: isTop3 ? color : "var(--text-1)" }}>{w.kaizy_score}</p>
                <p className="text-[8px] font-bold" style={{ color: "var(--text-3)" }}>KS</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="px-4 mt-6">
        <div className="rounded-xl p-4" style={{ background: "var(--brand-tint)", border: "1px solid rgba(255,107,0,0.15)" }}>
          <p className="text-[12px] font-bold mb-2" style={{ color: "var(--brand)" }}>📈 How to Climb the Leaderboard</p>
          <div className="space-y-1.5">
            {[
              "✅ Complete every accepted job",
              "⭐ Maintain 4.5+ rating from hirers",
              "⚡ Respond to alerts within 15 seconds",
              "📸 Upload before/after job photos",
              "🪪 Complete Aadhaar verification",
            ].map(tip => (
              <p key={tip} className="text-[10px]" style={{ color: "var(--text-2)" }}>{tip}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
