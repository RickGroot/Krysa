// Krysa service worker: the app shell works offline, data comes from Supabase
// (and the app's own localStorage cache) and is never cached here.
const CACHE = "krysa-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const net = fetch(req)
    .then((res) => {
      if (res.ok || res.type === "opaque") cache.put(req, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || net;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") e.respondWith(staleWhileRevalidate(req));
    return; // Supabase and everything else: straight to the network
  }
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html")),
    );
    return;
  }
  e.respondWith(staleWhileRevalidate(req));
});

// Push notifications from the krysa-notify Supabase function (see README).
self.addEventListener("push", (e) => {
  let m = {};
  try {
    m = e.data ? e.data.json() : {};
  } catch {
    m = { body: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(m.title || "Krysa", {
      body: m.body || "",
      icon: "icons/icon-192.png",
      tag: m.tag,
      silent: !!m.silent,
      data: { tab: m.tab, url: m.url },
    }),
  );
});

// Tapping one opens its link (the airline's check-in page), or the app on the right tab.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const { tab, url } = e.notification.data || {};
  e.waitUntil(
    (async () => {
      if (typeof url === "string" && url.startsWith("https://")) return self.clients.openWindow(url);
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const app = wins.find((w) => w.url.startsWith(self.registration.scope));
      if (app) {
        await app.focus();
        if (tab) app.postMessage({ krysaTab: tab });
        return;
      }
      return self.clients.openWindow(tab ? `./#${tab}` : "./");
    })(),
  );
});
