import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// Real-time Chat API — Booking-scoped messaging
// GET: Poll messages for a booking
// POST: Send a new message
// ═══════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('booking_id');
    const limit = Number(searchParams.get('limit')) || 100;

    let query = supabaseAdmin
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[chat fetch error]', error);
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, senderType, bookingId, senderName } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Empty message' });
    }

    const messageData: Record<string, unknown> = {
      sender_id: senderType || 'user',
      content: content.trim(),
      message_type: 'text',
      sender_name: senderName || (senderType === 'worker' ? 'Worker' : 'You'),
    };

    // Add booking_id if provided
    if (bookingId) {
      messageData.booking_id = bookingId;
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('[chat send error]', error);
      // Try without booking_id if column doesn't exist
      const { error: err2 } = await supabaseAdmin
        .from('messages')
        .insert({
          sender_id: senderType || 'user',
          content: content.trim(),
          message_type: 'text',
        });
      if (err2) return NextResponse.json({ success: false, error: err2.message });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Send failed' });
  }
}
