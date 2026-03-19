import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Read user ID from auth token cookie
    const token = req.cookies.get('kaizy_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Decode the JWT to get user info (simple base64 decode)
    let userId: string | null = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId || payload.sub;
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No user ID in token' }, { status: 401 });
    }

    // Fetch user data
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // If worker, also fetch worker profile
    let workerData = null;
    if (user.user_type === 'worker') {
      const { data } = await supabaseAdmin
        .from('worker_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      workerData = data;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        user_type: user.user_type,
        city: user.city,
        trade: workerData?.trade_primary,
        experience_years: workerData?.experience_years,
        avg_rating: workerData?.avg_rating || user.avg_rating,
        total_jobs: workerData?.total_jobs || user.total_jobs || 0,
        kaizy_score: workerData?.kaizy_score || 0,
        aadhaar_verified: user.aadhaar_verified || false,
        bio: workerData?.bio || '',
      },
    });
  } catch (error) {
    console.error('[auth/me error]', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
