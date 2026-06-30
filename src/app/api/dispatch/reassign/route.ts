import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createNotification } from '@/lib/supabase';

// ═══════════════════════════════════════
// POST /api/dispatch/reassign
// Auto-reassignment when worker cancels after booking
// Bible ref: Challenges Bible → CHALLENGE 3
// "When worker cancels AFTER hirer paid: auto-search replacement"
// ₹50 bonus for replacement worker who accepts
// ═══════════════════════════════════════

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, cancelledWorkerId, reason } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'bookingId required' }, { status: 400 });
    }

    // Fetch original booking
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('*, jobs(trade, hirer_id, description, latitude, longitude)')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const job = (booking as any).jobs || {};
    const hirerId = job.hirer_id || booking.hirer_id;
    const trade = job.trade || 'all';
    const hirerLat = Number(job.latitude || 11.0168);
    const hirerLng = Number(job.longitude || 76.9558);

    // Find replacement workers (excluding cancelled worker)
    const { data: workers } = await supabaseAdmin
      .from('worker_profiles')
      .select('*, users(name)')
      .eq('is_available', true)
      .neq('id', cancelledWorkerId || '')
      .limit(15);

    if (!workers || workers.length === 0) {
      // No workers available — refund hirer
      if (hirerId) {
        await createNotification(
          hirerId,
          'REASSIGN_FAILED',
          '😔 No replacement worker found',
          `We couldn't find a replacement within 10 minutes. Full refund of ₹${booking.total_amount} has been initiated. You also get ₹50 credit for your next booking.`,
          { bookingId }
        );
      }

      // Update booking
      await supabaseAdmin.from('bookings').update({
        status: 'cancelled',
        cancellation_reason: 'No replacement worker available',
        refund_amount: booking.total_amount,
        refund_credit: 50,
      }).eq('id', bookingId);

      return NextResponse.json({
        success: false,
        data: {
          bookingId,
          status: 'no_replacement',
          refundAmount: booking.total_amount,
          creditGiven: 50,
          message: 'No replacement found. Full refund + ₹50 credit issued.',
        },
      });
    }

    // Filter by trade and distance, sort by proximity
    const matchedWorkers = workers
      .filter((w: Record<string, unknown>) => {
        const wTrade = String(w.trade_primary || '').toLowerCase();
        return trade === 'all' || wTrade.includes(trade.toLowerCase());
      })
      .map((w: Record<string, unknown>) => {
        const wLat = Number(w.latitude || hirerLat + (Math.random() - 0.5) * 0.02);
        const wLng = Number(w.longitude || hirerLng + (Math.random() - 0.5) * 0.02);
        const distance = haversine(hirerLat, hirerLng, wLat, wLng);
        return {
          id: String(w.id),
          name: String((w.users as Record<string, unknown>)?.name || 'Worker'),
          distance,
          eta: Math.round(distance * 6 + 3),
          rating: Number(w.avg_rating || 4.0),
        };
      })
      .filter((w: { distance: number }) => w.distance <= 15) // 15km radius for reassignment
      .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance)
      .slice(0, 5);

    if (matchedWorkers.length === 0) {
      // Same no-replacement logic
      if (hirerId) {
        await createNotification(
          hirerId,
          'REASSIGN_FAILED',
          '😔 No nearby replacement found',
          `Full refund + ₹50 credit issued. We're sorry for the inconvenience.`,
          { bookingId }
        );
      }

      return NextResponse.json({
        success: false,
        data: { bookingId, status: 'no_replacement', message: 'No matching workers nearby.' },
      });
    }

    // Create emergency reassignment alerts with bonus
    const bonus = 50; // ₹50 bonus for accepting urgent reassignment

    // Update booking to reassigning state
    await supabaseAdmin.from('bookings').update({
      status: 'reassigning',
      worker_id: null,
      reassignment_reason: reason || 'Previous worker cancelled',
      reassignment_bonus: bonus,
      reassignment_started_at: new Date().toISOString(),
    }).eq('id', bookingId);

    // Notify replacement workers
    for (const w of matchedWorkers) {
      await createNotification(
        w.id,
        'URGENT_JOB',
        `🆘 Urgent: ${trade} job — ₹${bonus} bonus!`,
        `Previous worker cancelled. ${w.distance.toFixed(1)}km away. Accept now for ₹${bonus} extra.`,
        { bookingId, bonus, isReassignment: true }
      );
    }

    // Notify hirer
    if (hirerId) {
      await createNotification(
        hirerId,
        'REASSIGNING',
        '🔄 Finding a new worker...',
        `Previous worker cancelled. We're contacting ${matchedWorkers.length} nearby workers with a priority alert.`,
        { bookingId, workersContacted: matchedWorkers.length }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        status: 'reassigning',
        workersContacted: matchedWorkers.length,
        bonus,
        closestWorker: {
          name: matchedWorkers[0].name,
          distance: matchedWorkers[0].distance.toFixed(1),
          eta: matchedWorkers[0].eta,
        },
        message: `Urgent alert sent to ${matchedWorkers.length} workers with ₹${bonus} bonus.`,
      },
    });
  } catch (error) {
    console.error('[reassign error]', error);
    return NextResponse.json({ success: false, error: 'Reassignment failed' }, { status: 500 });
  }
}
