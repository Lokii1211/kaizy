import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generateJWT } from '@/lib/auth';
import { rateLimits, getClientIP } from '@/lib/rateLimit';
import { verifyOtp as memVerify, getAttemptsRemaining } from '@/lib/otp-store';

// ═══════════════════════════════════════════════════════════════════════
// POST /api/auth/verify-otp
// Checks Supabase DB first (serverless-safe primary), then in-memory
// fallback (for same-process dev flows / instant checks).
// Creates user if new, returns signed JWT.
// ═══════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req.headers);
    const rl = rateLimits.auth(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Wait a moment.' },
        { status: 429 }
      );
    }

    const { phone, otp, userType } = await req.json();

    const cleanPhone = phone?.replace(/\s/g, '');
    if (!cleanPhone || !/^\+91\d{10}$/.test(cleanPhone)) {
      return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 });
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ success: false, error: 'Invalid OTP. Must be 6 digits.' }, { status: 400 });
    }

    // ── 1. Check Supabase DB first (primary — survives across Lambda invocations) ──
    const dbResult = await tryDbVerify(cleanPhone, otp);

    if (dbResult === 'ok') {
      // DB verified — proceed to user lookup
    } else if (dbResult === 'not_found') {
      // Not in DB — fall back to in-memory (same-process dev / race condition safety)
      const memResult = memVerify(cleanPhone, otp);
      console.log(`[verify-otp] DB=not_found, memory=${memResult} phone=${cleanPhone}`);

      if (memResult !== 'ok') {
        const msg = memResult === 'expired' ? 'OTP expired. Request a new one.'
          : memResult === 'used' ? 'OTP already used. Request a new one.'
          : memResult === 'too_many' ? 'Too many wrong attempts. Request a new OTP.'
          : memResult === 'wrong'
            ? `Wrong OTP. ${getAttemptsRemaining(cleanPhone)} attempts remaining.`
            : 'OTP not found or expired. Request a new one.';
        return NextResponse.json({ success: false, error: msg }, { status: 400 });
      }
    } else {
      // DB returned a specific error
      const msg = dbResult === 'expired' ? 'OTP expired. Request a new one.'
        : dbResult === 'used' ? 'OTP already used. Request a new one.'
        : dbResult === 'too_many' ? 'Too many wrong attempts. Request a new OTP.'
        : dbResult === 'wrong' ? 'Wrong OTP. Please try again.'
        : 'OTP verification failed. Please try again.';
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    // ── 2. Find or create user in DB ──
    const supabase = getSupabase();

    let isNewUser = false;
    let user;

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .single();

    if (existingUser) {
      user = existingUser;
      if (!existingUser.user_type && userType) {
        await supabase.from('users').update({ user_type: userType }).eq('id', existingUser.id);
        user.user_type = userType;
      }
    } else {
      isNewUser = true;
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ phone: cleanPhone, user_type: userType || null, name: null, language: 'en', is_active: true })
        .select()
        .single();

      if (createError || !newUser) {
        console.error('[verify-otp] Failed to create user:', createError);
        return NextResponse.json({ success: false, error: 'Failed to create account. Try again.' }, { status: 500 });
      }
      user = newUser;
    }

    // ── 3. Generate JWT ──
    const resolvedType = user.user_type || userType || 'hirer';
    const token = await generateJWT(user.id, cleanPhone, resolvedType);

    // ── 4. Set cookies + return ──
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, phone: user.phone, name: user.name, userType: resolvedType, profilePhoto: user.profile_photo },
        token,
        isNewUser,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    response.cookies.set('kaizy_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
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
    const message = error instanceof Error && error.message.includes('Database not configured')
      ? 'Service unavailable. Please try again later.'
      : 'Verification failed. Please try again.';
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}

type DbVerifyResult = 'ok' | 'not_found' | 'expired' | 'used' | 'too_many' | 'wrong' | 'error';

async function tryDbVerify(phone: string, otp: string): Promise<DbVerifyResult> {
  try {
    const supabase = getSupabase();

    // Get the most recent non-used OTP for this phone
    const { data: record, error } = await supabase
      .from('otp_codes')
      .select('id, otp, used, expires_at, attempts')
      .eq('phone', phone)
      .neq('used', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !record) return 'not_found';
    if (new Date(record.expires_at) < new Date()) {
      await supabase.from('otp_codes').update({ used: true }).eq('id', record.id);
      return 'expired';
    }
    if (record.attempts >= 5) {
      await supabase.from('otp_codes').update({ used: true }).eq('id', record.id);
      return 'too_many';
    }
    if (record.otp !== otp) {
      await supabase.from('otp_codes').update({ attempts: (record.attempts || 0) + 1 }).eq('id', record.id);
      return 'wrong';
    }

    // Mark as used
    await supabase.from('otp_codes').update({ used: true }).eq('id', record.id);
    return 'ok';
  } catch (e) {
    console.error('[verify-otp] DB check error:', e);
    return 'error';
  }
}
