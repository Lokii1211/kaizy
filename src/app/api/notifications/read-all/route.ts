import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// ═══════════════════════════════════════════════════════
// PUT /api/notifications/read-all — Mark all notifications as read
// ═══════════════════════════════════════════════════════

export async function PUT(req: NextRequest) {
  try {
    const jwt = await getUserFromRequest(req.cookies);
    const userId = req.headers.get("x-user-id") || jwt?.sub || null;

    if (!userId) {
      return NextResponse.json({ success: true, message: "No active session" });
    }

    const supabase = getSupabase();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/notifications/read-all error]", error);
    return NextResponse.json({ success: false, error: "Failed to mark all as read" }, { status: 500 });
  }
}
