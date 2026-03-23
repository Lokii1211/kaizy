// ═══════════════════════════════════════
// RATE LIMITER — In-memory token bucket
// Protects API routes from abuse
// Production: Replace with Redis/Upstash
// ═══════════════════════════════════════

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.lastRefill > 600000) store.delete(key); // 10 min stale
  }
}, 300000);

/**
 * Check rate limit for a given key (IP, userId, etc.)
 * @param key - Unique identifier (IP address, user ID)
 * @param maxTokens - Maximum requests allowed in the window
 * @param refillRateMs - How often tokens refill (in ms)
 * @returns { allowed: boolean, remaining: number, retryAfterMs: number }
 */
export function checkRateLimit(
  key: string,
  maxTokens: number = 30,
  refillRateMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { tokens: maxTokens - 1, lastRefill: now };
    store.set(key, entry);
    return { allowed: true, remaining: maxTokens - 1, retryAfterMs: 0 };
  }

  // Refill tokens based on elapsed time
  const elapsed = now - entry.lastRefill;
  const tokensToAdd = Math.floor(elapsed / refillRateMs) * maxTokens;
  if (tokensToAdd > 0) {
    entry.tokens = Math.min(maxTokens, entry.tokens + tokensToAdd);
    entry.lastRefill = now;
  }

  if (entry.tokens > 0) {
    entry.tokens--;
    return { allowed: true, remaining: entry.tokens, retryAfterMs: 0 };
  }

  // Rate limited
  const retryAfterMs = refillRateMs - elapsed;
  return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
}

// Preset limiters for different route types
export const rateLimits = {
  // Auth routes: 5 requests per minute (prevent brute force)
  auth: (key: string) => checkRateLimit(`auth:${key}`, 5, 60000),
  // OTP: 3 per minute (SMS cost protection)
  otp: (key: string) => checkRateLimit(`otp:${key}`, 3, 60000),
  // Standard API: 30 per minute
  api: (key: string) => checkRateLimit(`api:${key}`, 30, 60000),
  // Booking creation: 5 per minute
  booking: (key: string) => checkRateLimit(`booking:${key}`, 5, 60000),
  // GPS updates: 60 per minute (high frequency expected)
  gps: (key: string) => checkRateLimit(`gps:${key}`, 60, 60000),
};

/**
 * Get client IP from request headers (works on Vercel)
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}
