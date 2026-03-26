"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ============================================================
// MOBILE NAV — Stitch "Digital Artisan" Bottom Dock
// Glassmorphism base · Saffron active bubble · No harsh borders
// ============================================================

const hirerNav: Array<{ emoji: string; label: string; href: string; isSos?: boolean }> = [
  { emoji: "🏠", label: "Home", href: "/" },
  { emoji: "🆘", label: "SOS", href: "/emergency", isSos: true },
  { emoji: "📋", label: "Bookings", href: "/dashboard/hirer" },
  { emoji: "👤", label: "Profile", href: "/settings" },
];

const workerNav: Array<{ emoji: string; label: string; href: string; isSos?: boolean }> = [
  { emoji: "🏠", label: "Home", href: "/dashboard/worker" },
  { emoji: "🔔", label: "Alerts", href: "/notifications" },
  { emoji: "💰", label: "Earnings", href: "/earnings" },
  { emoji: "👤", label: "Profile", href: "/settings" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [userType, setUserType] = useState<string>("hirer");

  useEffect(() => {
    const cookies = document.cookie.split(';').reduce((acc, c) => {
      const [k, v] = c.trim().split('=');
      acc[k] = v;
      return acc;
    }, {} as Record<string, string>);
    if (cookies.kaizy_user_type) setUserType(cookies.kaizy_user_type);
  }, [pathname]);

  const hideOn = ["/login", "/register/worker", "/register/hirer", "/tracking", "/chat"];
  if (hideOn.some(p => pathname === p)) return null;

  const navItems = userType === "worker" ? workerNav : hirerNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around lg:hidden"
         style={{
           background: "var(--bg-overlay)",
           backdropFilter: "blur(24px) saturate(1.8)",
           WebkitBackdropFilter: "blur(24px) saturate(1.8)",
           borderTop: "1px solid var(--border-1)",
           padding: "10px 4px 18px",
           paddingBottom: "max(18px, env(safe-area-inset-bottom))",
         }}>
      {navItems.map(item => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.label} href={item.href}
                className="flex flex-col items-center gap-[4px] px-4 py-1 active:scale-90 transition-all relative">
            {/* Active indicator — saffron pill behind icon */}
            {isActive && !item.isSos && (
              <div className="absolute -top-0.5 w-10 h-8 rounded-xl"
                   style={{ background: "var(--brand-tint)", opacity: 0.7 }} />
            )}
            <span className="text-[20px] leading-none relative z-10">{item.emoji}</span>
            <span className="text-[9px] font-bold relative z-10"
                  style={{
                    color: item.isSos ? "var(--danger)" : isActive ? "var(--brand)" : "var(--text-3)",
                    letterSpacing: "0.3px",
                  }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
