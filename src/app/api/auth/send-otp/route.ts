import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// POST /api/auth/send-otp
// Real OTP — Multiple SMS methods with fallback
// Method 1: Fast2SMS Quick route (international gateway, no DLT needed)
// Method 2: Fast2SMS OTP route (DLT required)
// Method 3: In-app display (last resort failsafe)
// ═══════════════════════════════════════

const FAST2SMS_KEY = process.env.FAST2SMS_API_KEY || '';

// Method 1: Quick SMS route (international gateway — bypasses DLT, always delivers)
async function sendQuickSMS(phone: string, otp: string): Promise<boolean> {
  if (!FAST2SMS_KEY) return false;
  try {
    const cleanNum = phone.replace('+91', '');
    const message = `Your Kaizy verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone. - Team Kaizy`;
    
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'q',
        message,
        language: 'english',
        flash: 0,
        numbers: cleanNum,
      }),
    });
    const data = await res.json();
    console.log(`[SMS quick] ${phone}: status=${res.status}`, JSON.stringify(data));
    return data.return === true;
  } catch (e) {
    console.error('[SMS quick error]', e);
    return false;
  }
}

// Method 2: OTP route (requires DLT — may not work without DLT registration)
async function sendOtpRoute(phone: string, otp: string): Promise<boolean> {
  if (!FAST2SMS_KEY) return false;
  try {
    const cleanNum = phone.replace('+91', '');
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
        numbers: cleanNum,
      }),
    });
    const data = await res.json();
    console.log(`[SMS otp] ${phone}: status=${res.status}`, JSON.stringify(data));
    return data.return === true;
  } catch (e) {
    console.error('[SMS otp error]', e);
    return false;
  }
}

// Method 3: V3 transactional route
async function sendV3SMS(phone: string, otp: string): Promise<boolean> {
  if (!FAST2SMS_KEY) return false;
  try {
    const cleanNum = phone.replace('+91', '');
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'v3',
        sender_id: 'TXTIND',
        message: `Your Kaizy OTP is ${otp}. Valid for 10 min.`,
        language: 'english',
        flash: 0,
        numbers: cleanNum,
      }),
    });
    const data = await res.json();
    console.log(`[SMS v3] ${phone}: status=${res.status}`, JSON.stringify(data));
    return data.return === true;
  } catch (e) {
    console.error('[SMS v3 error]', e);
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

    // Try all SMS methods in order until one succeeds
    let smsSent = false;
    let smsMethod = 'none';

    // Method 1: Quick SMS route (most reliable — international gateway)
    smsSent = await sendQuickSMS(cleanPhone, otp);
    if (smsSent) smsMethod = 'quick';

    // Method 2: OTP route (needs DLT)
    if (!smsSent) {
      smsSent = await sendOtpRoute(cleanPhone, otp);
      if (smsSent) smsMethod = 'otp';
    }

    // Method 3: V3 transactional
    if (!smsSent) {
      smsSent = await sendV3SMS(cleanPhone, otp);
      if (smsSent) smsMethod = 'v3';
    }

    console.log(`[OTP] ${cleanPhone}: sent=${smsSent} method=${smsMethod} otp=${otp}`);

    return NextResponse.json({
      success: true,
      message: smsSent 
        ? 'OTP sent to your phone via SMS ✓' 
        : 'OTP generated — check below',
      expires_in: 600,
      data: {
        sms_sent: smsSent,
        sms_method: smsMethod,
        // Show OTP on screen ONLY if SMS delivery failed (critical for launch)
        // This ensures users can always log in even if SMS gateway fails
        fallback_otp: !smsSent ? otp : undefined,
      },
    });
  } catch (error) {
    console.error('[send-otp error]', error);
    return NextResponse.json({ success: false, error: 'Failed to send OTP' }, { status: 500 });
  }
}
