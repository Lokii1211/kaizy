import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/auth";

// ═══════════════════════════════════════════════════════
// POST /api/dispatch/later
// Scheduled "Later" Booking Creation + Worker Notification
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      workerId,
      trade = "electrician",
      problemType = "General Service",
      description = "",
      scheduledFor,
      photos = [],
      voiceNoteUrl = null,
      address = "Hirer Location",
      lat = 11.0168,
      lng = 76.9558,
      estimatedMin = 249,
      estimatedMax = 499,
    } = body;

    if (!workerId || !scheduledFor) {
      return NextResponse.json(
        { success: false, error: "workerId and scheduledFor are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Get current hirer ID from cookie/auth
    let hirerId = body.hirerId;
    if (!hirerId) {
      const jwt = await getUserFromRequest(req.cookies);
      if (jwt?.sub) hirerId = jwt.sub;
    }

    // 1. Create Job record
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        hirer_id: hirerId || null,
        trade,
        problem_type: problemType,
        description: description || `Scheduled booking: ${problemType}`,
        latitude: lat,
        longitude: lng,
        address,
        job_type: "later",
        scheduled_for: scheduledFor,
        estimated_price: estimatedMin,
        photos,
        status: "accepted",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error("[dispatch/later job create error]", jobError);
      return NextResponse.json(
        { success: false, error: "Failed to create scheduled job" },
        { status: 500 }
      );
    }

    // Generate 4-digit OTP
    const otp = String(Math.floor(1000 + Math.random() * 9000));

    // 2. Create Booking record
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        job_id: job.id,
        hirer_id: hirerId || null,
        worker_id: workerId,
        status: "accepted",
        otp,
        visit_charge: 49,
        hirer_price: estimatedMin,
        created_at: new Date().toISOString(),
      })
      .select("*, worker_profiles(*, users(name, profile_photo, phone))")
      .single();

    if (bookingError || !booking) {
      console.error("[dispatch/later booking create error]", bookingError);
      return NextResponse.json(
        { success: false, error: "Failed to create booking confirmation" },
        { status: 500 }
      );
    }

    // 3. Notify Worker (In-app Notification record)
    await supabase.from("notifications").insert({
      user_id: workerId,
      title: "🗓️ New Scheduled Booking Confirmed!",
      body: `You have a booking for ${problemType} on ${new Date(scheduledFor).toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}.`,
      type: "BOOKING_ACCEPTED",
      data: { bookingId: booking.id, scheduledFor },
      created_at: new Date().toISOString(),
    });

    const bookingCode = `KZ-${booking.id.slice(0, 8).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      bookingCode,
      scheduledFor,
      job,
      booking,
    });
  } catch (error) {
    console.error("[dispatch/later error]", error);
    return NextResponse.json(
      { success: false, error: "Internal scheduling error" },
      { status: 500 }
    );
  }
}
