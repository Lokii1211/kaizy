"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap, Home, Users, Briefcase, Wallet, Shield, BarChart3, Settings,
  Bell, Menu, LogOut, TrendingUp, IndianRupee, CheckCircle2, Clock,
  AlertTriangle, MapPin, ArrowUpRight, ChevronRight, Eye, Search,
  BadgeCheck, Star, Activity, Globe, Smartphone, MessageSquare,
  UserPlus, FileText, Award, Database, Server, Cpu,
} from "lucide-react";

const sidebarLinks = [
  { name: "Overview", icon: Home, id: "overview" },
  { name: "Workers", icon: Users, id: "workers" },
  { name: "Hirers", icon: Briefcase, id: "hirers" },
  { name: "Jobs & Bookings", icon: FileText, id: "jobs" },
  { name: "Payments", icon: Wallet, id: "payments" },
  { name: "Analytics", icon: BarChart3, id: "analytics" },
  { name: "Trust & Safety", icon: Shield, id: "safety" },
  { name: "System", icon: Server, id: "system" },
  { name: "Settings", icon: Settings, id: "settings" },
];

const recentActivity = [
  { text: "New worker registered: Suresh M (Plumber, Nagpur)", time: "2 min ago", type: "user" },
  { text: "Booking completed: #KON-4521 — ₹1,800 released", time: "5 min ago", type: "payment" },
  { text: "Payment dispute raised on booking #KON-4498", time: "12 min ago", type: "alert" },
  { text: "New hirer registered: Green Homes Pvt Ltd", time: "18 min ago", type: "user" },
  { text: "KonnectBot handled 47 queries in last hour", time: "25 min ago", type: "bot" },
  { text: "Worker verification: Meena D passed AI video check", time: "30 min ago", type: "verify" },
];

const cityMetrics = [
  { city: "Coimbatore", workers: 2450, hirers: 680, bookings: 1230, gmv: "₹18.5L", growth: "+12%" },
  { city: "Nagpur", workers: 1820, hirers: 420, bookings: 890, gmv: "₹12.1L", growth: "+18%" },
  { city: "Surat", workers: 1560, hirers: 380, bookings: 720, gmv: "₹10.8L", growth: "+22%" },
  { city: "Lucknow", workers: 980, hirers: 290, bookings: 450, gmv: "₹6.7L", growth: "+15%" },
  { city: "Vizag", workers: 640, hirers: 180, bookings: 280, gmv: "₹4.2L", growth: "+28%", tag: "NEW" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className={`sidebar fixed lg:static top-0 left-0 w-64 z-50 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">Konnect<span className="text-[#FF8F5C]">On</span></span>
              <p className="text-[9px] text-white/40 -mt-0.5">Admin Console</p>
            </div>
          </Link>
          <nav className="space-y-1">
            {sidebarLinks.map((link) => (
              <button key={link.name} onClick={() => { setActiveTab(link.id); setSidebarOpen(false); }}
                className={`sidebar-link w-full ${activeTab === link.id ? "active" : ""}`}>
                <link.icon className="w-5 h-5" /> {link.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B2C] to-[#E55A1B] flex items-center justify-center text-white font-bold text-sm">A</div>
            <div>
              <p className="text-white text-sm font-semibold">Admin</p>
              <p className="text-white/50 text-xs">Super Admin</p>
            </div>
          </div>
          <button className="sidebar-link w-full text-red-400 hover:!bg-red-500/10"><LogOut className="w-5 h-5" /> Logout</button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-[#E2E8F0] px-4 lg:px-8 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100"><Menu className="w-5 h-5" /></button>
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">Platform Overview</h1>
                <p className="text-sm text-[var(--color-muted)]">Real-time Kaizy metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-green-50 rounded-xl px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                <span className="text-xs font-medium text-[var(--color-success)]">All Systems Operational</span>
              </div>
              <button className="relative p-2.5 rounded-xl hover:bg-gray-100">
                <Bell className="w-5 h-5 text-[var(--color-muted)]" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Total Workers", value: "7,450", change: "+340 this week", icon: Users, color: "#FF6B2C" },
              { label: "Active Hirers", value: "1,950", change: "+85 this week", icon: Briefcase, color: "var(--color-info)" },
              { label: "Total Bookings", value: "3,570", change: "+210 this week", icon: CheckCircle2, color: "#3B82F6" },
              { label: "GMV (Monthly)", value: "₹52.3L", change: "+18% MoM", icon: IndianRupee, color: "var(--color-success)" },
              { label: "KonnectBot Queries", value: "12.4K", change: "87% auto-resolved", icon: MessageSquare, color: "#8B5CF6" },
            ].map((stat, i) => (
              <div key={i} className="card group">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                    <stat.icon className="w-4.5 h-4.5" style={{ color: stat.color }} />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-muted)] group-hover:text-[#FF6B2C]" />
                </div>
                <p className="text-xl font-bold text-[var(--foreground)]">{stat.value}</p>
                <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{stat.label}</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: stat.color }}>{stat.change}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* City Performance — 2 cols */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold">City Performance</h2>
                  <button className="text-sm text-[#FF6B2C] font-semibold hover:underline flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>City</th>
                        <th>Workers</th>
                        <th>Hirers</th>
                        <th>Bookings</th>
                        <th>GMV</th>
                        <th>Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cityMetrics.map((city, i) => (
                        <tr key={i}>
                          <td>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[#FF6B2C]" />
                              <span className="font-medium">{city.city}</span>
                              {city.tag && <span className="badge badge-info text-[8px]">{city.tag}</span>}
                            </div>
                          </td>
                          <td>{city.workers.toLocaleString()}</td>
                          <td>{city.hirers}</td>
                          <td>{city.bookings.toLocaleString()}</td>
                          <td className="font-semibold">{city.gmv}</td>
                          <td><span className="text-[var(--color-success)] font-semibold">{city.growth}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Platform Health */}
              <div className="card mt-6">
                <h2 className="text-lg font-bold mb-4">Platform Health</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "API Latency", value: "142ms", status: "green", icon: Activity },
                    { label: "Uptime", value: "99.97%", status: "green", icon: Server },
                    { label: "DB Connections", value: "234/500", status: "yellow", icon: Database },
                    { label: "Error Rate", value: "0.02%", status: "green", icon: AlertTriangle },
                  ].map((metric, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#F8FAFC]">
                      <div className="flex items-center justify-between mb-2">
                        <metric.icon className="w-4 h-4 text-[var(--color-muted)]" />
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          metric.status === "green" ? "bg-[var(--color-success)]" : "bg-[var(--color-warning)]"
                        }`} />
                      </div>
                      <p className="text-lg font-bold">{metric.value}</p>
                      <p className="text-[10px] text-[var(--color-muted)]">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funnel Metrics */}
              <div className="card mt-6">
                <h2 className="text-lg font-bold mb-4">Conversion Funnel</h2>
                <div className="space-y-4">
                  {[
                    { label: "Worker Registrations", value: 7450, pct: 100, color: "#FF6B2C" },
                    { label: "Profile Completed", value: 6200, pct: 83, color: "var(--color-info)" },
                    { label: "First Job Applied", value: 4100, pct: 55, color: "#3B82F6" },
                    { label: "First Job Completed", value: 3200, pct: 43, color: "var(--color-success)" },
                    { label: "Repeat Workers (2+ jobs)", value: 1800, pct: 24, color: "#8B5CF6" },
                  ].map((step, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">{step.label}</span>
                        <span className="text-sm text-[var(--color-muted)]">
                          {step.value.toLocaleString()} ({step.pct}%)
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="h-full rounded-full transition-all" style={{ width: `${step.pct}%`, background: step.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Live Activity Feed */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                    Live Activity
                  </h3>
                </div>
                <div className="space-y-3">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-[#F8FAFC]">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        item.type === "user" ? "bg-[var(--color-info)]" :
                        item.type === "payment" ? "bg-[var(--color-success)]" :
                        item.type === "alert" ? "bg-[var(--color-danger)]" :
                        item.type === "bot" ? "bg-[#8B5CF6]" : "bg-[#3B82F6]"
                      }`} />
                      <div>
                        <p className="text-xs text-[var(--foreground)]">{item.text}</p>
                        <p className="text-[10px] text-[var(--color-muted)]">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Ratios */}
              <div className="card">
                <h3 className="font-bold text-sm mb-4">Key Ratios</h3>
                <div className="space-y-3">
                  {[
                    { label: "Worker Activation (D7)", value: "68%", target: "70%", color: "var(--color-warning)" },
                    { label: "Job Post → Booking Rate", value: "42%", target: "40%", color: "var(--color-success)" },
                    { label: "Same-Day Payment Rate", value: "94%", target: "95%", color: "var(--color-info)" },
                    { label: "WhatsApp Bot Resolution", value: "87%", target: "80%", color: "var(--color-success)" },
                    { label: "Repeat Hirer Rate", value: "56%", target: "50%", color: "var(--color-success)" },
                    { label: "Worker NPS", value: "+62", target: "+50", color: "var(--color-success)" },
                  ].map((ratio, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC]">
                      <div>
                        <p className="text-xs font-medium">{ratio.label}</p>
                        <p className="text-[10px] text-[var(--color-muted)]">Target: {ratio.target}</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: ratio.color }}>{ratio.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="card">
                <h3 className="font-bold text-sm mb-4">Revenue Breakdown (Monthly)</h3>
                <div className="space-y-3">
                  {[
                    { label: "Marketplace Commission", value: "₹4.8L", pct: 62 },
                    { label: "KonnectPremium (Workers)", value: "₹1.2L", pct: 15 },
                    { label: "Contractor SaaS", value: "₹0.8L", pct: 10 },
                    { label: "NBFC Referral", value: "₹0.6L", pct: 8 },
                    { label: "Other", value: "₹0.4L", pct: 5 },
                  ].map((rev, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs">{rev.label}</span>
                        <span className="text-xs font-semibold">{rev.value}</span>
                      </div>
                      <div className="progress-bar !h-1.5">
                        <div className="h-full rounded-full" style={{ width: `${rev.pct}%`, background: "var(--gradient-primary)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
