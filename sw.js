const CACHE_NAME = 'novaciencia-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/img/NovaCiencia/Logo_peqe.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      try { return cache.addAll(URLS_TO_CACHE); } catch (e) { return Promise.resolve(); }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Always try network first for API requests
  if (req.url.includes('/api/')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }
  // For navigation and assets use cache-first strategy
  event.respondWith(
    caches.match(req).then((resp) => resp || fetch(req).then((res) => {
      try { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); }catch(_){ }
      return res;
    }).catch(() => caches.match('/index.html')))
  );
});
