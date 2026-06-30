import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createNotification } from '@/lib/supabase';
import { rateLimits, getClientIP } from '@/lib/rateLimit';

// ═══════════════════════════════════════
// POST /api/bookings/parts
// Stage 3 of 3-Stage Pricing — Parts addon
// Worker discovers additional parts needed mid-job
// Hirer can approve or reject
// Bible ref: Challenges Bible → STAGE 3
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req.headers);
    const rl = rateLimits.api(ip);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { bookingId, workerId, parts } = body;
    // parts: [{ name: "Copper wire 3m", cost: 180 }, { name: "MCB 32A", cost: 220 }]

    if (!bookingId || !workerId || !parts || !Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'bookingId, workerId, and parts[] required',
      }, { status: 400 });
    }

    // Calculate total parts cost
    const totalPartsCost = parts.reduce(
      (sum: number, p: { name: string; cost: number }) => sum + (Number(p.cost) || 0),
      0
    );

    if (totalPartsCost <= 0) {
      return NextResponse.json({ success: false, error: 'Parts cost must be positive' }, { status: 400 });
    }

    // Fetch booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*, jobs(hirer_id, trade)')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    // Only allow parts request during in_progress
    if (booking.status !== 'in_progress') {
      return NextResponse.json({
        success: false,
        error: 'Can only request parts during an active job',
      }, { status: 400 });
    }

    // Get worker name
    const { data: worker } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', workerId)
      .single();

    // Save parts request
    await supabaseAdmin.from('bookings').update({
      parts_addon_list: parts,
      parts_addon_cost: totalPartsCost,
      parts_addon_status: 'pending',
      parts_addon_requested_at: new Date().toISOString(),
    }).eq('id', bookingId);

    // Notify hirer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hirerId = (booking as any)?.jobs?.hirer_id || booking.hirer_id;
    if (hirerId) {
      const partsDesc = parts.map((p: { name: string; cost: number }) => `${p.name}: ₹${p.cost}`).join(', ');
      await createNotification(
        hirerId,
        'PARTS_REQUEST',
        `🔩 ${worker?.name || 'Worker'} needs parts worth ₹${totalPartsCost}`,
        `Parts: ${partsDesc}. Approve to continue work, or reject to stop here.`,
        { bookingId, workerId, parts, totalPartsCost }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        parts,
        totalPartsCost,
        status: 'pending_approval',
        message: `Parts request ₹${totalPartsCost} sent to customer`,
      },
    });
  } catch (error) {
    console.error('[parts request error]', error);
    return NextResponse.json({ success: false, error: 'Failed to request parts' }, { status: 500 });
  }
}

// PATCH — Hirer approves/rejects parts addon
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, action } = body; // action: 'approve' | 'reject'

    if (!bookingId || !action) {
      return NextResponse.json({ success: false, error: 'bookingId and action required' }, { status: 400 });
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (action === 'approve') {
      const newTotal = (Number(booking.total_amount) || 0) + (Number(booking.parts_addon_cost) || 0);

      await supabaseAdmin.from('bookings').update({
        parts_addon_status: 'approved',
        total_amount: newTotal,
        parts_addon_approved_at: new Date().toISOString(),
      }).eq('id', bookingId);

      // Notify worker
      if (booking.worker_id) {
        await createNotification(
          booking.worker_id,
          'PARTS_APPROVED',
          '✅ Customer approved parts!',
          `₹${booking.parts_addon_cost} added. Continue with parts.`,
          { bookingId }
        );
      }

      return NextResponse.json({
        success: true,
        data: { bookingId, status: 'approved', newTotal, message: 'Parts approved. Continue work.' },
      });

    } else if (action === 'reject') {
      await supabaseAdmin.from('bookings').update({
        parts_addon_status: 'rejected',
        parts_addon_rejected_at: new Date().toISOString(),
      }).eq('id', bookingId);

      if (booking.worker_id) {
        await createNotification(
          booking.worker_id,
          'PARTS_REJECTED',
          '❌ Parts request declined',
          'Customer declined parts. Complete what\'s possible without parts.',
          { bookingId }
        );
      }

      return NextResponse.json({
        success: true,
        data: { bookingId, status: 'rejected', message: 'Parts declined. Complete what\'s possible.' },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[parts approve/reject error]', error);
    return NextResponse.json({ success: false, error: 'Failed to process' }, { status: 500 });
  }
}
