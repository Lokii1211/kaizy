import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/notifications — Fetch notifications for authenticated user only
// PATCH /api/notifications — Mark authenticated user's notifications as read

export async function GET(req: NextRequest) {
  try {
    const jwt = await getUserFromRequest(req.cookies);
    if (!jwt?.sub) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 50;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', jwt.sub)
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
    if (!jwt?.sub) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabase();
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', jwt.sub)
      .eq('is_read', false);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[mark-read error]', error);
    return NextResponse.json({ success: false });
  }
}
