/* English Kids - Service Worker v4
   - Navigation (index.html) is network-first: you always see the latest version online,
     and the newest copy is cached for offline use.
   - Static files are cache-first with runtime population. */
const CACHE = 'englishkids-v20';
const CORE = [
  "./",
  "./index.html",
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
  "./img/ambition.jpg",
  "./img/angry.jpg",
  "./img/apple.jpg",
  "./img/argument.png",
  "./img/art.jpg",
  "./img/bag.jpg",
  "./img/baker.jpg",
  "./img/ball.jpg",
  "./img/banana.jpg",
  "./img/basketball.jpg",
  "./img/bathroom.jpg",
  "./img/beach.jpg",
  "./img/bedroom.jpg",
  "./img/bird.jpg",
  "./img/blue.jpg",
  "./img/book.jpg",
  "./img/bread.jpg",
  "./img/breakfast.jpg",
  "./img/brother.jpg",
  "./img/cake.jpg",
  "./img/camel.jpg",
  "./img/camera.jpg",
  "./img/car.jpg",
  "./img/carrot.jpg",
  "./img/cartoon.jpg",
  "./img/cat.jpg",
  "./img/chair.jpg",
  "./img/cheese.jpg",
  "./img/chicken.jpg",
  "./img/church.jpg",
  "./img/class.jpg",
  "./img/climate.jpg",
  "./img/cold.jpg",
  "./img/compare.jpg",
  "./img/computer.jpg",
  "./img/cooperation.jpg",
  "./img/cow.jpg",
  "./img/cucumber.jpg",
  "./img/culture.jpg",
  "./img/dad.jpg",
  "./img/desert.jpg",
  "./img/doctor.jpg",
  "./img/dog.jpg",
  "./img/doll.jpg",
  "./img/door.png",
  "./img/drink.jpg",
  "./img/eat.jpg",
  "./img/education.jpg",
  "./img/egg.jpg",
  "./img/email.png",
  "./img/engineer.jpg",
  "./img/evening.jpg",
  "./img/eye.jpg",
  "./img/family.jpg",
  "./img/farmer.jpg",
  "./img/father.jpg",
  "./img/fish.jpg",
  "./img/flower.jpg",
  "./img/football.jpg",
  "./img/fox.jpg",
  "./img/friend.jpg",
  "./img/frog.jpg",
  "./img/future.jpg",
  "./img/garden.jpg",
  "./img/goat.jpg",
  "./img/grapes.jpg",
  "./img/green.jpg",
  "./img/guide.jpg",
  "./img/happy.jpg",
  "./img/hat.jpg",
  "./img/headache.jpg",
  "./img/helpful.jpg",
  "./img/holiday.jpg",
  "./img/home.jpg",
  "./img/homework.jpg",
  "./img/horse.jpg",
  "./img/hospital.jpg",
  "./img/house.jpg",
  "./img/ice.jpg",
  "./img/improve.png",
  "./img/interesting.jpg",
  "./img/inventor.jpg",
  "./img/juice.jpg",
  "./img/jump.jpg",
  "./img/kitchen.jpg",
  "./img/kite.jpg",
  "./img/knowledge.jpg",
  "./img/lion.jpg",
  "./img/lunch.jpg",
  "./img/math.jpg",
  "./img/meat.jpg",
  "./img/medicine.jpg",
  "./img/message.jpg",
  "./img/milk.jpg",
  "./img/mom.jpg",
  "./img/monkey.jpg",
  "./img/moon.jpg",
  "./img/morning.jpg",
  "./img/mosque.jpg",
  "./img/mother.jpg",
  "./img/mountain.jpg",
  "./img/mouth.jpg",
  "./img/museum.jpg",
  "./img/music.jpg",
  "./img/nest.jpg",
  "./img/nose.png",
  "./img/nurse.jpg",
  "./img/onion.jpg",
  "./img/opinion.jpg",
  "./img/orange.jpg",
  "./img/pen.jpg",
  "./img/pencil.jpg",
  "./img/performance.jpg",
  "./img/pig.jpg",
  "./img/pilot.jpg",
  "./img/pizza.jpg",
  "./img/play.jpg",
  "./img/policeman.jpg",
  "./img/pollution.jpg",
  "./img/potato.jpg",
  "./img/present.jpg",
  "./img/pyramid.jpg",
  "./img/rabbit.jpg",
  "./img/rain.jpg",
  "./img/read.jpg",
  "./img/red.jpg",
  "./img/research.png",
  "./img/respect.jpg",
  "./img/rice.jpg",
  "./img/river.jpg",
  "./img/run.jpg",
  "./img/sad.jpg",
  "./img/school.jpg",
  "./img/sea.jpg",
  "./img/sheep.jpg",
  "./img/shop.jpg",
  "./img/sister.jpg",
  "./img/sleep.jpg",
  "./img/social.jpg",
  "./img/song.jpg",
  "./img/star.jpg",
  "./img/station.jpg",
  "./img/street.jpg",
  "./img/student.jpg",
  "./img/success.jpg",
  "./img/sun.jpg",
  "./img/swim.jpg",
  "./img/swimming.jpg",
  "./img/table.jpg",
  "./img/tea.jpg",
  "./img/teacher.jpg",
  "./img/technology.jpg",
  "./img/tennis.jpg",
  "./img/tiger.jpg",
  "./img/tomato.jpg",
  "./img/tooth.png",
  "./img/tourist.jpg",
  "./img/travel.jpg",
  "./img/tree.jpg",
  "./img/umbrella.jpg",
  "./img/van.jpg",
  "./img/watch.jpg",
  "./img/water.png",
  "./img/watermelon.jpg",
  "./img/weather.jpg",
  "./img/wind.gif",
  "./img/window.jpg",
  "./img/yellow.jpg",
  "./img/yoyo.jpg",
  "./img/zebra.jpg",
  "./img/zoo.jpg"
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {}))
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
        .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // Other assets: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});