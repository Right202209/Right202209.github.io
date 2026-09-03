const CACHE_NAME = 'droit-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/css/style.css',
  '/css/card.css',
  '/css/stage.css',
  '/js/main.js',
  '/js/card.js',
  '/js/stage.js',
  '/js/yarn.js',
  '/js/background.js',
  '/js/mouse-trail.js',
  '/js/oneko.js',
  '/assets/droit.jpg',
  '/assets/background.png',
  'https://cdn.jsdelivr.net/npm/animejs@3.1.0/lib/anime.min.js',
  'https://cdn.jsdelivr.net/gh/Tomotoes/font/font.min.css'
];

// Cached best-effort: cache.addAll is all-or-nothing, so an entry that may be absent
// (the oneko sprite sheet is fetched from a CDN when not self-hosted) goes here instead.
const OPTIONAL_ASSETS = [
  '/assets/oneko.gif'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS).then(() =>
        Promise.all(OPTIONAL_ASSETS.map((url) => cache.add(url).catch(() => null)))
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
