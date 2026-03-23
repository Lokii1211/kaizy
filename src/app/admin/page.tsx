"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// ADMIN DASHBOARD — Founder-level operations view
// Revenue, users, bookings, real-time metrics
// ============================================================

interface AdminStats {
  users: { total: number; workers: number; hirers: number; workersOnline: number };
  bookings: { total: number; today: number; thisWeek: number; completed: number; pending: number; cancelled: number };
  revenue: { totalCommission: number; paidCommission: number; pendingCommission: number; commissionPerJob: number; estimatedMonthly: number };
  recentBookings: Array<{ id: string; status: string; created_at: string; total_amount: number }>;
  generatedAt: string;
}

const statusColors: Record<string, string> = {
  pending: "#F59E0B", accepted: "#3B82F6", in_progress: "#FF6B00",
  completed: "#22C55E", cancelled: "#EF4444", paid: "#10B981",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (json.success && json.data) setStats(json.data);
    } catch (e) {
      console.error("[admin]", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const refresh = () => { setRefreshing(true); fetchStats(); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 rounded-full animate-spin mx-auto" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
          <p className="text-[12px] font-bold mt-3" style={{ color: "var(--text-3)" }}>Loading admin data...</p>
        </div>
      </div>
    );
  }

  const s = stats;

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-[10px] font-bold text-gray-400">KAIZY ADMIN</p>
            <h1 className="text-[20px] font-black text-white">Command Center 🎯</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                    style={{ background: "rgba(255,255,255,0.1)" }}>
              <span className="text-[16px]" style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}>🔄</span>
            </button>
            <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
              <span className="text-[16px]">⚙️</span>
            </Link>
          </div>
        </div>

        {/* Revenue Hero */}
        <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[10px] font-bold text-gray-400">THIS MONTH&apos;S REVENUE</p>
          <p className="text-[36px] font-black" style={{ color: "#22C55E" }}>
            ₹{(s?.revenue.totalCommission || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            {Math.round((s?.revenue.totalCommission || 0) / 5)} jobs × ₹5/job ·
            <span style={{ color: "#F59E0B" }}> ₹{s?.revenue.pendingCommission || 0} pending</span>
          </p>
        </div>
      </div>

      {/* User Stats */}
      <div className="px-4 mt-4">
        <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "var(--text-3)", letterSpacing: 2 }}>Users</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { v: s?.users.total || 0, l: "Total", c: "var(--text-1)", icon: "👥" },
            { v: s?.users.workers || 0, l: "Workers", c: "var(--brand)", icon: "🔧" },
            { v: s?.users.hirers || 0, l: "Hirers", c: "#3B82F6", icon: "🏠" },
            { v: s?.users.workersOnline || 0, l: "Online", c: "var(--success)", icon: "🟢" },
          ].map(stat => (
            <div key={stat.l} className="rounded-xl p-3 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <span className="text-[14px]">{stat.icon}</span>
              <p className="text-[18px] font-black mt-1" style={{ color: stat.c }}>{stat.v}</p>
              <p className="text-[8px] font-bold" style={{ color: "var(--text-3)" }}>{stat.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Stats */}
      <div className="px-4 mt-4">
        <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "var(--text-3)", letterSpacing: 2 }}>Bookings</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: s?.bookings.today || 0, l: "Today", c: "var(--brand)" },
            { v: s?.bookings.thisWeek || 0, l: "This Week", c: "#3B82F6" },
            { v: s?.bookings.total || 0, l: "All Time", c: "var(--text-1)" },
          ].map(stat => (
            <div key={stat.l} className="rounded-xl p-3 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <p className="text-[20px] font-black" style={{ color: stat.c }}>{stat.v}</p>
              <p className="text-[9px] font-bold" style={{ color: "var(--text-3)" }}>{stat.l}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            { v: s?.bookings.completed || 0, l: "Completed", c: "var(--success)" },
            { v: s?.bookings.pending || 0, l: "Pending", c: "var(--warning)" },
            { v: s?.bookings.cancelled || 0, l: "Cancelled", c: "var(--danger)" },
          ].map(stat => (
            <div key={stat.l} className="rounded-xl p-3 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <p className="text-[16px] font-black" style={{ color: stat.c }}>{stat.v}</p>
              <p className="text-[9px] font-bold" style={{ color: "var(--text-3)" }}>{stat.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="px-4 mt-4">
        <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "var(--text-3)", letterSpacing: 2 }}>Revenue</p>
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px]" style={{ color: "var(--text-2)" }}>Total Commission</span>
              <span className="text-[14px] font-bold" style={{ color: "var(--success)" }}>₹{s?.revenue.totalCommission || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px]" style={{ color: "var(--text-2)" }}>Collected</span>
              <span className="text-[14px] font-bold" style={{ color: "var(--brand)" }}>₹{s?.revenue.paidCommission || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px]" style={{ color: "var(--text-2)" }}>Pending Collection</span>
              <span className="text-[14px] font-bold" style={{ color: "var(--warning)" }}>₹{s?.revenue.pendingCommission || 0}</span>
            </div>
            <div className="pt-2" style={{ borderTop: "1px dashed var(--border-1)" }}>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>Projected Monthly</span>
                <span className="text-[16px] font-black" style={{ color: "var(--success)" }}>
                  ₹{((s?.bookings.thisWeek || 0) * 5 * 4.3).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="px-4 mt-4">
        <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "var(--text-3)", letterSpacing: 2 }}>Recent Activity</p>

        {(!s?.recentBookings || s.recentBookings.length === 0) ? (
          <div className="rounded-xl p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <p className="text-[32px] mb-2">📊</p>
            <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>No bookings yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {s.recentBookings.map(b => (
              <div key={b.id} className="rounded-xl p-3 flex items-center gap-3"
                   style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColors[b.status] || "#999" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold truncate" style={{ color: "var(--text-1)" }}>
                    #{b.id.slice(0, 8)} · <span style={{ color: statusColors[b.status] || "var(--text-3)" }}>{b.status}</span>
                  </p>
                  <p className="text-[9px]" style={{ color: "var(--text-3)" }}>
                    {new Date(b.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <p className="text-[13px] font-black shrink-0" style={{ color: "var(--text-1)" }}>
                  ₹{b.total_amount || "—"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last Updated */}
      <p className="text-center text-[9px] mt-6 pb-4" style={{ color: "var(--text-3)" }}>
        Last refreshed: {s?.generatedAt ? new Date(s.generatedAt).toLocaleTimeString("en-IN") : "—"}
      </p>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
