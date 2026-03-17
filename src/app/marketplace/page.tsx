"use client";
import { useState } from "react";
import Link from "next/link";

const filters = ["All","⚡ Electrician","🔧 Plumber","🚗 Mechanic","🛞 Puncture","❄️ AC Repair","🪚 Carpenter","🎨 Painter","⚒️ Mason"];
const allWorkers = [
  { id:1, i:"R", name:"Raju K.", trade:"⚡ Electrician", rating:4.9, jobs:312, dist:"1.2km", price:"₹500/hr", color:"#FF6B00", verified:true, online:true },
  { id:2, i:"M", name:"Meena D.", trade:"🔧 Plumber", rating:4.7, jobs:189, dist:"0.8km", price:"₹400/hr", color:"#3B8BFF", verified:true, online:true },
  { id:3, i:"S", name:"Suresh M.", trade:"🚗 Mechanic", rating:4.8, jobs:256, dist:"2.1km", price:"₹600/hr", color:"#8B5CF6", verified:true, online:true },
  { id:4, i:"P", name:"Priya S.", trade:"❄️ AC Repair", rating:4.6, jobs:145, dist:"1.5km", price:"₹700/hr", color:"#06B6D4", verified:true, online:false },
  { id:5, i:"A", name:"Anand R.", trade:"🪚 Carpenter", rating:4.5, jobs:98, dist:"3.2km", price:"₹450/hr", color:"#10B981", verified:false, online:true },
  { id:6, i:"L", name:"Lakshmi R.", trade:"🎨 Painter", rating:4.4, jobs:67, dist:"2.8km", price:"₹350/hr", color:"#F59E0B", verified:true, online:true },
  { id:7, i:"G", name:"Gopal V.", trade:"⚒️ Mason", rating:4.6, jobs:203, dist:"4.1km", price:"₹550/hr", color:"#6366F1", verified:true, online:true },
  { id:8, i:"K", name:"Kavitha P.", trade:"⚡ Electrician", rating:4.7, jobs:134, dist:"1.9km", price:"₹480/hr", color:"#FF6B00", verified:true, online:true },
];

export default function MarketplacePage() {
  const [activeFilter, setActiveFilter] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnline, setShowOnline] = useState(false);

  const filtered = allWorkers.filter(w => {
    if (showOnline && !w.online) return false;
    if (activeFilter > 0) { const f = filters[activeFilter].replace(/^[^\s]+ /, ""); if (!w.trade.includes(f)) return false; }
    if (searchQuery) { const q = searchQuery.toLowerCase(); return w.name.toLowerCase().includes(q) || w.trade.toLowerCase().includes(q); }
    return true;
  });

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5 mb-3">
          <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 shrink-0"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}><span className="text-[14px]">←</span></Link>
          <div className="flex-1 flex items-center gap-3 rounded-[14px] px-4 py-3"
               style={{ background: "var(--bg-input)", border: "1px solid var(--border-1)" }}>
            <span className="text-[14px]" style={{ color: "var(--brand)" }}>🔍</span>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                   placeholder="Search workers..." className="flex-1 text-[13px] font-semibold outline-none bg-transparent"
                   style={{ color: "var(--text-1)" }} />
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-bold" style={{ color: "var(--text-3)" }}>📍 Gandhipuram</span>
          <span className="ml-auto text-[10px] font-semibold" style={{ color: "var(--text-3)" }}>{filtered.length} found</span>
          <button onClick={() => setShowOnline(!showOnline)} className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: showOnline ? "var(--success-tint)" : "var(--bg-elevated)", color: showOnline ? "var(--success)" : "var(--text-3)", border: "1px solid var(--border-1)" }}>
            {showOnline ? "● Online" : "All"}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map((f, i) => (
            <button key={f} onClick={() => setActiveFilter(i)}
                    className="shrink-0 rounded-[20px] px-3 py-[7px] text-[11px] font-bold active:scale-95 transition-all"
                    style={{ background: activeFilter === i ? "var(--brand)" : "var(--bg-card)", color: activeFilter === i ? "#fff" : "var(--text-2)", border: "1px solid var(--border-1)" }}>{f}</button>
          ))}
        </div>
      </div>
      <div className="px-4 space-y-2 animate-stagger">
        {filtered.map(w => (
          <Link key={w.id} href="/booking" className="flex items-center gap-3 rounded-[16px] p-3 active:scale-[0.98] transition-all"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <div className="relative shrink-0">
              <div className="rounded-full flex items-center justify-center text-[14px] font-black text-white" style={{ width: 44, height: 44, background: w.color }}>{w.i}</div>
              {w.online && <div className="absolute -bottom-0.5 -right-0.5 rounded-full online-pulse" style={{ width: 12, height: 12, background: "var(--success)", border: "2px solid var(--bg-card)" }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1"><p className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>{w.name}</p>{w.verified && <span className="text-[10px]" style={{ color: "var(--info)" }}>✓</span>}</div>
              <p className="text-[10px] font-bold" style={{ color: w.color }}>{w.trade}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}><span style={{ color: "var(--warning)" }}>⭐ {w.rating}</span> · {w.jobs} jobs · {w.dist}</p>
            </div>
            <p className="text-[13px] font-extrabold shrink-0" style={{ color: "var(--text-1)" }}>{w.price}</p>
          </Link>
        ))}
        {filtered.length === 0 && <div className="text-center py-16"><p className="text-[32px] mb-2">🔍</p><p className="text-[14px] font-bold" style={{ color: "var(--text-3)" }}>No workers found</p></div>}
      </div>
    </div>
  );
}
