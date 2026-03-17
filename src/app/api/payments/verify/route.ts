import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createNotification } from '@/lib/supabase';
import crypto from 'crypto';

// ═══════════════════════════════════════
// POST /api/payments/verify — Verify Razorpay payment
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const { bookingId, orderId, paymentId, signature } = await req.json();

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 });
    }

    // Update booking
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .update({
        razorpay_payment_id: paymentId,
        payment_status: 'captured',
      })
      .eq('id', bookingId)
      .select()
      .single();

    // Notify worker about payment
    if (booking?.worker_id) {
      await createNotification(
        booking.worker_id,
        'PAYMENT_RECEIVED',
        `💰 ₹${booking.net_to_worker} payment secured!`,
        `Payment will be released after job completion.`,
        { bookingId, amount: booking.net_to_worker }
      );
    }

    // Add to earnings ledger
    if (booking) {
      await supabaseAdmin.from('earnings').insert({
        worker_id: booking.worker_id,
        booking_id: bookingId,
        amount: booking.net_to_worker,
        type: 'job_payment',
        status: 'pending',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('[payments/verify error]', error);
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
