// Service worker for the Lịch âm section (scope /vi/lich-am/).
// Pages: network first, falling back to the last cached copy when offline.
// Built assets and images: served from cache, refreshed in the background.
const VERSION = 'lv-1';
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const PRECACHE = [
  '/vi/lich-am/',
  '/vi/lich-am/doi-ngay-am-duong/',
  '/vi/lich-am/dem-ngay/',
  '/vi/lich-am/xem-ngay-tot/',
  '/vi/lich-am/tien-ich/',
  '/vi/lich-am/tien-ich/ngay-gio/',
  '/vi/lich-am/tien-ich/thu-chi/',
  '/vi/lich-am/tien-ich/ghi-chu/',
  '/vi/lich-am/tien-ich/thai-ky/',
  '/vi/lich-am/tien-ich/lich-tiem-chung/',
  '/vi/lich-am/tien-ich/lich-ca/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGES).then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.endsWith('.ics')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && url.pathname.startsWith('/vi/lich-am/')) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(url.pathname)) || (await caches.match('/vi/lich-am/')) || Response.error()),
    );
    return;
  }

  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => cached);
        return cached || network;
      }),
    );
  }
});
