import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// ═══════════════════════════════════════
// GET /api/bookings/status?id=<bookingId|latest>
// Returns booking status for polling
// ═══════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Specific booking by ID
    if (id && id !== 'latest') {
      const { data } = await supabaseAdmin
        .from('bookings')
        .select('id, status, worker_id, hirer_id, job_id, total_amount, otp, payment_status, created_at')
        .eq('id', id)
        .single();

      return NextResponse.json({ success: true, data: data || { status: 'pending' } });
    }

    // Latest booking for the authenticated user
    const jwtPayload = await getUserFromRequest(req.cookies);

    let query = supabaseAdmin
      .from('bookings')
      .select('id, status, worker_id, hirer_id, job_id, total_amount, otp, payment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    // Filter by authenticated user if possible
    if (jwtPayload?.sub) {
      query = query.or(`hirer_id.eq.${jwtPayload.sub},worker_id.eq.${jwtPayload.sub}`);
    }

    const { data } = await query.single();

    return NextResponse.json({ success: true, data: data || { status: 'pending' } });
  } catch {
    return NextResponse.json({ success: true, data: { status: 'pending' } });
  }
}

// POST — Worker updates job status through lifecycle (requires auth)
export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabase();
    const jwt = await getUserFromRequest(req.cookies);
    if (!jwt?.sub) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { job_id, booking_id, status } = body;

    const validStatuses = ["accepted", "en_route", "arrived", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const id = booking_id || job_id;
    if (!id) {
      return NextResponse.json({ success: false, error: "Job ID or Booking ID required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      status,
      [`${status}_at`]: new Date().toISOString(),
    };

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();

      // Calculate commission: ₹5 flat or 2% whichever higher, free under ₹250
      try {
        const { data: booking } = await supabaseAdmin
          .from("bookings")
          .select("worker_id, hirer_price, worker_price")
          .eq("id", id)
          .single();

        if (booking) {
          const jobAmount = booking.worker_price || booking.hirer_price || 0;
          let commission = 0;
          if (jobAmount >= 250) {
            commission = Math.max(5, Math.round(jobAmount * 0.02));
          }

          if (commission > 0 && booking.worker_id) {
            await supabaseAdmin.from("commission_ledger").insert({
              worker_id: booking.worker_id,
              booking_id: id,
              job_amount: jobAmount,
              commission_amount: commission,
              paid: false,
              created_at: new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        console.error("[commission calc]", e);
      }
    }

    // Try updating bookings table first
    const { error: bookingError } = await supabaseAdmin
      .from("bookings")
      .update(updateData)
      .eq("id", id);

    // If booking update failed (e.g. job_id was passed), try updating by job_id
    if (bookingError) {
      const { error: jobError } = await supabaseAdmin
        .from("bookings")
        .update(updateData)
        .eq("job_id", id);

      if (jobError) {
        console.error("[status update]", jobError);
      }
    }

    // Also update the job status
    await supabaseAdmin
      .from("jobs")
      .update({ status })
      .eq("id", job_id || id);

    return NextResponse.json({ success: true, status, message: `Status → ${status}` });
  } catch (error) {
    console.error("[booking status POST]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
