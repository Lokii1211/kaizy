import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// ═══════════════════════════════════════
// Real-time Chat API — Booking-scoped messaging
// GET: Fetch messages for a booking (requires auth or booking_id)
// POST: Send a message (sender_id from JWT)
// ═══════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('booking_id');
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200);

    if (!bookingId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const jwtUser = await getUserFromRequest(req.cookies);
    if (!jwtUser?.sub) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Verify user is party to booking
    const { data: bk } = await supabaseAdmin
      .from('bookings')
      .select('hirer_id, worker_id, jobs(hirer_id)')
      .eq('id', bookingId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bkRaw = bk as any;
    const isParty = bk && (bkRaw.hirer_id === jwtUser.sub || bkRaw.worker_id === jwtUser.sub || bkRaw.jobs?.hirer_id === jwtUser.sub);
    if (!isParty) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('id, booking_id, sender_id, sender_type, content, created_at, is_read')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) console.error('[chat fetch]', error);

    return NextResponse.json({ success: true, data: data || [] });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

function sanitizeMessageContent(raw: string): string {
  // Regex for 10-digit Indian phone numbers (including variations with spaces/hyphens/+91)
  const phoneRegex = /(?:\+91[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5}\b|\b[6-9]\d{9}\b/g;
  // Regex for UPI VPA handles (e.g. name@okaxis, worker@upi, 9842112345@ybl)
  const upiRegex = /\b[a-zA-Z0-9.\-_]{2,64}@(okaxis|okhdfcbank|okicici|oksbi|ybl|ibl|axl|paytm|upi|apl|fbl|idfcbank|icici|sbi|hdfcbank|kotak)\b/gi;

  return raw
    .replace(phoneRegex, '[Contact details hidden for security]')
    .replace(upiRegex, '[Payment ID hidden for security]');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, senderType, bookingId } = body;

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'Empty message' }, { status: 400 });
    }
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'bookingId required' }, { status: 400 });
    }

    const jwtUser = await getUserFromRequest(req.cookies);
    if (!jwtUser?.sub) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Verify booking party
    const { data: bk } = await supabaseAdmin
      .from('bookings')
      .select('hirer_id, worker_id, jobs(hirer_id)')
      .eq('id', bookingId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bkRaw = bk as any;
    const isParty = bk && (bkRaw.hirer_id === jwtUser.sub || bkRaw.worker_id === jwtUser.sub || bkRaw.jobs?.hirer_id === jwtUser.sub);
    if (!isParty) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const senderId = jwtUser.sub;
    const resolvedType = jwtUser.userType || senderType || (bkRaw.worker_id === jwtUser.sub ? 'worker' : 'hirer');

    // Fetch sender name
    let senderName = resolvedType === 'worker' ? 'Worker' : 'Customer';
    const { data: u } = await supabaseAdmin.from('users').select('name').eq('id', senderId).single();
    if (u?.name) senderName = u.name;

    const sanitizedContent = sanitizeMessageContent(content.trim());

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: senderId,
        sender_type: resolvedType,
        sender_name: senderName,
        content: sanitizedContent,
        message_type: 'text',
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[chat send]', error);
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Send failed' });
  }
}
