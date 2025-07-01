self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("r-chop-cache").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./styles.css",
        "./script.js",
        "./manifest.json",
        "./icon-192.png",
        "./icon-512.png"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Actualiza caché con la versión nueva
        const clone = response.clone();
        caches.open("r-chop-cache").then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Si no hay conexión, usa lo que haya en caché
        return caches.match(event.request);
      })
  );
});