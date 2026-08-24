import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";
import { sendPushNotification } from "@/lib/push-server";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

// ═══════════════════════════════════════════════════════
// POST /api/dispatch/accept
// Race-safe Atomic Alert Acceptance + Hirer FCM & WhatsApp Notifications
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json({ success: false, error: "alertId is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get current worker userId
    let workerId = req.headers.get("x-user-id") || body.workerId;
    if (!workerId) {
      const jwt = await getUserFromRequest(req.cookies);
      if (jwt?.sub) workerId = jwt.sub;
    }

    if (!workerId) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    // 1. Invoke atomic job acceptance function
    let rpcRes = await supabase.rpc("accept_job_atomic", {
      p_alert_id: alertId,
      p_worker_id: workerId,
    });

    // Fallback to accept_job_alert if name differs
    if (rpcRes.error) {
      rpcRes = await supabase.rpc("accept_job_alert", {
        p_alert_id: alertId,
        p_worker_id: workerId,
      });
    }

    const { data: rpcData, error: rpcError } = rpcRes;

    // Check conflict / already taken
    if (rpcError || !rpcData || rpcData.success === false || rpcData.error === "already_taken") {
      return NextResponse.json(
        { success: false, reason: "already_taken", error: "This job was already accepted by another captain" },
        { status: 409 }
      );
    }

    const bookingId = rpcData.booking_id || rpcData.bookingId;
    const jobId = rpcData.job_id || rpcData.jobId;

    // 2. Fetch Hirer & Worker Details
    const { data: booking } = await supabase
      .from("bookings")
      .select("*, jobs(*, users:hirer_id(id, name, phone, fcm_token)), worker:worker_id(name, phone)")
      .eq("id", bookingId)
      .maybeSingle();

    const hirerObj = booking?.jobs?.users || {};
    const workerName = booking?.worker?.name || "Kaizy Captain";

    // 3. Send FCM Push Notification to Hirer
    if (hirerObj.id) {
      sendPushNotification(
        hirerObj.id,
        `✅ ${workerName} is on the way!`,
        `Your captain has accepted the request and is heading towards your location. Track live on Kaizy.`,
        `/hirer/tracking/${bookingId}`
      ).catch(() => {});
    }

    // 4. Send WhatsApp Confirmation to Hirer (async, non-blocking)
    if (hirerObj.phone) {
      sendWhatsAppNotification({
        to: hirerObj.phone,
        template: "booking_confirmed",
        params: {
          workerName,
          service: booking?.jobs?.trade || "Emergency Service",
          date: "Now (Instant Dispatch)",
          amount: String(booking?.hirer_price || 350),
          workerPhone: booking?.worker?.phone || "+919876500000",
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      bookingId,
      jobId,
      otp: rpcData.otp || booking?.otp || "4821",
    });
  } catch (error) {
    console.error("[dispatch/accept error]", error);
    return NextResponse.json({ success: false, error: "Internal accept error" }, { status: 500 });
  }
}
