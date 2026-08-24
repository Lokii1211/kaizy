import { getSupabase } from '@/lib/supabase';

// ═══════════════════════════════════════════════════════
// KAIZY — REAL WHATSAPP & PHONE OTP SERVICE (AiSensy + Fallbacks)
// ═══════════════════════════════════════════════════════

export interface SendOTPResult {
  success: boolean;
  error?: string;
  expiresIn?: number;
  channel?: 'whatsapp' | 'sms' | 'dev';
}

export interface VerifyOTPResult {
  valid: boolean;
  reason?: 'not_found' | 'expired' | 'blocked' | 'wrong' | 'invalid_input';
  attemptsLeft?: number;
}

/**
 * Standardize Indian phone number to 10 digits
 */
export function normalizePhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * SMS Fallback sender via Twilio or Fast2SMS
 */
async function sendSMSFallback(phone: string, otp: string): Promise<boolean> {
  const cleanPhone = normalizePhone(phone);

  // 1. Try Twilio if configured
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && fromNumber) {
    try {
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const params = new URLSearchParams({
        To: `+91${cleanPhone}`,
        From: fromNumber,
        Body: `Your Kaizy verification code is ${otp}. Valid for 10 minutes. Do not share with anyone.`,
      });

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (res.ok) {
        console.log(`[SMS OTP via Twilio] Sent to +91${cleanPhone}`);
        return true;
      }
    } catch (e) {
      console.error('[SMS OTP Twilio Error]', e);
    }
  }

  // 2. Try Fast2SMS if configured
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey) {
    try {
      const message = `Your Kaizy verification code is: ${otp}. Valid for 10 minutes. Do not share this code. - Team Kaizy`;
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: { authorization: fast2SmsKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ route: 'q', message, language: 'english', flash: 0, numbers: cleanPhone }),
      });
      const data = await res.json();
      return data.return === true;
    } catch (e) {
      console.error('[SMS OTP Fast2SMS Error]', e);
    }
  }

  return false;
}

/**
 * STEP 2 — sendOTP(phone)
 * Rate limit: max 3 per hour per phone
 * Sends WhatsApp template message via AiSensy with SMS fallback
 */
export async function sendOTP(rawPhone: string): Promise<SendOTPResult> {
  const phone = normalizePhone(rawPhone);
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return { success: false, error: 'invalid_phone' };
  }

  const supabase = getSupabase();
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  // Rate limit: max 3 per hour
  const { count } = await supabase
    .from('otp_codes')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', oneHourAgo);

  if ((count || 0) >= 3) {
    return { success: false, error: 'rate_limited' };
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 600000).toISOString(); // 10 minutes

  // Upsert to otp_codes table
  const { error: dbError } = await supabase.from('otp_codes').upsert(
    {
      phone,
      otp,
      expires_at: expiresAt,
      attempts: 0,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'phone' }
  );

  if (dbError) {
    console.error('[sendOTP DB Error]', dbError.message);
  }

  let deliveryChannel: 'whatsapp' | 'sms' | 'dev' = 'whatsapp';
  let sent = false;

  // Send via AiSensy WhatsApp Partner API
  const aisensyKey = process.env.AISENSY_API_KEY;
  if (aisensyKey) {
    try {
      const templateName = process.env.AISENSY_TEMPLATE_NAME || 'kaizy_otp_login';
      const toPhone = phone.startsWith('91') ? phone : '91' + phone;

      // 1. Partner API endpoint
      const res = await fetch('https://apis.aisensy.com/partner-apis/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AiSensy-Project-API-Pwd': aisensyKey,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: otp }],
              },
            ],
          },
          to: toPhone,
        }),
      });

      if (res.ok) {
        sent = true;
        deliveryChannel = 'whatsapp';
        console.log(`[WhatsApp OTP AiSensy] Sent successfully to ${toPhone}`);
      } else {
        // 2. Direct API Fallback endpoint
        const directRes = await fetch('https://backend.aisensy.com/direct/t1/api/v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: aisensyKey,
            destination: toPhone,
            templateName: templateName,
            languageCode: 'en',
            bodyValues: [otp],
          }),
        });

        if (directRes.ok) {
          sent = true;
          deliveryChannel = 'whatsapp';
          console.log(`[WhatsApp OTP AiSensy Direct] Sent successfully to ${toPhone}`);
        }
      }
    } catch (e) {
      console.error('[AiSensy WhatsApp Error]', e);
    }
  }

  // Fallback: SMS if WhatsApp didn't send
  if (!sent) {
    const smsSent = await sendSMSFallback(phone, otp);
    if (smsSent) {
      deliveryChannel = 'sms';
      sent = true;
    } else {
      // In local dev without keys, log OTP to console for seamless testing
      console.log(`\n========================================\n[KAIZY AUTH] OTP for +91${phone}: ${otp}\n========================================\n`);
      deliveryChannel = 'dev';
      sent = true;
    }
  }

  return { success: true, expiresIn: 600, channel: deliveryChannel };
}

/**
 * STEP 2 — verifyOTP(phone, inputOtp)
 * Verifies 6-digit OTP against Supabase otp_codes
 */
export async function verifyOTP(rawPhone: string, inputOtp: string): Promise<VerifyOTPResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone || !inputOtp || inputOtp.length !== 6) {
    return { valid: false, reason: 'invalid_input' };
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error || !data) {
    return { valid: false, reason: 'not_found' };
  }

  if (new Date(data.expires_at) < new Date()) {
    await supabase.from('otp_codes').delete().eq('phone', phone);
    return { valid: false, reason: 'expired' };
  }

  if ((data.attempts || 0) >= 5) {
    return { valid: false, reason: 'blocked' };
  }

  if (data.otp !== inputOtp) {
    const newAttempts = (data.attempts || 0) + 1;
    await supabase
      .from('otp_codes')
      .update({ attempts: newAttempts })
      .eq('phone', phone);

    return {
      valid: false,
      reason: 'wrong',
      attemptsLeft: Math.max(0, 5 - newAttempts),
    };
  }

  // OTP is valid — remove from DB to prevent replay
  await supabase.from('otp_codes').delete().eq('phone', phone);
  return { valid: true };
}
