// ═══════════════════════════════════════════════════════
// In-memory OTP store — module-level singleton (survives
// across requests in Next.js server, cleared on cold start)
// Primary store: always used. DB is secondary/persistent.
// ═══════════════════════════════════════════════════════

interface OtpEntry {
  otp: string;
  phone: string;
  expiresAt: number;  // epoch ms
  attempts: number;
  used: boolean;
}

// Module-level Map — lives in the Node.js process
const store = new Map<string, OtpEntry>();

// Purge expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.expiresAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export function saveOtp(phone: string, otp: string, ttlMs = 10 * 60 * 1000) {
  store.set(phone, {
    otp,
    phone,
    expiresAt: Date.now() + ttlMs,
    attempts: 0,
    used: false,
  });
}

export function verifyOtp(phone: string, otp: string): 'ok' | 'not_found' | 'expired' | 'used' | 'wrong' | 'too_many' {
  const entry = store.get(phone);
  if (!entry) return 'not_found';
  if (entry.used) return 'used';
  if (Date.now() > entry.expiresAt) { store.delete(phone); return 'expired'; }
  if (entry.attempts >= 5) { entry.used = true; return 'too_many'; }
  if (entry.otp !== otp) { entry.attempts++; return 'wrong'; }
  entry.used = true;
  return 'ok';
}

export function getAttemptsRemaining(phone: string): number {
  const entry = store.get(phone);
  return entry ? Math.max(0, 5 - entry.attempts) : 5;
}
