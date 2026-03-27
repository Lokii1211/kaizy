"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// CONTRACTOR PORTAL v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · Tonal surfaces · No borders · JetBrains Mono
// ============================================================

interface TeamMember {
  name: string; trade: string; status: string; rating: number;
  jobs: number; earnings: string; avatar: string; phone: string;
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  on_job: { label: "On Job", color: "var(--info)", dot: "var(--info)" },
  available: { label: "Available", color: "var(--success)", dot: "var(--success)" },
  off_duty: { label: "Off Duty", color: "var(--text-3)", dot: "var(--text-3)" },
};

const teamBookings = [
  { id: "TB-2024-001", client: "RS Puram Textile Mill", workers: 4, total: "₹32,000", status: "active", progress: 65, duration: "3 weeks" },
  { id: "TB-2024-002", client: "Apex Apartments", workers: 2, total: "₹8,500", status: "upcoming", progress: 0, duration: "2 days" },
  { id: "TB-2024-003", client: "Green Homes Colony", workers: 6, total: "₹1,20,000", status: "completed", progress: 100, duration: "6 weeks" },
];

export default function ContractorPortalPage() {
  const [activeTab, setActiveTab] = useState<"team" | "bookings" | "analytics">("team");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch('/api/workers?limit=10');
        const json = await res.json();
        if (json.success && json.data?.length) {
          setTeamMembers(json.data.map((w: Record<string, unknown>) => ({
            name: String(w.name || 'Worker'),
            trade: String((w.skills as string[])?.[0] || 'Technician'),
            status: w.available ? 'available' : 'off_duty',
            rating: Number(w.rating || 0),
            jobs: Number(w.jobsCompleted || 0),
            earnings: `₹${Number(w.jobsCompleted || 0) * 400}`,
            avatar: String(w.name || 'W').split(' ').map((s: string) => s[0]).join('').toUpperCase().slice(0, 2),
            phone: String(w.phone || ''),
          })));
        }
      } catch {}
    };
    fetchTeam();
  }, []);

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: "var(--bg-surface)" }}>
              <span className="text-[14px]">←</span>
            </Link>
            <div>
              <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
                Contractor Portal
              </h1>
              <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>Manage your workforce</p>
            </div>
          </div>
          <button className="px-3 py-2 rounded-[12px] text-[10px] font-bold text-white active:scale-95 transition-transform"
                  style={{ background: "var(--gradient-cta)" }}>
            ➕ Add Worker
          </button>
        </div>

        {/* Subscription Badge */}
        <div className="rounded-[16px] p-4 mb-4" style={{ background: "var(--bg-card)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">👑</span>
              <span className="text-[11px] font-bold" style={{ color: "var(--warning)" }}>Pro Plan</span>
            </div>
            <span className="text-[9px] font-bold" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>₹999/mo</span>
          </div>
          <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: "var(--bg-surface)" }}>
            <div className="h-full rounded-full" style={{ width: "60%", background: "var(--warning)" }} />
          </div>
          <p className="text-[8px] font-medium mt-1" style={{ color: "var(--text-3)" }}>4 of 6 slots used</p>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 rounded-[14px] p-1" style={{ background: "var(--bg-surface)" }}>
          {[
            { id: "team" as const, icon: "👥", label: "My Team" },
            { id: "bookings" as const, icon: "📋", label: "Bookings" },
            { id: "analytics" as const, icon: "📊", label: "Analytics" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className="flex-1 py-2.5 rounded-[10px] text-[10px] font-bold text-center transition-all flex items-center justify-center gap-1"
                    style={{ background: activeTab === tab.id ? "var(--brand)" : "transparent", color: activeTab === tab.id ? "#fff" : "var(--text-3)" }}>
              <span className="text-[12px]">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-3">
        {/* Team Tab */}
        {activeTab === "team" && (
          <div className="space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Workers", value: "6", icon: "👥" },
                { label: "Available", value: "3", icon: "✅" },
                { label: "On Jobs", value: "2", icon: "💼" },
                { label: "Rating", value: "4.65", icon: "⭐" },
              ].map(stat => (
                <div key={stat.label} className="rounded-[14px] p-3 text-center" style={{ background: "var(--bg-card)" }}>
                  <span className="text-[16px] block mb-1">{stat.icon}</span>
                  <p className="text-[16px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</p>
                  <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Workers */}
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Workers ({teamMembers.length})</p>
            <div className="space-y-2">
              {teamMembers.map(member => {
                const s = statusConfig[member.status] || statusConfig.off_duty;
                return (
                  <div key={member.name} className="rounded-[16px] p-4" style={{ background: "var(--bg-card)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[12px] font-bold text-white"
                           style={{ background: "var(--brand)" }}>{member.avatar}</div>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{member.name}</p>
                        <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{member.trade}</p>
                      </div>
                      <span className="text-[8px] font-bold px-2 py-1 rounded-full flex items-center gap-1"
                            style={{ background: "var(--bg-surface)", color: s.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                        {s.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: "Rating", val: String(member.rating) },
                        { label: "Jobs", val: String(member.jobs) },
                        { label: "Earned", val: member.earnings },
                      ].map(stat => (
                        <div key={stat.label} className="rounded-[10px] p-2 text-center" style={{ background: "var(--bg-surface)" }}>
                          <p className="text-[11px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{stat.val}</p>
                          <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-[12px] text-[10px] font-bold active:scale-95 transition-transform"
                              style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>
                        💼 Assign Job
                      </button>
                      <button className="py-2 px-3 rounded-[12px] text-[10px] active:scale-95 transition-transform"
                              style={{ background: "var(--bg-surface)", color: "var(--text-2)" }}>👁️</button>
                      <button className="py-2 px-3 rounded-[12px] text-[10px] active:scale-95 transition-transform"
                              style={{ background: "var(--bg-surface)", color: "var(--text-2)" }}>📞</button>
                    </div>
                  </div>
                );
              })}

              {/* Add Worker */}
              <button className="w-full rounded-[16px] p-5 flex flex-col items-center justify-center gap-3"
                      style={{ background: "var(--bg-card)", border: "2px dashed rgba(255,255,255,0.06)" }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--brand-tint)" }}>
                  <span className="text-[22px]">➕</span>
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>Add Worker</p>
                  <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>WhatsApp invite or manual add</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Active", value: "1", icon: "🟢" },
                { label: "Revenue", value: "₹1.6L", icon: "💰" },
                { label: "Utilization", value: "78%", icon: "📈" },
              ].map(s => (
                <div key={s.label} className="rounded-[14px] p-3 text-center" style={{ background: "var(--bg-card)" }}>
                  <span className="text-[14px] block mb-1">{s.icon}</span>
                  <p className="text-[14px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
                  <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{s.label}</p>
                </div>
              ))}
            </div>

            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Team Projects</p>
            {teamBookings.map(booking => (
              <div key={booking.id} className="rounded-[16px] p-4" style={{ background: "var(--bg-card)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{booking.client}</p>
                      <span className="text-[7px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: booking.status === "active" ? "rgba(59,130,246,0.1)" : booking.status === "upcoming" ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)",
                              color: booking.status === "active" ? "var(--info)" : booking.status === "upcoming" ? "var(--warning)" : "var(--success)",
                            }}>
                        {booking.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[9px] font-medium" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {booking.id} • {booking.workers} workers • {booking.duration}
                    </p>
                  </div>
                  <p className="text-[14px] font-black" style={{ color: "var(--brand)", fontFamily: "'JetBrains Mono', monospace" }}>{booking.total}</p>
                </div>
                {booking.status === "active" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] font-bold" style={{ color: "var(--text-3)" }}>Progress</span>
                      <span className="text-[8px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{booking.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-surface)" }}>
                      <div className="h-full rounded-full" style={{ width: `${booking.progress}%`, background: "var(--gradient-cta)" }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Monthly Revenue", value: "₹1,60,500", trend: "+18%", positive: true },
                { label: "Utilization", value: "78%", trend: "+5%", positive: true },
                { label: "Team Rating", value: "4.65/5", trend: "+0.1", positive: true },
                { label: "Dispute Rate", value: "1.2%", trend: "-0.3%", positive: true },
              ].map(metric => (
                <div key={metric.label} className="rounded-[14px] p-3.5" style={{ background: "var(--bg-card)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{metric.label}</p>
                    <span className="text-[8px] font-bold" style={{ color: metric.positive ? "var(--success)" : "var(--danger)" }}>{metric.trend}</span>
                  </div>
                  <p className="text-[16px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{metric.value}</p>
                </div>
              ))}
            </div>

            {/* Revenue by Worker */}
            <div className="rounded-[16px] p-4" style={{ background: "var(--bg-card)" }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Revenue by Worker</p>
              <div className="space-y-2.5">
                {teamMembers.sort((a, b) => parseInt(b.earnings.replace(/[₹,]/g, "")) - parseInt(a.earnings.replace(/[₹,]/g, ""))).map(m => {
                  const earnings = parseInt(m.earnings.replace(/[₹,]/g, ""));
                  return (
                    <div key={m.name} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[8px] font-bold text-white"
                           style={{ background: "var(--brand)" }}>{m.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-bold" style={{ color: "var(--text-1)" }}>{m.name}</p>
                          <p className="text-[10px] font-bold" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{m.earnings}</p>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-surface)" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min((earnings / 62100) * 100, 100)}%`, background: "var(--gradient-cta)" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Opportunity */}
            <div className="rounded-[16px] p-4" style={{ background: "var(--brand-tint)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[16px]">💡</span>
                <p className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>Opportunity Alert</p>
              </div>
              <p className="text-[10px] font-medium mb-2" style={{ color: "var(--text-2)" }}>
                You&apos;re missing <span className="font-bold" style={{ color: "var(--brand)" }}>₹18,500/month</span> due to low utilization workers.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["📢 Promote skills", "🎯 Assign to projects", "📚 Upskill via KonnectLearn"].map(tip => (
                  <span key={tip} className="px-2.5 py-1.5 rounded-[10px] text-[9px] font-bold"
                        style={{ background: "var(--bg-card)", color: "var(--text-2)" }}>
                    {tip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
