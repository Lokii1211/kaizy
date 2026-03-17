"use client";
import { useState } from "react";
import Link from "next/link";

const weeklyData = [42,68,55,80,45,72,60]; const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]; const max = Math.max(...weeklyData);
const transactions = [
  { id:1, title:"Car Engine Repair", who:"Vinod A.", amount:600, type:"in", time:"Today, 2:30 PM" },
  { id:2, title:"Shop Rewiring", who:"Anita S.", amount:1800, type:"in", time:"Today, 11:00 AM" },
  { id:3, title:"Withdrawal", who:"To bank ·····6789", amount:2400, type:"out", time:"Yesterday, 6:00 PM" },
  { id:4, title:"AC Wiring Install", who:"Kumar P.", amount:1200, type:"in", time:"Yesterday, 3:00 PM" },
  { id:5, title:"MCB Panel Replace", who:"Deepa K.", amount:450, type:"in", time:"Mon, 10:00 AM" },
  { id:6, title:"Solar Panel Check", who:"Raj M.", amount:800, type:"pending", time:"Mon, 8:30 AM" },
];

export default function EarningsPage() {
  const [period, setPeriod] = useState(1);
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      <div className="px-4 pt-4">
        <div className="flex justify-between items-center mb-4">
          <Link href="/dashboard/worker" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}><span className="text-[14px]">←</span></Link>
          <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>Earnings</h1>
          <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}><span className="text-[14px]">📥</span></button>
        </div>
        <div className="text-center mb-4">
          <p className="text-[10px] font-semibold" style={{ color: "var(--text-3)" }}>Total Balance</p>
          <p className="text-[42px] font-black leading-none" style={{ color: "var(--text-1)", fontFamily: "var(--font-syne)" }}>₹4,850</p>
          <p className="text-[12px] font-bold mt-1" style={{ color: "var(--success)" }}>↑ +₹2,400 today</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button className="rounded-[14px] p-3 flex items-center gap-2 active:scale-95" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[20px]">💳</span><div className="text-left"><p className="text-[12px] font-extrabold" style={{ color: "var(--text-1)" }}>Withdraw</p><p className="text-[9px]" style={{ color: "var(--text-3)" }}>To bank</p></div>
          </button>
          <button className="rounded-[14px] p-3 flex items-center gap-2 active:scale-95" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[20px]">⭐</span><div className="text-left"><p className="text-[12px] font-extrabold" style={{ color: "var(--text-1)" }}>KaizyScore</p><p className="text-[9px]" style={{ color: "var(--text-3)" }}>742</p></div>
          </button>
        </div>
      </div>
      <div className="flex mx-4 rounded-[10px] p-1 gap-1 mb-3" style={{ background: "var(--bg-card)" }}>
        {["Today","This Week","This Month"].map((p,i) => (
          <button key={p} onClick={() => setPeriod(i)} className="flex-1 py-2 rounded-[8px] text-[11px] font-bold transition-all"
                  style={{ background: period === i ? "var(--brand)" : "transparent", color: period === i ? "#fff" : "var(--text-3)" }}>{p}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mx-4 mb-3">
        {[{val:"₹5,650",l:"Earned"},{val:"8",l:"Jobs"},{val:"₹800",l:"Pending",c:"var(--warning)"}].map(s => (
          <div key={s.l} className="rounded-[12px] py-3 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <p className="text-[16px] font-black" style={{ color: s.c || "var(--text-1)" }}>{s.val}</p>
            <p className="text-[9px] font-semibold" style={{ color: "var(--text-3)" }}>{s.l}</p>
          </div>
        ))}
      </div>
      <div className="mx-4 rounded-[16px] p-4 mb-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
        <p className="text-[12px] font-extrabold mb-3" style={{ color: "var(--text-1)" }}>Weekly Trend</p>
        <div className="flex items-end justify-between gap-2" style={{ height: 80 }}>
          {weeklyData.map((val,i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-[4px]" style={{ height: `${(val/max)*60}px`, background: i === new Date().getDay()-1 ? "var(--brand)" : "var(--bg-elevated)" }} />
              <span className="text-[8px] font-bold" style={{ color: i === new Date().getDay()-1 ? "var(--brand)" : "var(--text-3)" }}>{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4">
        <p className="text-[12px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>Transactions</p>
        <div className="space-y-2">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 rounded-[14px] p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[16px] shrink-0"
                   style={{ background: tx.type === "in" ? "var(--success-tint)" : tx.type === "out" ? "var(--danger-tint)" : "var(--warning-tint)" }}>
                {tx.type === "in" ? "↓" : tx.type === "out" ? "↑" : "⏳"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-extrabold" style={{ color: "var(--text-1)" }}>{tx.title}</p>
                <p className="text-[9px]" style={{ color: "var(--text-3)" }}>{tx.who} · {tx.time}</p>
              </div>
              <p className="text-[14px] font-black shrink-0" style={{ color: tx.type === "in" ? "var(--success)" : tx.type === "out" ? "var(--danger)" : "var(--warning)" }}>
                {tx.type === "in" ? "+" : tx.type === "out" ? "-" : ""}₹{tx.amount.toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
