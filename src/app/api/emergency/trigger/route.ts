import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, findNearbyWorkers, calculateJobPricing, createNotification } from '@/lib/supabase';

// ═══════════════════════════════════════
// POST /api/emergency/trigger
// Real emergency dispatch — wider radius, more workers
// ═══════════════════════════════════════

const PROBLEM_TO_TRADE: Record<string, string> = {
  vehicle_breakdown: 'mechanic',
  tyre_puncture: 'mechanic',
  pipe_burst: 'plumber',
  power_failure: 'electrician',
  ac_emergency: 'ac_repair',
  lock_broken: 'carpenter',
  general: 'electrician',
};

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, problemType, userId, description } = await req.json();

    if (!lat || !lng) {
      return NextResponse.json({ success: false, error: 'Location required for emergency' }, { status: 400 });
    }

    const trade = PROBLEM_TO_TRADE[problemType] || 'mechanic';

    // Emergency pricing (1.8x multiplier)
    const pricing = await calculateJobPricing(trade, problemType || 'general', 0, true);

    // Create emergency job
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .insert({
        hirer_id: userId || null,
        trade,
        problem_type: problemType || 'general',
        description: description || 'EMERGENCY request',
        latitude: lat,
        longitude: lng,
        urgency: 'emergency',
        job_type: 'emergency',
        estimated_price: pricing.workerCharge,
        status: 'searching',
      })
      .select()
      .single();

    if (error || !job) {
      return NextResponse.json({ success: false, error: 'Failed to create emergency job' }, { status: 500 });
    }

    // Find workers in 15km radius (3x normal)
    const workers = await findNearbyWorkers(trade, lat, lng, 15, 10);

    if (workers.length === 0) {
      // Try ALL trades within 10km as fallback
      const allWorkers = await findNearbyWorkers('', lat, lng, 10, 5);
      if (allWorkers.length === 0) {
        await supabaseAdmin.from('jobs').update({ status: 'no_workers' }).eq('id', job.id);
        return NextResponse.json({
          success: false,
          data: { jobId: job.id, status: 'no_workers' },
          message: 'No workers available. Please call local emergency services.',
        });
      }
    }

    // Send alerts to all found workers
    const expiresAt = new Date(Date.now() + 45000).toISOString();
    const alerts = workers.map(w => ({
      job_id: job.id,
      worker_id: w.id,
      dispatch_round: 1,
      estimated_earnings: pricing.workerCharge,
      distance_km: w.distance,
      expires_at: expiresAt,
    }));

    await supabaseAdmin.from('job_alerts').insert(alerts);

    // Send URGENT notifications
    for (const w of workers) {
      await createNotification(
        w.id,
        'EMERGENCY_ALERT',
        `🆘 EMERGENCY · ₹${pricing.workerCharge} · ${w.distance}km`,
        `${problemType || 'Emergency help'} needed NOW! 45 seconds to respond.`,
        { jobId: job.id, emergency: true, earnings: pricing.workerCharge }
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
        message: `EMERGENCY: ${workers.length} workers alerted. Help is on the way.`,
      },
    });
  } catch (error) {
    console.error('[emergency/trigger error]', error);
    return NextResponse.json({ success: false, error: 'Emergency dispatch failed' }, { status: 500 });
  }
}
