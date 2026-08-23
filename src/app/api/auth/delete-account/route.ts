import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimits, getClientIP } from '@/lib/rateLimit';
import { getUserFromRequest } from '@/lib/auth';

// ═══════════════════════════════════════
// POST /api/auth/delete-account
// DPDP Act 2023 compliance — data deletion
// Schedules deletion in 30 days, processes payouts first
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req.headers);
    const rl = rateLimits.auth(ip);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { reason } = body;

    // Cryptographically verify user from token
    const userPayload = await getUserFromRequest(req.cookies);
    if (!userPayload?.sub) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const userId = userPayload.sub;

    // Check for pending payouts
    const { data: pendingBookings } = await supabaseAdmin
      .from('bookings')
      .select('id, total_amount, status')
      .eq('worker_id', userId)
      .in('status', ['completed', 'in_progress']);

    const hasPending = (pendingBookings?.length || 0) > 0;

    // Schedule deletion (30 days from now)
    const deletionDate = new Date(Date.now() + 30 * 86400000);

    await supabaseAdmin.from('deletion_requests').upsert({
      user_id: userId,
      reason: reason || 'Not specified',
      requested_at: new Date().toISOString(),
      scheduled_deletion_at: deletionDate.toISOString(),
      status: hasPending ? 'pending_payout' : 'scheduled',
      pending_bookings: pendingBookings?.length || 0,
    }, { onConflict: 'user_id' });

    // Mark user as pending deletion
    await supabaseAdmin.from('users').update({
      deletion_requested: true,
      deletion_scheduled_at: deletionDate.toISOString(),
    }).eq('id', userId);

    // If worker, take offline
    await supabaseAdmin.from('worker_profiles').update({
      is_available: false,
    }).eq('id', userId);

    return NextResponse.json({
      success: true,
      data: {
        userId,
        status: hasPending ? 'pending_payout' : 'scheduled',
        scheduledDeletionAt: deletionDate.toISOString(),
        pendingBookings: pendingBookings?.length || 0,
        message: hasPending
          ? 'Deletion scheduled after pending payouts are processed.'
          : `Account will be deleted on ${deletionDate.toLocaleDateString('en-IN')}.`,
        contactEmail: 'privacy@kaizy.in',
      },
    });
  } catch (error) {
    console.error('[delete-account error]', error);
    return NextResponse.json({ success: false, error: 'Failed to process' }, { status: 500 });
  }
}
