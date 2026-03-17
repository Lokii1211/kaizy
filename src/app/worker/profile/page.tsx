"use client";
import Link from "next/link";

export default function KaizyPassPage() {
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Hero */}
      <div className="text-center px-4 pt-8 pb-5" style={{ background: "linear-gradient(180deg, rgba(255,107,0,0.08) 0%, var(--bg-app) 100%)" }}>
        <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-[32px] font-black text-white mx-auto mb-3"
             style={{ background: "var(--brand)", boxShadow: "0 0 0 4px rgba(255,107,0,0.15), var(--shadow-brand)" }}>R</div>
        <h1 className="text-[20px] font-black" style={{ color: "var(--text-1)", fontFamily: "var(--font-syne)" }}>Raju Kumar</h1>
        <p className="text-[12px] font-bold" style={{ color: "var(--brand)" }}>⚡ Senior Electrician · 10 yrs</p>
        <div className="flex justify-center gap-2 mt-2">
          {[{l:"✓ Aadhaar",c:"var(--success)"},{l:"✓ ITI Cert",c:"var(--info)"},{l:"⭐ Top Rated",c:"var(--warning)"}].map(b => (
            <span key={b.l} className="text-[9px] font-bold px-2.5 py-1 rounded-[20px]" style={{ border: `1px solid ${b.c}`, color: b.c }}>{b.l}</span>
          ))}
        </div>
        <p className="mt-3 py-2 px-4 rounded-[10px] inline-block text-[11px] font-bold"
           style={{ background: "var(--bg-card)", color: "var(--text-2)", fontFamily: "'JetBrains Mono', monospace" }}>Share My KaamCard 📤</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mx-4 mb-4">
        {[{v:"4.9 ⭐",l:"Rating",c:"var(--brand)"},{v:"312",l:"Jobs Done",c:"var(--text-1)"},{v:"98%",l:"Completion",c:"var(--success)"}].map(s => (
          <div key={s.l} className="rounded-[14px] py-3 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <p className="text-[18px] font-black" style={{ color: s.c }}>{s.v}</p>
            <p className="text-[9px] font-semibold" style={{ color: "var(--text-3)" }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* KaizyScore */}
      <div className="mx-4 rounded-[14px] p-4 mb-4" style={{ background: "var(--bg-card)", border: "2px solid var(--brand)" }}>
        <div className="flex items-center gap-3">
          <p className="text-[36px] font-black" style={{ color: "var(--brand)", fontFamily: "var(--font-syne)" }}>742</p>
          <div className="flex-1">
            <p className="text-[12px] font-extrabold" style={{ color: "var(--text-1)" }}>Credit Ready</p>
            <div className="rounded-full overflow-hidden mt-1" style={{ height: 6, background: "var(--bg-elevated)" }}>
              <div className="h-full rounded-full" style={{ width: "74.2%", background: "linear-gradient(90deg, var(--brand), var(--warning))" }} />
            </div>
            <p className="text-[10px] mt-1" style={{ color: "var(--brand)" }}>₹25,000 loan eligible →</p>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="px-4 mb-4">
        <p className="text-[12px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>Skills</p>
        <div className="flex flex-wrap gap-2">
          {["⚡ Wiring","❄️ AC Repair","🔌 Inverter","💡 LED","🔧 MCB Panel","📱 Smart Home"].map(s => (
            <span key={s} className="text-[10px] font-bold px-3 py-1.5 rounded-[20px]"
                  style={{ background: "var(--brand-tint)", color: "var(--brand)", border: "1px solid rgba(255,107,0,0.2)" }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="px-4">
        <p className="text-[12px] font-extrabold mb-2" style={{ color: "var(--text-1)" }}>Recent Reviews</p>
        {[{n:"Vinod A.",r:5,t:"Excellent work! Very professional and clean.",d:"2 days ago"},{n:"Anita S.",r:5,t:"Fixed our entire shop wiring. Highly recommended!",d:"1 week ago"}].map((rv,i) => (
          <div key={i} className="rounded-[14px] p-3 mb-2" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <div className="flex justify-between items-center mb-1">
              <p className="text-[12px] font-extrabold" style={{ color: "var(--text-1)" }}>{rv.n}</p>
              <span className="text-[10px]" style={{ color: "var(--warning)" }}>{"⭐".repeat(rv.r)}</span>
            </div>
            <p className="text-[11px]" style={{ color: "var(--text-2)" }}>{rv.t}</p>
            <p className="text-[9px] mt-1" style={{ color: "var(--text-3)" }}>{rv.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
