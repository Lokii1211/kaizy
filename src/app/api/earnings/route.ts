import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/earnings — Worker's own earnings only (JWT required)
export async function GET(req: NextRequest) {
  try {
    const jwt = await getUserFromRequest(req.cookies);
    if (!jwt?.sub) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
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
    const { data } = await supabase
      .from('earnings')
      .select('*')
      .eq('worker_id', jwt.sub)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    return NextResponse.json({ success: true, data: data || [] });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch earnings' }, { status: 500 });
  }
}
