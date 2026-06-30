"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ============================================================
// Kaizy — THEME STORE (Dark/Light with system detection)
// Inspired by: Rapido + Uber dark mode toggle
// ============================================================

type Theme = "dark" | "light";
interface ThemeCtx { theme: Theme; toggle: () => void; isDark: boolean; }

const ThemeContext = createContext<ThemeCtx>({ theme: "dark", toggle: () => {}, isDark: true });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("ks-theme") as Theme | null;
    if (saved) { setTheme(saved); }
    else if (window.matchMedia("(prefers-color-scheme: light)").matches) { setTheme("light"); }
  }, []);

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
