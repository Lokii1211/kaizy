"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/stores/AuthStore";

interface NavItem {
  emoji: string;
  label: string;
  href: string;
  isCta?: boolean;
}

const hirerLinks: NavItem[] = [
  { emoji: "🏠", label: "Home", href: "/" },
  { emoji: "🛠️", label: "Book Now", href: "/booking", isCta: true },
  { emoji: "📋", label: "My Bookings", href: "/my-bookings" },
  { emoji: "🔍", label: "Browse", href: "/search" },
  { emoji: "💬", label: "Chat", href: "/chat" },
  { emoji: "🔔", label: "Notifications", href: "/notifications" },
  { emoji: "⚙️", label: "Settings", href: "/settings" },
];

const workerLinks: NavItem[] = [
  { emoji: "🏠", label: "Dashboard", href: "/dashboard/worker" },
  { emoji: "⚡", label: "Active Job", href: "/active-job" },
  { emoji: "💰", label: "Earnings", href: "/earnings" },
  { emoji: "🏆", label: "Leaderboard", href: "/leaderboard" },
  { emoji: "🔔", label: "Notifications", href: "/notifications" },
  { emoji: "⚙️", label: "Settings", href: "/settings" },
];

const hideOnRoutes = [
  "/login", "/welcome", "/register", "/onboarding",
  "/emergency", "/active-job",
];

export default function DesktopSidebar() {
  const pathname = usePathname();
  const { userType, user } = useAuth();

  if (hideOnRoutes.some(r => pathname === r || pathname.startsWith(r + "/"))) return null;

  const links = userType === "worker" ? workerLinks : hirerLinks;

  return (
    <aside
      className="hidden lg:flex flex-col w-[240px] shrink-0 sticky top-0 h-screen z-40 overflow-y-auto"
      style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border-1)" }}
    >
      {/* Logo */}
      <div className="px-5 pt-7 pb-5">
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}
          >
            <span className="text-white font-black text-base">K</span>
          </div>
          <div>
            <p className="text-[16px] font-black leading-tight" style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}>
              Kaizy
            </p>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>
              India&apos;s Workforce OS
            </p>
          </div>
        </Link>
      </div>

      <div style={{ height: 1, background: "var(--border-1)", margin: "0 16px 8px" }} />

      {/* Nav */}
      <nav className="flex-1 py-2 px-3 flex flex-col gap-0.5">
        {links.map(item => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] transition-all active:scale-[0.97] group"
              style={{
                background: item.isCta
                  ? "var(--gradient-cta)"
                  : isActive
                    ? "rgba(255,107,0,0.1)"
                    : "transparent",
                color: item.isCta ? "#FFDBCC" : isActive ? "var(--brand)" : "var(--text-2)",
                boxShadow: item.isCta ? "var(--shadow-brand)" : "none",
                marginBottom: item.isCta ? 8 : 0,
                marginTop: item.isCta ? 4 : 0,
              }}
            >
              <span className="text-[18px] w-6 text-center leading-none">{item.emoji}</span>
              <span className="text-[13px] font-semibold">{item.label}</span>
              {isActive && !item.isCta && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--brand)" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role badge */}
      <div className="px-4 py-3">
        <div
          className="rounded-[14px] px-3 py-2.5 flex items-center gap-2"
          style={{ background: "rgba(255,107,0,0.06)", border: "1px solid rgba(255,107,0,0.15)" }}
        >
          <span className="text-[20px]">{userType === "worker" ? "👷" : "🏠"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black capitalize" style={{ color: "var(--brand)" }}>
              {userType === "worker" ? "Worker" : "Home Owner"}
            </p>
            <p className="text-[9px] truncate" style={{ color: "var(--text-3)" }}>
              {user?.name || "Set up your profile"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats footer */}
      <div
        className="px-4 pb-6 pt-3"
        style={{ borderTop: "1px solid var(--border-1)" }}
      >
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { v: "50K+", l: "Jobs" },
            { v: "4.8★", l: "Rating" },
            { v: "15m", l: "ETA" },
          ].map(s => (
            <div key={s.l}>
              <p
                className="text-[13px] font-black"
                style={{ color: "var(--text-1)", fontFamily: "'JetBrains Mono', monospace" }}
              >
                {s.v}
              </p>
              <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
