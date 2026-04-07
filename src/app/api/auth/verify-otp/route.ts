import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateJWT } from '@/lib/auth';
import { rateLimits, getClientIP } from '@/lib/rateLimit';

// ═══════════════════════════════════════════════════════
// POST /api/auth/verify-otp
// Verifies OTP against Supabase otp_codes table
// Creates user if new, returns signed JWT
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIP(req.headers);
    const rl = rateLimits.auth(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Wait a moment.' },
        { status: 429 }
      );
    }

    const { phone, otp, userType } = await req.json();

    // Validate input
    const cleanPhone = phone?.replace(/\s/g, '');
    if (!cleanPhone || !/^\+91\d{10}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    if (!otp || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP. Must be 6 digits.' },
        { status: 400 }
      );
    }

    // ── 1. Find the latest OTP for this phone ──
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { success: false, error: 'OTP not found. Request a new one.' },
        { status: 400 }
      );
    }

    // ── 2. Check expiry ──
    if (new Date(otpRecord.expires_at) < new Date()) {
      // Mark as used so it can't be retried
      await supabaseAdmin
        .from('otp_codes')
        .update({ used: true })
        .eq('id', otpRecord.id);

      return NextResponse.json(
        { success: false, error: 'OTP expired. Request a new one.' },
        { status: 400 }
      );
    }

    // ── 3. Check attempts (max 5) ──
    if ((otpRecord.attempts || 0) >= 5) {
      await supabaseAdmin
        .from('otp_codes')
        .update({ used: true })
        .eq('id', otpRecord.id);

      return NextResponse.json(
        { success: false, error: 'Too many wrong attempts. Request a new OTP.' },
        { status: 400 }
      );
    }

    // ── 4. Verify OTP ──
    if (otpRecord.otp !== otp) {
      // Increment attempts
      await supabaseAdmin
        .from('otp_codes')
        .update({ attempts: (otpRecord.attempts || 0) + 1 })
        .eq('id', otpRecord.id);

      const remaining = 5 - (otpRecord.attempts || 0) - 1;
      return NextResponse.json(
        { success: false, error: `Wrong OTP. ${remaining} attempts remaining.` },
        { status: 400 }
      );
    }

    // ── 5. OTP is correct — mark as used ──
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // ── 6. Find or create user ──
    let isNewUser = false;
    let user;

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .single();

    if (existingUser) {
      user = existingUser;
      // If user exists but has no user_type and one was provided, update it
      if (!existingUser.user_type && userType) {
        await supabaseAdmin
          .from('users')
          .update({ user_type: userType })
          .eq('id', existingUser.id);
        user.user_type = userType;
      }
    } else {
      // Create new user
      isNewUser = true;
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          phone: cleanPhone,
          user_type: userType || null,
          name: null,
          language: 'en',
          is_active: true,
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error('[verify-otp] Failed to create user:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create account. Try again.' },
          { status: 500 }
        );
      }

      user = newUser;
    }

    // ── 7. Generate real JWT ──
    const resolvedType = user.user_type || userType || 'hirer';
    const token = await generateJWT(user.id, cleanPhone, resolvedType);

    // ── 8. Set cookie + return response ──
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          userType: resolvedType,
          profilePhoto: user.profile_photo,
        },
        token,
        isNewUser,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set('kaizy_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    // Also set a non-httponly cookie for client-side role checking
    response.cookies.set('kaizy_user_type', resolvedType, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[verify-otp] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
