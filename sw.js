/* English Kids - Service Worker v4
   - Navigation (index.html) is network-first: you always see the latest version online,
     and the newest copy is cached for offline use.
   - Static files are cache-first with runtime population. */
const CACHE = 'englishkids-v27';
const CORE = [
  "./",
  "./index.html",
  "./engine.js",
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
  // Islamic storybook art (tools/gen_art.mjs)
  "./img/art/map.js",
  "./img/art/index.json",
  "./img/art/hero.svg",
  "./img/art/a.svg","./img/art/achievement.svg","./img/art/adventure.svg","./img/art/advice.svg","./img/art/after.svg","./img/art/ambition.svg","./img/art/angry.svg","./img/art/animals.svg","./img/art/apple.svg","./img/art/april.svg","./img/art/argument.svg","./img/art/arm.svg","./img/art/arms.svg","./img/art/art.svg","./img/art/august.svg","./img/art/b.svg","./img/art/bag.svg","./img/art/baker.svg","./img/art/ball.svg","./img/art/banana.svg","./img/art/basketball.svg","./img/art/bat.svg","./img/art/bathroom.svg","./img/art/beach.svg","./img/art/beautiful.svg","./img/art/bed.svg","./img/art/bedroom.svg","./img/art/before.svg","./img/art/big.svg","./img/art/bird.svg","./img/art/blue.svg","./img/art/board.svg","./img/art/book.svg","./img/art/boy.svg","./img/art/brave.svg","./img/art/bread.svg","./img/art/breakfast.svg","./img/art/brother.svg","./img/art/building.svg","./img/art/bus.svg","./img/art/butterfly.svg","./img/art/c.svg","./img/art/cake.svg","./img/art/camel.svg","./img/art/camera.svg","./img/art/canihavesomewaterplease.svg","./img/art/cap.svg","./img/art/car.svg","./img/art/carrot.svg","./img/art/cartoon.svg","./img/art/cat.svg","./img/art/catch.svg","./img/art/chair.svg","./img/art/chairs.svg","./img/art/challenge.svg","./img/art/cheese.svg","./img/art/chicken.svg","./img/art/chips.svg","./img/art/chocolate.svg","./img/art/church.svg","./img/art/circle.svg","./img/art/class.svg","./img/art/classroom.svg","./img/art/climate.svg","./img/art/closet.svg","./img/art/cloudy.svg","./img/art/cold.svg","./img/art/compare.svg","./img/art/computer.svg","./img/art/confidence.svg","./img/art/cooperation.svg","./img/art/couch.svg","./img/art/cow.svg","./img/art/crayon.svg","./img/art/cucumber.svg","./img/art/culture.svg","./img/art/cup.svg","./img/art/d.svg","./img/art/dad.svg","./img/art/december.svg","./img/art/decision.svg","./img/art/delicious.svg","./img/art/desert.svg","./img/art/desk.svg","./img/art/difficult.svg","./img/art/dig.svg","./img/art/diningroom.svg","./img/art/dinner.svg","./img/art/discuss.svg","./img/art/doctor.svg","./img/art/dog.svg","./img/art/doll.svg","./img/art/door.svg","./img/art/dress.svg","./img/art/duck.svg","./img/art/e.svg","./img/art/ears.svg","./img/art/easy.svg","./img/art/education.svg","./img/art/effort.svg","./img/art/egg.svg","./img/art/eggs.svg","./img/art/eight.svg","./img/art/elephant.svg","./img/art/email.svg","./img/art/encourage.svg","./img/art/engineer.svg","./img/art/english.svg","./img/art/environment.svg","./img/art/eraser.svg","./img/art/evening.svg","./img/art/excuseme.svg","./img/art/experience.svg","./img/art/explain.svg","./img/art/explore.svg","./img/art/eye.svg","./img/art/eyes.svg","./img/art/f.svg","./img/art/face.svg","./img/art/fall.svg","./img/art/family.svg","./img/art/famous.svg","./img/art/farm.svg","./img/art/farmer.svg","./img/art/father.svg","./img/art/february.svg","./img/art/feet.svg","./img/art/fish.svg","./img/art/five.svg","./img/art/flower.svg","./img/art/foot.svg","./img/art/football.svg","./img/art/four.svg","./img/art/fox.svg","./img/art/friday.svg","./img/art/fridge.svg","./img/art/friend.svg","./img/art/friendly.svg","./img/art/friends.svg","./img/art/fruits.svg","./img/art/future.svg","./img/art/g.svg","./img/art/garden.svg","./img/art/getup.svg","./img/art/giraffe.svg","./img/art/girl.svg","./img/art/goat.svg","./img/art/goodbye.svg","./img/art/goodluck.svg","./img/art/goodmorning.svg","./img/art/goodnight.svg","./img/art/gotobed.svg","./img/art/gotoschool.svg","./img/art/grandfather.svg","./img/art/grandmother.svg","./img/art/grapes.svg","./img/art/grass.svg","./img/art/green.svg","./img/art/group.svg","./img/art/guide.svg","./img/art/h.svg","./img/art/hair.svg","./img/art/hand.svg","./img/art/hands.svg","./img/art/happy.svg","./img/art/happybirthday.svg","./img/art/hat.svg","./img/art/head.svg","./img/art/headache.svg","./img/art/health.svg","./img/art/hear.svg","./img/art/hello.svg","./img/art/helpful.svg","./img/art/hit.svg","./img/art/holiday.svg","./img/art/home.svg","./img/art/homework.svg","./img/art/hop.svg","./img/art/horse.svg","./img/art/hospital.svg","./img/art/hot.svg","./img/art/house.svg","./img/art/howareyou.svg","./img/art/i.svg","./img/art/iamfine.svg","./img/art/ice.svg","./img/art/ihavealittlecatathome.svg","./img/art/iliketoplayfootball.svg","./img/art/iloveyou.svg","./img/art/important.svg","./img/art/improve.svg","./img/art/in.svg","./img/art/interesting.svg","./img/art/internet.svg","./img/art/inventor.svg","./img/art/iwanttolearnenglishverywell.svg","./img/art/j.svg","./img/art/january.svg","./img/art/journey.svg","./img/art/juice.svg","./img/art/july.svg","./img/art/jump.svg","./img/art/june.svg","./img/art/jungle.svg","./img/art/k.svg","./img/art/kick.svg","./img/art/kitchen.svg","./img/art/kite.svg","./img/art/knowledge.svg","./img/art/l.svg","./img/art/leg.svg","./img/art/legs.svg","./img/art/lion.svg","./img/art/livingroom.svg","./img/art/log.svg","./img/art/lunch.svg","./img/art/m.svg","./img/art/march.svg","./img/art/mat.svg","./img/art/math.svg","./img/art/may.svg","./img/art/meat.svg","./img/art/medicine.svg","./img/art/men.svg","./img/art/message.svg","./img/art/milk.svg","./img/art/mom.svg","./img/art/monday.svg","./img/art/monkey.svg","./img/art/moon.svg","./img/art/morning.svg","./img/art/mosque.svg","./img/art/mother.svg","./img/art/mountain.svg","./img/art/mouth.svg","./img/art/mower.svg","./img/art/museum.svg","./img/art/music.svg","./img/art/myfavoritecolorisblue.svg","./img/art/mymothermakesadeliciouscake.svg","./img/art/mynameis.svg","./img/art/n.svg","./img/art/nest.svg","./img/art/net.svg","./img/art/night.svg","./img/art/nine.svg","./img/art/noon.svg","./img/art/nose.svg","./img/art/november.svg","./img/art/nurse.svg","./img/art/nut.svg","./img/art/o.svg","./img/art/october.svg","./img/art/on.svg","./img/art/one.svg","./img/art/onion.svg","./img/art/opinion.svg","./img/art/opportunity.svg","./img/art/orange.svg","./img/art/organize.svg","./img/art/oven.svg","./img/art/p.svg","./img/art/pants.svg","./img/art/parents.svg","./img/art/park.svg","./img/art/participate.svg","./img/art/pen.svg","./img/art/pencil.svg","./img/art/performance.svg","./img/art/pets.svg","./img/art/pig.svg","./img/art/pilot.svg","./img/art/pizza.svg","./img/art/plan.svg","./img/art/play.svg","./img/art/played.svg","./img/art/playground.svg","./img/art/policeman.svg","./img/art/pollution.svg","./img/art/pot.svg","./img/art/potato.svg","./img/art/practice.svg","./img/art/present.svg","./img/art/project.svg","./img/art/pyramid.svg","./img/art/q.svg","./img/art/queen.svg","./img/art/r.svg","./img/art/rabbit.svg","./img/art/rain.svg","./img/art/rainy.svg","./img/art/rat.svg","./img/art/read.svg","./img/art/reason.svg","./img/art/rectangle.svg","./img/art/red.svg","./img/art/research.svg","./img/art/respect.svg","./img/art/responsibility.svg","./img/art/result.svg","./img/art/rice.svg","./img/art/river.svg","./img/art/run.svg","./img/art/s.svg","./img/art/sad.svg","./img/art/sandwich.svg","./img/art/saturday.svg","./img/art/scared.svg","./img/art/school.svg","./img/art/science.svg","./img/art/sea.svg","./img/art/see.svg","./img/art/seeyoulater.svg","./img/art/september.svg","./img/art/seven.svg","./img/art/shakehands.svg","./img/art/share.svg","./img/art/shoes.svg","./img/art/shop.svg","./img/art/shorts.svg","./img/art/sink.svg","./img/art/sister.svg","./img/art/six.svg","./img/art/skill.svg","./img/art/skip.svg","./img/art/skirt.svg","./img/art/sky.svg","./img/art/slide.svg","./img/art/small.svg","./img/art/smell.svg","./img/art/snake.svg","./img/art/social.svg","./img/art/socks.svg","./img/art/song.svg","./img/art/spring.svg","./img/art/square.svg","./img/art/star.svg","./img/art/station.svg","./img/art/street.svg","./img/art/student.svg","./img/art/subject.svg","./img/art/success.svg","./img/art/suggest.svg","./img/art/summer.svg","./img/art/sun.svg","./img/art/sunday.svg","./img/art/sunny.svg","./img/art/surprised.svg","./img/art/swim.svg","./img/art/swimming.svg","./img/art/swing.svg","./img/art/t.svg","./img/art/table.svg","./img/art/taste.svg","./img/art/tea.svg","./img/art/teacher.svg","./img/art/technology.svg","./img/art/teeth.svg","./img/art/temperature.svg","./img/art/ten.svg","./img/art/tennis.svg","./img/art/thankyou.svg","./img/art/thebirdsingsabeautifulsong.svg","./img/art/thesunisverybrighttoday.svg","./img/art/three.svg","./img/art/throw.svg","./img/art/thursday.svg","./img/art/tiger.svg","./img/art/tired.svg","./img/art/today.svg","./img/art/toe.svg","./img/art/toilet.svg","./img/art/tomato.svg","./img/art/tomorrow.svg","./img/art/tongue.svg","./img/art/tooth.svg","./img/art/touch.svg","./img/art/tourist.svg","./img/art/travel.svg","./img/art/tree.svg","./img/art/triangle.svg","./img/art/trip.svg","./img/art/trousers.svg","./img/art/truck.svg","./img/art/tshirt.svg","./img/art/tuesday.svg","./img/art/turtle.svg","./img/art/tv.svg","./img/art/two.svg","./img/art/u.svg","./img/art/umbrella.svg","./img/art/under.svg","./img/art/v.svg","./img/art/van.svg","./img/art/visit.svg","./img/art/w.svg","./img/art/walk.svg","./img/art/warm.svg","./img/art/watch.svg","./img/art/water.svg","./img/art/watermelon.svg","./img/art/weather.svg","./img/art/wednesday.svg","./img/art/week.svg","./img/art/wegotoschooleverymorning.svg","./img/art/wind.svg","./img/art/window.svg","./img/art/windy.svg","./img/art/winter.svg","./img/art/wonderful.svg","./img/art/x.svg","./img/art/y.svg","./img/art/yellow.svg","./img/art/yesterday.svg","./img/art/yesterdayiplayedwithmyfriends.svg","./img/art/youarewelcome.svg","./img/art/yoyo.svg","./img/art/z.svg","./img/art/zebra.svg","./img/art/zoo.svg"
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