import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 100;

    const { data } = await supabaseAdmin
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);

    return NextResponse.json({ success: true, data: data || [] });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content, senderType } = await req.json();

    const { error } = await supabaseAdmin.from('messages').insert({
      sender_id: senderType || 'user',
      content,
      message_type: 'text',
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Send failed' });
  }
}
