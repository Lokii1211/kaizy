// ═══════════════════════════════════════
// PRIVACY MASKING — Aadhaar, Phone, UPI
// Like Rapido / Uber — never show full details
// ═══════════════════════════════════════

/**
 * Mask Aadhaar number: XXXX XXXX 4567
 */
export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar) return "XXXX XXXX XXXX";
  const clean = aadhaar.replace(/\s/g, "");
  if (clean.length < 4) return "XXXX XXXX XXXX";
  return `XXXX XXXX ${clean.slice(-4)}`;
}

/**
 * Mask phone number: +91 ●●●●● 67890
 */
export function maskPhone(phone: string): string {
  if (!phone) return "●●●●● ●●●●●";
  const clean = phone.replace(/[\s+]/g, "");
  // Remove country code
  const digits = clean.startsWith("91") ? clean.slice(2) : clean;
  if (digits.length < 5) return "●●●●● ●●●●●";
  return `+91 ●●●●● ${digits.slice(-5)}`;
}

/**
 * Mask UPI ID: r●●●●●@oksbi
 */
export function maskUPI(upi: string): string {
  if (!upi) return "●●●●●@●●●●";
  const [name, provider] = upi.split("@");
  if (!name || !provider) return "●●●●●@●●●●";
  return `${name[0]}●●●●●@${provider}`;
}

/**
 * Mask email: e●●●●●@gmail.com
 */
export function maskEmail(email: string): string {
  if (!email) return "●●●●●@●●●●";
  const [name, domain] = email.split("@");
  if (!name || !domain) return "●●●●●@●●●●";
  return `${name[0]}●●●●●@${domain}`;
}

/**
 * Mask a name to show only first name + last initial
 * "Rahul Sharma" → "Rahul S."
 */
export function maskName(name: string): string {
  if (!name) return "User";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
