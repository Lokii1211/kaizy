import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// POST /api/whatsapp — Send messages & handle incoming webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: "Missing 'action'" }, { status: 400 });
    }

    // ========== SEND MESSAGE ==========
    if (action === "send") {
      const { to, template, params, language } = body;
      if (!to || !template) {
        return NextResponse.json({ success: false, error: "to and template required" }, { status: 400 });
      }

      const result = await sendWhatsAppMessage({
        to,
        template,
        params: params || {},
        language: language || "en",
      });

      return NextResponse.json({ success: result.success, data: { messageId: result.messageId } });
    }

    // ========== SEND JOB ALERT ==========
    if (action === "job_alert") {
      const { workerPhones, jobTitle, location, amount, timing, language } = body;
      if (!workerPhones?.length || !jobTitle) {
        return NextResponse.json({ success: false, error: "workerPhones and jobTitle required" }, { status: 400 });
      }

      const results = await Promise.allSettled(
        workerPhones.map((phone: string) =>
          sendWhatsAppMessage({
            to: phone,
            template: "job_alert",
            params: { jobTitle, location: location || "", amount: String(amount || 0), timing: timing || "Today" },
            language: language || "en",
          })
        )
      );

      const sent = results.filter((r) => r.status === "fulfilled").length;
      return NextResponse.json({
        success: true,
        data: { sent, failed: results.length - sent, total: workerPhones.length },
      });
    }

    // ========== SEND EMERGENCY ALERT ==========
    if (action === "emergency_alert") {
      const { workerPhones, category, location, hirerName, amount } = body;
      if (!workerPhones?.length || !category) {
        return NextResponse.json({ success: false, error: "workerPhones and category required" }, { status: 400 });
      }

      const results = await Promise.allSettled(
        workerPhones.map((phone: string) =>
          sendWhatsAppMessage({
            to: phone,
            template: "emergency_alert",
            params: { category, location: location || "", hirerName: hirerName || "Customer", amount: String(amount || 0) },
          })
        )
      );

      const sent = results.filter((r) => r.status === "fulfilled").length;
      return NextResponse.json({
        success: true,
        data: { sent, failed: results.length - sent, total: workerPhones.length },
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}

// GET /api/whatsapp — Webhook verification (Gupshup/Twilio)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = searchParams.get("hub.verify_token");

  // Verify token for webhook setup
  const expectedToken = process.env.WHATSAPP_WEBHOOK_TOKEN || "Kaizy_verify_2024";
  if (verifyToken === expectedToken) {
    return new NextResponse(challenge || "OK", { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
