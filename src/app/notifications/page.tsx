"use client";
import { useState } from "react";
import Link from "next/link";

const tabs = ["All","Bookings","Payments","Alerts"];
const notifications = [
  { id:1, icon:"✅", title:"Job Completed", body:"Suresh completed Car Breakdown repair", time:"2 min ago", type:"Bookings", unread:true, color:"var(--success)", hasAction:true },
  { id:2, icon:"💰", title:"Payment Received", body:"₹600 credited for AC repair job", time:"15 min ago", type:"Payments", unread:true, color:"var(--brand)" },
  { id:3, icon:"🆘", title:"SOS Alert Nearby", body:"Plumber needed in Gandhipuram area", time:"1 hr ago", type:"Alerts", unread:false, color:"var(--danger)", hasAction:true },
  { id:4, icon:"⭐", title:"New Review", body:"Vinod rated you 5 stars for wiring job", time:"2 hr ago", type:"Bookings", unread:false, color:"var(--warning)" },
  { id:5, icon:"📋", title:"New Booking Request", body:"MCB Panel Replace at RS Puram — ₹800", time:"3 hr ago", type:"Bookings", unread:false, color:"var(--info)", hasAction:true },
  { id:6, icon:"💸", title:"Withdrawal Done", body:"₹2,400 sent to your bank account", time:"Yesterday", type:"Payments", unread:false, color:"var(--success)" },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [accepted, setAccepted] = useState<number[]>([]);
  const [declined, setDeclined] = useState<number[]>([]);
  const filtered = activeTab === 0 ? notifications : notifications.filter(n => n.type === tabs[activeTab]);

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      <div className="px-4 pt-4 pb-2">
        <div className="flex justify-between items-center mb-3">
          <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}><span className="text-[14px]">←</span></Link>
          <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>Activity</h1>
          <button className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>Mark all read</button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} className="shrink-0 rounded-[20px] px-3.5 py-[7px] text-[11px] font-bold active:scale-95"
                    style={{ background: activeTab === i ? "var(--brand)" : "var(--bg-card)", color: activeTab === i ? "#fff" : "var(--text-2)" }}>{t}</button>
          ))}
        </div>
      </div>
      <div className="px-4 mt-3 space-y-2 animate-stagger">
        {filtered.map(n => (
          <div key={n.id} className="rounded-[14px] p-3" style={{
            background: n.unread ? "var(--brand-tint)" : "var(--bg-card)",
            border: n.unread ? "1px solid rgba(255,107,0,0.15)" : "1px solid var(--border-1)",
          }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] shrink-0"
                   style={{ background: "var(--bg-elevated)" }}>{n.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-extrabold" style={{ color: "var(--text-1)" }}>{n.title}</p>
                  {n.unread && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--brand)" }} />}
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-2)" }}>{n.body}</p>
                <p className="text-[9px] mt-1 font-semibold" style={{ color: "var(--text-3)" }}>{n.time}</p>
              </div>
            </div>
            {/* Accept/Decline buttons for actionable notifications */}
            {n.hasAction && !accepted.includes(n.id) && !declined.includes(n.id) && (
              <div className="flex gap-2 mt-2 pl-[52px]">
                <button onClick={() => setAccepted(p => [...p, n.id])} className="flex-1 rounded-[8px] py-2 text-[11px] font-extrabold text-white active:scale-95"
                        style={{ background: "var(--success)" }}>✓ Accept</button>
                <button onClick={() => setDeclined(p => [...p, n.id])} className="flex-1 rounded-[8px] py-2 text-[11px] font-extrabold active:scale-95"
                        style={{ background: "var(--danger-tint)", color: "var(--danger)", border: "1px solid var(--danger)" }}>✕ Decline</button>
              </div>
            )}
            {accepted.includes(n.id) && <p className="text-[10px] font-bold mt-2 pl-[52px]" style={{ color: "var(--success)" }}>✓ Accepted</p>}
            {declined.includes(n.id) && <p className="text-[10px] font-bold mt-2 pl-[52px]" style={{ color: "var(--danger)" }}>✕ Declined</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
