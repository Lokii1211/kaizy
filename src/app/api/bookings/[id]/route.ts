import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// GET /api/bookings/[id] — Fetch single booking detail
// ═══════════════════════════════════════

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, status, created_at, completed_at,
        hirer_price, worker_payout, platform_fee,
        payment_status, otp, address,
        jobs(trade, description),
        worker_profiles!bookings_worker_id_fkey(
          id, avg_rating,
          users!worker_profiles_user_id_fkey(name, phone)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !booking) {
      // Fallback: try simpler query
      const { data: simple } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (!simple) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: simple.id,
          status: simple.status || 'pending',
          created_at: simple.created_at,
          completed_at: simple.completed_at,
          hirer_price: simple.hirer_price || simple.total_amount || 0,
          worker_payout: simple.worker_payout || 0,
          platform_fee: simple.platform_fee || 0,
          payment_status: simple.payment_status || 'pending',
          otp: simple.otp || '',
          trade: simple.trade || '',
          description: simple.description || '',
          worker_name: 'Worker',
          worker_phone: '',
          worker_rating: 0,
          worker_trade: simple.trade || '',
          worker_id: simple.worker_id || '',
          review_rating: null,
          review_tags: [],
          address: simple.address || '',
        }
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = booking as any;
    const workerProfile = b.worker_profiles;
    const job = b.jobs;

    // Fetch review if exists
    let reviewRating = null;
    let reviewTags: string[] = [];
    const { data: review } = await supabaseAdmin
      .from('reviews')
      .select('rating, tags')
      .eq('booking_id', id)
      .single();
    if (review) {
      reviewRating = review.rating;
      reviewTags = review.tags || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        id: b.id,
        status: b.status || 'pending',
        created_at: b.created_at,
        completed_at: b.completed_at,
        hirer_price: b.hirer_price || 0,
        worker_payout: b.worker_payout || 0,
        platform_fee: b.platform_fee || 0,
        payment_status: b.payment_status || 'pending',
        otp: b.otp || '',
        trade: job?.trade || '',
        description: job?.description || '',
        worker_name: workerProfile?.users?.name || 'Worker',
        worker_phone: workerProfile?.users?.phone || '',
        worker_rating: workerProfile?.avg_rating || 0,
        worker_trade: job?.trade || '',
        worker_id: workerProfile?.id || '',
        review_rating: reviewRating,
        review_tags: reviewTags,
        address: b.address || '',
      }
    });
  } catch (error) {
    console.error('[booking detail error]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch booking' }, { status: 500 });
  }
}
