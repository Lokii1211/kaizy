import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ═══════════════════════════════════════
// POST /api/auth/send-otp
// Send OTP to phone number (real production)
// ═══════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const { phone, userType } = await req.json();

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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store OTP
    await supabaseAdmin.from('otp_codes').insert({ phone: cleanPhone, otp, expires_at: expiresAt });

    // For development: log the OTP (in production, send via WhatsApp/SMS)
    console.log(`[KAIZY OTP] ${cleanPhone}: ${otp}`);

    // TODO: Send via Gupshup WhatsApp when ready
    // await sendWhatsAppOTP(cleanPhone, otp);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expires_in: 600,
      // Always return OTP until SMS/WhatsApp gateway is connected
      // Remove this line once Gupshup is integrated
      data: { debug_otp: otp },
    });
  } catch (error) {
    console.error('[send-otp error]', error);
    return NextResponse.json({ success: false, error: 'Failed to send OTP' }, { status: 500 });
  }
}
