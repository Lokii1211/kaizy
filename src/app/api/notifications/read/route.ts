import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// ═══════════════════════════════════════════════════════
// PUT /api/notifications/read — Mark single notification as read
// ═══════════════════════════════════════════════════════

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "notificationId is required" }, { status: 400 });
    }

    const jwt = await getUserFromRequest(req.cookies);
    const userId = jwt?.sub || null;

    const supabase = getSupabase();
    let query = supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
    if (userId) query = query.eq("user_id", userId);

    await query;

    return NextResponse.json({ success: true, notificationId });
  } catch (error) {
    console.error("[PUT /api/notifications/read error]", error);
    return NextResponse.json({ success: false, error: "Failed to mark as read" }, { status: 500 });
  }
}
