import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyJWT } from '@/lib/auth';

// ═══════════════════════════════════════════════════════
// POST /api/auth/logout
// Clears session cookies and invalidates push tokens
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('kaizy_token')?.value;

    if (token) {
      const payload = await verifyJWT(token);
      if (payload?.sub) {
        try {
          const supabase = getSupabase();
          await supabase
            .from('users')
            .update({ fcm_token: null, updated_at: new Date().toISOString() })
            .eq('id', payload.sub);
        } catch (e) {
          console.error('[logout fcm_token clear error]', e);
        }
      }
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

    // Clear session cookies
    response.cookies.delete('kaizy_token');
    response.cookies.delete('kaizy_role');

    // Also set maxAge 0 to be thoroughly compatible
    response.cookies.set('kaizy_token', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
    });
    response.cookies.set('kaizy_role', '', {
      path: '/',
      maxAge: 0,
      httpOnly: false,
    });

    return response;
  } catch (error) {
    console.error('[POST /api/auth/logout error]', error);
    const response = NextResponse.json({ success: true });
    response.cookies.delete('kaizy_token');
    response.cookies.delete('kaizy_role');
    return response;
  }
}
