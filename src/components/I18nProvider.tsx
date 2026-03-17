"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { type Locale, LOCALE_NAMES, LOCALE_FLAGS, getTranslations } from "@/lib/i18n";

type TranslationKeys = ReturnType<typeof getTranslations>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof TranslationKeys) => string;
  localeName: string;
  localeFlag: string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Load saved locale from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("connecton_locale") as Locale | null;
    if (saved && LOCALE_NAMES[saved]) {
      setLocaleState(saved);
      document.documentElement.lang = saved === "en" ? "en" : saved;
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("connecton_locale", newLocale);
    document.documentElement.lang = newLocale === "en" ? "en" : newLocale;
  };

  const translations = getTranslations(locale);

  const t = (key: keyof TranslationKeys): string => {
    return translations[key] || key;
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        localeName: LOCALE_NAMES[locale],
        localeFlag: LOCALE_FLAGS[locale],
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export default I18nProvider;
