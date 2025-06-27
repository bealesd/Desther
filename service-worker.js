const CACHE_NAME = "desther-cache-v1.0.0";
const urlsToCache = [
  "./",
  "./index.html",
  "./404.html",
  "./index.css",
  "./helpers/router.js",
  "./helpers/routes.js",
  "./config.js",
  './helpers/logger.js',
  './helpers/loginHelper.js',
  '.assets//icons/icon-72x72.png',
  '.assets//icons/icon-96x96.png',
  '.assets//icons/icon-128x128.png',
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
