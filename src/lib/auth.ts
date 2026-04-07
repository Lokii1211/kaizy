import { SignJWT, jwtVerify } from 'jose';

// ═══════════════════════════════════════════════════════
// KAIZY — PRODUCTION JWT AUTH LIBRARY
// Real tokens using jose (Edge-compatible)
// ═══════════════════════════════════════════════════════

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kaizy-default-secret-change-in-production-2026'
);

export interface JWTPayload {
  sub: string;        // userId (UUID from Supabase)
  phone: string;
  userType: 'worker' | 'hirer';
  iat: number;
  exp: number;
}

/**
 * Generate a signed JWT token — 30-day expiry
 */
export async function generateJWT(
  userId: string,
  phone: string,
  userType: 'worker' | 'hirer'
): Promise<string> {
  const token = await new SignJWT({
    sub: userId,
    phone,
    userType,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT token
 * Returns null if invalid or expired
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      sub: payload.sub as string,
      phone: (payload as Record<string, unknown>).phone as string,
      userType: (payload as Record<string, unknown>).userType as 'worker' | 'hirer',
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

/**
 * Extract user ID from request cookies
 * Used in API routes to identify the current user
 */
export async function getUserFromRequest(
  cookies: { get: (name: string) => { value: string } | undefined }
): Promise<JWTPayload | null> {
  const tokenCookie = cookies.get('kaizy_token');
  if (!tokenCookie?.value) return null;
  return verifyJWT(tokenCookie.value);
}
