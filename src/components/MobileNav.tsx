"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { emoji: "🏠", label: "Home", href: "/" },
  { emoji: "🆘", label: "SOS", href: "/emergency", isSos: true },
  { emoji: "📋", label: "My Jobs", href: "/notifications" },
  { emoji: "👤", label: "Profile", href: "/settings" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const hideOn = ["/login","/register/worker","/register/hirer"];
  if (hideOn.some(p => pathname === p)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around lg:hidden glass"
         style={{ borderTop: "1px solid var(--border-1)", padding: "8px 0 16px", paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
      {navItems.map(item => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.label} href={item.href} className="flex flex-col items-center gap-[3px] px-3 py-1 active:scale-90 transition-transform">
            <span className="text-[20px] leading-none">{item.emoji}</span>
            <span className="text-[9px] font-bold" style={{ color: item.isSos ? "var(--danger)" : isActive ? "var(--brand)" : "var(--text-3)", letterSpacing: "0.3px" }}>
              {item.label}
            </span>
            {isActive && !item.isSos && <div className="w-1 h-1 rounded-full" style={{ background: "var(--brand)" }} />}
          </Link>
        );
      })}
    </nav>
  );
}
