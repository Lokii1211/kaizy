import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, findNearbyWorkers, calculateJobPricing } from '@/lib/supabase';
import { createNotification } from '@/lib/push-server';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimits, getClientIP } from '@/lib/rateLimit';

// ═══════════════════════════════════════
// POST /api/jobs/create
// Create real job → find workers → dispatch alerts
// Rapido-style 45-second countdown
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 job creations per minute per IP
    const ip = getClientIP(req.headers);
    const rl = rateLimits.jobCreate(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const body = await req.json();
    const { trade, problemType, lat, lng, address, description, isEmergency } = body;
    let { hirerId } = body;

    if (!trade || !lat || !lng) {
      return NextResponse.json({ success: false, error: 'Trade, latitude, longitude required' }, { status: 400 });
    }

    // Resolve hirerId: prefer body, fallback to authenticated user
    if (!hirerId) {
      const jwtPayload = await getUserFromRequest(req.cookies);
      if (jwtPayload) {
        hirerId = jwtPayload.sub;
      }
    }

    // Calculate pricing
    const pricing = await calculateJobPricing(trade, problemType || 'general', 0, isEmergency);

    // Create job in database
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        hirer_id: hirerId || null,
        trade: trade.toLowerCase(),
        problem_type: problemType || 'general',
        description: description || '',
        latitude: lat,
        longitude: lng,
        address: address || 'Location detected via GPS',
        urgency: isEmergency ? 'emergency' : 'normal',
        job_type: isEmergency ? 'emergency' : 'instant',
        estimated_price: pricing.workerCharge,
        status: 'searching',
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('[job create error]', jobError);
      return NextResponse.json({ success: false, error: 'Failed to create job' }, { status: 500 });
    }

    // Find nearby workers (wider radius for emergencies)
    const searchRadius = isEmergency ? 15 : 5;
    const workers = await findNearbyWorkers(trade, lat, lng, searchRadius, isEmergency ? 10 : 5);

    if (workers.length === 0) {
      await supabaseAdmin.from('jobs').update({ status: 'no_workers' }).eq('id', job.id);
      return NextResponse.json({
        success: true,
        data: {
          jobId: job.id,
          status: 'no_workers',
          workersNotified: 0,
          pricing,
          message: 'No workers available nearby. Try again in a few minutes.',
        },
      });
    }

    // Step 1: Create dispatch_session (required by job_alerts FK)
    const sessionExpiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
    let hirerName = '';
    if (hirerId) {
      const { data: hirerUser } = await supabaseAdmin.from('users').select('name').eq('id', hirerId).single();
      hirerName = hirerUser?.name || '';
    }
    await supabaseAdmin.from('dispatch_sessions').upsert({
      job_id: job.id,
      trade: trade.toLowerCase(),
      urgency: isEmergency ? 'emergency' : 'normal',
      estimated_price: pricing.workerCharge,
      hirer_lat: lat,
      hirer_lng: lng,
      hirer_name: hirerName,
      address: address || '',
      round: 1,
      price_bump: 0,
      status: 'searching',
      accepted_by: null,
      created_at: new Date().toISOString(),
      expires_at: sessionExpiresAt,
    }, { onConflict: 'job_id' });

    // Step 2: Insert job_alerts with correct column names (round, not dispatch_round)
    const expiresAt = new Date(Date.now() + 45000).toISOString();
    const { data: insertedAlerts } = await supabaseAdmin
      .from('job_alerts')
      .insert(workers.map((w) => ({
        job_id: job.id,
        worker_id: w.id,
        status: 'pending' as const,
        round: 1,
        expires_at: expiresAt,
      })))
      .select('id, worker_id');

    const alertIdMap: Record<string, string> = {};
    for (const a of insertedAlerts || []) {
      alertIdMap[a.worker_id] = a.id;
    }

    // Step 3: Send push notification to each worker (include alertId so they can accept from notification)
    for (const w of workers) {
      await createNotification(
        w.id,
        'JOB_ALERT',
        `${isEmergency ? '🆘 EMERGENCY' : '🔔 New Job'} · ₹${pricing.workerCharge}`,
        `${trade} · ${w.distance}km away · ${problemType || 'General help'}`,
        { jobId: job.id, alertId: alertIdMap[w.id], trade, distance: w.distance, earnings: pricing.workerCharge }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: 'searching',
        workersNotified: workers.length,
        pricing,
        expiresAt,
        workers: workers.map(w => ({
          id: w.id, name: w.users?.name, distance: w.distance,
          rating: Number(w.avg_rating), eta: w.eta,
        })),
        message: `${workers.length} workers notified. They have 45 seconds to respond.`,
      },
    });
  } catch (error) {
    console.error('[jobs/create error]', error);
    return NextResponse.json({ success: false, error: 'Failed to create job' }, { status: 500 });
  }
}
