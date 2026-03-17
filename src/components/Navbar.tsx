"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Zap,
  User,
  Briefcase,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/I18nProvider";

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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || !isLanding
          ? "bg-white/90 backdrop-blur-xl shadow-md border-b border-[#E2E8F0]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span
                className={`text-xl font-bold tracking-tight ${
                  scrolled || !isLanding ? "text-[#1E293B]" : "text-white"
                }`}
              >
                Connect
                <span className="text-[#FF6B2C]">On</span>
              </span>
              <p
                className={`text-[10px] font-medium -mt-1 ${
                  scrolled || !isLanding ? "text-[var(--color-muted)]" : "text-white/60"
                }`}
              >
                The Bridge to Work
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-[#FF6B2C]/10 hover:text-[#FF6B2C] ${
                  scrolled || !isLanding
                    ? "text-[var(--foreground)]"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language Switcher */}
            <div className={scrolled || !isLanding ? "text-[var(--foreground)]" : "text-white"}>
              <LanguageSwitcher />
            </div>

            <Link
              href="/login"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                scrolled || !isLanding
                  ? "text-[#1E293B] hover:bg-gray-100"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {t("nav_login")}
            </Link>
            <Link href="/register/worker" className="btn-primary !py-2.5 !px-5 !text-sm">
              <User className="w-4 h-4" />
              {t("nav_register_worker")}
            </Link>
            <Link
              href="/register/hirer"
              className="btn-accent !py-2.5 !px-5 !text-sm"
            >
              <Briefcase className="w-4 h-4" />
              {t("nav_hire_workers")}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <div className={scrolled || !isLanding ? "text-[var(--foreground)]" : "text-white"}>
              <LanguageSwitcher />
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-lg transition-colors ${
                scrolled || !isLanding
                  ? "text-[var(--foreground)] hover:bg-gray-100"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-white border-t border-[#E2E8F0] px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 rounded-lg text-sm font-medium text-[var(--foreground)] hover:bg-[#FF6B2C]/10 hover:text-[#FF6B2C] transition-all"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
            <Link
              href="/login"
              className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold border-2 border-[#E2E8F0] hover:border-[#FF6B2C]"
            >
              {t("nav_login")}
            </Link>
            <Link
              href="/register/worker"
              className="btn-primary !w-full !justify-center !text-sm"
            >
              <User className="w-4 h-4" />
              {t("nav_register_worker")}
            </Link>
            <Link
              href="/register/hirer"
              className="btn-accent !w-full !justify-center !text-sm"
            >
              <Briefcase className="w-4 h-4" />
              {t("nav_hire_workers")}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
