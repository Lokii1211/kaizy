import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// POST /api/reviews — Submit a review
// GET  /api/reviews?workerId=xxx — Get worker reviews
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const { bookingId, workerId, reviewerId, rating, tags, comment } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be 1-5' }, { status: 400 });
    }

    // Save review
    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        booking_id: bookingId || null,
        worker_id: workerId || null,
        reviewer_id: reviewerId || null,
        rating,
        tags: tags || [],
        comment: comment || '',
      })
      .select()
      .single();

    if (error) {
      // Ignore duplicate review
      if (error.message.includes('duplicate')) {
        return NextResponse.json({ success: true, message: 'Review already submitted' });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Update worker avg rating
    if (workerId) {
      const { data: reviews } = await supabaseAdmin
        .from('reviews')
        .select('rating')
        .eq('worker_id', workerId);

      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await supabaseAdmin
          .from('worker_profiles')
          .update({ avg_rating: Math.round(avg * 100) / 100, total_reviews: reviews.length })
          .eq('id', workerId);
      }
    }

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error('[reviews error]', error);
    return NextResponse.json({ success: false, error: 'Failed to save review' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get('workerId');

    if (!workerId) {
      return NextResponse.json({ success: false, error: 'workerId required' }, { status: 400 });
    }

    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select('*, users:reviewer_id(name)')
      .eq('worker_id', workerId)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({ success: true, data: reviews || [] });
  } catch (error) {
    console.error('[reviews GET error]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
