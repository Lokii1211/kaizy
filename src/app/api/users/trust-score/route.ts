import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// GET /api/users/trust-score
// Hirer Trust Score for worker-side display
// Bible ref: Challenges Bible → SOLUTION 8
// Payment history(40%) + Worker ratings(40%) + Cancellation rate(20%)
// ═══════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
    }

    // Fetch user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('created_at, name')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Bookings stats
    const { count: totalBookings } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('hirer_id', userId);

    const { count: completedBookings } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('hirer_id', userId)
      .eq('status', 'completed');

    const { count: cancelledBookings } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('hirer_id', userId)
      .eq('status', 'cancelled')
      .eq('cancelled_by', 'hirer');

    // Payment disputes
    const { count: disputes } = await supabaseAdmin
      .from('disputes')
      .select('*', { count: 'exact', head: true })
      .eq('hirer_id', userId);

    const total = Number(totalBookings) || 0;
    const completed = Number(completedBookings) || 0;
    const cancelled = Number(cancelledBookings) || 0;
    const disputeCount = Number(disputes) || 0;

    // 1. Payment Score (40%) — based on completed vs disputed
    const paymentScore = total > 0
      ? Math.max(0, 100 - (disputeCount / total) * 100 * 5)
      : 80; // default for new users

    // 2. Completion Rate Score (40%) — how many bookings completed
    const completionScore = total > 0
      ? Math.min(100, (completed / total) * 100)
      : 80;

    // 3. Cancellation Score (20%) — lower is better
    const cancellationRate = total > 0 ? cancelled / total : 0;
    const cancellationScore = Math.max(0, 100 - cancellationRate * 200);

    // Final score
    const trustScore = Math.round(
      paymentScore * 0.4 +
      completionScore * 0.4 +
      cancellationScore * 0.2
    );

    // Restrictions
    let restriction = null;
    if (trustScore < 50) restriction = 'Account under review - restricted to daytime bookings';
    else if (trustScore < 60) restriction = 'Workers see low trust warning';
    else if (trustScore < 70) restriction = 'Night bookings require deposit';

    // Badge
    let badge = '🆕 New';
    if (total >= 50 && trustScore >= 90) badge = '💎 Trusted';
    else if (total >= 20 && trustScore >= 80) badge = '⭐ Verified';
    else if (total >= 5) badge = '✓ Active';

    return NextResponse.json({
      success: true,
      data: {
        userId,
        name: user.name,
        trustScore,
        badge,
        restriction,
        breakdown: {
          payment: { score: Math.round(paymentScore), weight: '40%', disputes: disputeCount },
          completion: { score: Math.round(completionScore), weight: '40%', rate: total > 0 ? `${Math.round((completed / total) * 100)}%` : 'N/A' },
          cancellation: { score: Math.round(cancellationScore), weight: '20%', rate: total > 0 ? `${Math.round(cancellationRate * 100)}%` : '0%' },
        },
        stats: {
          totalBookings: total,
          completed,
          cancelled,
          disputes: disputeCount,
        },
      },
    });
  } catch (error) {
    console.error('[hirer trust-score error]', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate' }, { status: 500 });
  }
}
