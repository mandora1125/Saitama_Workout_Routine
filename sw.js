const CACHE = 'saitama-pwa-shell-v2';
const SHELL = [
  './',
  './index.html',
  './config.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // PWA 화면/정적 파일은 캐시를 먼저 사용해 즉시 표시하고,
  // 최신 파일은 백그라운드에서 캐시에 갱신합니다.
  event.respondWith(
    caches.match(request).then(cached => {
      const networkUpdate = fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => null);

      return cached || networkUpdate.then(response =>
        response || caches.match('./index.html')
      );
    })
  );
});
