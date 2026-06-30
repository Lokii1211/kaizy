import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createNotification } from '@/lib/supabase';
import { rateLimits, getClientIP } from '@/lib/rateLimit';

// ═══════════════════════════════════════
// POST /api/bookings/quote
// Worker sends diagnosis + quote to hirer
// Bible ref: Challenges Bible → 3-Stage Pricing
//   Stage 1: Visit charge (already paid)
//   Stage 2: Worker diagnoses → sends quote
//   Stage 3: Parts addon (if needed)
// ═══════════════════════════════════════

interface QuoteRequest {
  bookingId: string;
  workerId: string;
  diagnosis: string;         // What the worker found
  complexityLevel: 'simple' | 'medium' | 'complex';
  suggestedAmount: number;   // Worker's quote in ₹
  partsNeeded?: { name: string; cost: number }[];
  estimatedDuration: string; // e.g., "30 min", "1-2 hours"
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req.headers);
    const rl = rateLimits.api(ip);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const body: QuoteRequest = await req.json();
    const { bookingId, workerId, diagnosis, complexityLevel, suggestedAmount, partsNeeded, estimatedDuration } = body;

    if (!bookingId || !workerId || !diagnosis || !suggestedAmount) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Validate suggested amount within complexity bounds
    const bounds: Record<string, { min: number; max: number }> = {
      simple: { min: 100, max: 500 },
      medium: { min: 300, max: 1200 },
      complex: { min: 700, max: 3000 },
    };

    const range = bounds[complexityLevel] || bounds.medium;
    const clampedAmount = Math.max(range.min, Math.min(range.max, suggestedAmount));

    // Calculate parts total
    const partsCost = (partsNeeded || []).reduce((sum, p) => sum + (p.cost || 0), 0);
    const totalQuote = clampedAmount + partsCost;

    // Fetch booking to get hirer
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('*, jobs(hirer_id, trade)')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    // Get worker name
    const { data: worker } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', workerId)
      .single();

    // Save quote to booking
    await supabaseAdmin.from('bookings').update({
      worker_diagnosis: diagnosis,
      complexity_level: complexityLevel,
      quoted_amount: clampedAmount,
      parts_cost: partsCost,
      parts_list: partsNeeded || [],
      total_quoted: totalQuote,
      estimated_duration: estimatedDuration,
      quote_sent_at: new Date().toISOString(),
      status: 'quote_sent',
    }).eq('id', bookingId);

    // Notify hirer with quote
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hirerId = (booking as any)?.jobs?.hirer_id || booking.hirer_id;

    if (hirerId) {
      await createNotification(
        hirerId,
        'QUOTE_RECEIVED',
        `💰 ${worker?.name || 'Worker'} sent a quote: ₹${totalQuote}`,
        `Diagnosis: ${diagnosis}. ${partsCost > 0 ? `Parts: ₹${partsCost}. ` : ''}Duration: ~${estimatedDuration}. Approve or reject in the app.`,
        {
          bookingId,
          workerId,
          diagnosis,
          quotedAmount: clampedAmount,
          partsCost,
          totalQuote,
          estimatedDuration,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        diagnosis,
        complexityLevel,
        labourCharge: clampedAmount,
        partsCost,
        totalQuote,
        estimatedDuration,
        quoteSentAt: new Date().toISOString(),
        message: 'Quote sent to customer. Waiting for approval.',
      },
    });
  } catch (error) {
    console.error('[quote error]', error);
    return NextResponse.json({ success: false, error: 'Failed to send quote' }, { status: 500 });
  }
}

// ═══════════════════════════════════════
// PATCH /api/bookings/quote
// Hirer approves or rejects worker's quote
// ═══════════════════════════════════════
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, action, hirerId } = body; // action: 'approve' | 'reject'

    if (!bookingId || !action) {
      return NextResponse.json({ success: false, error: 'bookingId and action required' }, { status: 400 });
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*, jobs(trade, hirer_id)')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // Hirer approved → update booking to in_progress, charge escrow
      await supabaseAdmin.from('bookings').update({
        status: 'in_progress',
        quote_approved_at: new Date().toISOString(),
        total_amount: booking.total_quoted || booking.quoted_amount,
      }).eq('id', bookingId);

      // Notify worker
      if (booking.worker_id) {
        await createNotification(
          booking.worker_id,
          'QUOTE_APPROVED',
          '✅ Customer approved your quote!',
          `₹${booking.total_quoted || booking.quoted_amount} confirmed. Start the work.`,
          { bookingId }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          bookingId,
          status: 'in_progress',
          approvedAmount: booking.total_quoted || booking.quoted_amount,
          message: 'Quote approved! Work can begin.',
        },
      });
    } else if (action === 'reject') {
      // Hirer rejected → only visit charge applies
      const visitCharge = Number(booking.visit_charge) || 49;

      await supabaseAdmin.from('bookings').update({
        status: 'quote_rejected',
        total_amount: visitCharge,
        quote_rejected_at: new Date().toISOString(),
      }).eq('id', bookingId);

      // Notify worker
      if (booking.worker_id) {
        await createNotification(
          booking.worker_id,
          'QUOTE_REJECTED',
          '❌ Customer declined the quote',
          `Visit charge ₹${visitCharge} will be paid. Job ended.`,
          { bookingId, hirerId }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          bookingId,
          status: 'quote_rejected',
          visitChargePaid: visitCharge,
          message: `Quote rejected. Visit charge ₹${visitCharge} paid to worker.`,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[quote approve/reject error]', error);
    return NextResponse.json({ success: false, error: 'Failed to process' }, { status: 500 });
  }
}
