import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id && id !== 'latest') {
      const { data } = await supabaseAdmin
        .from('bookings')
        .select('status, worker_id')
        .eq('id', id)
        .single();

      return NextResponse.json({ success: true, data: data || { status: 'pending' } });
    }

    // Get latest booking
    const { data } = await supabaseAdmin
      .from('bookings')
      .select('id, status, worker_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ success: true, data: data || { status: 'pending' } });
  } catch {
    return NextResponse.json({ success: true, data: { status: 'pending' } });
  }
}
