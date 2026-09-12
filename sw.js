const CACHE_NAME = 'panos-v5';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.min.css',
  '/script.min.js',
  '/chat.min.js',
  '/tool-utils.min.js',
  '/photo.webp',
  '/offline.html',
  '/manifest.json',
  '/ai-tools.html',
  '/donation-tax-estimator.html',
  '/what-would-x-do.html',
  '/why-should-i-give.html',
  '/first-time-donor-coach.html',
  '/charity-comparison-engine.html',
  '/nonprofit-health-checker.html',
  '/scam-nonprofit-detector.html',
  '/volunteer-match.html',
  '/what-can-i-donate.html',
  '/impact-story-generator.html',
  '/community-needs-map.html',
  '/neighborhood-giving-map.html',
];

// Install: precache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Cloudflare Worker API → always network, never cache
// - HTML → network-first (always get fresh HTML, fallback to cache, then offline page)
// - Everything else → cache-first (fast, fallback to network)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never cache Cloudflare Worker API calls
  if (url.hostname.endsWith('.workers.dev')) return;

  const isHTML = event.request.headers.get('accept')?.includes('text/html');
  const isSameOrigin = url.origin === self.location.origin;

  if (isHTML && isSameOrigin) {
    // Network-first for HTML
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() =>
          caches.match(event.request)
            .then(cached => cached || caches.match(OFFLINE_URL))
        )
    );
  } else {
    // Cache-first for assets
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (!res || res.status !== 200 || res.type === 'opaque') return res;
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        });
      })
    );
  }
});
