import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════
// POST /api/auth/test-sms — Debug SMS delivery
// Tests Fast2SMS API and returns the raw response
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  const FAST2SMS_KEY = process.env.FAST2SMS_API_KEY || '';
  
  if (!FAST2SMS_KEY) {
    return NextResponse.json({ error: 'FAST2SMS_API_KEY not set', keyLength: 0 });
  }

  const testOtp = '123456';
  const cleanPhone = (phone || '').replace('+91', '').replace(/\s/g, '');

  if (!/^\d{10}$/.test(cleanPhone)) {
    return NextResponse.json({ error: 'Invalid phone. Send 10 digits.', phone: cleanPhone });
  }

  const results: Record<string, unknown> = {
    keySet: true,
    keyLength: FAST2SMS_KEY.length,
    keyPrefix: FAST2SMS_KEY.substring(0, 8) + '...',
    phone: cleanPhone,
  };

  // Method 1: Fast2SMS OTP route
  try {
    const res1 = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: testOtp,
        flash: '0',
        numbers: cleanPhone,
      }),
    });
    const data1 = await res1.json();
    results.method1_otp_route = {
      status: res1.status,
      response: data1,
    };
  } catch (e) {
    results.method1_error = String(e);
  }

  // Method 2: Fast2SMS Quick Transactional (v route)
  try {
    const res2 = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'v3',
        sender_id: 'KAIZYY',
        message: `Your Kaizy verification code is: ${testOtp}. Do not share with anyone.`,
        language: 'english',
        flash: 0,
        numbers: cleanPhone,
      }),
    });
    const data2 = await res2.json();
    results.method2_v3_route = {
      status: res2.status,
      response: data2,
    };
  } catch (e) {
    results.method2_error = String(e);
  }

  // Method 3: Fast2SMS Quick SMS (q route - simplest)
  try {
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_KEY}&route=q&message=Your Kaizy OTP is ${testOtp}&flash=0&numbers=${cleanPhone}`;
    const res3 = await fetch(url);
    const data3 = await res3.json();
    results.method3_quick_route = {
      status: res3.status,
      response: data3,
    };
  } catch (e) {
    results.method3_error = String(e);
  }

  return NextResponse.json(results);
}

// Also allow GET for simple testing
export async function GET() {
  const FAST2SMS_KEY = process.env.FAST2SMS_API_KEY || '';
  return NextResponse.json({
    keySet: !!FAST2SMS_KEY,
    keyLength: FAST2SMS_KEY.length,
    keyPrefix: FAST2SMS_KEY ? FAST2SMS_KEY.substring(0, 8) + '...' : 'not set',
    usage: 'POST with { "phone": "91XXXXXXXXXX" } to test SMS delivery',
  });
}
