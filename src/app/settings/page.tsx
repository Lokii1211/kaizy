"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { useAuth } from "@/stores/AuthStore";

// ============================================================
// SETTINGS v10.0 — Stitch "Digital Artisan" Design
// Epilogue headlines · Tonal surfaces · No harsh borders
// ============================================================

interface UserProfile {
  id: string; name: string; phone: string; user_type: string;
  trade?: string; experience_years?: number; avg_rating?: number;
  total_jobs?: number; kaizy_score?: number;
}

const workerMenuSections = [
  { title: "Worker", items: [
    { icon: "💰", label: "Earnings & Payments", href: "/earnings" },
    { icon: "📊", label: "Performance Dashboard", href: "/dashboard/performance" },
    { icon: "📋", label: "My Jobs", href: "/my-bookings" },
    { icon: "💲", label: "My Pricing", href: "/onboarding/specialization" },
    { icon: "🧾", label: "Commission", href: "/commission" },
    { icon: "📄", label: "KaizyPass", href: "/worker/profile" },
    { icon: "🏅", label: "KaizyScore", href: "/kaizy-score" },
    { icon: "🏆", label: "Leaderboard", href: "/leaderboard" },
    { icon: "🪪", label: "Verify Identity", href: "/verify" },
    { icon: "🎯", label: "Incentives & Targets", href: "/incentives" },
    { icon: "📸", label: "Job Photos", href: "/job-photos" },
    { icon: "🎁", label: "Refer & Earn", href: "/referral" },
  ]},
  { title: "Preferences", items: [
    { icon: "⏰", label: "My Schedule", href: "/schedule" },
    { icon: "🌐", label: "Language", href: "#" },
    { icon: "🔔", label: "Notifications", href: "/notifications" },
    { icon: "⚙️", label: "Notification Settings", href: "/settings/notifications" },
  ]},
  { title: "Support", items: [
    { icon: "💬", label: "KaizyBot Help", href: "/konnectbot" },
    { icon: "📞", label: "Contact Support", href: "/help" },
    { icon: "📜", label: "Terms", href: "/terms" },
    { icon: "🔒", label: "Privacy Policy", href: "/privacy" },
    { icon: "🤝", label: "Worker Agreement", href: "/worker-agreement" },
    { icon: "💳", label: "Refund Policy", href: "/refunds" },
  ]},
];

const hirerMenuSections = [
  { title: "Account", items: [
    { icon: "📋", label: "My Bookings", href: "/my-bookings" },
    { icon: "❤️", label: "Saved Workers", href: "/saved-workers" },
    { icon: "📝", label: "Post a Job", href: "/booking" },
    { icon: "💰", label: "Pricing Guide", href: "/pricing" },
    { icon: "🎁", label: "Refer & Earn", href: "/referral" },
  ]},
  { title: "Preferences", items: [
    { icon: "🌐", label: "Language", href: "#" },
    { icon: "🔔", label: "Notifications", href: "/notifications" },
    { icon: "⚙️", label: "Notification Settings", href: "/settings/notifications" },
    { icon: "📍", label: "Saved Locations", href: "/saved-addresses" },
  ]},
  { title: "Support", items: [
    { icon: "💬", label: "KaizyBot Help", href: "/konnectbot" },
    { icon: "📞", label: "Contact Support", href: "/help" },
    { icon: "📜", label: "Terms", href: "/terms" },
    { icon: "🔒", label: "Privacy Policy", href: "/privacy" },
    { icon: "💳", label: "Refund Policy", href: "/refunds" },
  ]},
];

export default function SettingsPage() {
  const { toggle, isDark } = useTheme();
  const { logout: authLogout } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(j => {
      if (j.success && j.data) setUser(j.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    if (!confirm("Sign out of this device only?")) return;
    authLogout();
    router.push("/login");
  };

  const handleDeleteAccount = () => {
    if (!confirm("⚠️ Delete your account?\n\nThis will permanently remove all your data.\nYou have 30 days to change your mind.")) return;
    if (!confirm("This is irreversible. Are you absolutely sure?")) return;
    authLogout();
    router.push("/login");
  };

  const displayName = user?.name || user?.phone?.replace("+91", "") || "User";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const tradeLine = user?.user_type === "worker" && user?.trade
    ? `${user.trade} · ${user.experience_years || 0} yrs`
    : user?.user_type === "hirer" ? "Hirer" : "";

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex justify-between items-center mb-5">
          <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>Settings</h1>
          <div className="w-9" />
        </div>

        {/* Profile card */}
        {loading ? (
          <div className="skeleton rounded-[16px]" style={{ height: 80 }} />
        ) : (
          <div className="rounded-[20px] p-5 flex items-center gap-4" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
            <div className="rounded-full flex items-center justify-center text-[22px] font-black text-white shrink-0"
                 style={{ width: 56, height: 56, background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>{initials}</div>
            <div className="flex-1">
              <p className="text-[15px] font-extrabold tracking-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>{displayName}</p>
              {tradeLine && <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--brand-soft)" }}>{tradeLine}</p>}
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>{user?.phone || ""}</p>
            </div>
            <Link href={user?.user_type === "worker" ? "/worker/profile" : "/profile"}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-full"
                  style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>Edit</Link>
          </div>
        )}
      </div>

      {/* Quick stats */}
      {user?.user_type === "worker" && (
        <div className="grid grid-cols-3 gap-2.5 px-5 mt-3">
          {[
            { val: user.avg_rating ? `${user.avg_rating.toFixed(1)}⭐` : "—", label: "Rating" },
            { val: String(user.total_jobs || 0), label: "Jobs" },
            { val: String(user.kaizy_score || 0), label: "KaizyScore" },
          ].map(s => (
            <div key={s.label} className="rounded-[14px] py-3 px-2 text-center" style={{ background: "var(--bg-surface)" }}>
              <p className="text-[16px] font-black" style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</p>
              <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* THEME TOGGLE */}
      <div className="px-5 mt-6">
        <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>Appearance</p>
        <div className="rounded-[16px] p-4 flex items-center justify-between" style={{ background: "var(--bg-card)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-surface)" }}>
              <span className="text-[18px]">{isDark ? "🌙" : "☀️"}</span>
            </div>
            <div>
              <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{isDark ? "Dark Theme" : "Light Theme"}</p>
              <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{isDark ? "Easier on eyes at night" : "Classic bright look"}</p>
            </div>
          </div>
          <button onClick={toggle} className="relative rounded-full active:scale-95 transition-all"
                  style={{ width: 48, height: 26, background: isDark ? "var(--brand)" : "var(--bg-elevated)" }}>
            <div className="absolute top-[3px] rounded-full bg-white transition-all"
                 style={{ width: 20, height: 20, left: isDark ? 25 : 3, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
          </button>
        </div>
      </div>

      {/* Menu sections — role-based */}
      {(user?.user_type === "worker" ? workerMenuSections : hirerMenuSections).map(section => (
        <div key={section.title} className="px-5 mt-6">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>{section.title}</p>
          <div className="rounded-[16px] overflow-hidden" style={{ background: "var(--bg-card)" }}>
            {section.items.map((item, i) => (
              <Link key={item.label} href={item.href}
                    className="flex items-center gap-3 px-4 py-[13px] active:opacity-70 transition-opacity"
                     style={{ borderBottom: i < section.items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--bg-surface)" }}>
                  <span className="text-[14px]">{item.icon}</span>
                </div>
                <span className="text-[12px] font-bold flex-1" style={{ color: "var(--text-1)" }}>{item.label}</span>
                <span className="text-[11px]" style={{ color: "var(--text-3)" }}>›</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <div className="px-5 mt-8 space-y-3">
        <button onClick={handleLogout}
                className="block w-full py-4 rounded-[16px] text-center text-[12px] font-extrabold active:scale-[0.97] transition-transform"
                style={{ background: "var(--danger-tint)", color: "var(--danger)" }}>
          Log Out
        </button>
        <button onClick={handleDeleteAccount}
                className="block w-full py-3 rounded-[16px] text-center text-[10px] font-bold active:scale-[0.97] transition-transform"
                style={{ color: "var(--text-3)" }}>
          Delete My Account
        </button>
      </div>

      <p className="text-center text-[9px] mt-4 pb-4" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>Kaizy v11.0 · Digital Artisan</p>
    </div>
  );
}
