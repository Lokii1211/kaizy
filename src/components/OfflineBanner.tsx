"use client";

import { useState, useEffect } from "react";

// ============================================================
// OFFLINE BANNER — Low-latency network listener for 3G/2G
// ============================================================

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (!navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-50 px-4 py-2 bg-amber-500 text-black text-[12px] font-black text-center shadow-lg flex items-center justify-center gap-2 anim-down"
    >
      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
      <span>You&apos;re offline — some live features are limited</span>
    </div>
  );
}
