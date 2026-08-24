import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// ═══════════════════════════════════════════════════════
// POST /api/reviews/hirer — Worker reviews Hirer
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { bookingId, rating, tags = [], comment = "" } = body;

    if (!bookingId || !rating) {
      return NextResponse.json(
        { success: false, error: "bookingId and rating are required" },
        { status: 400 }
      );
    }

    const jwt = await getUserFromRequest(req.cookies);
    const callerId = req.headers.get("x-user-id") || jwt?.sub || null;

    // Fetch booking to find hirer_id
    const { data: booking, error: bkErr } = await supabase
      .from("bookings")
      .select("*, jobs(hirer_id)")
      .eq("id", bookingId)
      .single();

    if (bkErr || !booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    const hirerId = booking.hirer_id || booking.jobs?.hirer_id;

    // Insert into hirer_reviews table
    const { error: insertErr } = await supabase.from("hirer_reviews").insert({
      booking_id: bookingId,
      reviewer_id: callerId || booking.worker_id,
      hirer_id: hirerId,
      rating: Math.max(1, Math.min(3, rating)),
      tags,
      comment,
      created_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.warn("[hirer_reviews insert warning]", insertErr);
    }

    return NextResponse.json({
      success: true,
      message: "Customer review recorded successfully",
    });
  } catch (error) {
    console.error("[POST /api/reviews/hirer error]", error);
    return NextResponse.json({ success: false, error: "Review submission failed" }, { status: 500 });
  }
}
