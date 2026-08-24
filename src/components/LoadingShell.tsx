"use client";

import React from "react";

// ============================================================
// LOADING SHELL — Instant Zero-Flash Loading Skeleton
// Full-width shimmer bars + bottom nav shimmer
// Prevents blank white flashes & role-swapping visual glitches
// ============================================================

export default function LoadingShell() {
  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between p-5 pb-0 select-none animate-pulse"
      style={{
        background: "var(--bg-app)",
        minHeight: "100vh",
      }}
    >
      {/* 3 Shimmer Bars (full width, 60px each, 16px gap) */}
      <div className="w-full flex flex-col gap-4 pt-6">
        <div
          className="w-full rounded-[18px] skeleton"
          style={{ height: 60, background: "var(--bg-surface)" }}
        />
        <div
          className="w-full rounded-[18px] skeleton"
          style={{ height: 60, background: "var(--bg-surface)" }}
        />
        <div
          className="w-full rounded-[18px] skeleton"
          style={{ height: 60, background: "var(--bg-surface)" }}
        />
      </div>

      {/* Bottom Nav Shimmer (full width, 72px) */}
      <div
        className="w-full -mx-5 px-5 skeleton rounded-t-[20px]"
        style={{
          height: 72,
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-1)",
        }}
      />
    </div>
  );
}
