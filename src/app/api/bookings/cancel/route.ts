import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createNotification } from '@/lib/supabase';
import { rateLimits, getClientIP } from '@/lib/rateLimit';

// ═══════════════════════════════════════
// BOOKING CANCELLATION — With penalty logic
// Cancellation fees per refund policy:
// < 2 min: Free | After dispatch: ₹25 | After arrival: 50%
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIP(req.headers);
    const rl = rateLimits.booking(ip);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { bookingId, reason, cancelledBy } = body; // cancelledBy: 'hirer' | 'worker'

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'bookingId required' }, { status: 400 });
    }

    // Fetch current booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*, jobs(trade, description, hirer_id)')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const now = new Date();
    const createdAt = new Date(booking.created_at);
    const timeSinceBookingMs = now.getTime() - createdAt.getTime();
    const timeSinceBookingMin = timeSinceBookingMs / 60000;
    const status = booking.status;

    // Can't cancel completed/paid bookings
    if (['completed', 'paid', 'cancelled'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: `Cannot cancel a ${status} booking`,
      }, { status: 400 });
    }

    // Calculate cancellation fee
    let cancellationFee = 0;
    let feeReason = '';
    const totalAmount = Number(booking.total_amount) || 0;

    if (cancelledBy === 'hirer') {
      if (timeSinceBookingMin < 2) {
        // Free cancellation within 2 minutes
        cancellationFee = 0;
        feeReason = 'Free cancellation (within 2 minutes)';
      } else if (['pending', 'accepted'].includes(status)) {
        // After acceptance but before dispatch — minimal fee
        cancellationFee = 0;
        feeReason = 'Free cancellation (before dispatch)';
      } else if (status === 'en_route') {
        // After worker dispatched — ₹25 for travel compensation
        cancellationFee = 25;
        feeReason = '₹25 cancellation fee (worker already dispatched)';
      } else if (['arrived', 'in_progress'].includes(status)) {
        // After arrival — 50% fee
        cancellationFee = Math.round(totalAmount * 0.5);
        feeReason = `50% cancellation fee (worker ${status === 'arrived' ? 'has arrived' : 'started work'})`;
      }
    } else if (cancelledBy === 'worker') {
      // Workers can cancel before departing
      if (['pending', 'accepted'].includes(status)) {
        cancellationFee = 0;
        feeReason = 'No fee (cancelled before departure)';
      } else {
        // Worker cancelling after departure — impacts their score
        cancellationFee = 0;
        feeReason = 'No fee but KaizyScore impacted';
      }
    }

    // Update booking status
    const updates = {
      status: 'cancelled',
      cancelled_at: now.toISOString(),
      cancellation_reason: reason || 'User cancelled',
      cancelled_by: cancelledBy || 'hirer',
      cancellation_fee: cancellationFee,
    };

    await supabaseAdmin.from('bookings').update(updates).eq('id', bookingId);

    // Update job status too
    if (booking.job_id) {
      await supabaseAdmin.from('jobs').update({ status: 'cancelled' }).eq('id', booking.job_id);
    }

    // Send notifications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = booking as any;
    const hirerId = b?.jobs?.hirer_id || b?.hirer_id;
    const workerId = b?.worker_id;

    if (cancelledBy === 'hirer' && workerId) {
      await createNotification(
        workerId,
        'BOOKING_CANCELLED',
        '❌ Booking cancelled by hirer',
        `The hirer cancelled the booking. ${feeReason}`,
        { bookingId }
      );
    }

    if (cancelledBy === 'worker' && hirerId) {
      await createNotification(
        hirerId,
        'BOOKING_CANCELLED',
        '❌ Worker cancelled the booking',
        'We are finding another worker for you.',
        { bookingId }
      );

      // Auto-re-dispatch: Create a new job alert for other workers
      try {
        if (booking.job_id) {
          await supabaseAdmin.from('jobs').update({
            status: 'pending',
            worker_id: null,
          }).eq('id', booking.job_id);
        }
      } catch (e) {
        console.error('[re-dispatch]', e);
      }
    }

    // Impact worker KaizyScore on repeated cancellations
    if (cancelledBy === 'worker' && workerId && !['pending', 'accepted'].includes(status)) {
      try {
        const { data: wp } = await supabaseAdmin
          .from('worker_profiles')
          .select('cancellation_count')
          .eq('id', workerId)
          .single();

        const newCount = (Number(wp?.cancellation_count) || 0) + 1;
        await supabaseAdmin.from('worker_profiles').update({
          cancellation_count: newCount,
        }).eq('id', workerId);
      } catch (e) {
        console.error('[worker cancel count]', e);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        status: 'cancelled',
        cancellationFee,
        feeReason,
        cancelledBy: cancelledBy || 'hirer',
        cancelledAt: now.toISOString(),
        refundEligible: cancellationFee < totalAmount,
        refundAmount: Math.max(0, totalAmount - cancellationFee),
      },
    });
  } catch (error) {
    console.error('[booking cancel error]', error);
    return NextResponse.json({ success: false, error: 'Failed to cancel booking' }, { status: 500 });
  }
}
