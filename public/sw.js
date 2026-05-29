/* Paperly service worker — offline app shell + runtime asset caching.
 *
 * Strategy:
 *  - Navigations (HTML): network-first, falling back to the cached shell so
 *    the app opens offline. Keeps users on the latest deploy when online.
 *  - Content-hashed build assets (/assets/*): cache-first. Filenames change
 *    every build, so a cached entry can never be stale.
 *  - Same-origin static files (icons, manifest, favicon): stale-while-revalidate.
 *  - Cross-origin Google Fonts: stale-while-revalidate so type renders offline
 *    after first visit; misses fall back to the CSS system-font stack.
 *
 * The CACHE_VERSION is bumped to invalidate everything on a breaking change;
 * old caches are swept on activate.
 */
const CACHE_VERSION = "paperly-v1";
const SHELL_URL = "/index.html";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon.svg",
];
const FONT_ORIGINS = [
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      // addAll is atomic-ish but a single 404 rejects it; precache items are
      // known-good static files, so this is safe.
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never interfere with non-GET (no writes happen over the network anyway).
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // App navigations: network-first with a cached-shell fallback for offline.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstShell(request));
    return;
  }

  // Cross-origin: only the font origins, stale-while-revalidate.
  if (url.origin !== self.location.origin) {
    if (FONT_ORIGINS.includes(url.origin)) {
      event.respondWith(staleWhileRevalidate(request));
    }
    return;
  }

  // Hashed build assets are immutable → cache-first.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Other same-origin statics → stale-while-revalidate.
  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirstShell(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const fresh = await fetch(request);
    // Keep the shell copy current for the next offline open.
    cache.put(SHELL_URL, fresh.clone());
    return fresh;
  } catch {
    return (
      (await cache.match(request)) ||
      (await cache.match(SHELL_URL)) ||
      Response.error()
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && fresh.ok) cache.put(request, fresh.clone());
  return fresh;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((fresh) => {
      // Cache successful and opaque (cross-origin font) responses alike.
      if (fresh && (fresh.ok || fresh.type === "opaque")) {
        cache.put(request, fresh.clone());
      }
      return fresh;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}
