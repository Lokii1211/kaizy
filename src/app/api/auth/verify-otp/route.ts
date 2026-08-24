import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generateJWT } from '@/lib/auth';
import { verifyOTP, normalizePhone } from '@/lib/otp';
import { rateLimits, getClientIP } from '@/lib/rateLimit';

// ═══════════════════════════════════════════════════════
// POST /api/auth/verify-otp
// Verifies OTP, finds/creates user, generates JWT & cookies
// ═══════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req.headers);
    const rl = rateLimits.auth(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please wait.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { phone: rawPhone, otp, userType } = body;

    if (!rawPhone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone number and 6-digit OTP are required' },
        { status: 400 }
      );
    }

    const cleanPhone = normalizePhone(rawPhone);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const cleanOtp = String(otp).trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json(
        { success: false, error: 'OTP must be a 6-digit number' },
        { status: 400 }
      );
    }

    // 1. Verify OTP
    const verification = await verifyOTP(cleanPhone, cleanOtp);

    if (!verification.valid) {
      let errorMsg = 'Invalid verification code';
      if (verification.reason === 'expired') {
        errorMsg = 'OTP expired. Please request a new one.';
      } else if (verification.reason === 'blocked') {
        errorMsg = 'Too many failed attempts. Please request a new OTP.';
      } else if (verification.reason === 'wrong') {
        const left = verification.attemptsLeft ?? 4;
        errorMsg = `Wrong OTP. ${left} attempt${left === 1 ? '' : 's'} left.`;
      } else if (verification.reason === 'not_found') {
        errorMsg = 'No active OTP found. Please request a new code.';
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          reason: verification.reason,
          attemptsLeft: verification.attemptsLeft,
        },
        { status: 400 }
      );
    }

    // 2. Find or create user in Supabase
    const supabase = getSupabase();
    const e164Phone = `+91${cleanPhone}`;

    let isNewUser = false;
    let user;

    // Check with E.164 and bare number
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .or(`phone.eq.${e164Phone},phone.eq.${cleanPhone}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingUser) {
      user = existingUser;
      // Update role if newly selected
      if (userType && (!existingUser.user_type || existingUser.user_type === 'hirer')) {
        if (userType === 'worker' && existingUser.user_type !== 'worker') {
          await supabase.from('users').update({ user_type: 'worker' }).eq('id', existingUser.id);
          user.user_type = 'worker';
        }
      }
    } else {
      isNewUser = true;
      const initialRole = userType === 'worker' ? 'worker' : 'hirer';
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone: e164Phone,
          user_type: initialRole,
          name: null,
          language: 'en',
          is_active: true,
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error('[verify-otp] User create error:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create user account. Please try again.' },
          { status: 500 }
        );
      }
      user = newUser;
    }

    // 3. Generate signed JWT (30 days expiry)
    const resolvedRole: 'worker' | 'hirer' = user.user_type === 'worker' ? 'worker' : 'hirer';
    const token = await generateJWT(user.id, e164Phone, resolvedRole);

    // 4. Build response with TWO cookies: kaizy_token and kaizy_role
    const response = NextResponse.json({
      success: true,
      isNewUser,
      userType: resolvedRole,
      userId: user.id,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        user_type: resolvedRole,
      },
    });

    const isProd = process.env.NODE_ENV === 'production';
    const thirtyDaysSeconds = 30 * 24 * 60 * 60;

    // Cookie 1: kaizy_token (httpOnly, secure)
    response.cookies.set('kaizy_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: thirtyDaysSeconds,
      path: '/',
    });

    // Cookie 2: kaizy_role (accessible to JS for instant UI sync)
    response.cookies.set('kaizy_role', resolvedRole, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      maxAge: thirtyDaysSeconds,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[POST /api/auth/verify-otp error]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while verifying OTP' },
      { status: 500 }
    );
  }
}
