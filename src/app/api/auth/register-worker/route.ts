import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { phone, name, city, trade, experience, rate, bio, upiId } = await req.json();

    // Create user
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .insert({ phone, name, user_type: 'worker', city })
      .select()
      .single();

    if (userErr) {
      const msg = userErr.message.includes('duplicate')
        ? 'This phone number is already registered. Try logging in.'
        : userErr.message;
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    // Create worker profile
    await supabaseAdmin.from('worker_profiles').insert({
      id: user.id,
      trade_primary: trade,
      experience_years: experience || 0,
      rate_hourly: rate || 400,
      bio: bio || '',
      upi_id: upiId || '',
      is_online: false,
      is_available: true,
    });

    return NextResponse.json({ success: true, data: { userId: user.id } });
  } catch (error) {
    console.error('[register-worker error]', error);
    return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 });
  }
}
