import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// GET /api/bookings — Fetch user's bookings
// ═══════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 10;

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*, jobs(trade, description)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[bookings error]', error);
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('[bookings error]', error);
    return NextResponse.json({ success: true, data: [] });
  }
}
