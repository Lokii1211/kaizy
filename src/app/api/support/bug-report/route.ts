import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// ═══════════════════════════════════════════════════════
// POST /api/support/bug-report — Save user bug report
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const jwt = await getUserFromRequest(req.cookies);
    const userId = req.headers.get("x-user-id") || jwt?.sub || null;

    const body = await req.json().catch(() => ({}));
    const { category = "General", description = "", screenshotUrl = null } = body;

    if (!description.trim()) {
      return NextResponse.json({ success: false, error: "Description is required" }, { status: 400 });
    }

    const supabase = getSupabase();
    await supabase.from("bug_reports").insert({
      user_id: userId,
      category,
      description: description.trim(),
      screenshot_url: screenshotUrl,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Bug report submitted. Thank you for helping improve Kaizy!",
    });
  } catch (error) {
    console.error("[POST /api/support/bug-report error]", error);
    return NextResponse.json({ success: false, error: "Failed to submit bug report" }, { status: 500 });
  }
}
