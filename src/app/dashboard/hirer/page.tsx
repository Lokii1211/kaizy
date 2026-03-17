"use client";
import Link from "next/link";
import { useTheme } from "@/stores/ThemeStore";

export default function HirerDashboard() {
  const { isDark } = useTheme();
  const bookings = [
    { id:1, worker:"Suresh M.", avatar:"S", color:"#8B5CF6", trade:"🚗 Mechanic", status:"In Progress", statusColor:"var(--brand)", eta:"8 min away", price:"₹600" },
    { id:2, worker:"Meena D.", avatar:"M", color:"#3B8BFF", trade:"🔧 Plumber", status:"Completed", statusColor:"var(--success)", eta:"Done", price:"₹400" },
    { id:3, worker:"Raju K.", avatar:"R", color:"#FF6B00", trade:"⚡ Electrician", status:"Scheduled", statusColor:"var(--warning)", eta:"Tomorrow 10AM", price:"₹500" },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      <div className="px-4 pt-4 pb-3">
        <p className="text-[11px] font-bold mb-1" style={{ color: "var(--text-3)" }}>📍 Gandhipuram, Coimbatore</p>
        <h1 className="text-[22px] font-black mb-3" style={{ color: "var(--text-1)", fontFamily: "var(--font-syne)" }}>Hi, Vinod! 👋</h1>
        <Link href="/marketplace" className="flex items-center gap-3 rounded-[14px] px-4 py-3 mb-3"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-2)" }}>
          <span className="text-[14px]" style={{ color: "var(--brand)" }}>🎙️</span>
          <span className="text-[13px] font-semibold flex-1" style={{ color: "var(--text-3)" }}>What do you need?</span>
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/booking" className="rounded-[14px] p-4 flex items-center gap-3 active:scale-95"
                style={{ background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>
            <span className="text-[24px]">📝</span>
            <div><p className="text-[13px] font-extrabold text-white">Post Job</p><p className="text-[9px]" style={{ color: "rgba(255,255,255,0.6)" }}>Find workers fast</p></div>
          </Link>
          <Link href="/emergency" className="rounded-[14px] p-4 flex items-center gap-3 active:scale-95"
                style={{ background: "var(--danger-tint)", border: "1.5px solid var(--danger)" }}>
            <span className="text-[24px]">🆘</span>
            <div><p className="text-[13px] font-extrabold" style={{ color: "var(--danger)" }}>KaizySOS</p><p className="text-[9px]" style={{ color: "var(--text-3)" }}>Emergency</p></div>
          </Link>
        </div>
      </div>
      <div className="px-4 mt-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[12px] font-extrabold" style={{ color: "var(--text-1)" }}>My Bookings</p>
          <Link href="/notifications" className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>See All →</Link>
        </div>
        <div className="space-y-2 animate-stagger">
          {bookings.map(b => (
            <Link key={b.id} href="/booking" className="flex items-center gap-3 rounded-[14px] p-3 active:scale-[0.98] transition-all"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <div className="rounded-full flex items-center justify-center text-[16px] font-black text-white shrink-0" style={{ width: 44, height: 44, background: b.color }}>{b.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>{b.worker}</p>
                <p className="text-[10px] font-bold" style={{ color: b.color }}>{b.trade}</p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{b.eta}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] font-bold px-2 py-1 rounded-[20px]" style={{ background: "var(--brand-tint)", color: b.statusColor }}>{b.status}</span>
                <p className="text-[14px] font-black mt-1" style={{ color: "var(--text-1)" }}>{b.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-4 mt-5">
        <p className="text-[12px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>Browse Categories</p>
        <div className="grid grid-cols-4 gap-2">
          {[{icon:"⚡",name:"Electric"},{icon:"🔧",name:"Plumber"},{icon:"🚗",name:"Mechanic"},{icon:"❄️",name:"AC Tech"},{icon:"🪚",name:"Carpenter"},{icon:"🎨",name:"Painter"},{icon:"⚒️",name:"Mason"},{icon:"🛞",name:"Puncture"}].map(c => (
            <Link key={c.name} href="/marketplace" className="rounded-[12px] py-3 text-center active:scale-95"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <span className="text-[22px] block mb-1">{c.icon}</span>
              <span className="text-[9px] font-bold" style={{ color: "var(--text-1)" }}>{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
