import { NextResponse } from 'next/server';

// ═══════════════════════════════════════
// GET /api/auth/test-whatsapp — Test AISensy config
// POST /api/auth/test-whatsapp — Send test OTP via WhatsApp
// ═══════════════════════════════════════

export async function GET() {
  const AISENSY_KEY = process.env.AISENSY_API_KEY || '';
  const FAST2SMS_KEY = process.env.FAST2SMS_API_KEY || '';
  const TEMPLATE = process.env.AISENSY_TEMPLATE_NAME || 'kaizy_otp_auth';

  return NextResponse.json({
    aisensy: {
      keySet: !!AISENSY_KEY,
      keyLength: AISENSY_KEY.length,
      keyPrefix: AISENSY_KEY ? AISENSY_KEY.substring(0, 12) + '...' : 'not set',
      template: TEMPLATE,
    },
    fast2sms: {
      keySet: !!FAST2SMS_KEY,
      keyLength: FAST2SMS_KEY.length,
    },
    priority: AISENSY_KEY ? 'WhatsApp (AISensy)' : FAST2SMS_KEY ? 'SMS (Fast2SMS)' : 'On-screen fallback',
    instructions: !AISENSY_KEY
      ? 'Set AISENSY_API_KEY in Vercel env vars to enable WhatsApp OTP'
      : 'WhatsApp OTP is configured! POST with { "phone": "+91XXXXXXXXXX" } to test.',
  });
}

export async function POST(req: Request) {
  const AISENSY_KEY = process.env.AISENSY_API_KEY || '';

  if (!AISENSY_KEY) {
    return NextResponse.json({
      error: 'AISENSY_API_KEY not set in Vercel environment variables',
      steps: [
        '1. Go to aisensy.com → Sign up',
        '2. Connect WhatsApp Business → Create OTP template',
        '3. Get API key from Settings → API Keys',
        '4. Add AISENSY_API_KEY to Vercel env vars',
        '5. Redeploy',
      ],
    });
  }

  const { phone } = await req.json();
  const cleanNum = (phone || '').replace('+', '');
  const testOtp = '123456';

  if (!/^91\d{10}$/.test(cleanNum)) {
    return NextResponse.json({ error: 'Send { "phone": "+91XXXXXXXXXX" }' });
  }

  const results: Record<string, unknown> = {};

  // Test Campaign API
  try {
    const res = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_KEY,
        campaignName: 'kaizy_otp_test',
        destination: cleanNum,
        userName: 'Test User',
        templateParams: [testOtp],
        source: 'kaizy-test',
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
      }),
    });
    const data = await res.json();
    results.campaignAPI = { status: res.status, ok: res.ok, response: data };
  } catch (e) {
    results.campaignAPI = { error: String(e) };
  }

  // Test Direct API
  try {
    const templateName = process.env.AISENSY_TEMPLATE_NAME || 'kaizy_otp_auth';
    const res = await fetch('https://backend.aisensy.com/direct/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_KEY,
        destination: cleanNum,
        templateName,
        languageCode: 'en',
        bodyValues: [testOtp],
      }),
    });
    const data = await res.json();
    results.directAPI = { status: res.status, ok: res.ok, response: data };
  } catch (e) {
    results.directAPI = { error: String(e) };
  }

  return NextResponse.json(results);
}
