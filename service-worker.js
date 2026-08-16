const CACHE = 'calpro-shell-v2';
const ASSETS = ['./','./index.html','./css/tokens.css','./css/app.css','./css/ft-theme.css','./js/app.js','./js/config.js','./js/api.js','./manifest.webmanifest','./assets/icons/calpro-icon-512.png','./assets/icons/finance-tracker-192.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => { if (event.request.method !== 'GET') return; event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match('./index.html')))); });
