"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/stores/AuthStore";

// ============================================================
// MOBILE NAV — Stitch "Digital Artisan" Bottom Dock
// Uses AuthStore for instant role detection (no cookie parsing)
// ============================================================

const hirerNav: Array<{ emoji: string; label: string; href: string; isSos?: boolean }> = [
  { emoji: "🏠", label: "Home", href: "/" },
  { emoji: "🆘", label: "SOS", href: "/emergency", isSos: true },
  { emoji: "📋", label: "Bookings", href: "/my-bookings" },
  { emoji: "👤", label: "Profile", href: "/settings" },
];

const workerNav: Array<{ emoji: string; label: string; href: string; isSos?: boolean }> = [
  { emoji: "🏠", label: "Home", href: "/dashboard/worker" },
  { emoji: "🔔", label: "Alerts", href: "/notifications" },
  { emoji: "💰", label: "Earnings", href: "/earnings" },
  { emoji: "👤", label: "Profile", href: "/settings" },
];

const hideOnRoutes = [
  "/login", "/register/worker", "/register/hirer",
  "/tracking", "/chat", "/verify",
  "/onboarding/specialization", "/onboarding/bank",
];

export default function MobileNav() {
  const pathname = usePathname();
  const { userType } = useAuth();

  // Hide nav on auth/onboarding/fullscreen routes
  if (hideOnRoutes.some(p => pathname === p || pathname.startsWith(p + "/"))) return null;
  // Also hide on booking tracking states
  if (pathname.startsWith("/booking/") && pathname !== "/my-bookings") return null;

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
