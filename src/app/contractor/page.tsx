"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users, Plus, MapPin, Star, Clock, TrendingUp, IndianRupee,
  Calendar, Phone, ChevronRight, CheckCircle2, BarChart3, Shield,
  Award, Briefcase, ArrowRight, Search, Bell, Settings, LogOut,
  Zap, Eye, MessageCircle, UserPlus, Crown, Target, Percent,
} from "lucide-react";

const teamMembers = [
  { name: "Raju Kumar", trade: "Electrician", status: "on_job", rating: 4.8, jobs: 127, earnings: "₹48,600", avatar: "RK", phone: "+91 98765 43210" },
  { name: "Suresh Babu", trade: "Plumber", status: "available", rating: 4.6, jobs: 203, earnings: "₹62,100", avatar: "SB", phone: "+91 87654 32109" },
  { name: "Priya Sharma", trade: "AC Technician", status: "on_job", rating: 4.9, jobs: 89, earnings: "₹38,200", avatar: "PS", phone: "+91 76543 21098" },
  { name: "Anil Verma", trade: "Carpenter", status: "available", rating: 4.7, jobs: 156, earnings: "₹55,800", avatar: "AV", phone: "+91 65432 10987" },
  { name: "Lakshmi R", trade: "Painter", status: "off_duty", rating: 4.5, jobs: 64, earnings: "₹24,500", avatar: "LR", phone: "+91 54321 09876" },
  { name: "Ganesh M", trade: "Electrician", status: "available", rating: 4.4, jobs: 45, earnings: "₹18,900", avatar: "GM", phone: "+91 43210 98765" },
];

const statusConfig = {
  on_job: { label: "On Job", color: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  available: { label: "Available", color: "bg-green-50 text-green-700", dot: "bg-green-500" },
  off_duty: { label: "Off Duty", color: "bg-gray-50 text-gray-500", dot: "bg-gray-400" },
};

const teamBookings = [
  { id: "TB-2024-001", client: "RS Puram Textile Mill", workers: 4, total: "₹32,000", status: "active", progress: 65, duration: "3 weeks" },
  { id: "TB-2024-002", client: "Apex Apartments", workers: 2, total: "₹8,500", status: "upcoming", progress: 0, duration: "2 days" },
  { id: "TB-2024-003", client: "Green Homes Colony", workers: 6, total: "₹1,20,000", status: "completed", progress: 100, duration: "6 weeks" },
];

export default function ContractorPortalPage() {
  const [activeTab, setActiveTab] = useState<"team" | "bookings" | "analytics">("team");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-[#1E293B] text-white">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">Connect<span className="text-[#FF6B2C]">On</span></span>
              <p className="text-[10px] text-white/50">Contractor Portal</p>
            </div>
          </div>
        </div>

        {/* Subscription Badge */}
        <div className="px-6 py-4">
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">Pro Plan</span>
            </div>
            <p className="text-xs text-white/60 mb-2">₹999/month • 6 workers</p>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: "60%" }} />
            </div>
            <p className="text-[10px] text-white/40 mt-1">4 of 6 slots used this month</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {[
            { icon: Users, label: "My Team", tab: "team" as const },
            { icon: Briefcase, label: "Team Bookings", tab: "bookings" as const },
            { icon: BarChart3, label: "Analytics", tab: "analytics" as const },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.tab ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
          <div className="!mt-4 border-t border-white/10 pt-4 space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5">
              <MessageCircle className="w-5 h-5" /> Messages
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5">
              <Settings className="w-5 h-5" /> Settings
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B2C] flex items-center justify-center text-sm font-bold">AS</div>
            <div>
              <p className="text-sm font-semibold">Anita Sharma</p>
              <p className="text-[10px] text-white/50">Contractor • Coimbatore</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#E2E8F0] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">
                {activeTab === "team" && "My Team"}
                {activeTab === "bookings" && "Team Bookings"}
                {activeTab === "analytics" && "Analytics"}
              </h1>
              <p className="text-xs text-[var(--color-muted)]">Manage your workforce from one dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-gray-100">
                <Bell className="w-5 h-5" />
              </button>
              <button className="btn-primary !py-2.5 !px-4 !text-sm">
                <UserPlus className="w-4 h-4" /> Add Worker
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Team Tab */}
          {activeTab === "team" && (
            <div className="space-y-6 animate-slide-up">
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Workers", value: "6", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Available Now", value: "3", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
                  { label: "On Jobs", value: "2", icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50" },
                  { label: "Team Rating", value: "4.65", icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl p-4 border border-[#E2E8F0]">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-[var(--color-muted)]">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Workers Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold">Workers ({teamMembers.length})</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                      <input className="input !pl-9 !py-2 !text-sm !w-56" placeholder="Search workers..." />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {teamMembers.map((member) => {
                    const s = statusConfig[member.status as keyof typeof statusConfig];
                    return (
                      <div key={member.name} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#FF6B2C] flex items-center justify-center text-white font-bold">{member.avatar}</div>
                            <div>
                              <p className="font-bold text-sm">{member.name}</p>
                              <p className="text-xs text-[var(--color-muted)]">{member.trade}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 ${s.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="bg-[#F8FAFC] rounded-xl p-2 text-center">
                            <p className="text-sm font-bold">{member.rating}</p>
                            <p className="text-[9px] text-[var(--color-muted)]">Rating</p>
                          </div>
                          <div className="bg-[#F8FAFC] rounded-xl p-2 text-center">
                            <p className="text-sm font-bold">{member.jobs}</p>
                            <p className="text-[9px] text-[var(--color-muted)]">Jobs</p>
                          </div>
                          <div className="bg-[#F8FAFC] rounded-xl p-2 text-center">
                            <p className="text-sm font-bold">{member.earnings}</p>
                            <p className="text-[9px] text-[var(--color-muted)]">Earned</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button className="flex-1 py-2 rounded-xl bg-[#FF6B2C]/10 text-[#FF6B2C] text-xs font-semibold hover:bg-[#FF6B2C]/20 transition-colors flex items-center justify-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" /> Assign Job
                          </button>
                          <button className="py-2 px-3 rounded-xl border border-[#E2E8F0] text-xs hover:bg-gray-50 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="py-2 px-3 rounded-xl border border-[#E2E8F0] text-xs hover:bg-gray-50 transition-colors">
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Worker Card */}
                  <button className="bg-white rounded-2xl border-2 border-dashed border-[#E2E8F0] p-5 flex flex-col items-center justify-center gap-3 hover:border-[#FF6B2C] transition-colors min-h-[220px]">
                    <div className="w-14 h-14 rounded-2xl bg-[#FF6B2C]/10 flex items-center justify-center">
                      <Plus className="w-7 h-7 text-[#FF6B2C]" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm">Add Worker</p>
                      <p className="text-xs text-[var(--color-muted)]">WhatsApp invite or manual add</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <div className="space-y-6 animate-slide-up">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: "Active Projects", value: "1", change: "+1 this week", color: "text-blue-600" },
                  { label: "Total Revenue", value: "₹1,60,500", change: "+₹32,000 this month", color: "text-green-600" },
                  { label: "Utilization Rate", value: "78%", change: "+5% vs last month", color: "text-purple-600" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#E2E8F0]">
                    <p className="text-xs text-[var(--color-muted)] mb-1">{s.label}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className={`text-xs ${s.color} font-medium`}>{s.change}</p>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="font-bold mb-4">Team Projects</h2>
                <div className="space-y-3">
                  {teamBookings.map((booking) => (
                    <div key={booking.id} className="bg-white rounded-2xl p-5 border border-[#E2E8F0] hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold">{booking.client}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              booking.status === "active" ? "bg-blue-50 text-blue-700" :
                              booking.status === "upcoming" ? "bg-yellow-50 text-yellow-700" :
                              "bg-green-50 text-green-700"
                            }`}>
                              {booking.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-muted)]">{booking.id} • {booking.workers} workers • {booking.duration}</p>
                        </div>
                        <p className="text-lg font-bold text-[#FF6B2C]">{booking.total}</p>
                      </div>

                      {booking.status === "active" && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[var(--color-muted)]">Progress</span>
                            <span className="text-xs font-bold">{booking.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-[#FF6B2C] h-2 rounded-full transition-all"
                              style={{ width: `${booking.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6 animate-slide-up">
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { label: "Monthly Revenue", value: "₹1,60,500", trend: "+18%", icon: IndianRupee, positive: true },
                  { label: "Worker Utilization", value: "78%", trend: "+5%", icon: Target, positive: true },
                  { label: "Team Rating", value: "4.65 / 5", trend: "+0.1", icon: Star, positive: true },
                  { label: "Dispute Rate", value: "1.2%", trend: "-0.3%", icon: Shield, positive: true },
                ].map((metric) => (
                  <div key={metric.label} className="bg-white rounded-2xl p-5 border border-[#E2E8F0]">
                    <div className="flex items-center justify-between mb-3">
                      <metric.icon className="w-5 h-5 text-[var(--color-muted)]" />
                      <span className={`text-xs font-semibold ${metric.positive ? "text-green-600" : "text-red-600"}`}>
                        {metric.trend}
                      </span>
                    </div>
                    <p className="text-xl font-bold">{metric.value}</p>
                    <p className="text-xs text-[var(--color-muted)]">{metric.label}</p>
                  </div>
                ))}
              </div>

              {/* Revenue Breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0]">
                <h3 className="font-bold mb-4">Revenue by Worker</h3>
                <div className="space-y-3">
                  {teamMembers.sort((a, b) => parseInt(b.earnings.replace(/[₹,]/g, "")) - parseInt(a.earnings.replace(/[₹,]/g, ""))).map((m) => {
                    const earnings = parseInt(m.earnings.replace(/[₹,]/g, ""));
                    const maxEarnings = 62100;
                    return (
                      <div key={m.name} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-[#FF6B2C] flex items-center justify-center text-white text-[10px] font-bold">{m.avatar}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{m.name}</p>
                            <p className="text-sm font-bold">{m.earnings}</p>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-[#FF6B2C] h-2 rounded-full"
                              style={{ width: `${(earnings / maxEarnings) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Opportunity Alert */}
              <div className="bg-gradient-to-r from-[#FF6B2C]/10 to-[#3B82F6]/10 rounded-2xl p-6 border border-[#FF6B2C]/20">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-6 h-6 text-[#FF6B2C]" />
                  <h3 className="font-bold">💡 Opportunity Alert</h3>
                </div>
                <p className="text-sm text-[var(--color-muted)] mb-3">
                  You&apos;re missing <span className="font-bold text-[#FF6B2C]">₹18,500/month</span> because
                  Lakshmi R and Ganesh M have low utilization. Consider:
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-white rounded-xl text-xs font-semibold border border-[#E2E8F0]">
                    📢 Promote their skills
                  </span>
                  <span className="px-3 py-1.5 bg-white rounded-xl text-xs font-semibold border border-[#E2E8F0]">
                    🎯 Assign to team projects
                  </span>
                  <span className="px-3 py-1.5 bg-white rounded-xl text-xs font-semibold border border-[#E2E8F0]">
                    📚 Upskill via KonnectLearn
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
