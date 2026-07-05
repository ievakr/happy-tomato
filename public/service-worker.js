/* eslint-disable no-restricted-globals */
importScripts('/__firebase-sw-config.js');
importScripts('https://www.gstatic.com/firebasejs/11.7.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.7.3/firebase-messaging-compat.js');

try {
  const cfg = self.__FIREBASE_CONFIG__;
  if (cfg && cfg.apiKey) {
    if (!firebase.apps.length) {
      firebase.initializeApp(cfg);
    }
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const title = payload.notification?.title || 'Happy Tomato';
      const options = {
        body: payload.notification?.body || '',
        icon: '/logo192.png',
        data: payload.data || {},
      };
      return self.registration.showNotification(title, options);
    });
  }
} catch (e) {
  console.error('[FCM service worker]', e);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const openDay = data.openDay ? String(data.openDay) : '';
  const kind = data.kind ? String(data.kind) : '';
  const url = new URL(self.location.origin + '/');
  if (openDay) {
    url.searchParams.set('day', openDay);
  }
  if (kind === 'weekly_summary') {
    url.searchParams.set('weeklySummary', '1');
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if (openDay) {
            client.postMessage({
              type: 'calendar-open-day',
              day: openDay,
              kind,
            });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url.href);
      }
      return undefined;
    }),
  );
});

const PRECACHE_NAME = 'happy-tomato-precache-v3';
const RUNTIME_CACHE = 'happy-tomato-runtime-v2';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

self.addEventListener('install', (event) => {
  // Activate this new worker as soon as it finishes installing, so app updates
  // take effect on the next launch instead of waiting behind the old worker.
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(PRECACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => ![PRECACHE_NAME, RUNTIME_CACHE].includes(cacheName))
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/__/')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put('/index.html', responseClone);
          });
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    // Stale-while-revalidate: serve the cached asset immediately (fast + works
    // offline), but always kick off a background fetch to refresh the cache so
    // a stale build can't get "stuck". On a cache miss (e.g. a new hashed chunk
    // after an update) we wait for the network and cache the fresh response.
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(request))
  );
});

