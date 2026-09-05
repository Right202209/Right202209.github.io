const CACHE_NAME = 'droit-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/css/style.css',
  '/js/main.js',
  '/js/background.js',
  '/js/mouse-trail.js',
  '/assets/droit.jpg',
  '/assets/background.png',
  'https://cdn.jsdelivr.net/npm/animejs@3.1.0/lib/anime.min.js',
  'https://cdn.jsdelivr.net/gh/Tomotoes/font/font.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith('droit-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
