import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/workers/me/rank — Return the authenticated worker's leaderboard rank
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.cookies);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (user.userType !== 'worker') return NextResponse.json({ success: false, error: 'Workers only' }, { status: 403 });

    const supabase = getSupabase();
    const workerId = user.sub;

    // Get this worker's kaizy_score
    const { data: me } = await supabase
      .from('worker_profiles')
      .select('kaizy_score')
      .eq('id', workerId)
      .single();

    const myScore = me?.kaizy_score || 0;

    // Count workers with higher kaizy_score to determine rank
    const { count } = await supabase
      .from('worker_profiles')
      .select('*', { count: 'exact', head: true })
      .gt('kaizy_score', myScore);

    const rank = (count || 0) + 1;

    return NextResponse.json({ success: true, data: { rank, score: myScore } });
  } catch (e) {
    console.error('[worker rank error]', e);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
