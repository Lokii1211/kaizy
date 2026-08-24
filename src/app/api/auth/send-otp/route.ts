import { NextRequest, NextResponse } from 'next/server';
import { sendOTP, normalizePhone } from '@/lib/otp';
import { rateLimits, getClientIP } from '@/lib/rateLimit';

// ═══════════════════════════════════════════════════════
// POST /api/auth/send-otp
// Dispatches WhatsApp OTP via AiSensy (SMS fallback)
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req.headers);
    const rl = rateLimits.auth(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawPhone = body.phone;

    if (!rawPhone || typeof rawPhone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const cleanPhone = normalizePhone(rawPhone);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid 10-digit Indian mobile number' },
        { status: 400 }
      );
    }

    const result = await sendOTP(cleanPhone);

    if (!result.success) {
      if (result.error === 'rate_limited') {
        return NextResponse.json(
          { success: false, error: 'Too many OTP requests. Please try again after an hour.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expiresIn: result.expiresIn || 600,
      channel: result.channel || 'whatsapp',
      message: 'OTP sent successfully to your WhatsApp number',
    });
  } catch (error) {
    console.error('[POST /api/auth/send-otp error]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while sending OTP' },
      { status: 500 }
    );
  }
}
