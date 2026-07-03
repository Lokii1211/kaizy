// ═══════════════════════════════════════════════════════
// KAIZY — WEB PUSH CLIENT HELPER
// Subscribes/unsubscribes the browser to push notifications.
// Degrades gracefully when VAPID keys or browser support are missing.
// ═══════════════════════════════════════════════════════

/** Check if this browser supports the Push API */
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

/** Convert a base64 (URL-safe) VAPID key string into the Uint8Array applicationServerKey expects */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission and subscribe to push.
 * No-ops cleanly if unsupported or VAPID public key isn't configured.
 */
export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!isPushSupported()) {
      console.log('[push] Push notifications not supported in this browser');
      return false;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.log('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not configured, skipping subscription');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[push] Notification permission not granted:', permission);
      return false;
    }

    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      console.error('[push] Failed to register subscription with server:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[push] subscribeToPush error:', error);
    return false;
  }
}

/**
 * Unsubscribe from push and clear the subscription server-side.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    if (!isPushSupported()) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
    }

    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unsubscribe' }),
    });

    return true;
  } catch (error) {
    console.error('[push] unsubscribeFromPush error:', error);
    return false;
  }
}
