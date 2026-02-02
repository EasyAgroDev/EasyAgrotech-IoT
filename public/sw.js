const CACHE_NAME = "easyagrotech-pwa-v1";

// cache ONLY dashboard pages
const FILES_TO_CACHE = [
  "/app_data",
  "/app_data/profile",
  "/manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // ❌ never cache login, auth, socket.io
  if (
    url.pathname.startsWith("/user_auth") ||
    url.pathname === "/" ||
    url.pathname.includes("/socket.io/") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
