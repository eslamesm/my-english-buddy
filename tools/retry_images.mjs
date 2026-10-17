/* Retry a few failed words with better Wikipedia titles */
import fs from 'fs';
import path from 'path';

const OUT = 'C:\\EnglishKids\\img';
const idx = JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8'));

const OVER = {
  orange: ['Orange (fruit)'], queen: ['Queen (chess piece)'], table: ['Table (furniture)'],
  doctor: ['Physician'], church: ['Church (building)'], class: ['Classroom'],
  shop: ['Retail'], station: ['Train station'], wind: ['Wind'],
  run: ['Running'], jump: ['Jumping'], swim: ['Swimming'], read: ['Reading (process)'],
  play: ['Play (activity)'], book: ['Book'], milk: ['Milk'], cake: ['Cake'],
  ball: ['Ball'], star: ['Star'], egg: ['Egg'], fish: ['Fish'],
  house: ['House'], car: ['Car'], tree: ['Tree'], flower: ['Flower'],
  banana: ['Banana'], rabbit: ['Rabbit'], water: ['Water'], sun: ['Sun'],
  song: ['Song'], friend: ['Friend'], school: ['School'], home: ['Home'], family: ['Family']
};
const todo = Object.entries(OVER).filter(([s]) => !idx[s]);

async function api(title, tries = 0) {
  if (tries > 4) return null;
  try {
    const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&pithumbsize=420&redirects=1&converttitles=1&titles=' + encodeURIComponent(title);
    const r = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'EnglishKidsLocalTool/1.0' } });
    if (r.status === 429) { await new Promise((res) => setTimeout(res, 4000 * (tries + 1))); return api(title, tries + 1); }
    if (!r.ok) return null;
    const j = await r.json();
    const first = Object.values((j.query && j.query.pages) || {}).find((p) => p.thumbnail && p.thumbnail.source);
    if (!first) return null;
    return first.thumbnail.source.split('?')[0];
  } catch (e) { await new Promise((res) => setTimeout(res, 1500 * (tries + 1))); return api(title, tries + 1); }
}

function looks(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return '.jpg';
  if (buf[0] === 0x89 && buf[1] === 0x50) return '.png';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF') return '.webp';
  if (buf.subarray(0, 4).toString('latin1') === 'GIF8') return '.gif';
  return null;
}

let ok = 0;
for (const [s, titles] of todo) {
  let got = null;
  for (const t of titles) { got = await api(t); if (got) break; }
  if (got) {
    try {
      const img = await fetch(got, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'EnglishKidsLocalTool/1.0' } });
      if (img.ok) {
        const buf = Buffer.from(await img.arrayBuffer());
        const ext = looks(buf);
        if (ext) { fs.writeFileSync(path.join(OUT, s + ext), buf); idx[s] = 'img/' + s + ext; ok++; console.log('ok', s); }
      }
    } catch (e) { /* ignore */ }
  }
  await new Promise((res) => setTimeout(res, 300));
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(idx, null, 0));
console.log('retry ok:', ok, 'total now:', Object.keys(idx).length);