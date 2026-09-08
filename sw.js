/* BEYOND PWA — кэш оболочки. Прогресс в Firebase / localStorage. */
const CACHE = "beyond-shell-v4";

function shellUrls() {
  const base = self.registration.scope;
  return [
    base,
    base + "index.html",
    base + "manifest.webmanifest",
    base + "css/app.css",
    base + "css/auth.css",
    base + "css/character.css",
    base + "css/books.css",
    base + "css/life-features.css",
    base + "css/daybook.css",
    base + "js/main.js",
    base + "js/app.js",
    base + "js/cloud.js",
    base + "js/firebase-config.js",
    base + "js/life-features.js",
    base + "js/daybook.js",
    base + "icons/icon-192.png",
    base + "icons/icon-512.png",
    base + "icons/icon-180.png",
    base + "icons/icon-32.png",
    base + "icons/red-john.png",
  ];
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        shellUrls().map((url) =>
          cache.add(url).catch(() => null)
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isNav = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  const isFresh = /\.(js|css|webmanifest)$/i.test(url.pathname) || /\/icons\/red-john\.png$/i.test(url.pathname);

  // HTML + JS/CSS — сеть первее, чтобы обновления доходили на ПК
  if (isNav || isFresh) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match(self.registration.scope + "index.html"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
