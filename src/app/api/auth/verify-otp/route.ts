import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generateJWT } from '@/lib/auth';
import { rateLimits, getClientIP } from '@/lib/rateLimit';
import { verifyOtp as memVerify, getAttemptsRemaining } from '@/lib/otp-store';

// ═══════════════════════════════════════════════════════
// POST /api/auth/verify-otp
// Check in-memory store FIRST (always works), then DB.
// Creates user if new, returns signed JWT.
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
      return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 });
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ success: false, error: 'Invalid OTP. Must be 6 digits.' }, { status: 400 });
    }

    // ── 1. Check in-memory store first (always works regardless of DB state) ──
    const memResult = memVerify(cleanPhone, otp);
    console.log(`[verify-otp] memory check: phone=${cleanPhone} result=${memResult}`);

    if (memResult === 'not_found') {
      // Not in memory — try DB as fallback (for OTPs sent before server restart)
      const dbVerified = await tryDbVerify(cleanPhone, otp);
      if (!dbVerified) {
        return NextResponse.json(
          { success: false, error: 'OTP not found or expired. Request a new one.' },
          { status: 400 }
        );
      }
    } else if (memResult === 'expired') {
      return NextResponse.json({ success: false, error: 'OTP expired. Request a new one.' }, { status: 400 });
    } else if (memResult === 'used') {
      return NextResponse.json({ success: false, error: 'OTP already used. Request a new one.' }, { status: 400 });
    } else if (memResult === 'too_many') {
      return NextResponse.json({ success: false, error: 'Too many wrong attempts. Request a new OTP.' }, { status: 400 });
    } else if (memResult === 'wrong') {
      const remaining = getAttemptsRemaining(cleanPhone);
      return NextResponse.json(
        { success: false, error: `Wrong OTP. ${remaining} attempts remaining.` },
        { status: 400 }
      );
    }
    // memResult === 'ok' → proceed to user creation

    // ── 2. Find or create user in DB ──
    const supabaseAdmin = getSupabase();

    let isNewUser = false;
    let user;

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .single();

    if (existingUser) {
      user = existingUser;
      if (!existingUser.user_type && userType) {
        await supabaseAdmin.from('users').update({ user_type: userType }).eq('id', existingUser.id);
        user.user_type = userType;
      }
    } else {
      isNewUser = true;
      const { data: newUser, error: createError } = await supabaseAdmin
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

// DB fallback — used only when OTP isn't in memory (server restarted after send)
async function tryDbVerify(phone: string, otp: string): Promise<boolean> {
  try {
    const { getSupabase } = await import('@/lib/supabase');
    const supabaseAdmin = getSupabase();

    const { data: record, error } = await supabaseAdmin
      .from('otp_codes')
      .select('id, otp, used, expires_at, attempts')
      .eq('phone', phone)
      .or('used.eq.false,used.is.null')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !record) return false;
    if (new Date(record.expires_at) < new Date()) return false;
    if (record.otp !== otp) return false;

    // Mark as used in DB
    await supabaseAdmin.from('otp_codes').update({ used: true }).eq('id', record.id);
    return true;
  } catch {
    return false;
  }
}
