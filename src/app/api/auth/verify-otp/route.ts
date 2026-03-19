import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// ═══════════════════════════════════════
// POST /api/auth/verify-otp
// Verify OTP → Create/find user → Return JWT
// ═══════════════════════════════════════

function generateJWT(userId: string, phone: string, userType: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: userId, phone, userType,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'kaizy-jwt-secret')
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyJWT(token: string): { sub: string; phone: string; userType: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'kaizy-jwt-secret')
      .update(`${parts[0]}.${parts[1]}`)
      .digest('base64url');
    if (expectedSig !== parts[2]) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, userType } = await req.json();
    const cleanPhone = phone?.replace(/\s/g, '');

    if (!cleanPhone || !otp) {
      return NextResponse.json({ success: false, error: 'Phone and OTP required' }, { status: 400 });
    }

    // Find valid OTP
    const { data: otpRecord } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('otp', otp)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!otpRecord) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 401 });
    }

    // Mark OTP as used
    await supabaseAdmin.from('otp_codes').update({ used: true }).eq('id', otpRecord.id);

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .single();

    let user = existingUser;
    let isNewUser = false;

    if (!user) {
      // Create new user
      isNewUser = true;
      const { data: newUser } = await supabaseAdmin
        .from('users')
        .insert({ phone: cleanPhone, user_type: userType || 'hirer' })
        .select()
        .single();
      user = newUser;
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
    }

    // Generate JWT
    const token = generateJWT(user.id, user.phone, user.user_type);

    // Set httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        userType: user.user_type,
        profilePhoto: user.profile_photo,
        city: user.city,
      },
      isNewUser,
      token,
    });

    response.cookies.set('kaizy_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    // Client-readable cookie for user type routing
    response.cookies.set('kaizy_user_type', user.user_type, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[verify-otp error]', error);
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
