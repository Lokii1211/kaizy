"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

// ============================================================
// SWR CACHING & LOW-LATENCY 3G DATA FETCHING
// Workers: 30s cache · Earnings: 60s cache · Pricing: 1-week cache
// ============================================================

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// 1. Nearby Online Workers Hook (30s cache)
export function useNearbyWorkers(trade = "electrician", lat = 11.0168, lng = 76.9558) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/workers/browse?trade=${trade}&lat=${lat}&lng=${lng}&limit=20`,
    fetcher,
    {
      dedupingInterval: 30000, // 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    workers: data?.success ? data.data : [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// 2. Worker Earnings Hook (60s cache)
export function useWorkerEarnings(period = "week") {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/earnings?period=${period}`,
    fetcher,
    {
      dedupingInterval: 60000, // 60 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    earnings: data?.success ? data.data : null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// 3. Market Pricing Hook (1 week cache = 604800000 ms)
export function useMarketPricing() {
  const { data, error, isLoading } = useSWR(
    `/api/pricing/market`,
    fetcher,
    {
      dedupingInterval: 7 * 86400000, // 1 week
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    pricing: data?.success ? data.data : [],
    isLoading,
    isError: error,
  };
}

// 4. Intelligent Route Prefetching Hook for Low-end 3G devices
export function usePrefetchRoutes() {
  const router = useRouter();

  const prefetchRoute = useCallback(
    (path: string) => {
      try {
        router.prefetch(path);
      } catch {}
    },
    [router]
  );

  return { prefetchRoute };
}
