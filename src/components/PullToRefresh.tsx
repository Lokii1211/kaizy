"use client";

import { useRef, useState, useCallback, ReactNode } from "react";

// ============================================================
// PULL TO REFRESH — Swiggy/Zomato/Rapido-style overscroll refresh
// Wrap any scrollable page content; only triggers when the page
// is scrolled to the very top, matching native app behavior.
// ============================================================

const PULL_THRESHOLD = 70; // px of pull needed to trigger refresh
const MAX_PULL = 110; // px cap on visual pull distance (resistance)

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  disabled?: boolean;
}

export default function PullToRefresh({ onRefresh, children, disabled }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || refreshing) return;
    // Only start tracking a pull if the page is already scrolled to the top
    if (window.scrollY <= 0 && (containerRef.current?.scrollTop ?? 0) <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [disabled, refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || disabled || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY <= 0) {
      // Resistance curve — pulling feels heavier the further you go
      const resisted = Math.min(MAX_PULL, delta * 0.5);
      setPullDistance(resisted);
    } else {
      pulling.current = false;
      setPullDistance(0);
    }
  }, [disabled, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      if (navigator.vibrate) navigator.vibrate(15);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: "relative" }}
    >
      {/* Pull indicator */}
      <div
        style={{
          position: "absolute",
          top: -50,
          left: "50%",
          transform: `translate(-50%, ${pullDistance}px)`,
          transition: pulling.current ? "none" : "transform 0.25s ease-out",
          opacity: pullDistance > 4 || refreshing ? 1 : 0,
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: "var(--bg-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {refreshing ? (
            <div
              className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }}
            />
          ) : (
            <span
              style={{
                fontSize: 16,
                transform: `rotate(${progress * 180}deg)`,
                transition: "transform 0.1s linear",
                color: progress >= 1 ? "var(--brand)" : "var(--text-3)",
              }}
            >
              ↓
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pulling.current ? "none" : "transform 0.25s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
