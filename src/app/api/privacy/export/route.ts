import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// ═══════════════════════════════════════════════════════
// POST /api/privacy/export — Export all user data in JSON
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const jwt = await getUserFromRequest(req.cookies);
    const userId = req.headers.get("x-user-id") || jwt?.sub || null;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const supabase = getSupabase();

    // Fetch all user records in parallel
    const [userRes, bookingsRes, reviewsRes, alertsRes] = await Promise.all([
      supabase.from("users").select("*, worker_profiles(*)").eq("id", userId).maybeSingle(),
      supabase
        .from("bookings")
        .select("*, jobs(*)")
        .or(`hirer_id.eq.${userId},worker_id.eq.${userId}`),
      supabase
        .from("reviews")
        .select("*")
        .or(`reviewer_id.eq.${userId},worker_id.eq.${userId}`),
      supabase.from("job_alerts").select("*").eq("worker_id", userId),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_profile: userRes.data,
      bookings_history: bookingsRes.data || [],
      reviews_given_and_received: reviewsRes.data || [],
      job_alerts_history: alertsRes.data || [],
      dpdp_compliance: "Indian Digital Personal Data Protection (DPDP) Act 2023 compliant data export",
    };

    return NextResponse.json({
      success: true,
      data: exportData,
      filename: `kaizy-data-export-${userId.slice(0, 8)}.json`,
    });
  } catch (error) {
    console.error("[POST /api/privacy/export error]", error);
    return NextResponse.json({ success: false, error: "Data export failed" }, { status: 500 });
  }
}
