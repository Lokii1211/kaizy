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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, senderType, bookingId } = body;

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'Empty message' });
    }
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'bookingId required' });
    }

    // Resolve sender from JWT (preferred) or fall back to senderType hint
    const jwtUser = await getUserFromRequest(req.cookies);
    const senderId = jwtUser?.sub || null;
    const resolvedType = jwtUser?.userType || senderType || 'hirer';

    // Fetch sender name
    let senderName = resolvedType === 'worker' ? 'Worker' : 'Customer';
    if (senderId) {
      const { data: u } = await supabaseAdmin.from('users').select('name').eq('id', senderId).single();
      if (u?.name) senderName = u.name;
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: senderId,
        sender_type: resolvedType,
        sender_name: senderName,
        content: content.trim(),
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
