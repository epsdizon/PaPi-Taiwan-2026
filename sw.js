/* PaPi Taiwan 2026 — offline support.
   The site keeps working with weak signal: pages come from the network first, then from this cache.
   Bump VERSION whenever site files change. */
const VERSION = 'papi-2026-v23';
const PHOTOS = 'papi-photos-v1';
const TILES = 'papi-tiles-v1'; // map tiles you've already seen, for weak signal
const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/style.css',
  'assets/data.js',
  'assets/outfit.js',
  'assets/app.js',
  'assets/icons/icon-192.png',
  'assets/van-seating.webp',
  'assets/van-seating-tours.webp',
  'assets/van-seating-home.webp',
  'assets/vendor/leaflet/leaflet.js',
  'assets/vendor/leaflet/leaflet.css',
  'assets/fonts/sofia-sans-latin-wght-normal.woff2',
  'assets/fonts/sofia-sans-extra-condensed-latin-wght-normal.woff2',
  'assets/fonts/noto-sans-tc-400.woff2',
  'assets/fonts/noto-sans-tc-900.woff2',
];
const API_HOSTS = /(^|\.)wikipedia\.org$|(^|\.)wikimedia\.org$|jsdelivr\.net$|currency-api\.pages\.dev$|er-api\.com$|open-meteo\.com$/;

self.addEventListener('install', (e) => {
  // cache: 'reload' skips the browser's own cache, so a new version never stores old files
  e.waitUntil(caches.open(VERSION)
    .then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![VERSION, PHOTOS, TILES].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    // Ask the server every time (cheap when nothing changed), so updates show right away
    e.respondWith(networkFirst(req, VERSION, 3500, new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })));
  } else if (/(^|\.)basemaps\.cartocdn\.com$/.test(url.hostname)) {
    e.respondWith(tileFirst(req));
  } else if (url.hostname === 'upload.wikimedia.org') {
    e.respondWith(cacheFirst(req, PHOTOS));
  } else if (API_HOSTS.test(url.hostname)) {
    e.respondWith(networkFirst(req, PHOTOS, 6000));
  }
});

async function networkFirst(req, name, waitMs, netReq) {
  const cache = await caches.open(name);
  const fallback = async () => (await cache.match(req, { ignoreSearch: req.mode === 'navigate' })) || (req.mode === 'navigate' ? cache.match('index.html') : undefined);
  const net = fetch(netReq || req).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  });
  net.catch(() => {});
  const slow = new Promise((resolve) => {
    setTimeout(async () => { const hit = await fallback(); if (hit) resolve(hit); }, waitMs);
  });
  try {
    return await Promise.race([net, slow]);
  } catch (err) {
    const hit = await fallback();
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
  return res;
}

// Map tiles: from the cache when we have them; keep the newest 800 or so (about 30 MB)
async function tileFirst(req) {
  const cache = await caches.open(TILES);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) {
    cache.put(req, res.clone()).then(() => { if (Math.random() < 0.05) trimCache(cache, 800); }).catch(() => {});
  }
  return res;
}

async function trimCache(cache, max) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i += 1) await cache.delete(keys[i]);
}
