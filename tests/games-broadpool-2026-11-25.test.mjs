/* Broad pool: gameWordPool extracted from the REAL index.html, run with stub deps. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const a = html.indexOf('/* BROADPOOL_START */'), b = html.indexOf('/* BROADPOOL_END */');
assert.ok(a > 0 && b > a);
function pool(core, cur, pics, opts) {
  const sb = {
    wordBank: () => core, curriculumWords: () => cur,
    uniqByWord: (arr) => { const s = {}; return arr.filter((x) => { const k = x.t.toLowerCase(); if (s[k]) return false; s[k] = 1; return true; }); },
    pictureAssessmentWords: (ws) => ws.filter((w) => !['monday', 'march'].includes(w.t.toLowerCase())),
    picSrc: (t) => (pics.includes(t.toLowerCase()) ? 'x.png' : ''),
  };
  vm.createContext(sb);
  vm.runInContext(html.slice(a, b) + ';globalThis.R=gameWordPool(' + JSON.stringify(opts || {}) + ')', sb);
  return JSON.parse(JSON.stringify(sb.R));
}
const W = (...t) => t.map((x) => ({ t: x, emoji: 'e' }));
const core = W('cat', 'dog', 'sun', 'ball');
test('adds curriculum words, dedupes, drops multi-word and non-alphabetic entries', () => {
  const r = pool(core, W('Cat', 'good morning', 'it\'s', 'apple', 'pen'), []);
  assert.deepEqual(r.map((w) => w.t), ['cat', 'dog', 'sun', 'ball', 'apple', 'pen']);
});
test('minLen filter for spelling games', () => {
  assert.ok(pool(core, W('is', 'apple'), [], { minLen: 3 }).every((w) => w.t.length >= 3));
});
test('picture pool skips ambiguous calendar words and keeps emoji fallback', () => {
  const r = pool(core, W('Monday', 'March', 'apple'), ['apple'], { picture: true });
  assert.ok(!r.some((w) => /monday|march/i.test(w.t)));
  assert.ok(r.some((w) => w.t === 'apple'));
});
test('falls back to the core words when the pool would be under 4', () => {
  assert.deepEqual(pool(W('cat', 'dog'), [], []).map((w) => w.t), ['cat', 'dog']);
});
test('no learning-engine access in the broad pool block', () => {
  assert.ok(!/learnEvent|LearningEngine|bumpWordStar|progress\[/.test(html.slice(a, b)));
});

test('semantic guard: with the real ambiguity/temporal rules no temporal or ambiguous word reaches any picture pool', () => {
  const g = (n) => { const i = html.indexOf('function ' + n + '('); assert.ok(i >= 0, n); return html.slice(i, html.indexOf('\n', i)); };
  const tw = html.match(/const TEMPORAL_WORD_KEYS=new Set\([^\n]*\);/)[0];
  const sb = {};
  vm.createContext(sb);
  vm.runInContext(tw + '\n' + g('isTemporalWord') + '\n' + g('isPictureAmbiguousWord') + '\n' + g('pictureAssessmentWords') + '\n' + html.slice(a, b) +
    ';globalThis.run=(core,cur)=>{wordBank=()=>core;curriculumWords=()=>cur;uniqByWord=(x)=>{const s={};return x.filter(w=>!s[w.t.toLowerCase()]&&(s[w.t.toLowerCase()]=1))};picSrc=()=>"x";return {pic:gameWordPool({picture:true}).map(w=>w.t),listen:pictureAssessmentWords(gameWordPool()).map(w=>w.t)}}', sb);
  const bad = 'Monday Sunday March May October Yesterday Today Tomorrow Brave Interesting Delicious Wonderful Travel Holiday Played Important Project Famous Difficult Easy'.split(' ');
  const r = sb.run(W('cat', 'dog', 'sun', 'ball'), W(...bad, 'apple', 'pen', 'cup'));
  for (const k of ['pic', 'listen']) {
    bad.forEach((w) => assert.ok(!r[k].includes(w), k + ':' + w));
    assert.ok(r[k].includes('apple'));
  }
});
test('listen pool keeps the literal pictureAssessmentWords guard expected by temporal-assessment.test', () => {
  assert.match(html, /type==='listen'\?pictureAssessmentWords/);
});

test('picture-clue pool: abstract/verb/feeling/weather/colour/number/calendar/plural words are excluded, concrete nouns and core words stay', () => {
  const sb = {};
  vm.createContext(sb);
  const tw = html.match(/const TEMPORAL_WORD_KEYS=new Set\([^\n]*\);/)[0];
  const g = (n) => { const i = html.indexOf('function ' + n + '('); return html.slice(i, html.indexOf('\n', i)); };
  vm.runInContext(tw + '\n' + g('isTemporalWord') + '\n' + g('isPictureAmbiguousWord') + '\n' + g('pictureAssessmentWords') + '\n' + html.slice(a, b) +
    ';globalThis.run=(core,cur,o)=>{wordBank=()=>core;curriculumWords=()=>cur;uniqByWord=(x)=>{const s={};return x.filter(w=>!s[w.t.toLowerCase()]&&(s[w.t.toLowerCase()]=1))};picSrc=()=>"x";return gameWordPool(o).map(w=>w.t)}', sb);
  const bad = 'achievement angry happy sad tired cloudy rainy sunny windy weather cold hot warm blue yellow green red one two nine ten monday march today yesterday jump run swim read play hear see walk brave easy difficult interesting wonderful beautiful friendly ears eyes feet hands legs teeth chairs eggs trousers orange home board chips cartoon station'.split(' ');
  const good = 'apple banana pencil doctor museum elephant tiger'.split(' ');
  const r = sb.run(W('cat', 'dog'), W(...bad, ...good, 'ball'), { picture: true, minLen: 3 });
  bad.forEach((w) => assert.ok(!r.map((x) => x.toLowerCase()).includes(w), 'leaked ' + w));
  good.forEach((w) => assert.ok(r.includes(w), 'missing ' + w));
  assert.ok(r.includes('cat') && r.includes('dog'));
  const plain = sb.run(W('cat', 'dog'), W('achievement', 'happy', 'apple', 'pen'), {});
  assert.ok(plain.includes('achievement') && plain.includes('happy'), 'audio/text-only pool keeps the full single-word list');
});
test('picture games request the concrete pool; boss (audio to text) and spell keep the full pool', () => {
  assert.match(html, /type==='listen'\?pictureAssessmentWords\(gameWordPool\(\{picture:true\}\)\):gameWordPool\(\)/);
  assert.match(html, /bpool=gameWordPool\(\{minLen:3,picture:true\}\)/);
  assert.match(html, /uniqByWord\(gameWordPool\(\{minLen:3,picture:true\}\)\)/);
  assert.match(html, /adaptiveWords\(gameWordPool\(\{picture:true\}\), pairs/);
  assert.match(html, /const bank=gameWordPool\(\);/);
});

test('gallery review: words with artifact art, overlapping or wrong images stay out of picture pools but remain in text/audio pools', () => {
  const ex = 'arm boy ear eye foot hand farm bedroom jungle zoo garden building bathroom kitchen beach slide sky sea river breakfast lunch dinner face head brother sister mother father grandfather grandmother girl basketball football tennis toe tooth orange'.split(' ');
  const sb = {};
  vm.createContext(sb);
  const tw = html.match(/const TEMPORAL_WORD_KEYS=new Set\([^\n]*\);/)[0];
  const g = (n) => { const i = html.indexOf('function ' + n + '('); return html.slice(i, html.indexOf('\n', i)); };
  vm.runInContext(tw + '\n' + g('isTemporalWord') + '\n' + g('isPictureAmbiguousWord') + '\n' + g('pictureAssessmentWords') + '\n' + html.slice(a, b) +
    ';globalThis.run=(core,cur,o)=>{wordBank=()=>core;curriculumWords=()=>cur;uniqByWord=(x)=>{const s={};return x.filter(w=>!s[w.t.toLowerCase()]&&(s[w.t.toLowerCase()]=1))};picSrc=()=>"x";return gameWordPool(o).map(w=>w.t.toLowerCase())}', sb);
  const r = sb.run(W('cat', 'ball', 'table', 'flower', 'water'), W(...ex, 'apple'), { picture: true });
  ex.forEach((w) => assert.ok(!r.includes(w), 'picture pool leaked ' + w));
  const t = sb.run(W('cat'), W(...ex, 'apple'), {});
  ex.forEach((w) => assert.ok(t.includes(w), 'text pool lost ' + w));
});
test('allowlist has no excluded word (source check) and is reviewed (98 or fewer words)', () => {
  const m = html.match(/const PICTURE_CONCRETE=\{([^}]*)\};/);
  const list = m[1].split(',').map((x) => x.split(':')[0]);
  for (const w of ['farm', 'bedroom', 'face', 'head', 'mother', 'sister', 'girl', 'foot', 'hand', 'arm', 'boy', 'ear', 'eye', 'tooth', 'toe']) assert.ok(!list.includes(w), w);
  assert.ok(list.length <= 98, String(list.length));
  assert.equal(new Set(list).size, list.length);
});
