import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, findNearbyWorkers, calculateJobPricing, createNotification } from '@/lib/supabase';

// ═══════════════════════════════════════
// POST /api/jobs/create
// Create real job → find workers → dispatch alerts
// Rapido-style 45-second countdown
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trade, problemType, lat, lng, address, description, isEmergency, hirerId } = body;

    if (!trade || !lat || !lng) {
      return NextResponse.json({ success: false, error: 'Trade, latitude, longitude required' }, { status: 400 });
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

    // Create job alerts for each worker (45-second window)
    const expiresAt = new Date(Date.now() + 45000).toISOString();
    const alerts = workers.map((w) => ({
      job_id: job.id,
      worker_id: w.id,
      dispatch_round: 1,
      estimated_earnings: pricing.workerCharge,
      distance_km: w.distance,
      status: 'sent' as const,
      expires_at: expiresAt,
    }));

    await supabaseAdmin.from('job_alerts').insert(alerts);

    // Send notification to each worker
    for (const w of workers) {
      await createNotification(
        w.id,
        'JOB_ALERT',
        `${isEmergency ? '🆘 EMERGENCY' : '🔔 New Job'} · ₹${pricing.workerCharge}`,
        `${trade} · ${w.distance}km away · ${problemType || 'General help'}`,
        { jobId: job.id, trade, distance: w.distance, earnings: pricing.workerCharge }
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
