"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/stores/ThemeStore";
import { useAuth } from "@/stores/AuthStore";
import { getSupabase } from "@/lib/supabase";
import UserAvatar from "@/components/UserAvatar";
import LoadingShell from "@/components/LoadingShell";
import { formatPrice } from "@/lib/formatters";

// ============================================================
// REAL NOTIFICATIONS SCREEN — /notifications
// 8 Real Types: JOB_ALERT (countdown), BOOKING_CONFIRMED, WORKER_EN_ROUTE,
// WORKER_ARRIVED, QUOTE_RECEIVED, PAYMENT_RECEIVED, REVIEW_REQUEST, SYSTEM_ALERT
// Realtime Sync · Date Grouping · Accept/Decline Atomic Actions · Read/Unread
// ============================================================

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

interface AlertCountdown {
  [alertId: string]: number; // seconds left
}

export default function NotificationsPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "alerts" | "bookings" | "payments">("all");

  // Job alert state machines
  const [alertCountdowns, setAlertCountdowns] = useState<AlertCountdown>({});
  const [alertStatuses, setAlertStatuses] = useState<Record<string, "pending" | "accepted" | "declined" | "taken" | "expired">>({});
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabase(), []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // ── 1. FETCH NOTIFICATIONS ──
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=50");
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data);

        // Compute countdowns for job alerts
        const counts: AlertCountdown = {};
        const statuses: Record<string, "pending" | "accepted" | "declined" | "taken" | "expired"> = {};

        json.data.forEach((n: NotificationItem) => {
          if (n.type === "JOB_ALERT" || n.type === "EMERGENCY_ALERT") {
            const alertId = (n.data?.alertId as string) || n.id;
            const expiresAt = n.data?.expiresAt ? new Date(n.data.expiresAt as string).getTime() : 0;
            const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

            counts[alertId] = diff > 0 ? diff : (n.data?.secondsLeft as number) || 45;
            statuses[alertId] = diff <= 0 && expiresAt > 0 ? "expired" : "pending";
          }
        });

        setAlertCountdowns(counts);
        setAlertStatuses((prev) => ({ ...prev, ...statuses }));
      }
    } catch (err) {
      console.error("[fetchNotifications err]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── 2. REALTIME NOTIFICATIONS SUBSCRIPTION ──
  useEffect(() => {
    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotif = payload.new as NotificationItem;
          if (newNotif) {
            setNotifications((prev) => [newNotif, ...prev]);
            if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);

            // Set alert countdown if job alert
            if (newNotif.type === "JOB_ALERT" || newNotif.type === "EMERGENCY_ALERT") {
              const alertId = (newNotif.data?.alertId as string) || newNotif.id;
              setAlertCountdowns((prev) => ({ ...prev, [alertId]: 45 }));
              setAlertStatuses((prev) => ({ ...prev, [alertId]: "pending" }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // ── 3. ALERT COUNTDOWN TIMER TICKER ──
  useEffect(() => {
    const timer = setInterval(() => {
      setAlertCountdowns((prev) => {
        const next: AlertCountdown = {};
        Object.entries(prev).forEach(([id, secs]) => {
          if (secs > 1) {
            next[id] = secs - 1;
          } else {
            next[id] = 0;
            setAlertStatuses((s) => ({ ...s, [id]: "expired" }));
          }
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ── 4. MARK SINGLE AS READ ──
  const markAsRead = async (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );

    try {
      await fetch("/api/notifications/read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notifId }),
      });
    } catch {}
  };

  // ── 5. MARK ALL AS READ ──
  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await fetch("/api/notifications/read-all", { method: "PUT" });
      showToast("All notifications marked as read ✓");
    } catch {}
  };

  // ── 6. WORKER ACCEPT JOB ALERT ──
  const handleAcceptAlert = async (alertId: string, notifId: string) => {
    setActionInProgress(alertId);
    markAsRead(notifId);

    try {
      const res = await fetch("/api/dispatch/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });

      const json = await res.json();

      if (res.status === 409 || json.reason === "already_taken") {
        setAlertStatuses((prev) => ({ ...prev, [alertId]: "taken" }));
        showToast("Job was taken by another worker");
        return;
      }

      if (json.success && json.bookingId) {
        setAlertStatuses((prev) => ({ ...prev, [alertId]: "accepted" }));
        router.push(`/worker/job/${json.bookingId}`);
      }
    } catch {
      showToast("Could not accept job. Please retry.");
    } finally {
      setActionInProgress(null);
    }
  };

  // ── 7. WORKER DECLINE JOB ALERT ──
  const handleDeclineAlert = async (alertId: string, notifId: string) => {
    setAlertStatuses((prev) => ({ ...prev, [alertId]: "declined" }));
    markAsRead(notifId);

    try {
      await fetch("/api/alerts/decline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, reason: "not_available" }),
      });
    } catch {}
  };

  // ── 8. DATE GROUPING HELPER ──
  const getGroupDate = (dateIso: string) => {
    const d = new Date(dateIso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

    if (target === today) return "Today";
    if (target === yesterday) return "Yesterday";
    return "Earlier";
  };

  // Filter by Tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "alerts") return n.type.includes("ALERT");
    if (activeTab === "bookings") return n.type.includes("BOOKING") || n.type.includes("WORKER") || n.type.includes("QUOTE");
    if (activeTab === "payments") return n.type.includes("PAYMENT");
    return true;
  });

  // Group into Today / Yesterday / Earlier
  const grouped = useMemo(() => {
    const map: Record<string, NotificationItem[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    filteredNotifications.forEach((n) => {
      const g = getGroupDate(n.created_at);
      map[g]?.push(n);
    });

    return map;
  }, [filteredNotifications]);

  if (loading) return <LoadingShell />;

  return (
    <div
      className="min-h-screen pb-24 select-none"
      style={{ background: isDark ? "var(--bg-app)" : "#F9FAFB" }}
    >
      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 p-3.5 rounded-[16px] bg-[#FF6B00] text-white text-[12px] font-black text-center shadow-2xl anim-up">
          {toastMessage}
        </div>
      )}

      {/* ── TOP HEADER ── */}
      <div
        className="px-5 pt-7 pb-4 border-b sticky top-0 z-30 backdrop-blur-md flex justify-between items-center"
        style={{
          background: isDark ? "rgba(10,10,10,0.92)" : "rgba(255,255,255,0.95)",
          borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center border font-bold"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          ←
        </button>

        <h1
          className="text-[18px] font-black"
          style={{ color: "var(--text-1)", fontFamily: "'Epilogue', sans-serif" }}
        >
          Notifications
        </h1>

        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-[11px] font-bold text-[#FF6B00] active:scale-95"
        >
          Mark all read
        </button>
      </div>

      {/* ── TABS BAR ── */}
      <div className="px-5 pt-4 pb-2">
        <div
          className="p-1 rounded-[16px] border flex gap-1 shadow-sm"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
        >
          {(["all", "alerts", "bookings", "payments"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-[12px] text-[11px] font-black transition-all capitalize"
              style={{
                background: activeTab === tab ? "#FF6B00" : "transparent",
                color: activeTab === tab ? "#FFFFFF" : "var(--text-2)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── NOTIFICATIONS CONTENT BY GROUPS ── */}
      <div className="px-5 pt-3 space-y-6">
        {filteredNotifications.length === 0 ? (
          <div
            className="p-10 rounded-[24px] border text-center my-6 space-y-2"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-2)" }}
          >
            <span className="text-[40px] block">🔔</span>
            <h3 className="text-[16px] font-black" style={{ color: "var(--text-1)" }}>
              No notifications
            </h3>
            <p className="text-[12px] font-medium text-gray-400">
              You&apos;re completely up to date.
            </p>
          </div>
        ) : (
          (["Today", "Yesterday", "Earlier"] as const).map((groupTitle) => {
            const list = grouped[groupTitle];
            if (!list || list.length === 0) return null;

            return (
              <div key={groupTitle} className="space-y-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 block px-1">
                  {groupTitle}
                </span>

                <div className="space-y-3">
                  {list.map((item) => {
                    const isUnread = !item.is_read;
                    const alertId = (item.data?.alertId as string) || item.id;
                    const alertStatus = alertStatuses[alertId] || "pending";
                    const secondsLeft = alertCountdowns[alertId] ?? 45;
                    const isExpired = alertStatus === "expired" || alertStatus === "taken" || alertStatus === "declined";

                    return (
                      <div
                        key={item.id}
                        onClick={() => markAsRead(item.id)}
                        className={`p-4 rounded-[20px] border shadow-sm transition-all relative overflow-hidden ${
                          isUnread ? "border-l-[4px] border-l-[#FF6B00]" : ""
                        } ${isExpired ? "opacity-60 bg-gray-500/5" : ""}`}
                        style={{
                          background: isUnread
                            ? isDark
                              ? "rgba(255,107,0,0.04)"
                              : "rgba(255,107,0,0.02)"
                            : "var(--bg-card)",
                          borderColor: isDark ? "var(--border-2)" : "#E5E7EB",
                        }}
                      >
                        {/* ══════════════════════════════
                            1. JOB_ALERT (WORKER)
                        ══════════════════════════════ */}
                        {(item.type === "JOB_ALERT" || item.type === "EMERGENCY_ALERT") && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className="text-[20px]">🚨</span>
                                <div>
                                  <h4 className="text-[14px] font-black text-[#FF6B00]">
                                    {item.title || "Emergency Job Request"}
                                  </h4>
                                  <p className="text-[11px] font-bold text-gray-400">
                                    {(item.data?.trade as string) || "Electrician"} · ~{String(item.data?.distance || "1.8")} km away
                                  </p>
                                </div>
                              </div>

                              {/* Countdown Badge */}
                              <div className="text-right">
                                {alertStatus === "pending" && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-red-500/15 text-red-500 border border-red-500/30 animate-pulse">
                                    ⏱ 0:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
                                  </span>
                                )}
                                {alertStatus === "taken" && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gray-500/20 text-gray-400">
                                    Taken by another
                                  </span>
                                )}
                                {alertStatus === "expired" && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gray-500/20 text-gray-400">
                                    Expired
                                  </span>
                                )}
                                {alertStatus === "declined" && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gray-500/20 text-gray-400">
                                    Declined
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-[12px] font-medium" style={{ color: "var(--text-1)" }}>
                              {item.body}
                            </p>

                            {/* Estimated Payout Chip */}
                            <div className="flex justify-between items-center p-2.5 rounded-[12px] bg-black/5 dark:bg-white/5 text-[11px] font-bold">
                              <span>Estimated Payout:</span>
                              <span className="text-[13px] font-black text-green-500 font-mono">
                                {formatPrice(Number(item.data?.payoutAmount || 350))}
                              </span>
                            </div>

                            {/* Accept / Decline Action Buttons */}
                            {alertStatus === "pending" && (
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAcceptAlert(alertId, item.id);
                                  }}
                                  disabled={actionInProgress === alertId}
                                  className="flex-1 py-3 rounded-[14px] text-[13px] font-black text-white active:scale-95 shadow-md"
                                  style={{ background: "#10B981" }}
                                >
                                  {actionInProgress === alertId ? "Accepting..." : "✓ Accept Job"}
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeclineAlert(alertId, item.id);
                                  }}
                                  className="py-3 px-4 rounded-[14px] text-[12px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 active:scale-95"
                                >
                                  ✕ Pass
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ══════════════════════════════
                            2. BOOKING_CONFIRMED (HIRER)
                        ══════════════════════════════ */}
                        {item.type === "BOOKING_CONFIRMED" && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className="text-[20px]">✅</span>
                                <h4 className="text-[13px] font-black" style={{ color: "var(--text-1)" }}>
                                  {item.title}
                                </h4>
                              </div>
                              <span className="text-[9px] text-gray-400">Now</span>
                            </div>
                            <p className="text-[12px] text-gray-400">{item.body}</p>
                            <Link
                              href={`/hirer/tracking/${item.data?.bookingId || ""}`}
                              className="block w-full py-2.5 rounded-[12px] text-[12px] font-black text-white text-center shadow-md active:scale-95"
                              style={{ background: "#FF6B00" }}
                            >
                              Track Captain Live →
                            </Link>
                          </div>
                        )}

                        {/* ══════════════════════════════
                            3. WORKER_EN_ROUTE (HIRER)
                        ══════════════════════════════ */}
                        {item.type === "WORKER_EN_ROUTE" && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[20px]">🚗</span>
                              <h4 className="text-[13px] font-black" style={{ color: "var(--text-1)" }}>
                                {item.title}
                              </h4>
                            </div>
                            <p className="text-[12px] text-gray-400">{item.body}</p>
                            <Link
                              href={`/hirer/tracking/${item.data?.bookingId || ""}`}
                              className="block w-full py-2.5 rounded-[12px] text-[12px] font-black text-white text-center active:scale-95"
                              style={{ background: "#3B82F6" }}
                            >
                              Open Live Map 🧭
                            </Link>
                          </div>
                        )}

                        {/* ══════════════════════════════
                            4. WORKER_ARRIVED (HIRER)
                        ══════════════════════════════ */}
                        {item.type === "WORKER_ARRIVED" && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[20px]">📍</span>
                              <h4 className="text-[13px] font-black text-green-500">
                                {item.title}
                              </h4>
                            </div>
                            <p className="text-[12px] text-gray-400">{item.body}</p>
                            <Link
                              href={`/hirer/tracking/${item.data?.bookingId || ""}`}
                              className="block w-full py-2.5 rounded-[12px] text-[12px] font-black text-white text-center active:scale-95 shadow-md"
                              style={{ background: "#10B981" }}
                            >
                              Open Tracking & Share Start OTP →
                            </Link>
                          </div>
                        )}

                        {/* ══════════════════════════════
                            5. QUOTE_RECEIVED (HIRER)
                        ══════════════════════════════ */}
                        {item.type === "QUOTE_RECEIVED" && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[20px]">💬</span>
                              <h4 className="text-[13px] font-black text-[#FF6B00]">
                                {item.title}
                              </h4>
                            </div>
                            <p className="text-[12px]" style={{ color: "var(--text-1)" }}>
                              {item.body}
                            </p>
                            <div className="flex gap-2">
                              <Link
                                href={`/hirer/tracking/${item.data?.bookingId || ""}`}
                                className="flex-1 py-2.5 rounded-[12px] text-[12px] font-black text-white text-center active:scale-95 shadow-md"
                                style={{ background: "#10B981" }}
                              >
                                Review & Approve →
                              </Link>
                            </div>
                          </div>
                        )}

                        {/* ══════════════════════════════
                            6. PAYMENT_RECEIVED (WORKER)
                        ══════════════════════════════ */}
                        {item.type === "PAYMENT_RECEIVED" && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[20px]">💰</span>
                              <h4 className="text-[13px] font-black text-green-500">
                                {item.title}
                              </h4>
                            </div>
                            <p className="text-[12px] text-gray-400">{item.body}</p>
                            <Link
                              href="/worker/my-jobs"
                              className="block w-full py-2.5 rounded-[12px] text-[12px] font-black border text-center active:scale-95"
                              style={{
                                background: "var(--bg-surface)",
                                borderColor: "var(--border-2)",
                                color: "var(--text-1)",
                              }}
                            >
                              View Earnings Balance →
                            </Link>
                          </div>
                        )}

                        {/* ══════════════════════════════
                            7. REVIEW_REQUEST (HIRER)
                        ══════════════════════════════ */}
                        {item.type === "REVIEW_REQUEST" && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[20px]">⭐</span>
                              <h4 className="text-[13px] font-black" style={{ color: "var(--text-1)" }}>
                                {item.title}
                              </h4>
                            </div>
                            <p className="text-[12px] text-gray-400">{item.body}</p>
                            <Link
                              href={`/hirer/review/${item.data?.bookingId || ""}`}
                              className="block w-full py-2.5 rounded-[12px] text-[12px] font-black text-white text-center active:scale-95 shadow-md"
                              style={{ background: "#FF6B00" }}
                            >
                              Rate Experience (5★) →
                            </Link>
                          </div>
                        )}

                        {/* ══════════════════════════════
                            8. SYSTEM_ALERT (DISMISS ONLY)
                        ══════════════════════════════ */}
                        {item.type === "SYSTEM_ALERT" && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className="text-[18px]">🛡️</span>
                                <h4 className="text-[13px] font-black" style={{ color: "var(--text-1)" }}>
                                  {item.title}
                                </h4>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNotifications((prev) => prev.filter((n) => n.id !== item.id));
                                }}
                                className="text-gray-400 text-[12px] font-bold p-1"
                              >
                                ✕
                              </button>
                            </div>
                            <p className="text-[12px] text-gray-400">{item.body}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
