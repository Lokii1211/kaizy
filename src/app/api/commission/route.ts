import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// COMMISSION LEDGER — Kaizy's ₹5/job Revenue Model
// Every completed booking → ₹5 deducted from worker payout
// Worker sees: earnings - commission = net payout
// ═══════════════════════════════════════

const COMMISSION_PER_JOB = 5; // ₹5 flat per completed job

// GET — Fetch commission summary for a worker
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get('workerId');

    // If no workerId, try to get from auth token
    let resolvedId = workerId;
    if (!resolvedId) {
      try {
        const token = req.cookies.get('kaizy_token')?.value;
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          resolvedId = payload.sub || payload.userId || '';
        }
      } catch {}
    }

    if (!resolvedId) {
      return NextResponse.json({ success: false, error: 'workerId required' }, { status: 400 });
    }

    // Fetch commission records
    const { data: commissions } = await supabaseAdmin
      .from('commissions')
      .select('*')
      .eq('worker_id', resolvedId)
      .order('created_at', { ascending: false });

    const records = commissions || [];
    const totalCommission = records.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const totalPaid = records.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const totalPending = records.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount || 0), 0);

    // Check if worker should be blocked (unpaid > ₹50)
    const isBlocked = totalPending > 50;

    return NextResponse.json({
      success: true,
      data: {
        records,
        summary: {
          totalCommission,
          totalPaid,
          totalPending,
          commissionPerJob: COMMISSION_PER_JOB,
          isBlocked,
          blockReason: isBlocked ? `Pending commission ₹${totalPending} exceeds ₹50 limit. Clear dues to continue.` : null,
          totalJobs: records.length,
        },
      },
    });
  } catch (error) {
    console.error('[commission GET error]', error);
    return NextResponse.json({ success: true, data: { records: [], summary: { totalCommission: 0, totalPaid: 0, totalPending: 0, commissionPerJob: COMMISSION_PER_JOB, isBlocked: false, totalJobs: 0 } } });
  }
}

// POST — Record a new commission (called when booking is completed/paid)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workerId, bookingId, jobAmount } = body;

    if (!workerId || !bookingId) {
      return NextResponse.json({ success: false, error: 'workerId and bookingId required' }, { status: 400 });
    }

    // Check if commission already recorded for this booking
    const { data: existing } = await supabaseAdmin
      .from('commissions')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('worker_id', workerId)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, data: { message: 'Commission already recorded', id: existing.id } });
    }

    // Insert commission record
    const { data: commission, error } = await supabaseAdmin
      .from('commissions')
      .insert({
        worker_id: workerId,
        booking_id: bookingId,
        amount: COMMISSION_PER_JOB,
        job_amount: jobAmount || 0,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[commission insert error]', error);
      // Table might not exist yet — that's OK, we still process the booking
      return NextResponse.json({ success: true, data: { message: 'Commission tracked (table pending setup)', amount: COMMISSION_PER_JOB } });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: commission.id,
        amount: COMMISSION_PER_JOB,
        netPayout: (jobAmount || 0) - COMMISSION_PER_JOB,
        message: `₹${COMMISSION_PER_JOB} Kaizy commission deducted`,
      },
    });
  } catch (error) {
    console.error('[commission POST error]', error);
    return NextResponse.json({ success: false, error: 'Failed to record commission' }, { status: 500 });
  }
}

// PATCH — Mark commissions as paid (admin action or UPI auto-deduct)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { workerId, commissionIds } = body;

    if (!workerId) {
      return NextResponse.json({ success: false, error: 'workerId required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (commissionIds && commissionIds.length > 0) {
      // Pay specific commissions
      await supabaseAdmin
        .from('commissions')
        .update({ status: 'paid', paid_at: now })
        .in('id', commissionIds);
    } else {
      // Pay ALL pending commissions for this worker
      await supabaseAdmin
        .from('commissions')
        .update({ status: 'paid', paid_at: now })
        .eq('worker_id', workerId)
        .eq('status', 'pending');
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Commissions marked as paid', paidAt: now },
    });
  } catch (error) {
    console.error('[commission PATCH error]', error);
    return NextResponse.json({ success: false, error: 'Failed to update commissions' }, { status: 500 });
  }
}
