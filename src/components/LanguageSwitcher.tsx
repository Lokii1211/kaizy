"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { LOCALE_NAMES, LOCALE_FLAGS, type Locale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale, localeName } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const locales = Object.entries(LOCALE_NAMES) as [Locale, string][];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-sm"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline font-medium">{localeName}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] py-2 min-w-[200px] z-50 animate-scale-in">
          <div className="px-3 py-2 text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">
            Choose Language
          </div>
          {locales.map(([code, name]) => (
            <button
              key={code}
              onClick={() => {
                setLocale(code);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-[#F8FAFC] transition-colors ${
                locale === code ? "text-[#FF6B2C] font-semibold bg-[#FF6B2C]/5" : "text-[var(--foreground)]"
              }`}
            >
              <span className="text-lg">{LOCALE_FLAGS[code]}</span>
              <span className="flex-1 text-left">{name}</span>
              {locale === code && <Check className="w-4 h-4 text-[#FF6B2C]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
