import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createNotification } from '@/lib/supabase';

// ═══════════════════════════════════════
// PATCH /api/bookings/update
// Update booking status through the lifecycle:
// accepted → en_route → arrived → in_progress → completed → paid
// Also handles: cash payment confirmation, job completion
// ═══════════════════════════════════════

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, status, workerId, hirerId, paymentMethod, paymentAmount } = body;

    if (!bookingId || !status) {
      return NextResponse.json({ success: false, error: 'bookingId and status required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { status };
    const now = new Date().toISOString();

    // Status-specific fields
    switch (status) {
      case 'en_route':
        updates.departed_at = now;
        break;
      case 'arrived':
        updates.arrived_at = now;
        break;
      case 'in_progress':
        updates.started_at = now;
        break;
      case 'completed':
        updates.completed_at = now;
        break;
      case 'paid':
        updates.payment_status = 'paid';
        updates.payment_method = paymentMethod || 'cash';
        updates.paid_at = now;
        if (paymentAmount) updates.total_amount = paymentAmount;
        break;
      case 'cancelled':
        updates.cancelled_at = now;
        break;
    }

    // Update booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select('*, jobs(trade, description, hirer_id)')
      .single();

    if (error) {
      console.error('[booking update error]', error);
      // Try simpler update without select
      await supabaseAdmin.from('bookings').update(updates).eq('id', bookingId);
      return NextResponse.json({ success: true, data: { bookingId, status } });
    }

    // Also update the job status
    if (booking?.job_id) {
      const jobStatus = status === 'paid' ? 'completed' : status;
      await supabaseAdmin.from('jobs').update({ status: jobStatus }).eq('id', booking.job_id);
    }

    // Send notifications based on status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = booking as any;
    const hirerIdResolved = hirerId || b?.jobs?.hirer_id || b?.hirer_id;
    const workerIdResolved = workerId || b?.worker_id;

    if (status === 'en_route' && hirerIdResolved) {
      await createNotification(hirerIdResolved, 'WORKER_EN_ROUTE', '🚗 Worker is on the way!', 'Track them live on the map.', { bookingId });
    }
    if (status === 'arrived' && hirerIdResolved) {
      await createNotification(hirerIdResolved, 'WORKER_ARRIVED', '📍 Worker has arrived!', 'Share the OTP to start the job.', { bookingId });
    }
    if (status === 'completed' && hirerIdResolved) {
      await createNotification(hirerIdResolved, 'JOB_COMPLETED', '✅ Job completed!', 'Please confirm and release payment.', { bookingId });
    }
    if (status === 'paid' && workerIdResolved) {
      const amount = paymentAmount || b?.total_amount || 0;
      await createNotification(workerIdResolved, 'PAYMENT_RECEIVED', `💰 ₹${amount} received!`, 'Payment confirmed for your job.', { bookingId, amount });

      // Update worker stats (total_jobs + total_earnings)
      try {
        const { data: wp } = await supabaseAdmin
          .from('worker_profiles')
          .select('total_jobs, total_earnings')
          .eq('id', workerIdResolved)
          .single();

        if (wp) {
          await supabaseAdmin.from('worker_profiles').update({
            total_jobs: (Number(wp.total_jobs) || 0) + 1,
            total_earnings: (Number(wp.total_earnings) || 0) + amount,
          }).eq('id', workerIdResolved);
        }
      } catch (statsErr) {
        console.error('[worker stats update]', statsErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: { bookingId, status, updatedAt: now },
    });
  } catch (error) {
    console.error('[bookings/update error]', error);
    return NextResponse.json({ success: false, error: 'Failed to update booking' }, { status: 500 });
  }
}
