import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// ═══════════════════════════════════════
// POST /api/notifications/subscribe — Store/clear a user's web push subscription
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const jwt = await getUserFromRequest(req.cookies);
    if (!jwt?.sub) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const userId = jwt.sub;

    const body = await req.json();

    // Unsubscribe: clear the stored token
    if (body?.action === 'unsubscribe') {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ fcm_token: null })
        .eq('id', userId);

      if (error) {
        console.error('[notifications/subscribe unsubscribe error]', error);
        return NextResponse.json({ success: false, error: 'Failed to clear subscription' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Unsubscribed' });
    }

    // Subscribe: expect a PushSubscription-shaped object { endpoint, keys: { p256dh, auth } }
    if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
      return NextResponse.json({ success: false, error: 'Invalid push subscription' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ fcm_token: JSON.stringify(body) })
      .eq('id', userId);

    if (error) {
      console.error('[notifications/subscribe error]', error);
      return NextResponse.json({ success: false, error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Subscribed' });
  } catch (error) {
    console.error('[notifications/subscribe error]', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
