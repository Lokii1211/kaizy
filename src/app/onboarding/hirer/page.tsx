"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingShell from "@/components/LoadingShell";

// ============================================================
// /onboarding/hirer — Entry point forwards to /onboarding/hirer/profile
// ============================================================

export default function HirerOnboardingIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding/hirer/profile");
  }, [router]);

  return <LoadingShell />;
}
