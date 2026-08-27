/* TumiFact Service Worker — Fase 4.2 Offline First (minimal) */
const CACHE_NAME = 'tumifact-v2-1';
const PRECACHE_URLS = ['/manifest.json', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Solo cachear GET navegaciones y estáticos
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // No cachear API ni health
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/openapi')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cachear copias de 200 en background
        if (
          response.ok &&
          (request.destination === 'document' ||
            request.destination === 'style' ||
            request.destination === 'script')
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  );
});
