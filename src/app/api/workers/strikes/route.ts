import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createNotification } from '@/lib/supabase';

// ═══════════════════════════════════════
// WORKER DISCIPLINARY / STRIKE SYSTEM
// Bible ref: PreLaunch Complete Bible → PART 10
// Strike 1: Warning | Strike 2: 48hr suspend
// Strike 3: 7-day suspend | Strike 4: Permanent ban
// Immediate ban: theft, assault, fake ID, fraud
// ═══════════════════════════════════════

interface StrikeRequest {
  workerId: string;
  reason: string;
  category: 'no_show' | 'late' | 'poor_quality' | 'rude_behavior' | 'overcharge' | 'fake_review' | 'other';
  severity: 'minor' | 'major' | 'critical';
  reportedBy: string; // hirerId or 'system'
  bookingId?: string;
  evidence?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: StrikeRequest = await req.json();
    const { workerId, reason, category, severity, reportedBy, bookingId, evidence } = body;

    if (!workerId || !reason || !category) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Get current strike count
    const { data: profile } = await supabaseAdmin
      .from('worker_profiles')
      .select('strike_count, is_suspended, suspended_until, is_banned')
      .eq('id', workerId)
      .single();

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Worker not found' }, { status: 404 });
    }

    if (profile.is_banned) {
      return NextResponse.json({ success: false, error: 'Worker already banned' }, { status: 400 });
    }

    // ─── IMMEDIATE BAN (no strikes) ───
    const immediateBanReasons = ['theft', 'assault', 'fake_identity', 'fraud'];
    if (severity === 'critical' || immediateBanReasons.includes(category)) {
      await supabaseAdmin.from('worker_profiles').update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        ban_reason: reason,
        is_available: false,
      }).eq('id', workerId);

      // Record strike
      await supabaseAdmin.from('worker_strikes').insert({
        worker_id: workerId,
        reason,
        category,
        severity: 'critical',
        reported_by: reportedBy,
        booking_id: bookingId || null,
        evidence: evidence || null,
        action_taken: 'permanent_ban',
        created_at: new Date().toISOString(),
      });

      await createNotification(
        workerId,
        'ACCOUNT_BANNED',
        '⛔ Account Permanently Suspended',
        `Your account has been banned due to: ${reason}. You can appeal within 7 days via WhatsApp support.`,
        { reason, category }
      );

      return NextResponse.json({
        success: true,
        data: {
          workerId,
          action: 'permanent_ban',
          reason,
          canAppeal: true,
          appealDeadline: new Date(Date.now() + 7 * 86400000).toISOString(),
          message: 'Account permanently suspended. Worker can appeal within 7 days.',
        },
      });
    }

    // ─── GRADUATED STRIKE SYSTEM ───
    const newStrikeCount = (Number(profile.strike_count) || 0) + 1;
    let action = '';
    let suspensionHours = 0;
    let notificationTitle = '';
    let notificationBody = '';

    switch (newStrikeCount) {
      case 1:
        action = 'warning';
        notificationTitle = '⚠️ Warning — Strike 1 of 4';
        notificationBody = `Reason: ${reason}. This is a warning. Repeated issues will lead to suspension.`;
        break;
      case 2:
        action = '48hr_suspension';
        suspensionHours = 48;
        notificationTitle = '🚫 48-Hour Suspension — Strike 2 of 4';
        notificationBody = `Reason: ${reason}. You cannot receive jobs for 48 hours. One more strike = 7-day suspension.`;
        break;
      case 3:
        action = '7day_suspension';
        suspensionHours = 168; // 7 days
        notificationTitle = '🚫 7-Day Suspension — Strike 3 of 4';
        notificationBody = `Reason: ${reason}. Your account is suspended for 7 days. Next strike = permanent ban.`;
        break;
      default: // 4+
        action = 'permanent_ban';
        notificationTitle = '⛔ Account Permanently Suspended';
        notificationBody = `Reason: ${reason}. Your account has been permanently banned after 4 strikes.`;
        break;
    }

    // Apply action
    const updates: Record<string, unknown> = {
      strike_count: newStrikeCount,
    };

    if (suspensionHours > 0) {
      updates.is_suspended = true;
      updates.suspended_until = new Date(Date.now() + suspensionHours * 3600000).toISOString();
      updates.is_available = false;
    }

    if (newStrikeCount >= 4) {
      updates.is_banned = true;
      updates.banned_at = new Date().toISOString();
      updates.ban_reason = `4 strikes: ${reason}`;
      updates.is_available = false;
    }

    await supabaseAdmin.from('worker_profiles').update(updates).eq('id', workerId);

    // Record strike
    await supabaseAdmin.from('worker_strikes').insert({
      worker_id: workerId,
      reason,
      category,
      severity,
      reported_by: reportedBy,
      booking_id: bookingId || null,
      evidence: evidence || null,
      action_taken: action,
      suspension_hours: suspensionHours,
      created_at: new Date().toISOString(),
    });

    // Notify worker
    await createNotification(workerId, 'STRIKE_ISSUED', notificationTitle, notificationBody, {
      strikeNumber: newStrikeCount,
      action,
      reason,
      category,
    });

    return NextResponse.json({
      success: true,
      data: {
        workerId,
        strikeNumber: newStrikeCount,
        action,
        suspensionHours: suspensionHours || null,
        suspendedUntil: suspensionHours ? new Date(Date.now() + suspensionHours * 3600000).toISOString() : null,
        canAppeal: newStrikeCount >= 4,
        message: `Strike ${newStrikeCount} issued. Action: ${action}`,
      },
    });
  } catch (error) {
    console.error('[strike error]', error);
    return NextResponse.json({ success: false, error: 'Failed to process strike' }, { status: 500 });
  }
}

// GET — View worker's discipline history
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const workerId = url.searchParams.get('workerId');

    if (!workerId) {
      return NextResponse.json({ success: false, error: 'workerId required' }, { status: 400 });
    }

    const { data: profile } = await supabaseAdmin
      .from('worker_profiles')
      .select('strike_count, is_suspended, suspended_until, is_banned, banned_at, ban_reason')
      .eq('id', workerId)
      .single();

    const { data: strikes } = await supabaseAdmin
      .from('worker_strikes')
      .select('*')
      .eq('worker_id', workerId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        workerId,
        currentStatus: profile?.is_banned ? 'banned' : profile?.is_suspended ? 'suspended' : 'active',
        strikeCount: profile?.strike_count || 0,
        isSuspended: profile?.is_suspended || false,
        suspendedUntil: profile?.suspended_until || null,
        isBanned: profile?.is_banned || false,
        banReason: profile?.ban_reason || null,
        history: strikes || [],
      },
    });
  } catch (error) {
    console.error('[strike history error]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}
