import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// FAKE REVIEW DETECTION ENGINE
// Bible ref: Challenges Bible → SOLUTION 7
// Detects: self-reviews, review bombing, timing anomalies
// Score 0-100: < 30 = flagged, < 15 = auto-removed
// ═══════════════════════════════════════

interface ReviewCheck {
  reviewId?: string;
  bookingId: string;
  reviewerId: string;       // Who wrote the review
  targetId: string;         // Who gets reviewed
  rating: number;           // 1-5
  reviewText: string;
  ipAddress?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ReviewCheck = await req.json();
    const { bookingId, reviewerId, targetId, rating, reviewText, ipAddress } = body;

    if (!bookingId || !reviewerId || !targetId || !rating) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    let trustScore = 100; // Start at 100, deduct for red flags
    const flags: string[] = [];

    // ─── CHECK 1: Self-Review ───
    if (reviewerId === targetId) {
      trustScore -= 100;
      flags.push('SELF_REVIEW: Reviewer and target are the same user');
    }

    // ─── CHECK 2: Valid Booking ───
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, status, hirer_id, worker_id, completed_at')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      trustScore -= 50;
      flags.push('INVALID_BOOKING: No matching booking found');
    } else if (booking.status !== 'completed') {
      trustScore -= 40;
      flags.push('INCOMPLETE_BOOKING: Booking not completed');
    } else {
      // Verify reviewer is part of the booking
      if (reviewerId !== booking.hirer_id && reviewerId !== booking.worker_id) {
        trustScore -= 60;
        flags.push('NOT_PARTICIPANT: Reviewer not part of this booking');
      }
    }

    // ─── CHECK 3: Timing Anomaly ───
    if (booking?.completed_at) {
      const completedAt = new Date(booking.completed_at);
      const timeSinceComplete = (Date.now() - completedAt.getTime()) / 60000; // minutes

      if (timeSinceComplete < 1) {
        trustScore -= 20;
        flags.push('TOO_FAST: Review submitted < 1 min after job completion');
      }
      if (timeSinceComplete > 43200) { // 30 days
        trustScore -= 15;
        flags.push('TOO_LATE: Review submitted > 30 days after completion');
      }
    }

    // ─── CHECK 4: Review Bombing ───
    // Check if reviewer left many reviews in short time
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count: recentReviews } = await supabaseAdmin
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('reviewer_id', reviewerId)
      .gte('created_at', oneHourAgo);

    if ((recentReviews || 0) >= 5) {
      trustScore -= 30;
      flags.push(`REVIEW_BOMBING: ${recentReviews} reviews in last hour`);
    }

    // ─── CHECK 5: Duplicate Review ───
    const { count: duplicates } = await supabaseAdmin
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('booking_id', bookingId)
      .eq('reviewer_id', reviewerId);

    if ((duplicates || 0) > 0) {
      trustScore -= 40;
      flags.push('DUPLICATE: Already reviewed this booking');
    }

    // ─── CHECK 6: Text Quality ───
    if (reviewText) {
      if (reviewText.length < 5) {
        trustScore -= 5;
        flags.push('SHORT_TEXT: Review text is very short');
      }
      // Check for repeated characters (spam pattern)
      if (/(.)\1{4,}/.test(reviewText)) {
        trustScore -= 20;
        flags.push('SPAM_PATTERN: Repeated characters detected');
      }
      // Check for common fake phrases
      const fakePatterns = ['fake', 'paid review', 'i was asked to write', 'do not hire'];
      if (fakePatterns.some(p => reviewText.toLowerCase().includes(p))) {
        trustScore -= 15;
        flags.push('SUSPICIOUS_TEXT: Contains suspicious keywords');
      }
    }

    // ─── CHECK 7: Rating Anomaly ───
    // All 5-star from same IP = suspicious
    if (rating === 5 && ipAddress) {
      const { count: sameIpFives } = await supabaseAdmin
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ipAddress)
        .eq('rating', 5)
        .eq('target_id', targetId);

      if ((sameIpFives || 0) >= 3) {
        trustScore -= 25;
        flags.push('SAME_IP_BOOST: Multiple 5-star from same IP');
      }
    }

    // ─── FINAL VERDICT ───
    trustScore = Math.max(0, Math.min(100, trustScore));

    let verdict: 'approved' | 'flagged' | 'auto_removed' = 'approved';
    if (trustScore < 15) verdict = 'auto_removed';
    else if (trustScore < 30) verdict = 'flagged';

    // Save fraud check result
    await supabaseAdmin.from('review_fraud_checks').insert({
      booking_id: bookingId,
      reviewer_id: reviewerId,
      target_id: targetId,
      rating,
      trust_score: trustScore,
      flags,
      verdict,
      ip_address: ipAddress || null,
      checked_at: new Date().toISOString(),
    });

    // If auto-removed, mark the review
    if (verdict === 'auto_removed') {
      await supabaseAdmin.from('reviews')
        .update({ is_hidden: true, hidden_reason: 'Auto-removed by fraud detection' })
        .eq('booking_id', bookingId)
        .eq('reviewer_id', reviewerId);
    }

    return NextResponse.json({
      success: true,
      data: {
        trustScore,
        verdict,
        flags,
        isGenuine: verdict === 'approved',
        message: verdict === 'approved'
          ? '✅ Review looks genuine'
          : verdict === 'flagged'
            ? '⚠️ Review flagged for manual review'
            : '❌ Review auto-removed (suspected fake)',
      },
    });
  } catch (error) {
    console.error('[fraud detection error]', error);
    return NextResponse.json({ success: false, error: 'Failed to check' }, { status: 500 });
  }
}
