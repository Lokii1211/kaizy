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
    const jobId = searchParams.get('jobId');

    // Lookup by job_id (used by BookingStore polling)
    if (jobId) {
      const { data } = await supabaseAdmin
        .from('bookings')
        .select('id, status, worker_id, hirer_id, job_id, total_amount, otp, payment_status, created_at')
        .eq('job_id', jobId)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return NextResponse.json({ success: true, data: data || { status: 'searching' } });
    }

    // Specific booking by booking ID
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

      try {
        const { data: booking } = await supabaseAdmin
          .from("bookings")
          .select("worker_id, hirer_price, worker_price, total_amount")
          .eq("id", id)
          .single();

        if (booking?.worker_id) {
          // KaizyScore +10 and total_jobs +1 on every completed job
          const { data: wp } = await supabaseAdmin
            .from("worker_profiles")
            .select("kaizy_score, total_jobs")
            .eq("id", booking.worker_id)
            .single();
          if (wp) {
            await supabaseAdmin.from("worker_profiles").update({
              kaizy_score: Math.min(1000, (wp.kaizy_score || 300) + 10),
              total_jobs: (wp.total_jobs || 0) + 1,
            }).eq("id", booking.worker_id);
          }

          // Commission ledger (table may not exist yet — ignore error)
          const jobAmount = booking.total_amount || booking.worker_price || booking.hirer_price || 0;
          if (jobAmount >= 250) {
            const commission = Math.max(5, Math.round(jobAmount * 0.02));
            supabaseAdmin.from("commission_ledger").insert({
              worker_id: booking.worker_id,
              booking_id: id,
              job_amount: jobAmount,
              commission_amount: commission,
              paid: false,
              created_at: new Date().toISOString(),
            }).then(undefined, () => {/* table may not exist */});
          }
        }
      } catch (e) {
        console.error("[completion handler]", e);
      }
    }

    if (status === "cancelled") {
      // KaizyScore -20 for cancel after accept (only penalise worker cancellations)
      if (jwt?.userType === "worker") {
        try {
          const { data: booking } = await supabaseAdmin
            .from("bookings").select("worker_id, status").eq("id", id).single();
          if (booking?.worker_id && ["accepted", "en_route", "arrived"].includes(booking.status)) {
            const { data: wp } = await supabaseAdmin
              .from("worker_profiles").select("kaizy_score").eq("id", booking.worker_id).single();
            if (wp) {
              await supabaseAdmin.from("worker_profiles").update({
                kaizy_score: Math.max(0, (wp.kaizy_score || 300) - 20),
              }).eq("id", booking.worker_id);
            }
          }
        } catch (e) {
          console.error("[cancel score]", e);
        }
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
