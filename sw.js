const CACHE_NAME = 'droit-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/js/background.js',
  '/assets/droit.jpg',
  '/assets/background.png',
  'https://cdn.jsdelivr.net/npm/animejs@3.1.0/lib/anime.min.js',
  'https://cdn.jsdelivr.net/gh/Tomotoes/font/font.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
