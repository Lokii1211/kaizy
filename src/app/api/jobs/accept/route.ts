import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createNotification } from '@/lib/supabase';

// ═══════════════════════════════════════
// POST /api/jobs/accept
// Worker accepts a job alert (atomic, race-safe)
// Uses PostgreSQL function for atomicity
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const { alertId, workerId } = await req.json();

    if (!alertId || !workerId) {
      return NextResponse.json({ success: false, error: 'alertId and workerId required' }, { status: 400 });
    }

    // Call the atomic accept function (handles race conditions)
    const { data, error } = await supabaseAdmin.rpc('accept_job', {
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
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*, jobs(*)')
      .eq('id', data.booking_id)
      .single();

    // Get worker name
    const { data: worker } = await supabaseAdmin
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
