import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { createNotification } from '@/lib/push-server';

// ═══════════════════════════════════════
// POST /api/jobs/accept
// Worker accepts a job alert (atomic, race-safe).
// JWT auth required — caller must be the worker they claim.
// Uses PostgreSQL accept_job_atomic function for atomicity.
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    // Auth check — caller must be authenticated as a worker
    const user = await getUserFromRequest(req.cookies);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (user.userType !== 'worker') {
      return NextResponse.json({ success: false, error: 'Only workers can accept jobs' }, { status: 403 });
    }

    const { alertId } = await req.json();

    if (!alertId) {
      return NextResponse.json({ success: false, error: 'alertId required' }, { status: 400 });
    }

    // workerId is always the authenticated user — never trust body param
    const workerId = user.sub;

    const supabase = getSupabase();

    // Call the atomic accept function (handles race conditions)
    const { data, error } = await supabase.rpc('accept_job_atomic', {
      p_alert_id: alertId,
      p_worker_id: workerId,
    });

    if (error) {
      console.error('[accept error]', error);
      return NextResponse.json({
        success: false,
        error: 'Job already taken or expired',
        reason: 'already_taken',
      }, { status: 409 });
    }

    if (!data?.success) {
      return NextResponse.json({
        success: false,
        error: data?.reason || 'Could not accept job',
        reason: data?.reason,
      }, { status: 409 });
    }

    // Get booking details for notification
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, jobs(*)')
      .eq('id', data.booking_id)
      .single();

    // Get worker name
    const { data: worker } = await supabase
      .from('users')
      .select('name')
      .eq('id', workerId)
      .single();

    // Notify hirer that worker accepted
    if (booking?.hirer_id) {
      await createNotification(
        booking.hirer_id,
        'BOOKING_ACCEPTED',
        `✅ ${worker?.name || 'Worker'} accepted your job!`,
        `ETA: ~10 minutes · OTP: ${data.otp}`,
        { bookingId: data.booking_id, workerId, workerName: worker?.name, otp: data.otp }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId: data.booking_id,
        jobId: data.job_id,
        otp: data.otp,
        message: 'Job accepted! Navigate to the customer.',
      },
    });
  } catch (error) {
    console.error('[jobs/accept error]', error);
    return NextResponse.json({ success: false, error: 'Failed to accept job' }, { status: 500 });
  }
}
