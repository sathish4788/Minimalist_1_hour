// MinimaList PWA Service Worker for Offline Capabilities & Google Play Store Compliance
const CACHE_NAME = 'minimalist-pwa-v3';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icon.svg',
  '/favicon.ico',
  '/pwa-192x192.png',
  '/pwa-maskable-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/screenshot-mobile.png',
  '/screenshot-desktop.png',
  '/apple-touch-icon.png'
];

// Workbox manifest injection placeholder
// @ts-ignore
const _wbManifest = self.__WB_MANIFEST || [];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache asset warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Let Gemini API calls and server API routes go directly to network
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Cache-First for static PWA assets (manifests, icons, images) so Chrome never fails parsing
  const isPwaAsset =
    url.pathname.startsWith('/manifest.') ||
    url.pathname.startsWith('/pwa-') ||
    url.pathname.startsWith('/screenshot-') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/icon.svg';

  if (isPwaAsset && event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          // Fallback to base manifest if query string failed
          if (url.pathname.startsWith('/manifest.')) {
            return caches.match('/manifest.json');
          }
          return caches.match('/pwa-192x192.png');
        });
      })
    );
    return;
  }

  // Handle other GET requests with Network-First falling back to Cache
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith('http')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/');
            }
            return new Response('Offline: MinimaList is functioning offline from local cache.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        })
    );
  }
});

// Handle notification click on Android / desktop to focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (_event) => {
  // Notification dismissed by user
});
