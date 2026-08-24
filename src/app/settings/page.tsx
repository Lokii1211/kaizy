"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { useAuth } from "@/stores/AuthStore";
import { useI18n, type Locale } from "@/components/I18nProvider";

interface UserProfile {
  id: string; name: string; phone: string; user_type: string;
  trade?: string; experience_years?: number; avg_rating?: number;
  total_jobs?: number; kaizy_score?: number;
}

const languages: { code: Locale; name: string; native: string; flag: string }[] = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", native: "हिंदी", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳" },
];

export default function SettingsPage() {
  const { toggle, isDark } = useTheme();
  const { user: authUser, logout: authLogout } = useAuth();
  const { locale, setLocale } = useI18n();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLangModal, setShowLangModal] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(j => {
      if (j.success && j.data) setProfile(j.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const user = profile || (authUser ? {
    id: authUser.id, name: authUser.name, phone: authUser.phone, user_type: authUser.user_type,
  } as UserProfile : null);

  const handleLogout = () => {
    if (!confirm("Sign out of this device?")) return;
    authLogout();
    router.push("/login");
  };

  const displayName = user?.name || user?.phone?.replace("+91", "") || "User";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const tradeLine = user?.user_type === "worker" && user?.trade
    ? `${user.trade} · ${user.experience_years || 0} yrs`
    : user?.user_type === "hirer" ? "Hirer" : "";

  const workerMenuSections = [
    { title: "Worker Tools", items: [
      { icon: "💰", label: "Earnings & Payments", href: "/earnings" },
      { icon: "📊", label: "Performance Dashboard", href: "/dashboard/performance" },
      { icon: "⚡", label: "Active Job", href: "/active-job" },
      { icon: "💲", label: "My Pricing & Specialization", href: "/onboarding/specialization" },
      { icon: "🧾", label: "Commission Settlement", href: "/commission" },
      { icon: "📄", label: "KaizyPass Digital ID", href: "/worker/profile" },
      { icon: "🏅", label: "KaizyScore & Badges", href: "/kaizy-score" },
      { icon: "🏆", label: "Leaderboard", href: "/leaderboard" },
      { icon: "🪪", label: "Verify Identity (KYC)", href: "/verify" },
      { icon: "🎯", label: "Incentives & Rewards", href: "/incentives" },
      { icon: "📸", label: "Job Photos & Audit", href: "/job-photos" },
      { icon: "🎁", label: "Refer & Earn", href: "/referral" },
    ]},
    { title: "Preferences", items: [
      { icon: "⏰", label: "Working Hours & Schedule", href: "/schedule" },
      { icon: "🌐", label: `Language (${languages.find(l => l.code === locale)?.name || 'English'})`, href: "action:language" },
      { icon: "🔔", label: "Notifications Feed", href: "/notifications" },
      { icon: "⚙️", label: "Notification Settings", href: "/settings/notifications" },
    ]},
    { title: "Support & Legal", items: [
      { icon: "💬", label: "KaizyBot AI Assistant", href: "/kaizybot" },
      { icon: "📞", label: "Contact Support & Help Center", href: "/help" },
      { icon: "📜", label: "Terms of Service", href: "/terms" },
      { icon: "🔒", label: "Privacy Policy (DPDP)", href: "/privacy" },
      { icon: "🤝", label: "Worker Partner Agreement", href: "/worker-agreement" },
      { icon: "💳", label: "Refund Policy", href: "/refunds" },
    ]},
  ];

  const hirerMenuSections = [
    { title: "Account & Bookings", items: [
      { icon: "📋", label: "My Bookings", href: "/my-bookings" },
      { icon: "❤️", label: "Saved Workers", href: "/saved-workers" },
      { icon: "🛠️", label: "Book a Worker", href: "/booking" },
      { icon: "💰", label: "Market Pricing Guide", href: "/pricing" },
      { icon: "🎁", label: "Refer & Earn ₹100", href: "/referral" },
    ]},
    { title: "Preferences", items: [
      { icon: "🌐", label: `Language (${languages.find(l => l.code === locale)?.name || 'English'})`, href: "action:language" },
      { icon: "🔔", label: "Notifications Feed", href: "/notifications" },
      { icon: "⚙️", label: "Notification Settings", href: "/settings/notifications" },
      { icon: "📍", label: "Saved Addresses", href: "/saved-addresses" },
    ]},
    { title: "Support & Legal", items: [
      { icon: "💬", label: "KaizyBot AI Assistant", href: "/kaizybot" },
      { icon: "📞", label: "Contact Support & Help Center", href: "/help" },
      { icon: "📜", label: "Terms of Service", href: "/terms" },
      { icon: "🔒", label: "Privacy Policy (DPDP)", href: "/privacy" },
      { icon: "💳", label: "Refund Policy", href: "/refunds" },
    ]},
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex justify-between items-center mb-5">
          <Link href="/" aria-label="Go back" className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
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
              {tradeLine && <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--brand)" }}>{tradeLine}</p>}
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>{user?.phone || ""}</p>
            </div>
            <Link href={user?.user_type === "worker" ? "/worker/profile" : "/profile"}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                  style={{ background: "var(--brand-tint)", color: "var(--brand)" }}>Edit</Link>
          </div>
        )}
      </div>

      {/* Quick stats for workers */}
      {loading ? (
        <div className="grid grid-cols-3 gap-2.5 px-5 mt-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton rounded-[14px]" style={{ height: 56 }} />)}
        </div>
      ) : user?.user_type === "worker" && (
        <div className="grid grid-cols-3 gap-2.5 px-5 mt-3">
          {[
            { val: user.avg_rating ? `${user.avg_rating.toFixed(1)}⭐` : "5.0⭐", label: "Rating" },
            { val: String(user.total_jobs || 0), label: "Jobs" },
            { val: String(user.kaizy_score || 500), label: "KaizyScore" },
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
        <div className="rounded-[16px] p-4 flex items-center justify-between" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-surface)" }}>
              <span className="text-[18px]">{isDark ? "🌙" : "☀️"}</span>
            </div>
            <div>
              <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>{isDark ? "Dark Theme" : "Light Theme"}</p>
              <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{isDark ? "Easier on eyes at night" : "Clean white appearance"}</p>
            </div>
          </div>
          <button onClick={toggle} aria-label="Toggle theme" className="relative rounded-full active:scale-95 transition-all"
                  style={{ width: 48, height: 26, background: isDark ? "var(--brand)" : "var(--bg-elevated)" }}>
            <div className="absolute top-[3px] rounded-full bg-white transition-all"
                 style={{ width: 20, height: 20, left: isDark ? 25 : 3, boxShadow: "0 2px 4px rgba(0,0,0,0.15)" }} />
          </button>
        </div>
      </div>

      {/* Menu sections — role-based */}
      {loading ? (
        <div className="px-5 mt-6 space-y-6">
          {[1, 2, 3].map(s => (
            <div key={s}>
              <div className="skeleton h-3 w-20 rounded-full mb-2" />
              <div className="skeleton rounded-[16px]" style={{ height: 130 }} />
            </div>
          ))}
        </div>
      ) : (user?.user_type === "worker" ? workerMenuSections : hirerMenuSections).map(section => (
        <div key={section.title} className="px-5 mt-6">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>{section.title}</p>
          <div className="rounded-[16px] overflow-hidden" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
            {section.items.map((item, i) => {
              const isAction = item.href.startsWith("action:");
              if (isAction) {
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.href === "action:language") setShowLangModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-[13px] text-left active:opacity-70 transition-opacity"
                    style={{ borderBottom: i < section.items.length - 1 ? "1px solid var(--border-1)" : "none" }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--bg-surface)" }}>
                      <span className="text-[14px]">{item.icon}</span>
                    </div>
                    <span className="text-[12px] font-bold flex-1" style={{ color: "var(--text-1)" }}>{item.label}</span>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>›</span>
                  </button>
                );
              }
              return (
                <Link key={item.label} href={item.href}
                      className="flex items-center gap-3 px-4 py-[13px] active:opacity-70 transition-opacity"
                      style={{ borderBottom: i < section.items.length - 1 ? "1px solid var(--border-1)" : "none" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--bg-surface)" }}>
                    <span className="text-[14px]">{item.icon}</span>
                  </div>
                  <span className="text-[12px] font-bold flex-1" style={{ color: "var(--text-1)" }}>{item.label}</span>
                  <span className="text-[11px]" style={{ color: "var(--text-3)" }}>›</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Logout & Delete account */}
      <div className="px-5 mt-8 space-y-3">
        <button onClick={handleLogout}
                className="block w-full py-4 rounded-[16px] text-center text-[12px] font-extrabold active:scale-[0.97] transition-transform"
                style={{ background: "var(--danger-tint)", color: "var(--danger)" }}>
          Log Out
        </button>
        <Link href="/delete-account"
              className="block w-full py-3 rounded-[16px] text-center text-[11px] font-semibold active:scale-[0.97] transition-transform"
              style={{ color: "var(--text-3)" }}>
          Delete My Account & Data (DPDP Act)
        </Link>
      </div>

      <p className="text-center text-[9px] mt-4 pb-4" style={{ color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>Kaizy v11.0 · India&apos;s Workforce OS</p>

      {/* ── LANGUAGE SWITCHER MODAL ── */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
             style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-[24px] p-6 anim-up"
               style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-float)" }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-[16px] font-extrabold" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>Choose Language / भाषा चुनें</h3>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>Select your preferred platform language</p>
              </div>
              <button onClick={() => setShowLangModal(false)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] active:scale-90"
                      style={{ background: "var(--bg-surface)", color: "var(--text-2)" }}>✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto no-scrollbar py-1">
              {languages.map((lang) => {
                const isSelected = locale === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLocale(lang.code);
                      setShowLangModal(false);
                    }}
                    className="rounded-[14px] p-3 text-left flex items-center gap-2.5 active:scale-95 transition-all"
                    style={{
                      background: isSelected ? "var(--brand-tint)" : "var(--bg-surface)",
                      border: isSelected ? "2px solid var(--brand)" : "2px solid transparent",
                    }}
                  >
                    <span className="text-[20px]">{lang.flag}</span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold truncate" style={{ color: isSelected ? "var(--brand)" : "var(--text-1)" }}>{lang.native}</p>
                      <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{lang.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
