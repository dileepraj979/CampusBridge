/**
 * CampusBridge Custom Service Worker
 * App Shell Precaching, Stale-While-Revalidate, Strict Logout Cache Invalidation,
 * Quota Warning Alerts & Web Push Dispatch
 */

const CACHE_VERSION = 'v1.0.0';
const APP_SHELL_CACHE = `campusbridge-appshell-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `campusbridge-dynamic-${CACHE_VERSION}`;

const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// 1. Install Event — Precache Core App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => {
        return cache.addAll(PRECACHE_RESOURCES);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[Service Worker] Pre-cache warning:', err);
      })
  );
});

// 2. Activate Event — Clean Stale Caches and Claim Clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== APP_SHELL_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event — Routing & Caching Strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Non-GET requests (POST, PUT, DELETE, PATCH): Always pass through to network
  if (request.method !== 'GET') {
    return;
  }

  // API Requests: Let the application-level Dexie sync engine handle offline mutations
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            offlineFallback: true,
            message: 'CampusBridge is currently operating in local offline mode.'
          }),
          { headers: { 'Content-Type': 'application/json' }, status: 503 }
        );
      })
    );
    return;
  }

  // Navigation requests (HTML SPA Routing): App Shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedShell = await caches.match('/index.html');
        return cachedShell || fetch(request);
      })
    );
    return;
  }

  // Static Assets (CSS, JS, Fonts, Images): Stale-While-Revalidate
  const isStaticAsset = (
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});

// 4. Message Event — Logout Invalidation & Storage Quota Alerts
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {};

  // Strict Cache Clearing on Logout or Device Revocation
  if (type === 'LOGOUT_PURGE') {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ success: true, message: 'All offline caches purged.' });
    }
  }

  // Storage Quota Monitoring
  if (type === 'CHECK_STORAGE_QUOTA') {
    if (navigator.storage && navigator.storage.estimate) {
      const { usage, quota } = await navigator.storage.estimate();
      const pctUsed = quota ? Math.round((usage / quota) * 100) : 0;
      const isCritical = pctUsed >= 80;

      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: 'STORAGE_QUOTA_REPORT',
          usageBytes: usage,
          quotaBytes: quota,
          percentUsed: pctUsed,
          isCritical
        });
      });
    }
  }

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 5. Push Notifications (Web Push API)
self.addEventListener('push', (event) => {
  let data = {
    title: 'CampusBridge Alert',
    message: 'New institutional update available.',
    category: 'ACADEMIC'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.message = event.data.text();
    }
  }

  const options = {
    body: data.message,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      actionLink: data.actionLink || '/'
    },
    actions: [
      { action: 'open', title: 'Open CampusBridge' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 6. Notification Click Action
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.actionLink || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
