import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, findNearbyWorkers } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// ═══════════════════════════════════════════════════════
// POST /api/sos
// SOS BOOKING — Find nearest workers, create job, alert them
// This is the RAPIDO-style instant booking
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const jwt = await getUserFromRequest(req.cookies);
    if (!jwt) {
      return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });
    }

    const {
      trade,
      problemType,
      description,
      latitude,
      longitude,
      address,
      landmark,
      photos = [],
    } = await req.json();

    if (!trade) {
      return NextResponse.json({ success: false, error: 'Trade is required' }, { status: 400 });
    }

    const lat = latitude || 11.0168;
    const lng = longitude || 76.9558;

    // ── 1. Create job record ──
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        hirer_id: jwt.sub,
        trade,
        problem_type: problemType || 'general',
        description: description || '',
        latitude: lat,
        longitude: lng,
        address: address || '',
        landmark: landmark || '',
        job_type: 'sos',
        urgency: 'emergency',
        status: 'searching',
        photos,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('[sos] job creation failed:', jobError);
      return NextResponse.json({ success: false, error: 'Failed to create job' }, { status: 500 });
    }

    // ── 2. Find nearest 10 workers ──
    const nearbyWorkers = await findNearbyWorkers(trade, lat, lng, 15, 10);

    if (nearbyWorkers.length === 0) {
      // Update job status
      await supabaseAdmin.from('jobs').update({ status: 'no_workers' }).eq('id', job.id);

      return NextResponse.json({
        success: true,
        data: {
          jobId: job.id,
          status: 'no_workers',
          workersFound: 0,
          message: 'No workers available right now. Try posting a job for later.',
        },
      });
    }

    // ── 3. Create job_alerts for each worker ──
    const alerts = nearbyWorkers.map(w => ({
      job_id: job.id,
      worker_id: w.id,
      status: 'sent',
      expires_at: new Date(Date.now() + 45 * 1000).toISOString(), // 45-second timeout
    }));

    const { error: alertError } = await supabaseAdmin
      .from('job_alerts')
      .insert(alerts);

    if (alertError) {
      console.error('[sos] alert creation failed:', alertError);
    }

    // ── 4. Create notifications for each worker ──
    const notifications = nearbyWorkers.map(w => ({
      user_id: w.id,
      type: 'sos_job',
      title: `🆘 Emergency ${trade.replace('_', ' ')} job nearby!`,
      body: `${address || 'Nearby location'} · ₹49 visit charge`,
      data: {
        jobId: job.id,
        trade,
        problemType: problemType || 'general',
        latitude: lat,
        longitude: lng,
        distance: w.distance,
      },
    }));

    await supabaseAdmin.from('notifications').insert(notifications);

    // ── 5. TODO: Send FCM push notifications ──
    // This requires Firebase Admin SDK + worker FCM tokens
    // For now, workers see alerts via polling/realtime

    // ── 6. Update job status ──
    await supabaseAdmin
      .from('jobs')
      .update({ status: 'alerting' })
      .eq('id', job.id);

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: 'alerting',
        workersAlerted: nearbyWorkers.length,
        nearestWorker: {
          name: nearbyWorkers[0].users?.name || 'Worker',
          distance: nearbyWorkers[0].distance,
          eta: nearbyWorkers[0].eta,
          rating: Number(nearbyWorkers[0].avg_rating),
        },
        expiresAt: new Date(Date.now() + 45 * 1000).toISOString(),
        message: `${nearbyWorkers.length} workers alerted. First response expected in ~${nearbyWorkers[0].eta} minutes.`,
      },
    });
  } catch (error) {
    console.error('[sos] error:', error);
    return NextResponse.json({ success: false, error: 'SOS booking failed' }, { status: 500 });
  }
}

// ── GET: Check SOS job status ──
export async function GET(req: NextRequest) {
  try {
    const jobId = req.nextUrl.searchParams.get('jobId');
    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId required' }, { status: 400 });
    }

    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Check if any worker accepted
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*, worker:users!bookings_worker_id_fkey(id, name, phone, profile_photo)')
      .eq('job_id', jobId)
      .neq('status', 'cancelled')
      .single();

    // Check alerts status
    const { data: alerts } = await supabaseAdmin
      .from('job_alerts')
      .select('id, worker_id, status')
      .eq('job_id', jobId);

    const accepted = alerts?.filter(a => a.status === 'accepted').length || 0;
    const pending = alerts?.filter(a => a.status === 'sent').length || 0;
    const expired = alerts?.filter(a => a.status === 'expired').length || 0;

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        jobStatus: job.status,
        booking: booking ? {
          bookingId: booking.id,
          status: booking.status,
          otp: booking.otp,
          worker: booking.worker,
          visitCharge: booking.visit_charge,
        } : null,
        alerts: { total: alerts?.length || 0, accepted, pending, expired },
      },
    });
  } catch (error) {
    console.error('[sos/status] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to check status' }, { status: 500 });
  }
}
