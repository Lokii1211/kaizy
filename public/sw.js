// ══════════════════════════════════════
// Kaizy Service Worker — Offline + Caching
// v2: Better caching strategies for 100K+ DAU
// ══════════════════════════════════════
const CACHE_NAME = 'kaizy-v2';
const OFFLINE_URL = '/offline.html';

// Critical assets to precache on install
const PRECACHE = [
  '/',
  '/offline.html',
  '/kaizy-logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST for OTP, bookings, etc.)
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (Mapbox tiles, AISensy, etc.)
  if (url.origin !== self.location.origin) return;

  // ── Navigation requests: network-first, offline fallback ──
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful page responses for offline
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // ── API requests: network-first (don't serve stale data) ──
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // ── Static assets (_next/static, images, fonts): cache-first ──
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // ── Everything else: stale-while-revalidate ──
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// ── Push notifications ──
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Kaizy', body: event.data.text() };
  }

  const { title, body, icon, url, tag } = payload;

  event.waitUntil(
    self.registration.showNotification(title || 'Kaizy', {
      body: body || '',
      icon: icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag,
      data: { url: url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an existing Kaizy window if one is already open
      for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
