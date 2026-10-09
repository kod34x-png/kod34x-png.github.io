// Seyr — uygulama kabuğunu önbellekte tutar; canlı yayınlar her zaman internetten gelir.
const CACHE = "seyr-v6";
const SHELL = ["./", "index.html", "style.css", "app.js", "cams.js", "manifest.webmanifest", "icons/icon-192.png", "lib/leaflet/leaflet.js", "lib/leaflet/leaflet.css", "lib/land.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // Önce internet, olmazsa önbellek: yeni sürüm her zaman hemen gelir.
  e.respondWith(
    fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./")))
  );
});
