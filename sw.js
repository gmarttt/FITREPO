// FITFAT · service worker v3
// Red primero (ignorando la caché HTTP de GitHub) y, si no hay conexión, la copia guardada.
const C = "fitfat-v3";

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(C).then(c =>
      Promise.all(["./", "./index.html"].map(f => c.add(new Request(f, { cache: "reload" })).catch(() => {})))
    )
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(C);
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), r.mode === "navigate" ? 4000 : 8000);
      const n = await fetch(r, { cache: "reload", signal: ctl.signal });
      clearTimeout(t);
      if (n && n.ok) c.put(r, n.clone());
      return n;
    } catch (err) {
      return (await c.match(r)) || (await c.match("./index.html")) || (await c.match("./")) || Response.error();
    }
  })());
});
