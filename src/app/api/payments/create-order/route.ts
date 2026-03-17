import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// ═══════════════════════════════════════
// POST /api/payments/create-order — Create Razorpay order
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const amountPaise = Math.round(booking.total_amount * 100);

    // Create Razorpay order
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `kaizy_${bookingId.substring(0, 8)}`,
        notes: { bookingId, hirerId: booking.hirer_id, workerId: booking.worker_id },
      }),
    });

    const order = await rzpResponse.json();

    if (order.error) {
      console.error('[razorpay error]', order.error);
      return NextResponse.json({ success: false, error: 'Payment setup failed' }, { status: 500 });
    }

    // Update booking with order ID
    await supabaseAdmin
      .from('bookings')
      .update({ razorpay_order_id: order.id, payment_status: 'order_created' })
      .eq('id', bookingId);

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: amountPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('[payments/create-order error]', error);
    return NextResponse.json({ success: false, error: 'Payment creation failed' }, { status: 500 });
  }
}
