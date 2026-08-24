"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingShell from "@/components/LoadingShell";

// ============================================================
// /hirer/tracking — Forwards to /tracking?bookingId=...
// ============================================================

function HirerTrackingRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || searchParams.get("id") || "";

  useEffect(() => {
    if (bookingId) {
      router.replace(`/hirer/tracking/${bookingId}`);
    } else {
      router.replace("/my-bookings");
    }
  }, [bookingId, router]);

  return <LoadingShell />;
}

export default function HirerTrackingPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <HirerTrackingRedirectContent />
    </Suspense>
  );
}
