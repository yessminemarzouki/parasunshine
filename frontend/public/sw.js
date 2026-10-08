const CACHE_NAME = "parasunshine-v2";
const API_CACHE = "parasunshine-api-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting(); // active la nouvelle version immédiatement, sans attendre la fermeture des onglets
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/", "/index.html"]);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Prend le contrôle de tous les onglets ouverts immédiatement
      self.clients.claim(),
      // Supprime tous les anciens caches (v1 et antérieurs)
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key !== CACHE_NAME && key !== API_CACHE)
              .map((key) => caches.delete(key)),
          ),
        ),
    ]),
  );
});

// Routes authentifiées / spécifiques à un utilisateur — jamais mises en cache
const NEVER_CACHE_PATTERNS = [
  "/api/me",
  "/api/user",
  "/api/orders",
  "/api/addresses",
  "/api/wishlist",
  "/api/reviews/check",
  "/api/admin",
  "/checkout",
  "/order-confirmation",
];

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore tout ce qui n'est pas une requête GET
  if (request.method !== "GET") return;

  const isNeverCache = NEVER_CACHE_PATTERNS.some((pattern) =>
    url.pathname.startsWith(pattern),
  );

  // Routes sensibles/authentifiées : toujours réseau, jamais de cache
  if (isNeverCache) {
    event.respondWith(fetch(request));
    return;
  }

  // Routes API publiques : stale-while-revalidate
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            })
            .catch(() => response);

          return response || fetchPromise;
        });
      }),
    );
    return;
  }

  // Ne jamais servir du cache pour les pages HTML dynamiques
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    }),
  );
});
