"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Search, Briefcase, Bell, User, Zap,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Search", href: "/marketplace" },
  { icon: Zap, label: "SOS", href: "/emergency", isSos: true },
  { icon: Briefcase, label: "Bookings", href: "/dashboard/worker" },
  { icon: User, label: "Profile", href: "/settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on certain pages
  const hideOnPaths = ["/login", "/register", "/tracking", "/booking", "/emergency"];
  if (hideOnPaths.some(p => pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#E2E8F0] lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          
          if (item.isSos) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-90 transition-transform">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[9px] font-bold text-red-500 mt-0.5">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 active:scale-90 transition-transform ${
                isActive ? "text-[#FF6B2C]" : "text-[var(--color-muted)]"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : ""}`} />
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>{item.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-[#FF6B2C]" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
