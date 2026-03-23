import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// POST /api/auth/send-otp
// Real OTP — sends SMS via Fast2SMS API
// ═══════════════════════════════════════

const FAST2SMS_KEY = process.env.FAST2SMS_API_KEY || '';

async function sendSMS(phone: string, otp: string): Promise<boolean> {
  if (!FAST2SMS_KEY) {
    console.log(`[OTP] No SMS key configured. OTP for ${phone}: ${otp}`);
    return false;
  }

  try {
    // Fast2SMS DLT / Quick Transactional SMS
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: otp,
        flash: '0',
        numbers: phone.replace('+91', ''),
      }),
    });
    const data = await res.json();
    console.log(`[SMS] ${phone}: ${data.return ? 'SENT' : 'FAILED'}`, data.message);
    return data.return === true;
  } catch (e) {
    console.error('[SMS error]', e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    // Validate Indian phone format
    const cleanPhone = phone?.replace(/\s/g, '');
    if (!cleanPhone || !/^\+91\d{10}$/.test(cleanPhone)) {
      return NextResponse.json({ success: false, error: 'Invalid phone number. Use +91XXXXXXXXXX format' }, { status: 400 });
    }

    // Rate limit: max 5 OTPs per phone per hour
    const { count } = await supabaseAdmin
      .from('otp_codes')
      .select('id', { count: 'exact', head: true })
      .eq('phone', cleanPhone)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if ((count || 0) >= 5) {
      return NextResponse.json({ success: false, error: 'Too many OTP requests. Try again in 1 hour.' }, { status: 429 });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store OTP in database
    await supabaseAdmin.from('otp_codes').insert({ phone: cleanPhone, otp, expires_at: expiresAt });

    // Send real SMS
    const smsSent = await sendSMS(cleanPhone, otp);

    return NextResponse.json({
      success: true,
      message: smsSent ? 'OTP sent to your phone via SMS' : 'OTP generated (SMS delivery pending)',
      expires_in: 600,
      data: {
        sms_sent: smsSent,
        // PRODUCTION: Never expose OTP. Only show in development.
        debug_otp: process.env.NODE_ENV === 'development' && !smsSent ? otp : undefined,
      },
    });
  } catch (error) {
    console.error('[send-otp error]', error);
    return NextResponse.json({ success: false, error: 'Failed to send OTP' }, { status: 500 });
  }
}
