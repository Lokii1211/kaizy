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

    // Scheduled-job slot conflict check: if this alert's job has a
    // scheduled_for, reject when the worker already holds another booking
    // within ±90 minutes of that slot.
    try {
      const { data: alertRow } = await supabase
        .from('job_alerts')
        .select('job_id, jobs(scheduled_for)')
        .eq('id', alertId)
        .single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scheduledFor = (alertRow as any)?.jobs?.scheduled_for;
      if (scheduledFor) {
        const slot = new Date(scheduledFor).getTime();
        const windowMs = 90 * 60 * 1000;
        const { data: conflicts } = await supabase
          .from('bookings')
          .select('id, scheduled_for, jobs!inner(scheduled_for)')
          .eq('worker_id', workerId)
          .in('status', ['accepted', 'scheduled', 'en_route', 'in_progress'])
          .gte('jobs.scheduled_for', new Date(slot - windowMs).toISOString())
          .lte('jobs.scheduled_for', new Date(slot + windowMs).toISOString())
          .limit(1);
        if (conflicts && conflicts.length > 0) {
          return NextResponse.json({
            success: false,
            error: 'You already have a booking near this time slot',
            reason: 'slot_conflict',
          }, { status: 409 });
        }
      }
    } catch { /* conflict check is best-effort — never block accepts on its failure */ }

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

    // data.job_id may be the real job UUID or text depending on migration version
    const jobId = data.job_id as string;
    let bookingId = data.booking_id as string;

    // If RPC didn't create a booking (migration 003 scenario), create one here
    if (!bookingId || bookingId === jobId) {
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id, hirer_id')
        .eq('job_id', jobId)
        .neq('status', 'cancelled')
        .single();

      if (existingBooking) {
        bookingId = existingBooking.id;
      } else {
        // Get hirer_id from jobs table
        const { data: jobRow } = await supabase.from('jobs').select('hirer_id').eq('id', jobId).single();
        const otp = data.otp || String(Math.floor(1000 + Math.random() * 9000));
        const { data: newBooking } = await supabase
          .from('bookings')
          .insert({
            job_id: jobId,
            hirer_id: jobRow?.hirer_id || null,
            worker_id: workerId,
            status: 'accepted',
            otp,
            visit_charge: 49,
            platform_fee: 5,
          })
          .select('id')
          .single();
        bookingId = newBooking?.id || jobId;
      }
    }

    // Get booking and hirer details for notification
    const { data: booking } = await supabase
      .from('bookings')
      .select('hirer_id, otp')
      .eq('id', bookingId)
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
        `ETA: ~10 minutes · OTP: ${booking.otp || data.otp}`,
        { bookingId, workerId, workerName: worker?.name, otp: booking.otp || data.otp }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        jobId,
        otp: booking?.otp || data.otp,
        message: 'Job accepted! Navigate to the customer.',
      },
    });
  } catch (error) {
    console.error('[jobs/accept error]', error);
    return NextResponse.json({ success: false, error: 'Failed to accept job' }, { status: 500 });
  }
}
