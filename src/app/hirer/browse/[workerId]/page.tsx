"use client";

import { useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingShell from "@/components/LoadingShell";

function BrowseWorkerRedirectContent() {
  const router = useRouter();
  const params = useParams();
  const workerId = params?.workerId as string;

  useEffect(() => {
    if (workerId) {
      router.replace(`/hirer/worker/${workerId}`);
    }
  }, [workerId, router]);

  return <LoadingShell />;
}

export default function BrowseWorkerRedirectPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <BrowseWorkerRedirectContent />
    </Suspense>
  );
}
