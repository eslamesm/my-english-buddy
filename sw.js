/* English Kids - Service Worker v4
   - Navigation (index.html) is network-first: you always see the latest version online,
     and the newest copy is cached for offline use.
   - Static files are cache-first with runtime population. */
const CACHE = 'englishkids-v62';
const CORE = [
  "./content/grammar-expansion.js",
  "./content/context-course.js",
  "./content/support-course.js",
  "./support-course.js",
  "./support-course-ui.js",
  "./audio/words/apple.wav",
  "./audio/words/bag.wav",
  "./audio/words/ball.wav",
  "./audio/words/bed.wav",
  "./audio/words/big.wav",
  "./audio/words/book.wav",
  "./audio/words/cat.wav",
  "./audio/words/cup.wav",
  "./audio/words/dog.wav",
  "./audio/words/duck.wav",
  "./audio/words/father.wav",
  "./audio/words/fish.wav",
  "./audio/words/hat.wav",
  "./audio/words/hop.wav",
  "./audio/words/log.wav",
  "./audio/words/pen.wav",
  "./audio/words/pig.wav",
  "./audio/words/rabbit.wav",
  "./audio/words/red.wav",
  "./audio/words/run.wav",
  "./audio/words/shop.wav",
  "./audio/words/sister.wav",
  "./audio/words/sun.wav",
  "./audio/words/tiger.wav",

  "./",
  "./index.html",
  "./engine.js",
  "./placement.js",
  "./progression-exam.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./img/buddy.svg",
  "./img/logo-compact.svg",
  "./img/logo-full.svg",
  "./img/logo-ar.svg",
  "./vosk/vosk.js",
  "./audio/teacher/hello.wav",
  "./audio/teacher/intro_letters.wav",
  "./audio/teacher/intro_words.wav",
  "./audio/teacher/intro_phrases.wav",
  "./audio/teacher/intro_sentences.wav",
  "./audio/teacher/intro_review.wav",
  "./audio/teacher/intro_recall.wav",
  "./audio/teacher/your_turn.wav",
  "./audio/teacher/listen_again.wav",
  "./audio/teacher/praise3.wav",
  "./audio/teacher/praise3b.wav",
  "./audio/teacher/praise2.wav",
  "./audio/teacher/praise1.wav",
  "./audio/teacher/praise0.wav",
  "./audio/teacher/cheer.wav",
  "./assets/fonts/cairo-arabic-400-normal.woff2",
  "./assets/fonts/cairo-arabic-700-normal.woff2",
  "./assets/fonts/cairo-arabic-800-normal.woff2",
  "./assets/fonts/cairo-latin-400-normal.woff2",
  "./assets/fonts/cairo-latin-700-normal.woff2",
  "./assets/fonts/cairo-latin-800-normal.woff2",
  // Islamic storybook art (tools/gen_art.mjs)
  "./img/art/map.js",
  "./img/art/index.json",
  
  ];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      // Cache core files individually so one missing/failed optional asset
      // can never break the whole install (addAll is all-or-nothing).
      // Entry HTML is re-fetched (cache:'reload') so a new SW never
      // precaches a stale copy; everything else uses the normal HTTP cache.
      Promise.all(CORE.map((url) => {
        const fresh = (url === './' || url === './index.html');
        return c.add(new Request(url, fresh ? {cache:'reload'} : undefined)).catch(() => {});
      }))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // HTML navigation: network-first (always fresh when online)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.open(CACHE).then((c) => c.match(req)).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Other assets: cache-first
  event.respondWith(
    caches.open(CACHE).then((cached) => cached.match(req)).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        })
        // Never answer a failed asset (audio/image/model/js…) with HTML:
        // return a real 404 so <img onerror>, audio fallbacks and model
        // loading code can detect the failure and fall back correctly.
        .catch(() => new Response('', {status:404, statusText:'Not Found'}));
    })
  );
});