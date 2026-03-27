"use client";

import { useState, useEffect } from "react";

// ============================================================
// PWA INSTALL PROMPT v10.0 — Stitch "Digital Artisan" Design
// ============================================================

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 10000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showBanner || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[60] animate-slide-up">
      <div className="rounded-[18px] p-4 flex items-center gap-3"
           style={{ background: "var(--bg-card)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-[22px]"
             style={{ background: "var(--gradient-cta)" }}>
          📲
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold" style={{ color: "var(--text-1)" }}>Install Kaizy</p>
          <p className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>Add to home screen for faster access</p>
        </div>
        <button onClick={handleInstall}
                className="text-[10px] font-bold px-4 py-2 rounded-[12px] text-white active:scale-95 transition-transform shrink-0"
                style={{ background: "var(--gradient-cta)" }}>
          Install
        </button>
        <button onClick={handleDismiss}
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                style={{ background: "var(--bg-surface)" }}>
          <span className="text-[12px]" style={{ color: "var(--text-3)" }}>✕</span>
        </button>
      </div>
    </div>
  );
}
