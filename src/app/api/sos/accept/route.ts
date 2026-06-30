import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// ═══════════════════════════════════════════════════════
// POST /api/sos/accept
// Worker accepts an SOS job alert
// Uses atomic DB function to prevent race conditions
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const jwt = await getUserFromRequest(req.cookies);
    if (!jwt) {
      return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });
    }

    const { alertId, jobId } = await req.json();

    if (!alertId && !jobId) {
      return NextResponse.json({ success: false, error: 'alertId or jobId required' }, { status: 400 });
    }

    // If alertId provided, use atomic function
    if (alertId) {
      const { data, error } = await supabaseAdmin.rpc('accept_job_atomic', {
        p_alert_id: alertId,
        p_worker_id: jwt.sub,
      });

      if (error) {
        console.error('[sos/accept] rpc error:', error);
        // Fallback: manual accept
        return await manualAccept(jwt.sub, jobId || alertId);
      }

      if (!data?.success) {
        return NextResponse.json({
          success: false,
          error: data?.reason === 'already_booked'
            ? 'Another worker already accepted this job'
            : 'This alert has expired',
        }, { status: 409 });
      }

      return NextResponse.json({
        success: true,
        data: {
          bookingId: data.booking_id,
          jobId: data.job_id,
          otp: data.otp,
          message: 'Job accepted! Navigate to the hirer location.',
        },
      });
    }

    // Fallback: manual accept with jobId
    return await manualAccept(jwt.sub, jobId);
  } catch (error) {
    console.error('[sos/accept] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to accept job' }, { status: 500 });
  }
}

async function manualAccept(workerId: string, jobId: string) {
  // Check if job is still available
  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!job || job.status === 'booked') {
    return NextResponse.json({ success: false, error: 'Job already taken' }, { status: 409 });
  }

  // Check if booking already exists
  const { data: existing } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('job_id', jobId)
    .neq('status', 'cancelled')
    .single();

  if (existing) {
    return NextResponse.json({ success: false, error: 'Job already booked' }, { status: 409 });
  }

  // Generate 4-digit OTP
  const otp = String(Math.floor(1000 + Math.random() * 9000));

  // Create booking
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      job_id: jobId,
      hirer_id: job.hirer_id,
      worker_id: workerId,
      status: 'accepted',
      otp,
      visit_charge: 49,
      platform_fee: 5,
    })
    .select()
    .single();

  if (error || !booking) {
    return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 });
  }

  // Update job status
  await supabaseAdmin.from('jobs').update({ status: 'booked' }).eq('id', jobId);

  // Expire all alerts for this job
  await supabaseAdmin
    .from('job_alerts')
    .update({ status: 'expired' })
    .eq('job_id', jobId)
    .eq('status', 'sent');

  // Notify hirer
  await supabaseAdmin.from('notifications').insert({
    user_id: job.hirer_id,
    type: 'worker_accepted',
    title: '✅ Worker accepted your job!',
    body: 'A worker is on the way. Share the OTP when they arrive.',
    data: { bookingId: booking.id, jobId, otp },
  });

  return NextResponse.json({
    success: true,
    data: {
      bookingId: booking.id,
      jobId,
      otp,
      message: 'Job accepted! Navigate to the hirer.',
    },
  });
}
