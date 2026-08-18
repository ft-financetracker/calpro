const CACHE = 'calpro-shell-v4-2-1';
const ASSETS = [
  './',
  './index.html',
  './css/tokens.css',
  './css/app.css',
  './css/components.css',
  './css/responsive.css',
  './js/app.js',
  './js/config.js',
  './js/api.js',
  './js/components/templates.js',
  './js/calculators/cash.js',
  './js/calculators/discount.js',
  './js/calculators/hpp.js',
  './js/calculators/marketplace.js',
  './js/calculators/production-hpp.js',
  './js/calculators/selling-price.js',
  './manifest.webmanifest',
  './assets/icons/calpro-icon-192.png',
  './assets/icons/calpro-icon-512-v2.png',
  './assets/icons/favicon-48.png',
  './assets/icons/apple-touch-icon.png'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
  );
});
