import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// POST /api/workers/toggle
// Toggle worker online/offline + update GPS
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const { workerId, isOnline, latitude, longitude } = await req.json();

    if (!workerId) {
      return NextResponse.json({ success: false, error: 'workerId required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      is_online: isOnline,
      updated_at: new Date().toISOString(),
    };

    if (isOnline && latitude && longitude) {
      updateData.latitude = latitude;
      updateData.longitude = longitude;
      updateData.last_online_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('worker_profiles')
      .update(updateData)
      .eq('id', workerId);

    if (error) {
      console.error('[toggle error]', error);
      return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 });
    }

    // Get online count for response
    const { count } = await supabaseAdmin
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

// GET — Get online worker count
export async function GET() {
  try {
    const { count } = await supabaseAdmin
      .from('worker_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_online', true);

    return NextResponse.json({ success: true, data: { onlineCount: count || 0 } });
  } catch {
    return NextResponse.json({ success: false, data: { onlineCount: 0 } });
  }
}
