import { NextRequest, NextResponse } from 'next/server';
import { rateLimits, getClientIP } from '@/lib/rateLimit';
import { saveOtp } from '@/lib/otp-store';

// ═══════════════════════════════════════════════════════
// POST /api/auth/send-otp
// OTP is saved to Supabase DB (primary, awaited — serverless-safe)
// AND in-memory store (secondary, helps local dev same-process flow).
// WhatsApp via AISensy (primary) + SMS fallback.
// Rate limited: 3 OTP requests per minute per IP.
// ═══════════════════════════════════════════════════════

const AISENSY_API_KEY = process.env.AISENSY_API_KEY || '';
const AISENSY_TEMPLATE = process.env.AISENSY_TEMPLATE_NAME || 'kaizy_otp_auth';
const FAST2SMS_KEY = process.env.FAST2SMS_API_KEY || '';

async function sendWhatsAppOTP(phone: string, otp: string): Promise<boolean> {
  if (!AISENSY_API_KEY) return false;
  try {
    const cleanNum = phone.replace('+', '');
    const res = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: 'kaizy_otp_campaign',
        destination: cleanNum,
        userName: 'Kaizy User',
        templateParams: [otp],
        source: 'kaizy-app',
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
        paramsFallbackValue: { FirstName: 'User' },
      }),
    });
    const data = await res.json();
    console.log(`[WhatsApp OTP] ${phone}: status=${res.status}`, JSON.stringify(data));
    return res.ok && (data.status === 'success' || data.success === true);
  } catch (e) {
    console.error('[WhatsApp OTP error]', e);
    return false;
  }
}

async function sendWhatsAppDirect(phone: string, otp: string): Promise<boolean> {
  if (!AISENSY_API_KEY) return false;
  try {
    const cleanNum = phone.replace('+', '');
    const res = await fetch('https://backend.aisensy.com/direct/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        destination: cleanNum,
        templateName: AISENSY_TEMPLATE,
        languageCode: 'en',
        bodyValues: [otp],
      }),
    });
    const data = await res.json();
    console.log(`[WhatsApp Direct] ${phone}: status=${res.status}`, JSON.stringify(data));
    return res.ok && (data.status === 'success' || data.success === true);
  } catch (e) {
    console.error('[WhatsApp Direct error]', e);
    return false;
  }
}

async function sendSMSFallback(phone: string, otp: string): Promise<boolean> {
  if (!FAST2SMS_KEY) return false;
  try {
    const cleanNum = phone.replace('+91', '');
    const message = `Your Kaizy verification code is: ${otp}. Valid for 10 minutes. Do not share this code. - Team Kaizy`;
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { 'authorization': FAST2SMS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: 'q', message, language: 'english', flash: 0, numbers: cleanNum }),
    });
    const data = await res.json();
    console.log(`[SMS Fallback] ${phone}: status=${res.status}`, JSON.stringify(data));
    return data.return === true;
  } catch (e) {
    console.error('[SMS Fallback error]', e);
    return false;
  }
}

// Save OTP to Supabase — awaited (required for serverless compatibility).
// In serverless each Lambda invocation is a fresh process; in-memory won't
// survive between send-otp and verify-otp invocations.
async function saveToDb(phone: string, otp: string, expiresAt: string): Promise<boolean> {
  try {
    const { getSupabase } = await import('@/lib/supabase');
    const supabase = getSupabase();
    // Upsert: if an OTP for this phone already exists, replace it
    const { error } = await supabase.from('otp_codes').upsert(
      { phone, otp, expires_at: expiresAt, used: false, attempts: 0 },
      { onConflict: 'phone' }
    );
    if (error) {
      console.error('[send-otp] DB save failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[send-otp] DB unavailable:', e instanceof Error ? e.message : e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req.headers);
    const rl = rateLimits.otp(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const { phone } = await req.json();

    const cleanPhone = phone?.replace(/\s/g, '');
    if (!cleanPhone || !/^\+91\d{10}$/.test(cleanPhone)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid phone number. Use +91XXXXXXXXXX format',
      }, { status: 400 });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // PRIMARY: save to Supabase DB (awaited — serverless-safe across Lambda invocations)
    const dbSaved = await saveToDb(cleanPhone, otp, expiresAt);

    // SECONDARY: also save to in-memory for same-process dev flows (no-op in serverless)
    saveOtp(cleanPhone, otp);

    if (!dbSaved) {
      // DB is required for OTP to survive across serverless invocations
      console.error('[send-otp] DB save failed — cannot guarantee OTP delivery');
      // Still proceed: in-memory works in single-process (dev/staging), and delivery
      // channels still fire. Log the warning but don't block the user.
    }

    let sent = false;
    let channel = 'none';

    sent = await sendWhatsAppOTP(cleanPhone, otp);
    if (sent) channel = 'whatsapp';

    if (!sent) {
      sent = await sendWhatsAppDirect(cleanPhone, otp);
      if (sent) channel = 'whatsapp-direct';
    }

    if (!sent) {
      sent = await sendSMSFallback(cleanPhone, otp);
      if (sent) channel = 'sms';
    }

    console.log(`[OTP] ${cleanPhone}: sent=${sent} channel=${channel} dbSaved=${dbSaved}`);

    const getMessage = () => {
      if (channel === 'whatsapp' || channel === 'whatsapp-direct') return 'OTP sent to your WhatsApp ✓';
      if (channel === 'sms') return 'OTP sent to your phone via SMS ✓';
      return 'OTP generated — use the code shown below';
    };

    return NextResponse.json({
      success: true,
      message: getMessage(),
      expires_in: 600,
      data: {
        otp_sent: sent,
        channel,
        // Only expose OTP in development — never in production regardless of delivery status
        ...(process.env.NODE_ENV === 'development' ? { fallback_otp: otp } : {}),
      },
    });
  } catch (error) {
    console.error('[send-otp error]', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send OTP. Please try again.',
    }, { status: 503 });
  }
}
