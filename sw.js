const CACHE_NAME = "vocalgym-v06";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./js/audio.js",
  "./js/gamification.js",
  "./js/notation.js",
  "./js/pitch-worklet.js",
  "./js/recorder.js",
  "./js/range.js",
  "./js/storage.js",
  "./js/timing.js",
  "./js/ui/header.js",
  "./js/ui/history.js",
  "./js/ui/metronome.js",
  "./js/ui/notation.js",
  "./js/ui/pitch-monitor.js",
  "./js/ui/range.js",
  "./js/ui/rewards.js",
  "./js/ui/recordings.js",
  "./js/ui/routine.js",
  "./js/ui/safety.js",
  "./js/ui/settings.js",
  "./js/ui/shell.js",
  "./assets/exercises/chromatic.musicxml",
  "./assets/exercises/arpeggio-major.musicxml",
  "./assets/exercises/scale-major.musicxml",
  "./assets/exercises/scale-minor.musicxml",
  "./assets/exercises/fifths-fast.musicxml",
  "./assets/exercises/laxvox-segundas.musicxml",
  "./assets/exercises/laxvox-segundas-dobles.musicxml",
  "./assets/exercises/laxvox-terceras.musicxml",
  "./assets/exercises/laxvox-terceras-dobles.musicxml",
  "./assets/exercises/ming-oh.musicxml",
  "./assets/exercises/name-ney.musicxml",
  "./assets/exercises/vi-va.musicxml",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const cdn =
    url.hostname === "cdn.tailwindcss.com" ||
    url.hostname === "unpkg.com" ||
    url.hostname === "cdn.jsdelivr.net";
  if (cdn) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }
  if (url.origin !== self.location.origin) {
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
