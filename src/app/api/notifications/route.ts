import { NextRequest, NextResponse } from "next/server";

// ============================================================
// Kaizy — NOTIFICATION CASCADE ENGINE
// FCM (primary) → WhatsApp (backup) → SMS (fallback)
// 10 notification types · Priority levels · Deep links
// ============================================================

interface NotificationConfig {
  type: string;
  priority: "low" | "normal" | "high" | "critical";
  channels: ("fcm" | "whatsapp" | "sms")[];
  sound?: string;
  vibration?: number[];
  fullScreenIntent?: boolean;
  ttl?: number;
  titleFn: (data: Record<string, unknown>) => string;
  bodyFn: (data: Record<string, unknown>) => string;
  titleHi?: (data: Record<string, unknown>) => string;
  bodyHi?: (data: Record<string, unknown>) => string;
  deepLink: string;
}

const NOTIFICATION_CONFIGS: Record<string, NotificationConfig> = {
  JOB_ALERT: {
    type: "JOB_ALERT", priority: "critical",
    channels: ["fcm", "whatsapp"],
    sound: "kaizy_alert.mp3", vibration: [500, 200, 200],
    fullScreenIntent: true, ttl: 45,
    titleFn: (d) => `🔔 New Job! ₹${d.price}`,
    bodyFn: (d) => `${d.jobTitle} • ${d.distance} km away`,
    titleHi: (d) => `🔔 नई जॉब! ₹${d.price}`,
    bodyHi: (d) => `${d.jobTitle} • ${d.distance} km दूर`,
    deepLink: "kaizy://job-alert/{alertId}",
  },
  BOOKING_CONFIRMED: {
    type: "BOOKING_CONFIRMED", priority: "high",
    channels: ["fcm", "whatsapp"],
    sound: "success.mp3",
    titleFn: () => "✅ Worker Confirmed!",
    bodyFn: (d) => `${d.workerName} accepted. ETA: ${d.eta} minutes`,
    titleHi: () => "✅ वर्कर कन्फर्म!",
    bodyHi: (d) => `${d.workerName} ने एक्सेप्ट किया। ${d.eta} मिनट`,
    deepLink: "kaizy://tracking/{bookingId}",
  },
  WORKER_EN_ROUTE: {
    type: "WORKER_EN_ROUTE", priority: "high",
    channels: ["fcm"],
    titleFn: (d) => `🚶 ${d.workerName} is on the way`,
    bodyFn: (d) => `${d.eta} minutes away • Tap to track`,
    deepLink: "kaizy://tracking/{bookingId}",
  },
  WORKER_ARRIVED: {
    type: "WORKER_ARRIVED", priority: "critical",
    channels: ["fcm", "whatsapp"],
    sound: "arrived.mp3", vibration: [300, 100, 300],
    titleFn: (d) => `📍 ${d.workerName} has arrived!`,
    bodyFn: () => "Your worker is at the location",
    titleHi: (d) => `📍 ${d.workerName} पहुँच गया!`,
    bodyHi: () => "वर्कर लोकेशन पर है",
    deepLink: "kaizy://booking/{bookingId}",
  },
  JOB_STARTED: {
    type: "JOB_STARTED", priority: "normal",
    channels: ["fcm"],
    titleFn: () => "🔧 Job Started",
    bodyFn: (d) => `${d.workerName} has started working on ${d.jobTitle}`,
    deepLink: "kaizy://booking/{bookingId}",
  },
  JOB_COMPLETED: {
    type: "JOB_COMPLETED", priority: "high",
    channels: ["fcm", "whatsapp"],
    titleFn: () => "✅ Job Complete!",
    bodyFn: (d) => `${d.jobTitle} done • Rate your experience`,
    titleHi: () => "✅ काम पूरा!",
    bodyHi: (d) => `${d.jobTitle} हो गया • रेटिंग दें`,
    deepLink: "kaizy://review/{bookingId}",
  },
  PAYMENT_RECEIVED: {
    type: "PAYMENT_RECEIVED", priority: "high",
    channels: ["fcm", "whatsapp"],
    sound: "payment.mp3",
    titleFn: (d) => `💰 ₹${d.amount} credited!`,
    bodyFn: (d) => `For ${d.jobTitle} • Check earnings`,
    titleHi: (d) => `💰 ₹${d.amount} जमा हो गया!`,
    bodyHi: (d) => `${d.jobTitle} के लिए • कमाई देखें`,
    deepLink: "kaizy://earnings",
  },
  PAYMENT_RELEASED: {
    type: "PAYMENT_RELEASED", priority: "normal",
    channels: ["fcm"],
    titleFn: (d) => `✅ Payment sent to ${d.workerName}`,
    bodyFn: (d) => `₹${d.amount} transferred`,
    deepLink: "kaizy://booking/{bookingId}",
  },
  NEW_MESSAGE: {
    type: "NEW_MESSAGE", priority: "high",
    channels: ["fcm"],
    titleFn: (d) => `💬 ${d.senderName}`,
    bodyFn: (d) => String(d.preview || "New message"),
    deepLink: "kaizy://chat/{bookingId}",
  },
  DISPUTE_RAISED: {
    type: "DISPUTE_RAISED", priority: "high",
    channels: ["fcm", "whatsapp"],
    titleFn: () => "⚠️ Dispute Raised",
    bodyFn: () => "A dispute has been raised. Review within 12 hours.",
    deepLink: "kaizy://dispute/{bookingId}",
  },
};

// In-memory notification store (production: Supabase)
const notifStore = new Map<string, Array<{
  id: string; userId: string; type: string; title: string; body: string;
  titleHi: string | null; bodyHi: string | null;
  data: Record<string, unknown>; channels: string[];
  status: string; priority: string; sentAt: string; readAt: string | null;
}>>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ── SEND NOTIFICATION ──
    if (action === "send") {
      const { userId, type, data = {} } = body;
      const config = NOTIFICATION_CONFIGS[type];

      if (!config) {
        return NextResponse.json({ success: false, error: `Unknown type: ${type}` }, { status: 400 });
      }

      const title = config.titleFn(data);
      const bodyText = config.bodyFn(data);
      const titleHi = config.titleHi ? config.titleHi(data) : null;
      const bodyHi = config.bodyHi ? config.bodyHi(data) : null;

      const notif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId, type, title, body: bodyText, titleHi, bodyHi,
        data, channels: config.channels,
        status: "sent", priority: config.priority,
        sentAt: new Date().toISOString(), readAt: null,
      };

      const userNotifs = notifStore.get(userId) || [];
      userNotifs.unshift(notif);
      notifStore.set(userId, userNotifs);

      // In production: send FCM, WhatsApp, SMS here
      const deliveryReport = {
        fcm: config.channels.includes("fcm") ? "sent" : "skipped",
        whatsapp: config.channels.includes("whatsapp") ? "sent" : "skipped",
        sms: config.channels.includes("sms") ? "sent" : "skipped",
      };

      return NextResponse.json({
        success: true,
        data: {
          notification: notif,
          delivery: deliveryReport,
          deepLink: config.deepLink.replace("{bookingId}", String(data.bookingId || "")).replace("{alertId}", String(data.alertId || "")),
        },
      });
    }

    // ── MARK READ ──
    if (action === "mark_read") {
      const { userId, notificationId } = body;
      const userNotifs = notifStore.get(userId) || [];
      const notif = userNotifs.find(n => n.id === notificationId);
      if (notif) { notif.status = "read"; notif.readAt = new Date().toISOString(); }
      return NextResponse.json({ success: true });
    }

    // ── MARK ALL READ ──
    if (action === "mark_all_read") {
      const { userId } = body;
      const userNotifs = notifStore.get(userId) || [];
      const now = new Date().toISOString();
      userNotifs.filter(n => n.status !== "read").forEach(n => { n.status = "read"; n.readAt = now; });
      return NextResponse.json({ success: true, marked: userNotifs.length });
    }

    // ── GET CONFIG ──
    if (action === "config") {
      return NextResponse.json({
        success: true,
        data: Object.entries(NOTIFICATION_CONFIGS).map(([key, config]) => ({
          type: key, priority: config.priority, channels: config.channels,
          hasSound: !!config.sound, fullScreen: !!config.fullScreenIntent,
        })),
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// GET: Fetch user notifications
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "user-001";
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "20");

  const userNotifs = notifStore.get(userId) || [];
  const filtered = status ? userNotifs.filter(n => n.status === status) : userNotifs;

  return NextResponse.json({
    success: true,
    data: {
      notifications: filtered.slice(0, limit),
      total: filtered.length,
      unread: userNotifs.filter(n => n.status !== "read").length,
    },
  });
}
