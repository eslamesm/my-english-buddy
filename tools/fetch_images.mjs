/* Fetch real photos from Wikipedia pageimages for every word in index.html */
import fs from 'fs';
import path from 'path';

const HTML = fs.readFileSync('C:\\EnglishKids\\index.html', 'utf8');
const OUT = 'C:\\EnglishKids\\img';
fs.mkdirSync(OUT, { recursive: true });

// 1) collect unique words: either `word:'Apple'` (letters) or `t:'Apple'` (all other lists)
const words = new Set();
const reWord = /word:'([^']+)'/g; let m;
while ((m = reWord.exec(HTML))) words.add(m[1]);
const reT = /t:'([^']+)'/g;
while ((m = reT.exec(HTML))) {
  const w = m[1];
  if (!/^\s*$/.test(w)) words.add(w);
}
const phraseSet = new Set(['Good morning','Good night','Thank you','You are welcome','How are you','I am fine','My name is','I love you','Excuse me','See you later','Good luck','Happy birthday','I like to play football','My favorite color is blue','The sun is very bright today','I have a little cat at home','Can I have some water please','My mother makes a delicious cake','We go to school every morning','The bird sings a beautiful song','I want to learn English very well','Yesterday I played with my friends']);
const numerals = new Set(['One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen','Twenty']);
const greetings = new Set(['Hello','Bye','Hi','Yes','No','What','Where','When','Who','Why']);
const skip = new Set(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']);
const all = [...words].filter(w=>!phraseSet.has(w)&&!numerals.has(w)&&!greetings.has(w)&&!skip.has(w)&&/^[A-Za-z]/.test(w));
const slug = w => w.toLowerCase().replace(/[^a-z0-9]+/g, '');
const uniq = new Map();
for (const w of all) if (!uniq.has(slug(w))) uniq.set(slug(w), w);
const list = [...uniq.entries()];
console.log('unique words to fetch:', list.length);

// resume support: skip words already fetched
const existing = {};
const idx = 'C:\\EnglishKids\\img\\index.json';
if (fs.existsSync(idx)) { Object.assign(existing, JSON.parse(fs.readFileSync(idx, 'utf8'))); }
const todo = list.filter(([s]) => !existing[s]);
console.log('already have:', list.length - todo.length, 'to fetch:', todo.length);

async function api(title, tries = 0) {
  if (tries > 4) return null;
  try {
    const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&pithumbsize=420&redirects=1&converttitles=1&titles=' + encodeURIComponent(title);
    const r = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'EnglishKidsLocalTool/1.0 (offline asset builder; contact: none)' } });
    if (r.status === 429) {
      await new Promise(res => setTimeout(res, 4000 * (tries + 1)));
      return api(title, tries + 1);
    }
    if (!r.ok) return `ERR:${r.status}`;
    const j = await r.json();
    const pages = (j.query && j.query.pages) || {};
    const first = Object.values(pages).find(p => p.thumbnail && p.thumbnail.source);
    if (!first) return 'NONE';
    const src = first.thumbnail.source.split('?')[0];
    const ext = (path.extname(src) || '.jpg').split(/[?#]/)[0] || '.jpg';
    return { src, ext };
  } catch (e) {
    await new Promise(res => setTimeout(res, 1500 * (tries + 1)));
    return api(title, tries + 1);
  }
}

const TYPES = new Map();
for (const [e, sig] of [['.jpg', [[0xff, 0xd8]]], ['.png', [[0x89, 0x50]]], ['.webp', [['RIFF']]], ['.gif', [['GIF8']]]]) TYPES.set(e, sig);

function LooksLikeImage(buf) {
  for (const [ext, sigs] of TYPES) {
    for (const sig of sigs) {
      if (typeof sig === 'string') { if (buf.subarray(0, 4).toString('latin1') === sig) return ext; }
      else { let ok = true; for (let i = 0; i < sig.length; i++) if (buf[i] !== sig[i]) { ok = false; break; } if (ok) return ext; }
    }
  }
  return null;
}

const ok = [], fail = [];
for (let i = 0; i < todo.length; i++) {
  const [s, word] = todo[i];
  const title = word.split(' ')[0]; // single-word lookup for multiword titles
  const res = await api(title);
  if (res && res.src) {
    let ext = res.ext.toLowerCase();
    if (ext === '.jpeg') ext = '.jpg';
    let target = null;
    try {
      const img = await fetch(res.src, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'EnglishKidsLocalTool/1.0' } });
      if (img.ok) {
        const buf = Buffer.from(await img.arrayBuffer());
        const real = LooksLikeImage(buf);
        if (real) {
          ext = real;
          target = path.join(OUT, s + ext);
          fs.writeFileSync(target, buf);
          ok.push([s, path.basename(target)]);
        } else fail.push([word, 'badfmt']);
      } else fail.push([word, 'http:' + img.status]);
    } catch (e) { fail.push([word, 'dl']); }
  } else fail.push([word, res || 'none']);
  if ((i + 1) % 12 === 0) console.log(`${i + 1}/${todo.length} ok this run:${ok.length}`);
  await new Promise(res => setTimeout(res, 280));
}

fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ ...existing, ...Object.fromEntries(ok) }, null, 0));
fs.writeFileSync(path.join(OUT, 'MAP.json'), JSON.stringify({ ...existing, ...Object.fromEntries(ok) }, null, 0));
console.log('DONE ok:', ok.length, 'fail:', fail.length, '(total success so far:', Object.keys({ ...existing, ...Object.fromEntries(ok) }).length, ')');
console.log('FAILS sample:', JSON.stringify(fail.slice(0, 60)));
fs.writeFileSync('C:\\Users\\ik\\AppData\\Local\\Temp\\opencode\\ektest\\img_fail.txt', JSON.stringify(fail, null, 0));