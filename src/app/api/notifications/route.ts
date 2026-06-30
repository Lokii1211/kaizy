import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// ═══════════════════════════════════════
// GET /api/notifications — Fetch notifications for user
// PATCH /api/notifications — Mark user's notifications as read
// ═══════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 50;
    let userId = searchParams.get('userId');

    if (!userId) {
      const jwt = await getUserFromRequest(req.cookies);
      userId = jwt?.sub || null;
    }

    if (!userId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[notifications error]', error);
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('[notifications error]', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const jwt = await getUserFromRequest(req.cookies);
    const userId = jwt?.sub;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[mark-read error]', error);
    return NextResponse.json({ success: false });
  }
}
