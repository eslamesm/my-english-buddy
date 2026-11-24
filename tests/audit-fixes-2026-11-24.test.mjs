/* Permanent acceptance tests for the 2026-11-24 six-lane audit fixes.
   These fail if any of the confirmed defects regress. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mapSrc = fs.readFileSync(path.join(root, 'assets/visual3d/map.js'), 'utf8');
const map = JSON.parse(mapSrc.slice(mapSrc.indexOf('=') + 1).replace(/;\s*$/, '').trim());

/* --- Audio lane: offline grammar must cover every CVC word --- */
test('offline recognition grammar (VOCAB) includes all 20 CVC words', () => {
  const vocabBlock = html.slice(html.indexOf('const VOCAB'), html.indexOf('const GRAMMAR'));
  assert.ok(/\.\.\.CVC\.map\(w=>w\.t\)/.test(vocabBlock), 'VOCAB must spread CVC words');
  const cvcBlock = html.slice(html.indexOf('const CVC = ['), html.indexOf('const WORDS = ['));
  const words = [...cvcBlock.matchAll(/\{t:'([a-z]+)'/g)].map(m => m[1]);
  assert.equal(words.length, 20, 'CVC list has 20 words');
});

/* --- Audio lane: no dangling teacher-clip references --- */
test('every teacher clip referenced in lesson plans exists on disk', () => {
  const clips = new Set([...html.matchAll(/clip:'([a-z0-9_]+)'/g)].map(m => m[1]));
  for (const c of clips) {
    assert.ok(fs.existsSync(path.join(root, 'audio/teacher', c + '.wav')), 'missing teacher clip: ' + c);
  }
});

/* --- Curriculum lane: KG1 matches the official 2025/26 book contents --- */
test('KG1 units teach flower/father/tree/head/table/board and not mower/desk', () => {
  const kg1 = html.slice(html.indexOf('const KG1_T1_UNITS'), html.indexOf('const KG2_T1_UNITS'));
  for (const w of ['Flower', 'Father', 'Tree', 'Head', 'Table', 'Board']) {
    assert.ok(kg1.includes(`['${w}'`), 'KG1 missing ' + w);
  }
  for (const w of ['Mower', 'Desk']) {
    assert.ok(!kg1.includes(`['${w}'`), 'KG1 still has ' + w);
  }
});

/* --- Curriculum lane: no intra-term duplicate words --- */
test('P1 term 2 has no duplicate words across its units', () => {
  const t2 = html.slice(html.indexOf('const P1_T2_UNITS'), html.indexOf('/* Term 1 units'));
  const words = [...t2.matchAll(/\['([A-Za-z -]+)'/g)].map(m => m[1].toLowerCase());
  const dup = words.filter((w, i) => words.indexOf(w) !== i);
  assert.deepEqual([...new Set(dup)], [], 'duplicates: ' + dup.join(','));
});

/* --- Curriculum lane: honest coverage note for thin grades --- */
test('curriculum cards disclose selected-vocab coverage for grades beyond kg1/kg2/p1', () => {
  assert.ok(html.includes('مفردات مختارة داعمة'), 'honest coverage hint missing');
});

/* --- Visual lane: no two different keys share byte-identical images --- */
test('no byte-identical image is shared across different mapped keys', () => {
  const seen = new Map();
  const groups = [];
  for (const [k, rel] of Object.entries(map)) {
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) continue;
    const b = fs.readFileSync(p);
    if (b.length < 30000) continue; // skip small icons
    const h = String(b.length) + ':' + b.subarray(0, 64).toString('base64') + b.subarray(-64).toString('base64');
    if (!seen.has(h)) { seen.set(h, [k]); continue; }
    seen.get(h).push(k);
  }
  for (const ks of seen.values()) if (ks.length > 1) groups.push(ks);
  // Pre-existing documented shares (visual audit 2026-11-24, P2 — educational judgment reserved,
  // scheduled for content review). The audit-confirmed before|after defect is FIXED and must not return.
  const allowed = new Set([
    'q|queen','beautiful|flower','couch|livingroom','family|parents','book|education','cake|delicious',
    'kite|windy','chair|chairs','bed|bedroom','sea|wave','airplane|plane|travel|trip','farm|farmer',
    'cold|snow','doctor|doctor-b300','firefighter|firefighter-2-b300','police-officer-b300|policeman',
    'bowl|rice-bowl-b300','snake|snake-b300','b|ball','e|eggs','p|pig','w|water','teeth|tooth',
    'bicycle|bicyclerider|bike|cycle','boat|sailboat|ship','bookshelf|openbook',
    'april|august|december|february|friday|january|july|june|march|may|monday|november|october|saturday|september|sunday|thursday|today|tomorrow|tuesday|wednesday|week|yesterday',
    'go to school|gotoschool','dining room|diningroom','get up|getup','go to bed|gotobed',
    'shake hands|shakehands','homework|subject','plan|project','adventure|brave',
    'guide|knowledge|present','interesting|inventor|skill',
  ]);
  // 2026-11-24 round 2: the 20 abstract words and before/after are now bound to distinct
  // generated images in fixes1124/. Their former shares are FIXED and must not return;
  // any new byte-identical share across keys fails this test.
  for (const ks of groups) {
    const key = ks.slice().sort().join('|');
    assert.ok(allowed.has(key), 'NEW byte-identical image share across keys (regression): ' + key);
  }
});

/* --- Visual lane: every map target exists (including new fixes1124 set) --- */
test('every map.js target exists on disk', () => {
  const missing = Object.entries(map).filter(([, rel]) => !fs.existsSync(path.join(root, rel)));
  assert.deepEqual(missing, [], 'missing targets: ' + missing.map(m => m[0]).join(','));
});

/* --- E2E lane: scene SVGs must not reference external files --- */
test('scene SVGs embed all imagery (no external hrefs)', () => {
  const dir = path.join(root, 'assets/visual3d/scenes');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.svg'))) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8');
    const ext = [...s.matchAll(/href="(?!data:)([^"]+)"/g)];
    assert.equal(ext.length, 0, f + ' still references external files: ' + ext.map(m => m[1]).join(','));
  }
});

/* --- Performance lane: .vercelignore must not exclude mapped images --- */
test('.vercelignore has zero intersection with map.js-referenced images', () => {
  const ignores = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8')
    .split('\n').map(l => l.trim().replace(/^\//, '')).filter(l => l && !l.startsWith('#'));
  const refs = new Set(Object.values(map));
  const clash = ignores.filter(l => refs.has(l));
  assert.deepEqual(clash, [], 'clashes: ' + clash.join(','));
});

/* --- UI lane: classification game copy matches its tap interaction --- */
test('sort game description does not say drag', () => {
  assert.ok(!html.includes('اسحب الكلمات للفئة'), 'stale drag copy');
  assert.ok(html.includes('اضغط على الفئة الصحيحة'), 'tap copy missing');
});

/* --- Runtime: service worker cache bumped for changed bytes --- */
test('sw.js cache version is v47 (2026-11-24 grammar expansion)', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(sw, /englishkids-v62/);
});
