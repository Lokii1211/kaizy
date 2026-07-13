import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/workers/toggle — Toggle worker online/offline + update GPS
// workerId always comes from the JWT — never from request body
export async function POST(req: NextRequest) {
  try {
    const jwt = await getUserFromRequest(req.cookies);
    if (!jwt?.sub) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    if (jwt.userType !== 'worker') {
      return NextResponse.json({ success: false, error: 'Only workers can toggle availability' }, { status: 403 });
    }

    const body = await req.json();
    const { isOnline, latitude, longitude } = body;

    const updateData: Record<string, unknown> = {
      is_online: isOnline,
      updated_at: new Date().toISOString(),
    };

    if (isOnline && latitude && longitude) {
      updateData.latitude = latitude;
      updateData.longitude = longitude;
      updateData.last_online_at = new Date().toISOString();
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('worker_profiles')
      .update(updateData)
      .eq('id', jwt.sub);

    if (error) {
      console.error('[toggle error]', error);
      return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 });
    }

    const { count } = await supabase
      .from('worker_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_online', true);

    return NextResponse.json({
      success: true,
      data: {
        isOnline,
        onlineCount: count || 0,
        message: isOnline ? 'You are now online! Jobs will be sent to you.' : 'You are offline.',
      },
    });
  } catch (error) {
    console.error('[workers/toggle error]', error);
    return NextResponse.json({ success: false, error: 'Failed to toggle status' }, { status: 500 });
  }
}

// GET — Get online worker count (public, no auth needed)
export async function GET() {
  try {
    const supabase = getSupabase();
    const { count } = await supabase
      .from('worker_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_online', true);

    return NextResponse.json({ success: true, data: { onlineCount: count || 0 } });
  } catch {
    return NextResponse.json({ success: false, data: { onlineCount: 0 } });
  }
}
