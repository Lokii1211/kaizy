"use client";

import { useEffect } from "react";
import { subscribeToPush } from "@/lib/push";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[Kaizy] SW registered:", reg.scope);

          // Check for updates every 60 minutes
          const interval = setInterval(() => reg.update(), 60 * 60 * 1000);

          // When a new SW is waiting, activate it
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New version available — reload to pick it up
                console.log("[Kaizy] New SW version available, reloading...");
                window.location.reload();
              }
            });
          });

          // Only prompt for push subscription if the user is logged in
          if (document.cookie.includes("kaizy_token")) {
            subscribeToPush().catch((err) => {
              console.warn("[push] subscription failed:", err);
            });
          }

          return () => clearInterval(interval);
        })
        .catch((err) => {
          console.warn("[Kaizy] SW registration failed:", err);
        });
    }
  }, []);

  return null;
}
