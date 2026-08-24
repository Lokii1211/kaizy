import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// ═══════════════════════════════════════════════════════
// PUT /api/alerts/decline — Worker declines a job alert
// ═══════════════════════════════════════════════════════

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { alertId, reason = "not_available" } = body;

    if (!alertId) {
      return NextResponse.json({ success: false, error: "alertId is required" }, { status: 400 });
    }

    const jwt = await getUserFromRequest(req.cookies);
    const workerId = req.headers.get("x-user-id") || jwt?.sub || null;

    const supabase = getSupabase();
    let query = supabase
      .from("job_alerts")
      .update({
        status: "declined",
        declined_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", alertId);

    if (workerId) query = query.eq("worker_id", workerId);
    await query;

    return NextResponse.json({ success: true, alertId, status: "declined" });
  } catch (error) {
    console.error("[PUT /api/alerts/decline error]", error);
    return NextResponse.json({ success: false, error: "Decline failed" }, { status: 500 });
  }
}
