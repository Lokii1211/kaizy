"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingShell from "@/components/LoadingShell";

export default function EmergencyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/hirer/sos");
  }, [router]);

  return <LoadingShell />;
}
