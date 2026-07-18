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
        jobs(trade, description, hirer_id),
        worker_profiles!bookings_worker_id_fkey(
          id, avg_rating, kaizy_score,
          users!worker_profiles_user_id_fkey(name, phone)
        )
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

    // Check which completed bookings already have a review
    const completedIds = (data || []).filter(b => b.status === 'completed').map(b => b.id);
    let reviewedSet = new Set<string>();
    if (completedIds.length > 0) {
      const { data: reviews } = await supabaseAdmin
        .from('reviews')
        .select('booking_id')
        .in('booking_id', completedIds);
      reviewedSet = new Set((reviews || []).map(r => r.booking_id).filter(Boolean));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enriched = (data || []).map((b: any) => ({
      ...b,
      trade: b.jobs?.trade || b.trade || '',
      description: b.jobs?.description || b.description || '',
      worker_name: b.worker_profiles?.users?.name || b.worker_name || 'Worker',
      worker_phone: b.worker_profiles?.users?.phone || '',
      worker_rating: b.worker_profiles?.avg_rating || 0,
      worker_kaizy_score: b.worker_profiles?.kaizy_score || 0,
      has_review: reviewedSet.has(b.id),
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('[bookings error]', error);
    return NextResponse.json({ success: true, data: [] });
  }
}
