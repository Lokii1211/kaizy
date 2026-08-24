"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/AuthStore";
import LoadingShell from "@/components/LoadingShell";

// ============================================================
// /my-bookings — Role-based forward to /hirer/my-jobs or /worker/my-jobs
// ============================================================

function MyBookingsSwitcherContent() {
  const router = useRouter();
  const { userType } = useAuth();

  useEffect(() => {
    if (userType === "worker") {
      router.replace("/worker/my-jobs");
    } else {
      router.replace("/hirer/my-jobs");
    }
  }, [userType, router]);

  return <LoadingShell />;
}

export default function MyBookingsPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <MyBookingsSwitcherContent />
    </Suspense>
  );
}
