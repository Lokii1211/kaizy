"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";
import { LOCALE_NAMES, LOCALE_FLAGS, type Locale } from "@/lib/i18n";

// ============================================================
// LANGUAGE SWITCHER v10.0 — Stitch "Digital Artisan" Design
// ============================================================

export default function LanguageSwitcher() {
  const { locale, setLocale, localeName } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const locales = Object.entries(LOCALE_NAMES) as [Locale, string][];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors text-sm"
              style={{ background: "rgba(255,255,255,0.1)" }}
              aria-label="Change language">
        <span className="text-[14px]">🌐</span>
        <span className="hidden sm:inline font-medium">{localeName}</span>
        <span className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 rounded-[18px] py-2 min-w-[200px] z-50 animate-scale-in"
             style={{ background: "var(--bg-card)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          <div className="px-3 py-2 text-[8px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            Choose Language
          </div>
          {locales.map(([code, name]) => (
            <button key={code}
                    onClick={() => { setLocale(code); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
                    style={{
                      background: locale === code ? "var(--brand-tint)" : "transparent",
                      color: locale === code ? "var(--brand)" : "var(--text-1)",
                      fontWeight: locale === code ? 700 : 400,
                    }}>
              <span className="text-lg">{LOCALE_FLAGS[code]}</span>
              <span className="flex-1 text-left">{name}</span>
              {locale === code && <span className="text-[12px]" style={{ color: "var(--brand)" }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
