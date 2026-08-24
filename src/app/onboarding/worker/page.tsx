"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingShell from "@/components/LoadingShell";

// ============================================================
// /onboarding/worker — Entry point forwards to /onboarding/worker/selfie
// ============================================================

export default function WorkerOnboardingIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding/worker/selfie");
  }, [router]);

  return <LoadingShell />;
}
