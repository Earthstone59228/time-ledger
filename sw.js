// Bump this on every deploy that changes any cached file — it's what
// forces the old cache to be dropped and the new assets to be fetched.
const CACHE_NAME = 'time-ledger-v2';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/fonts.css',
  './js/app.js',
  './js/store.js',
  './js/dates.js',
  './js/categories.js',
  './fonts/inter-latin-400-normal.woff2',
  './fonts/inter-latin-500-normal.woff2',
  './fonts/inter-latin-600-normal.woff2',
  './fonts/source-serif-4-latin-400-normal.woff2',
  './fonts/source-serif-4-latin-500-normal.woff2',
  './fonts/source-serif-4-latin-600-normal.woff2',
  './fonts/ibm-plex-mono-latin-400-normal.woff2',
  './fonts/ibm-plex-mono-latin-500-normal.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Cache-first for everything: this is a fully offline, single-user app with
// no live backend, so there is never a fresher network response to prefer.
// Navigations fall back to the cached app shell if the exact URL isn't cached.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return undefined;
        });
    })
  );
});
