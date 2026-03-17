import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyJWT } from '../verify-otp/route';

// ═══════════════════════════════════════
// GET /api/auth/me — Get current user
// ═══════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('kaizy_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', payload.sub)
      .single();

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let workerProfile = null;
    if (user.user_type === 'worker') {
      const { data } = await supabaseAdmin
        .from('worker_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      workerProfile = data;
    }

    return NextResponse.json({
      success: true,
      user: { ...user, workerProfile },
    });
  } catch (error) {
    console.error('[auth/me error]', error);
    return NextResponse.json({ success: false, error: 'Auth check failed' }, { status: 500 });
  }
}
