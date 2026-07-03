import "server-only";
import { supabaseAdmin } from "./supabase";

// ═══════════════════════════════════════════════════════
// SERVER-ONLY push notification dispatch.
// Isolated from supabase.ts because supabase.ts is also imported
// by client components (for the browser `supabase` client export),
// and `web-push` depends on Node-only modules (tls, net, etc.) that
// cannot be bundled into client code. The `server-only` import above
// makes Next.js throw a build error if this file is ever imported
// from a client component, instead of a confusing bundler crash.
// ═══════════════════════════════════════════════════════

let webPushConfigured: boolean | null = null;
let warnedPushNotConfigured = false;

// No-ops silently if web-push isn't installed, VAPID keys aren't set, or the
// user has no stored push subscription. Never throws.
export async function sendPushNotification(userId: string, title: string, body: string, url?: string) {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    if (!warnedPushNotConfigured) {
      console.log('[push] VAPID keys not configured, skipping push notifications');
      warnedPushNotConfigured = true;
    }
    return;
  }

  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('fcm_token')
      .eq('id', userId)
      .single();

    if (!user?.fcm_token) return;

    let subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
    try {
      subscription = JSON.parse(user.fcm_token);
    } catch {
      console.error('[push] stored fcm_token is not valid JSON, skipping');
      return;
    }

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return;
    }

    if (webPushConfigured === null) {
      try {
        const webpush = (await import('web-push')).default;
        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
        webPushConfigured = true;
      } catch (err) {
        console.error('[push] web-push package not available, skipping push notifications:', err);
        webPushConfigured = false;
      }
    }

    if (!webPushConfigured) return;

    const webpush = (await import('web-push')).default;
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, url: url || '/', icon: '/icon-192.png' })
    );
  } catch (error) {
    console.error('[push] sendPushNotification failed:', error);
  }
}

// ═══ Combined helper: writes the in-app notification row AND attempts push ═══
// Drop-in replacement for the old createNotification — same signature,
// import it from '@/lib/push-server' instead of '@/lib/supabase'.
export async function createNotification(userId: string, type: string, title: string, body: string, data: Record<string, unknown> = {}) {
  await supabaseAdmin.from('notifications').insert({ user_id: userId, type, title, body, data });

  // Push notifications are best-effort — never let a push failure break the in-app flow
  try {
    await sendPushNotification(userId, title, body, typeof data?.url === 'string' ? data.url : undefined);
  } catch (err) {
    console.error('[push] createNotification push dispatch failed:', err);
  }
}
