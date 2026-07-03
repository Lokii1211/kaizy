import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// ═══════════════════════════════════════
// GET /api/bookings — Fetch user's bookings list
// Requires authentication — always filters by the calling user's ID
// Supports: status filter, role filter, pagination
// ═══════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabase();

    // Resolve current user from JWT cookie
    const jwtPayload = await getUserFromRequest(req.cookies);
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
    const statusFilter = searchParams.get('status');
    const roleOverride = searchParams.get('role'); // 'worker' to see jobs as worker

    // If not authenticated, return empty
    if (!jwtPayload) {
      return NextResponse.json({ success: true, data: [] });
    }

    const userId = jwtPayload.sub;
    const isWorker = roleOverride === 'worker' || jwtPayload.userType === 'worker';

    let query = supabaseAdmin
      .from('bookings')
      .select(`
        *,
        jobs(trade, description),
        worker_profiles(users(name))
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Always scope to the authenticated user
    if (isWorker) {
      query = query.eq('worker_id', userId);
    } else {
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
