/* PaPi Taiwan 2026 — offline support.
   The site keeps working with weak signal: pages come from the network first, then from this cache.
   Bump VERSION whenever site files change. */
const VERSION = 'papi-2026-v1';
const PHOTOS = 'papi-photos-v1';
const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/style.css',
  'assets/data.js',
  'assets/app.js',
  'assets/icons/icon-192.png',
  'assets/fonts/sofia-sans-latin-wght-normal.woff2',
  'assets/fonts/sofia-sans-extra-condensed-latin-wght-normal.woff2',
  'assets/fonts/noto-sans-tc-400.woff2',
  'assets/fonts/noto-sans-tc-900.woff2',
];
const API_HOSTS = /(^|\.)wikipedia\.org$|(^|\.)wikimedia\.org$|jsdelivr\.net$|currency-api\.pages\.dev$|er-api\.com$/;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== PHOTOS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    e.respondWith(networkFirst(req, VERSION, 3500));
  } else if (url.hostname === 'upload.wikimedia.org') {
    e.respondWith(cacheFirst(req, PHOTOS));
  } else if (API_HOSTS.test(url.hostname)) {
    e.respondWith(networkFirst(req, PHOTOS, 6000));
  }
});

async function networkFirst(req, name, waitMs) {
  const cache = await caches.open(name);
  const fallback = async () => (await cache.match(req)) || (req.mode === 'navigate' ? cache.match('index.html') : undefined);
  const net = fetch(req).then((res) => {
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
