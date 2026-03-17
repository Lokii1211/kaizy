"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnline(true);
      setTimeout(() => setShowOnline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showOnline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] py-1.5 px-4 flex items-center justify-center gap-2 text-[11px] font-bold transition-all duration-300 ${
        isOnline
          ? "bg-green-500 text-white animate-slide-down"
          : "bg-red-500 text-white"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5" /> Back online
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" /> No internet — showing cached data
        </>
      )}
    </div>
  );
}
