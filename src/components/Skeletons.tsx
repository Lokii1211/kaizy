"use client";

import React from "react";

// ============================================================
// KAIZY SKELETON SCREENS (High-Fidelity Zero-Spinner Architecture)
// Modeled after Rapido, Swiggy, and Blinkit for instant perceived speed
// ============================================================

/**
 * 1. WorkerCardSkeleton (matches horizontal worker card in home strip)
 * 168px wide × 200px tall
 */
export function WorkerCardSkeleton() {
  return (
    <div
      className="shrink-0 rounded-[18px] p-3 flex flex-col justify-between"
      style={{
        width: 168,
        height: 200,
        background: "var(--bg-card)",
        border: "1px solid var(--border-1)",
      }}
    >
      <div className="flex items-center gap-2.5">
        {/* Avatar area: 44px circle */}
        <div className="w-11 h-11 rounded-full skeleton shrink-0" />
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="h-3 w-[80%] rounded-full skeleton" />
          <div className="h-2 w-[60%] rounded-full skeleton" />
        </div>
      </div>

      <div className="space-y-1.5 my-2">
        <div className="h-2.5 w-[70%] rounded-full skeleton" />
        <div className="h-4 w-10 rounded-md skeleton" />
      </div>

      {/* Button: 100% × 36px */}
      <div className="w-full h-9 rounded-[12px] skeleton" />
    </div>
  );
}

/**
 * 2. WorkerListSkeleton (for full-width worker cards in search / marketplace)
 * Full width × 88px
 */
export function WorkerListSkeleton() {
  return (
    <div
      className="w-full rounded-[16px] p-3.5 flex items-center gap-3.5"
      style={{
        height: 88,
        background: "var(--bg-card)",
        border: "1px solid var(--border-1)",
      }}
    >
      {/* Left: 52px circle shimmer */}
      <div className="w-[52px] h-[52px] rounded-full skeleton shrink-0" />

      {/* Right: 3 shimmer bars */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3.5 w-[65%] rounded-full skeleton" />
        <div className="h-2.5 w-[85%] rounded-full skeleton" />
        <div className="h-2.5 w-[40%] rounded-full skeleton" />
      </div>

      <div className="w-12 h-6 rounded-md skeleton shrink-0" />
    </div>
  );
}

/**
 * 3. ProfileSkeleton (for worker profile page)
 */
export function ProfileSkeleton() {
  return (
    <div className="min-h-screen pb-20 w-full" style={{ background: "var(--bg-app)" }}>
      {/* Top: 200px shimmer (hero area) */}
      <div className="w-full h-[200px] skeleton relative mb-6" />

      <div className="px-5 space-y-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full skeleton shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded-full skeleton" />
            <div className="h-3 w-28 rounded-full skeleton" />
          </div>
        </div>

        {/* 3 rows of shimmer bars */}
        <div className="space-y-2.5">
          <div className="h-3.5 w-full rounded-full skeleton" />
          <div className="h-3.5 w-[85%] rounded-full skeleton" />
          <div className="h-3.5 w-[70%] rounded-full skeleton" />
        </div>

        {/* Stats row: 3 equal shimmer rectangles */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <div className="h-20 rounded-[14px] skeleton" />
          <div className="h-20 rounded-[14px] skeleton" />
          <div className="h-20 rounded-[14px] skeleton" />
        </div>

        {/* Pricing list shimmer */}
        <div className="space-y-2 pt-2">
          <div className="h-12 w-full rounded-[14px] skeleton" />
          <div className="h-12 w-full rounded-[14px] skeleton" />
          <div className="h-12 w-full rounded-[14px] skeleton" />
        </div>
      </div>
    </div>
  );
}

/**
 * 4. EarningsSkeleton (for earnings screen)
 */
export function EarningsSkeleton() {
  return (
    <div className="min-h-screen px-5 pt-5 pb-20 w-full" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="w-9 h-9 rounded-xl skeleton" />
        <div className="w-24 h-4 rounded-full skeleton" />
        <div className="w-9" />
      </div>

      {/* 120px tall card shimmer (earnings card) */}
      <div className="w-full rounded-[20px] skeleton mb-4" style={{ height: 120 }} />

      {/* 80px bar chart shimmer */}
      <div className="w-full rounded-[16px] skeleton mb-5" style={{ height: 80 }} />

      {/* 4 transaction row shimmers (64px each) */}
      <div className="space-y-2.5">
        <div className="h-3 w-32 rounded-full skeleton mb-3" />
        <div className="w-full rounded-[14px] skeleton" style={{ height: 64 }} />
        <div className="w-full rounded-[14px] skeleton" style={{ height: 64 }} />
        <div className="w-full rounded-[14px] skeleton" style={{ height: 64 }} />
        <div className="w-full rounded-[14px] skeleton" style={{ height: 64 }} />
      </div>
    </div>
  );
}

/**
 * 5. JobAlertSkeleton (used for active job / my bookings)
 * Full width, 160px height
 */
export function JobAlertSkeleton() {
  return (
    <div
      className="w-full rounded-[20px] p-5 flex flex-col justify-between"
      style={{
        height: 160,
        background: "var(--bg-card)",
        border: "1px solid var(--border-1)",
      }}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-4 w-36 rounded-full skeleton" />
          <div className="h-3 w-24 rounded-full skeleton" />
        </div>
        <div className="w-12 h-6 rounded-full skeleton" />
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full skeleton shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-[75%] rounded-full skeleton" />
          <div className="h-2.5 w-[50%] rounded-full skeleton" />
        </div>
      </div>

      <div className="w-full h-8 rounded-[10px] skeleton" />
    </div>
  );
}

/**
 * 6. ChatSkeleton (for chat screens)
 * 5 alternating left/right message bubble shimmers
 */
export function ChatSkeleton() {
  return (
    <div className="flex-1 p-4 space-y-4 overflow-hidden w-full">
      {/* 1. Left bubble */}
      <div className="flex justify-start">
        <div className="h-12 w-[65%] rounded-[16px] rounded-tl-sm skeleton" />
      </div>
      {/* 2. Right bubble */}
      <div className="flex justify-end">
        <div className="h-10 w-[55%] rounded-[16px] rounded-tr-sm skeleton" />
      </div>
      {/* 3. Left bubble */}
      <div className="flex justify-start">
        <div className="h-16 w-[75%] rounded-[16px] rounded-tl-sm skeleton" />
      </div>
      {/* 4. Right bubble */}
      <div className="flex justify-end">
        <div className="h-14 w-[60%] rounded-[16px] rounded-tr-sm skeleton" />
      </div>
      {/* 5. Left bubble */}
      <div className="flex justify-start">
        <div className="h-10 w-[45%] rounded-[16px] rounded-tl-sm skeleton" />
      </div>
    </div>
  );
}

export default {
  WorkerCardSkeleton,
  WorkerListSkeleton,
  ProfileSkeleton,
  EarningsSkeleton,
  JobAlertSkeleton,
  ChatSkeleton,
};
