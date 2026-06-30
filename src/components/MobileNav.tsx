"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/stores/AuthStore";

// ============================================================
// MOBILE NAV — Stitch "Digital Artisan" Bottom Dock
// Uses AuthStore for instant role detection (no cookie parsing)
// ============================================================

interface NavItem {
  emoji: string;
  label: string;
  href: string;
  isCta?: boolean;
}

const hirerNav: NavItem[] = [
  { emoji: "🏠", label: "Home", href: "/" },
  { emoji: "🛠️", label: "Book", href: "/booking", isCta: true },
  { emoji: "📋", label: "Bookings", href: "/my-bookings" },
  { emoji: "👤", label: "Profile", href: "/settings" },
];

const workerNav: NavItem[] = [
  { emoji: "🏠", label: "Home", href: "/dashboard/worker" },
  { emoji: "🔍", label: "Jobs", href: "/marketplace" },
  { emoji: "💰", label: "Earnings", href: "/earnings" },
  { emoji: "👤", label: "Profile", href: "/settings" },
];

const hideOnRoutes = [
  "/login", "/register/worker", "/register/hirer",
  "/tracking", "/chat", "/verify",
  "/onboarding", "/welcome",
  "/emergency", "/kaizypay",
  "/active-job",
];

export default function MobileNav() {
  const pathname = usePathname();
  const { userType } = useAuth();

  // Hide nav on auth/onboarding/fullscreen routes
  if (hideOnRoutes.some(p => pathname === p || pathname.startsWith(p + "/"))) return null;
  // Also hide on booking tracking states (active booking flow)
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
            {/* CTA button — raised brand-colored circle */}
            {item.isCta ? (
              <>
                <div className="flex items-center justify-center rounded-full"
                     style={{
                       width: 44,
                       height: 44,
                       marginTop: -18,
                       background: "var(--gradient-cta)",
                       boxShadow: "0 4px 16px rgba(255,107,0,0.35)",
                     }}>
                  <span className="text-[20px] leading-none">{item.emoji}</span>
                </div>
                <span className="text-[9px] font-bold"
                      style={{ color: "var(--brand)", letterSpacing: "0.3px", marginTop: -2 }}>
                  {item.label}
                </span>
              </>
            ) : (
              <>
                {/* Active indicator — saffron pill behind icon */}
                {isActive && (
                  <div className="absolute -top-0.5 w-10 h-8 rounded-xl"
                       style={{ background: "var(--brand-tint)", opacity: 0.7 }} />
                )}
                <span className="text-[20px] leading-none relative z-10">{item.emoji}</span>
                <span className="text-[9px] font-bold relative z-10"
                      style={{
                        color: isActive ? "var(--brand)" : "var(--text-3)",
                        letterSpacing: "0.3px",
                      }}>
                  {item.label}
                </span>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
