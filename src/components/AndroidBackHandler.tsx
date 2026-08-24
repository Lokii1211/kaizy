"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

// ============================================================
// ANDROID BACK BUTTON HANDLER — Deterministic Screen Hierarchy
// Catches popstate events and routes to parent screen
// Prevents app exits, loops, or navigation crashes on Android
// ============================================================

const parentMap: Record<string, string> = {
  // Hirer & Booking Flows
  "/hirer/booking/searching": "/dashboard/hirer",
  "/hirer/booking/matched": "/dashboard/hirer",
  "/hirer/booking/payment": "/dashboard/hirer",
  "/hirer/tracking": "/dashboard/hirer",
  "/hirer/chat": "/my-bookings",
  "/tracking": "/my-bookings",
  "/chat": "/my-bookings",
  "/booking/payment-success": "/my-bookings",
  "/booking/review": "/my-bookings",
  "/booking": "/",

  // Worker Flows
  "/worker/active-job": "/dashboard/worker",
  "/active-job": "/dashboard/worker",
  "/earnings/withdrawal-success": "/earnings",
  "/commission": "/dashboard/worker",
  "/kaizy-score": "/dashboard/worker",
  "/leaderboard": "/dashboard/worker",
  "/incentives": "/dashboard/worker",
  "/job-photos": "/dashboard/worker",

  // Onboarding & Registration
  "/login/otp": "/login",
  "/onboarding/hirer/profile": "/login",
  "/onboarding/hirer/location": "/onboarding/hirer/profile",
  "/onboarding/hirer/ready": "/onboarding/hirer/location",
  "/onboarding/worker/trade": "/register/worker",
  "/onboarding/worker/pricing": "/onboarding/specialization",
  "/onboarding/bank": "/dashboard/worker",
  "/onboarding/specialization": "/dashboard/worker",
  "/onboarding/hirer": "/",

  // Settings & Preferences
  "/settings/notifications": "/settings",
  "/delete-account": "/settings",
  "/saved-addresses": "/settings",
  "/saved-workers": "/settings",
};

export default function AndroidBackHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const currentPath = window.location.pathname;
      const parent = parentMap[currentPath];

      if (parent) {
        e.preventDefault();
        router.push(parent);
        return;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router, pathname]);

  return null;
}
