import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// GET /api/bookings — Fetch user's bookings list
// Like Uber "Your Trips" / Swiggy "My Orders"
// Supports: status filter, user_id filter, pagination
// ═══════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 20;
    const statusFilter = searchParams.get('status');
    const userId = searchParams.get('user_id');

    let query = supabaseAdmin
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('hirer_id', userId);
    }

    if (statusFilter === 'active') {
      query = query.in('status', ['pending', 'accepted', 'in_progress', 'matched', 'en_route']);
    } else if (statusFilter === 'completed') {
      query = query.eq('status', 'completed');
    } else if (statusFilter === 'cancelled') {
      query = query.eq('status', 'cancelled');
    }

    const { data, error } = await query;

    if (error) {
      console.error('[bookings list error]', error);
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('[bookings error]', error);
    return NextResponse.json({ success: true, data: [] });
  }
}
