import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// POST /api/reviews — Submit review after job completion
// Both hirer and worker can review each other
// Updates worker avg_rating after each review
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const { bookingId, reviewerId, revieweeId, rating, tags, comment, reviewerType } = await req.json();

    if (!bookingId || !rating) {
      return NextResponse.json({ success: false, error: 'bookingId and rating required' }, { status: 400 });
    }

    // Validate rating
    const safeRating = Math.max(1, Math.min(5, Number(rating)));

    // Insert review
    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        booking_id: bookingId,
        reviewer_id: reviewerId || null,
        reviewee_id: revieweeId || null,
        reviewer_type: reviewerType || 'hirer',
        rating: safeRating,
        tags: tags || [],
        comment: comment || '',
      })
      .select()
      .single();

    if (error) {
      console.error('[review insert error]', error);
      // May fail if reviews table doesn't have all columns — try minimal insert
      const { error: retryError } = await supabaseAdmin
        .from('reviews')
        .insert({
          booking_id: bookingId,
          rating: safeRating,
          tags: tags || [],
          comment: comment || '',
        });

      if (retryError) {
        console.error('[review retry error]', retryError);
        return NextResponse.json({ success: false, error: 'Failed to save review' }, { status: 500 });
      }
    }

    // Update worker's average rating
    if (revieweeId && reviewerType === 'hirer') {
      try {
        // Calculate new average from all reviews
        const { data: allReviews } = await supabaseAdmin
          .from('reviews')
          .select('rating')
          .eq('reviewee_id', revieweeId);

        if (allReviews && allReviews.length > 0) {
          const avgRating = Math.round(
            (allReviews.reduce((sum, r) => sum + Number(r.rating), 0) / allReviews.length) * 10
          ) / 10;

          await supabaseAdmin
            .from('worker_profiles')
            .update({ avg_rating: avgRating, total_reviews: allReviews.length })
            .eq('id', revieweeId);
        }
      } catch (e) {
        console.error('[rating update error]', e);
        // Non-critical — review is saved even if rating update fails
      }
    }

    // Mark booking as reviewed
    try {
      await supabaseAdmin
        .from('bookings')
        .update({ review_submitted: true })
        .eq('id', bookingId);
    } catch {
      // Non-critical — review is saved even if this fails
    }

    return NextResponse.json({
      success: true,
      data: {
        reviewId: review?.id || 'saved',
        rating: safeRating,
        message: 'Thank you for your review!',
      },
    });
  } catch (error) {
    console.error('[reviews error]', error);
    return NextResponse.json({ success: false, error: 'Failed to submit review' }, { status: 500 });
  }
}

// GET /api/reviews — Fetch reviews for a worker
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get('workerId');
    const bookingId = searchParams.get('bookingId');
    const limit = Number(searchParams.get('limit')) || 20;

    let query = supabaseAdmin
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (workerId) query = query.eq('reviewee_id', workerId);
    if (bookingId) query = query.eq('booking_id', bookingId);

    const { data, error } = await query;

    if (error) {
      console.error('[reviews fetch error]', error);
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
