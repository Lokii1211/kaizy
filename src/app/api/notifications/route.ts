import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// GET /api/notifications — Fetch notifications
// PATCH /api/notifications — Mark all as read
// ═══════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 50;
    const userId = searchParams.get('userId');

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

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

export async function PATCH() {
  try {
    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[mark-read error]', error);
    return NextResponse.json({ success: false });
  }
}
