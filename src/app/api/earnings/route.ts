import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// ═══════════════════════════════════════════════════════
// GET /api/earnings?period=today|week|month
// Worker's real payout history from completed bookings.
// Returns: per-job entries + aggregate stats + streak + tier + 7-day chart
// Auth: JWT required (workerId from cookie, never from query)
// ═══════════════════════════════════════════════════════

const COMMISSION_RATE = 0.13; // 13% platform commission
const PLATFORM_MIN   = 5;     // minimum ₹5 per job

function calcNetEarning(totalAmount: number): number {
  const commission = Math.max(PLATFORM_MIN, Math.round(totalAmount * COMMISSION_RATE));
  return Math.max(0, totalAmount - commission);
}

function calcTier(kaizyScore: number, totalJobs: number): { tier: string; color: string; nextTier: string; jobsToNext: number; scoreToNext: number } {
  if (kaizyScore >= 800 && totalJobs >= 100) return { tier: "KaizyPro", color: "#FF6B00", nextTier: "Max", jobsToNext: 0, scoreToNext: 0 };
  if (kaizyScore >= 600 && totalJobs >= 50)  return { tier: "Elite",    color: "#8B5CF6", nextTier: "KaizyPro", jobsToNext: Math.max(0, 100 - totalJobs), scoreToNext: Math.max(0, 800 - kaizyScore) };
  if (kaizyScore >= 400 && totalJobs >= 10)  return { tier: "Trusted",  color: "#3B82F6", nextTier: "Elite",    jobsToNext: Math.max(0, 50  - totalJobs), scoreToNext: Math.max(0, 600 - kaizyScore) };
  return { tier: "Active", color: "#22C55E", nextTier: "Trusted", jobsToNext: Math.max(0, 10 - totalJobs), scoreToNext: Math.max(0, 400 - kaizyScore) };
}

function calcStreak(completedDates: string[]): number {
  // completedDates: ISO date strings of completed jobs (any time of day)
  const daySet = new Set(completedDates.map(d => d.split('T')[0]));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (daySet.has(key)) {
      if (i === 0 || streak > 0) streak++; // today counts even if not started; only continue if already a streak
    } else {
      if (i === 0) continue; // today not worked yet — check yesterday
      break;
    }
  }
  return streak;
}

function buildWeeklyChart(completedBookings: { completed_at: string; net_amount: number }[]): { day: string; amount: number; date: string }[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chart: { day: string; amount: number; date: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const amount = completedBookings
      .filter(b => b.completed_at && b.completed_at.split('T')[0] === dateKey)
      .reduce((sum, b) => sum + b.net_amount, 0);
    chart.push({ day: days[d.getDay()], amount: Math.round(amount), date: dateKey });
  }
  return chart;
}

export async function GET(req: NextRequest) {
  try {
    const jwt = await getUserFromRequest(req.cookies);
    if (!jwt?.sub) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';

    const now = new Date();
    let startDate: Date;
    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const supabase = getSupabase();

    // Fetch completed bookings for this worker in the period
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id, total_amount, net_to_worker, hirer_price,
        created_at, completed_at, status,
        job_id, hirer_id,
        jobs(trade, description),
        users!bookings_hirer_id_fkey(name)
      `)
      .eq('worker_id', jwt.sub)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    // Fetch all completed dates for streak (last 30 days regardless of period)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const { data: streakBookings } = await supabase
      .from('bookings')
      .select('completed_at')
      .eq('worker_id', jwt.sub)
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('completed_at', 'is', null);

    // Fetch worker profile stats
    const { data: workerProfile } = await supabase
      .from('worker_profiles')
      .select('kaizy_score, avg_rating, total_jobs')
      .eq('id', jwt.sub)
      .single();

    const kaizyScore = workerProfile?.kaizy_score || 300;
    const avgRating = workerProfile?.avg_rating || 0;
    const totalJobsAll = workerProfile?.total_jobs || 0;

    // Fetch last 7 days for chart (always 7 days regardless of period)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { data: chartBookings } = await supabase
      .from('bookings')
      .select('completed_at, total_amount, net_to_worker')
      .eq('worker_id', jwt.sub)
      .eq('status', 'completed')
      .gte('created_at', sevenDaysAgo.toISOString())
      .not('completed_at', 'is', null);

    // Build earnings entries for the period
    const entries = (bookings || []).map((b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = b as any;
      const grossAmount = Number(b.total_amount || b.hirer_price || 0);
      const netAmount = Number(b.net_to_worker || calcNetEarning(grossAmount));
      const trade = raw.jobs?.trade || '';
      const hirerName = raw.users?.name || 'Customer';

      return {
        id: b.id,
        booking_id: b.id,
        amount: netAmount,
        gross_amount: grossAmount,
        type: 'job_payment',
        status: 'credited',
        created_at: b.created_at,
        completed_at: b.completed_at,
        hirer_name: hirerName,
        trade,
      };
    });

    const totalEarnings = entries.reduce((sum, e) => sum + e.amount, 0);
    const totalJobs = entries.length;

    // Streak calculation
    const streakDates = (streakBookings || [])
      .map(b => b.completed_at || '')
      .filter(Boolean);
    const streak = calcStreak(streakDates);

    // Tier calculation
    const tierInfo = calcTier(kaizyScore, totalJobsAll);

    // Weekly chart
    const chartData = (chartBookings || []).map(b => ({
      completed_at: b.completed_at || '',
      net_amount: Number(b.net_to_worker || calcNetEarning(Number(b.total_amount || 0))),
    }));
    const weeklyChart = buildWeeklyChart(chartData);

    return NextResponse.json({
      success: true,
      data: entries,
      // Aggregate stats for dashboard widgets
      totalEarnings: Math.round(totalEarnings),
      totalJobs,
      avgRating: Number(avgRating.toFixed(1)),
      kaizyScore,
      streak,
      tier: tierInfo.tier,
      tierColor: tierInfo.color,
      nextTier: tierInfo.nextTier,
      jobsToNextTier: tierInfo.jobsToNext,
      scoreToNextTier: tierInfo.scoreToNext,
      weeklyChart,
      totalJobsAll,
    });
  } catch (error) {
    console.error('[earnings]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch earnings' }, { status: 500 });
  }
}
