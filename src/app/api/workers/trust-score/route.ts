import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// GET /api/workers/trust-score
// Bible ref: Challenges Bible → SOLUTION 8
// Trust Score = Rating(40%) + Verification(30%) + Disputes(20%) + Tenure(10%)
// ═══════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const workerId = url.searchParams.get('workerId');

    if (!workerId) {
      return NextResponse.json({ success: false, error: 'workerId required' }, { status: 400 });
    }

    // Fetch worker data
    const { data: worker } = await supabaseAdmin
      .from('worker_profiles')
      .select('*')
      .eq('id', workerId)
      .single();

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .eq('id', workerId)
      .single();

    // Fetch dispute count against this worker
    const { count: disputeCount } = await supabaseAdmin
      .from('disputes')
      .select('*', { count: 'exact', head: true })
      .eq('worker_id', workerId)
      .eq('status', 'resolved_against_worker');

    if (!worker) {
      return NextResponse.json({ success: false, error: 'Worker not found' }, { status: 404 });
    }

    // ─── CALCULATIONS ───

    // 1. Rating Score (40%) — 5.0 = 100%, 4.0 = 80%, etc.
    const avgRating = Number(worker.avg_rating) || 0;
    const ratingScore = Math.min(100, (avgRating / 5) * 100);

    // 2. Verification Score (30%)
    // Level 0 = 0%, Level 1 = 40%, Level 2 = 70%, Level 3 = 100%
    const verificationLevel = Number(worker.verification_level) || 0;
    const verificationScores: Record<number, number> = { 0: 0, 1: 40, 2: 70, 3: 100 };
    const verificationScore = verificationScores[verificationLevel] || 0;

    // 3. Dispute Score (20%) — 0 disputes = 100%, each dispute -20%
    const disputes = Number(disputeCount) || 0;
    const disputeScore = Math.max(0, 100 - disputes * 20);

    // 4. Tenure Score (10%) — 0 days = 0%, 30+ days = 50%, 90+ days = 80%, 180+ = 100%
    const createdAt = user?.created_at ? new Date(user.created_at) : new Date();
    const daysOnPlatform = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
    let tenureScore = 0;
    if (daysOnPlatform >= 180) tenureScore = 100;
    else if (daysOnPlatform >= 90) tenureScore = 80;
    else if (daysOnPlatform >= 30) tenureScore = 50;
    else if (daysOnPlatform >= 7) tenureScore = 25;
    else tenureScore = 10;

    // ─── FINAL SCORE ───
    const trustScore = Math.round(
      ratingScore * 0.4 +
      verificationScore * 0.3 +
      disputeScore * 0.2 +
      tenureScore * 0.1
    );

    // ─── TRUST TIER ───
    let tier = 'New';
    let tierEmoji = '🆕';
    if (trustScore >= 90) { tier = 'Diamond'; tierEmoji = '💎'; }
    else if (trustScore >= 80) { tier = 'Gold'; tierEmoji = '🥇'; }
    else if (trustScore >= 70) { tier = 'Silver'; tierEmoji = '🥈'; }
    else if (trustScore >= 50) { tier = 'Bronze'; tierEmoji = '🥉'; }

    // ─── RESTRICTIONS ───
    let restriction = null;
    if (trustScore < 50) restriction = 'Account under review';
    else if (trustScore < 60) restriction = 'Restricted to daytime jobs only';
    else if (trustScore < 70) restriction = 'Night jobs require extra verification';

    return NextResponse.json({
      success: true,
      data: {
        workerId,
        trustScore,
        tier,
        tierEmoji,
        restriction,
        breakdown: {
          rating: { score: Math.round(ratingScore), weight: '40%', value: avgRating.toFixed(1) },
          verification: { score: Math.round(verificationScore), weight: '30%', level: verificationLevel },
          disputes: { score: Math.round(disputeScore), weight: '20%', count: disputes },
          tenure: { score: Math.round(tenureScore), weight: '10%', days: daysOnPlatform },
        },
        jobsCompleted: Number(worker.total_jobs) || 0,
        cancellationCount: Number(worker.cancellation_count) || 0,
        daysOnPlatform,
      },
    });
  } catch (error) {
    console.error('[trust-score error]', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate' }, { status: 500 });
  }
}
