const CACHE_NAME = "easyagrotech-pwa-v2";

// only shell, NOT data
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
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // ❌ never touch auth or sockets
  if (
    url.pathname.startsWith("/user_auth") ||
    url.pathname.includes("/socket.io/") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  // HTML → network first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
