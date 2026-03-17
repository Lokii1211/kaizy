"use client";
import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";
import LiveBookingFeed from "@/components/LiveBookingFeed";

export default function WorkerDashboard() {
  const { isDark } = useTheme();
  const [isOnline, setIsOnline] = useState(true);
  const jobs = [
    { id:1, icon:"🚗", title:"Car Breakdown Repair", loc:"Ukkadam · 2.3 km", price:600, time:"~1 hr", color:"#8B5CF6" },
    { id:2, icon:"🔧", title:"Pipe Leak Fix", loc:"Peelamedu · 1.1 km", price:450, time:"~45m", color:"#3B8BFF" },
    { id:3, icon:"⚡", title:"MCB Panel Replace", loc:"RS Puram · 3.2 km", price:800, time:"~2 hr", color:"#FF6B00" },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] font-bold" style={{ color: "var(--text-1)" }}>9:41</span>
          <span className="text-[11px]" style={{ color: "var(--text-1)" }}>📶 🔋</span>
        </div>
        <p className="text-[18px] font-black mb-3" style={{ color: "var(--text-1)", fontFamily: "var(--font-syne)" }}>Good morning, Raju! 👋</p>

        {/* Online toggle */}
        <button onClick={() => setIsOnline(!isOnline)} className="w-full flex items-center justify-between rounded-[14px] p-4 mb-3 active:scale-[0.98] transition-all"
                style={{ background: isOnline ? "var(--success-tint)" : "var(--bg-card)", border: `2px solid ${isOnline ? "var(--success)" : "var(--border-1)"}` }}>
          <div>
            <p className="text-[14px] font-extrabold" style={{ color: isOnline ? "var(--success)" : "var(--text-3)" }}>● {isOnline ? "ONLINE" : "OFFLINE"}</p>
            <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{isOnline ? "Finding jobs near you" : "You won't receive new jobs"}</p>
          </div>
          <div className="relative rounded-[12px]" style={{ width: 52, height: 28, background: isOnline ? "var(--success)" : "var(--bg-elevated)" }}>
            <div className="absolute top-1 rounded-full bg-white transition-all" style={{ width: 20, height: 20, left: isOnline ? 28 : 4 }} />
          </div>
        </button>

        {/* Earnings */}
        <div className="rounded-[14px] p-4 mb-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Today&apos;s Earnings</p>
          <p className="text-[36px] font-black" style={{ color: "var(--brand)", fontFamily: "var(--font-syne)" }}>₹1,200</p>
          <p className="text-[10px] mb-3" style={{ color: "var(--success)" }}>3 jobs completed</p>
          <div className="grid grid-cols-2 gap-3 pt-2" style={{ borderTop: "1px solid var(--border-1)" }}>
            <div><p className="text-[14px] font-black" style={{ color: "var(--text-1)" }}>₹5,400</p><p className="text-[9px]" style={{ color: "var(--text-3)" }}>This Week</p></div>
            <div><p className="text-[14px] font-black" style={{ color: "var(--brand)" }}>₹18,900</p><p className="text-[9px]" style={{ color: "var(--text-3)" }}>This Month</p></div>
          </div>
        </div>
      </div>

      {/* Job feed */}
      <div className="px-4">
        {/* Live booking requests (real-time) */}
        {isOnline && (
          <div className="mb-4">
            <LiveBookingFeed />
          </div>
        )}

        <p className="text-[13px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>New Jobs Nearby [{jobs.length}]</p>
        <div className="space-y-2 animate-stagger">
          {jobs.map(j => (
            <Link key={j.id} href="/booking" className="flex items-center gap-3 rounded-[14px] p-3 active:scale-[0.98] transition-all"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)", borderLeft: `4px solid ${j.color}` }}>
              <span className="text-[22px]">{j.icon}</span>
              <div className="flex-1">
                <p className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>{j.title}</p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>📍 {j.loc}</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-black" style={{ color: "var(--brand)" }}>₹{j.price}</p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{j.time}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* KaizyScore */}
      <div className="mx-4 mt-4 rounded-[14px] p-4" style={{ background: "var(--bg-card)", border: "2px solid var(--brand)" }}>
        <div className="flex items-center gap-3">
          <p className="text-[32px] font-black" style={{ color: "var(--brand)", fontFamily: "var(--font-syne)" }}>742</p>
          <div className="flex-1">
            <p className="text-[12px] font-extrabold" style={{ color: "var(--text-1)" }}>Credit Ready</p>
            <div className="rounded-full overflow-hidden mt-1" style={{ height: 6, background: "var(--bg-elevated)" }}>
              <div className="h-full rounded-full" style={{ width: "74.2%", background: "linear-gradient(90deg, var(--brand), var(--warning))" }} />
            </div>
            <p className="text-[10px] mt-1" style={{ color: "var(--brand)" }}>₹25,000 loan eligible →</p>
          </div>
        </div>
      </div>
    </div>
  );
}
