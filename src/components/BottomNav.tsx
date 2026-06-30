"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ============================================================
// BOTTOM NAV v10.0 — Stitch "Digital Artisan" Glassmorphism Dock
// ============================================================

const navItems = [
  { icon: "🏠", label: "Home", href: "/" },
  { icon: "🔍", label: "Search", href: "/marketplace" },
  { icon: "⚡", label: "SOS", href: "/emergency", isSos: true },
  { icon: "📋", label: "Bookings", href: "/my-bookings" },
  { icon: "👤", label: "Profile", href: "/settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  const hideOnPaths = ["/login", "/register", "/tracking", "/booking", "/emergency"];
  if (hideOnPaths.some(p => pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
         style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="mx-3 mb-2 rounded-[20px] px-2 py-2"
           style={{ background: "rgba(19,19,19,0.85)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        <div className="flex items-center justify-around">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            if (item.isSos) {
              return (
                <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center -mt-4">
                  <div className="w-13 h-13 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                       style={{ background: "var(--gradient-cta)", boxShadow: "0 4px 16px rgba(255,107,0,0.4)" }}>
                    <span className="text-[20px]">{item.icon}</span>
                  </div>
                  <span className="text-[8px] font-bold mt-0.5" style={{ color: "var(--brand)" }}>{item.label}</span>
                </Link>
              );
            }

            return (
              <Link key={item.label} href={item.href}
                    className="flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1 active:scale-90 transition-transform">
                <div className="relative">
                  <span className="text-[18px]" style={{ opacity: isActive ? 1 : 0.5 }}>{item.icon}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
                         style={{ background: "var(--brand)" }} />
                  )}
                </div>
                <span className="text-[9px]" style={{ color: isActive ? "var(--brand)" : "rgba(255,255,255,0.4)", fontWeight: isActive ? 700 : 500 }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
