"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/I18nProvider";

// ============================================================
// NAVBAR v10.0 — Stitch "Digital Artisan" Design
// Glassmorphism · No borders · Tonal surfaces
// ============================================================

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isLanding = pathname === "/";

  const navLinks = [
    { name: t("nav_how_it_works"), href: "/#how-it-works" },
    { name: t("nav_for_workers"), href: "/#for-workers" },
    { name: t("nav_for_businesses"), href: "/#for-businesses" },
    { name: t("nav_marketplace"), href: "/marketplace" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled || !isLanding
        ? "backdrop-blur-xl"
        : "bg-transparent"
    }`}
    style={scrolled || !isLanding ? { background: "rgba(19,19,19,0.85)", backdropFilter: "blur(20px) saturate(180%)" } : {}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 text-[18px]"
                 style={{ background: "var(--gradient-cta)" }}>
              ⚡
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                kai<span style={{ color: "var(--brand)" }}>zy</span>
              </span>
              <p className="text-[10px] font-medium -mt-1 text-white/40">
                India&apos;s Workforce OS
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all text-white/70 hover:text-white hover:bg-white/5">
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-white">
              <LanguageSwitcher />
            </div>
            <Link href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-all">
              {t("nav_login")}
            </Link>
            <Link href="/register/worker"
                  className="px-4 py-2.5 rounded-[14px] text-sm font-bold text-white flex items-center gap-2 active:scale-95 transition-transform"
                  style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-brand)" }}>
              👤 {t("nav_register_worker")}
            </Link>
            <Link href="/register/hirer"
                  className="px-4 py-2.5 rounded-[14px] text-sm font-bold flex items-center gap-2 active:scale-95 transition-transform"
                  style={{ background: "var(--bg-surface)", color: "var(--text-1)" }}>
              💼 {t("nav_hire_workers")}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="text-white">
              <LanguageSwitcher />
            </div>
            <button onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-lg transition-colors text-white hover:bg-white/10">
              <span className="text-[20px]">{isOpen ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden transition-all duration-300 overflow-hidden ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 py-4 space-y-1" style={{ background: "var(--bg-card)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-[14px] text-sm font-medium transition-all"
                  style={{ color: "var(--text-1)" }}>
              {link.name}
            </Link>
          ))}
          <div className="pt-3 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <Link href="/login"
                  className="block w-full text-center py-2.5 rounded-[14px] text-sm font-semibold"
                  style={{ background: "var(--bg-surface)", color: "var(--text-1)" }}>
              {t("nav_login")}
            </Link>
            <Link href="/register/worker"
                  className="block w-full text-center py-2.5 rounded-[14px] text-sm font-bold text-white"
                  style={{ background: "var(--gradient-cta)" }}>
              👤 {t("nav_register_worker")}
            </Link>
            <Link href="/register/hirer"
                  className="block w-full text-center py-2.5 rounded-[14px] text-sm font-bold"
                  style={{ background: "var(--bg-surface)", color: "var(--text-1)" }}>
              💼 {t("nav_hire_workers")}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
