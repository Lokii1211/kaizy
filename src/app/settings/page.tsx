"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";

// ============================================================
// SETTINGS — Real user data from API
// ============================================================

interface UserProfile {
  id: string; name: string; phone: string; user_type: string;
  trade?: string; experience_years?: number; avg_rating?: number;
  total_jobs?: number; kaizy_score?: number;
}

const workerMenuSections = [
  { title: "Worker", items: [
    { icon: "💰", label: "Earnings & Payments", href: "/earnings" },
    { icon: "📋", label: "My Jobs", href: "/my-bookings" },
    { icon: "📄", label: "KaizyPass", href: "/worker/profile" },
    { icon: "🎯", label: "Incentives & Targets", href: "/incentives" },
    { icon: "📸", label: "Job Photos", href: "/job-photos" },
    { icon: "🎁", label: "Refer & Earn", href: "/referral" },
  ]},
  { title: "Preferences", items: [
    { icon: "🌐", label: "Language", href: "#" },
    { icon: "🔔", label: "Notifications", href: "/notifications" },
  ]},
  { title: "Support", items: [
    { icon: "💬", label: "KaizyBot Help", href: "/konnectbot" },
    { icon: "📞", label: "Contact Support", href: "/help" },
    { icon: "📜", label: "Terms", href: "/terms" },
    { icon: "🔒", label: "Privacy Policy", href: "/privacy" },
  ]},
];

const hirerMenuSections = [
  { title: "Account", items: [
    { icon: "📋", label: "My Bookings", href: "/my-bookings" },
    { icon: "❤️", label: "Saved Workers", href: "/saved-workers" },
    { icon: "📝", label: "Post a Job", href: "/booking" },
    { icon: "🎁", label: "Refer & Earn", href: "/referral" },
  ]},
  { title: "Preferences", items: [
    { icon: "🌐", label: "Language", href: "#" },
    { icon: "🔔", label: "Notifications", href: "/notifications" },
    { icon: "📍", label: "Saved Locations", href: "#" },
  ]},
  { title: "Support", items: [
    { icon: "💬", label: "KaizyBot Help", href: "/konnectbot" },
    { icon: "📞", label: "Contact Support", href: "/help" },
    { icon: "📜", label: "Terms", href: "/terms" },
    { icon: "🔒", label: "Privacy Policy", href: "/privacy" },
  ]},
];

export default function SettingsPage() {
  const { toggle, isDark } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(j => {
      if (j.success && j.data) setUser(j.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    document.cookie = "kaizy_token=; Max-Age=0; path=/";
    document.cookie = "kaizy_user_type=; Max-Age=0; path=/";
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
      <div className="px-4 pt-4 pb-3">
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <span className="text-[14px]">←</span>
          </Link>
          <h1 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>Profile</h1>
          <div className="w-9" />
        </div>

        {/* Profile card */}
        {loading ? (
          <div className="skeleton rounded-[16px]" style={{ height: 80 }} />
        ) : (
          <div className="rounded-[16px] p-4 flex items-center gap-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            <div className="rounded-full flex items-center justify-center text-[22px] font-black text-white shrink-0"
                 style={{ width: 56, height: 56, background: "var(--brand)", boxShadow: "var(--shadow-brand)" }}>{initials}</div>
            <div className="flex-1">
              <p className="text-[15px] font-extrabold" style={{ color: "var(--text-1)" }}>{displayName}</p>
              {tradeLine && <p className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>{tradeLine}</p>}
              <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{user?.phone || ""}</p>
            </div>
            <Link href={user?.user_type === "worker" ? "/worker/profile" : "/settings"} className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>Edit →</Link>
          </div>
        )}
      </div>

      {/* Quick stats */}
      {user?.user_type === "worker" && (
        <div className="grid grid-cols-3 gap-2 px-4 mt-2">
          {[
            { val: user.avg_rating ? `${user.avg_rating.toFixed(1)}⭐` : "—", label: "Rating" },
            { val: String(user.total_jobs || 0), label: "Jobs" },
            { val: String(user.kaizy_score || 0), label: "KaizyScore" },
          ].map(s => (
            <div key={s.label} className="rounded-[12px] py-3 px-2 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
              <p className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>{s.val}</p>
              <p className="text-[9px] font-semibold" style={{ color: "var(--text-3)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* THEME TOGGLE */}
      <div className="px-4 mt-5">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)", letterSpacing: "2px" }}>Appearance</p>
        <div className="rounded-[14px] p-4 flex items-center justify-between" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
          <div className="flex items-center gap-3">
            <span className="text-[20px]">{isDark ? "🌙" : "☀️"}</span>
            <div>
              <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{isDark ? "Dark Theme" : "Light Theme"}</p>
              <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{isDark ? "Easier on eyes at night" : "Classic bright look"}</p>
            </div>
          </div>
          <button onClick={toggle} className="relative rounded-[12px] active:scale-95 transition-all"
                  style={{ width: 52, height: 28, background: isDark ? "var(--brand)" : "var(--bg-elevated)" }}>
            <div className="absolute top-[4px] rounded-full bg-white transition-all"
                 style={{ width: 20, height: 20, left: isDark ? 28 : 4, boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }} />
          </button>
        </div>
      </div>

      {/* Menu sections — role-based */}
      {(user?.user_type === "worker" ? workerMenuSections : hirerMenuSections).map(section => (
        <div key={section.title} className="px-4 mt-5">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)", letterSpacing: "2px" }}>{section.title}</p>
          <div className="rounded-[14px] overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-1)" }}>
            {section.items.map((item, i) => (
              <Link key={item.label} href={item.href}
                    className="flex items-center gap-3 px-4 py-[14px] active:opacity-70 transition-opacity"
                    style={{ borderBottom: i < section.items.length - 1 ? "1px solid var(--border-1)" : "none" }}>
                <span className="text-[16px]">{item.icon}</span>
                <span className="text-[13px] font-bold flex-1" style={{ color: "var(--text-1)" }}>{item.label}</span>
                <span className="text-[12px]" style={{ color: "var(--text-3)" }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <div className="px-4 mt-6">
        <button onClick={handleLogout}
                className="block w-full py-4 rounded-[14px] text-center text-[13px] font-extrabold active:scale-[0.98] transition-transform"
                style={{ background: "var(--bg-card)", color: "var(--danger)", border: "1px solid var(--danger-tint)" }}>
          Log Out
        </button>
      </div>

      <p className="text-center text-[10px] mt-4 pb-4" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>Kaizy v6.0 · Production</p>
    </div>
  );
}
