"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// WORKER LEADERBOARD v11.0 — Top 10 Workers in City
// "Raju is #3 in Coimbatore this week"
// Reference: Rapido captain badges + Swiggy delivery streak
// ============================================================

interface LeaderEntry {
  rank: number; name: string; trade: string; jobs: number;
  rating: number; earnings: number; streak: number; isPro: boolean;
}

const tradeIcons: Record<string, string> = {
  electrician: "⚡", plumber: "🔧", mechanic: "🚗",
  ac_repair: "❄️", carpenter: "🪚", painter: "🎨", mason: "⚒️",
};

const mockLeaderboard: LeaderEntry[] = [
  { rank: 1, name: "Arjun D.", trade: "mechanic", jobs: 28, rating: 4.9, earnings: 18500, streak: 14, isPro: true },
  { rank: 2, name: "Raju K.", trade: "electrician", jobs: 24, rating: 4.8, earnings: 15200, streak: 12, isPro: true },
  { rank: 3, name: "Kumar B.", trade: "plumber", jobs: 22, rating: 4.7, earnings: 14800, streak: 9, isPro: false },
  { rank: 4, name: "Prakash T.", trade: "ac_repair", jobs: 19, rating: 4.6, earnings: 13200, streak: 7, isPro: false },
  { rank: 5, name: "Surya M.", trade: "painter", jobs: 18, rating: 4.7, earnings: 12500, streak: 6, isPro: false },
  { rank: 6, name: "Senthil V.", trade: "plumber", jobs: 16, rating: 4.5, earnings: 10800, streak: 5, isPro: false },
  { rank: 7, name: "Vijay R.", trade: "carpenter", jobs: 15, rating: 4.4, earnings: 9600, streak: 4, isPro: false },
  { rank: 8, name: "Muthu S.", trade: "electrician", jobs: 14, rating: 4.5, earnings: 8900, streak: 3, isPro: false },
  { rank: 9, name: "Dinesh P.", trade: "mason", jobs: 12, rating: 4.3, earnings: 8200, streak: 2, isPro: false },
  { rank: 10, name: "Ganesh N.", trade: "mechanic", jobs: 11, rating: 4.4, earnings: 7500, streak: 1, isPro: false },
];

const rankMedals = ["", "🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"week" | "month" | "alltime">("week");
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const myRank = 24;

  useEffect(() => {
    setLoading(true);
    setTimeout(() => { setLeaders(mockLeaderboard); setLoading(false); }, 600);
  }, [period]);

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard/worker" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black tracking-tight"
              style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
            Leaderboard
          </h1>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto"
                style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>📍 Coimbatore</span>
        </div>

        <div className="flex rounded-[14px] p-1" style={{ background: "var(--bg-card)" }}>
          {([["week","This Week"],["month","This Month"],["alltime","All Time"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setPeriod(id)}
                    className="flex-1 rounded-[10px] py-2 text-[10px] font-bold transition-all"
                    style={{ background: period === id ? "var(--brand)" : "transparent", color: period === id ? "#fff" : "var(--text-3)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Your rank */}
      <div className="mx-5 mb-4 rounded-[18px] p-4 flex items-center gap-3" style={{ background: "var(--brand-tint)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black text-white"
             style={{ background: "var(--gradient-cta)" }}>You</div>
        <div className="flex-1">
          <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>Your Rank</p>
          <p className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>Complete more jobs to climb up!</p>
        </div>
        <p className="text-[28px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>#{myRank}</p>
      </div>

      {/* Podium */}
      {!loading && leaders.length >= 3 && (
        <div className="flex items-end justify-center gap-3 px-5 mb-5">
          {[1, 0, 2].map(idx => {
            const l = leaders[idx];
            const heights = [80, 60, 44];
            const sizes = ["68px", "56px", "56px"];
            const bgs = ["var(--gradient-cta)", "linear-gradient(135deg,#C0C0C0,#A0A0A0)", "linear-gradient(135deg,#CD7F32,#8B5A2B)"];
            const pos = idx === 0 ? 1 : idx === 1 ? 0 : 2;
            return (
              <div key={l.rank} className="flex-1 text-center">
                <div className="rounded-full flex items-center justify-center font-black text-white mx-auto mb-1"
                     style={{ width: sizes[pos], height: sizes[pos], background: bgs[pos], fontSize: pos === 0 ? 22 : 18,
                              boxShadow: pos === 0 ? "var(--shadow-brand)" : "none" }}>
                  {l.name.split(" ").map(w => w[0]).join("")}
                </div>
                <p className="text-[10px] font-bold truncate" style={{ color: "var(--text-1)" }}>{l.name}</p>
                <p className="text-[8px] font-medium" style={{ color: "var(--text-3)" }}>{l.jobs} jobs</p>
                <div className="rounded-t-[12px] mt-2 flex items-center justify-center"
                     style={{ background: "var(--bg-card)", height: heights[pos] }}>
                  <span className="text-[20px]">{rankMedals[l.rank]}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="px-5">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Top 10</p>

        {loading && [1,2,3,4,5].map(i => <div key={i} className="skeleton h-16 rounded-[14px] mb-2" />)}

        {!loading && leaders.map(l => (
          <div key={l.rank} className="flex items-center gap-3 rounded-[14px] p-3 mb-2"
               style={{ background: l.rank <= 3 ? "var(--brand-tint)" : "var(--bg-card)" }}>
            <div className="w-8 text-center shrink-0">
              {l.rank <= 3 ? <span className="text-[18px]">{rankMedals[l.rank]}</span>
                : <span className="text-[14px] font-black" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>{l.rank}</span>}
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-black text-white shrink-0"
                 style={{ background: "var(--gradient-cta)" }}>
              {l.name.split(" ").map(w => w[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-1)" }}>{l.name}</p>
                {l.isPro && <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: "var(--gradient-cta)", color: "#fff" }}>PRO</span>}
              </div>
              <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
                {tradeIcons[l.trade] || "🔧"} {l.trade.replace("_"," ")} · ⭐ {l.rating} · 🔥 {l.streak}d
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[13px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{l.jobs}</p>
              <p className="text-[7px] font-bold uppercase" style={{ color: "var(--text-3)" }}>jobs</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-5 mt-5 rounded-[18px] p-4 text-center" style={{ background: "var(--bg-card)" }}>
        <p className="text-[20px] mb-1">🏆</p>
        <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>Top 3 featured on Kaizy Instagram</p>
        <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>Complete more jobs this week to make the podium!</p>
      </div>
    </div>
  );
}
