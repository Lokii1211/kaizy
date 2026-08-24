"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ============================================================
// Kaizy — THEME STORE (Dark/Light with system detection)
// Inspired by: Rapido + Uber dark mode toggle
// ============================================================

type Theme = "dark" | "light";
interface ThemeCtx { theme: Theme; toggle: () => void; isDark: boolean; }

const ThemeContext = createContext<ThemeCtx>({ theme: "light", toggle: () => {}, isDark: false });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    try {
      const saved = localStorage.getItem("ks-theme") as Theme | null;
      if (saved === "dark" || saved === "light") return saved;
    } catch {}
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    localStorage.setItem("ks-theme", theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#090909" : "#FFFFFF");
  }, [theme]);

  const toggle = () => setTheme(prev => prev === "dark" ? "light" : "dark");
  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
