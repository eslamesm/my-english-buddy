import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const dir = (p) => fs.readdirSync(path.join(ROOT, p));

const artIndex = JSON.parse(read('img/art/index.json'));
const artMap = JSON.parse(read('assets/visual3d/map.js').replace(/^\s*window\.ART_IMG_3D\s*=/, '').replace(/;\s*$/, ''));
const wordsJson = JSON.parse(read('tools/words.json'));
const artFiles = new Set(Object.values(artMap).filter((p) => exists(p)));
const wordWavs = new Set(dir('audio/words').filter((f) => f.endsWith('.wav')).map((f) => f.replace(/\.wav$/, '').toLowerCase()));
const lettersWavs = new Set(dir('audio/letters').filter((f) => f.endsWith('.wav')));
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

test('runtime uses the 3D art map, not legacy SVG vocabulary art, and index metadata remains valid', () => {
  const runtimeFiles = ['index.html', 'sw.js', 'engine.js', 'support-course-ui.js', 'support-course.js', 'placement.js', 'progression-exam.js', 'assets/visual3d/map.js'];
  for (const f of runtimeFiles) {
    if (!exists(f)) continue;
    assert.ok(!/img\/art\/[A-Za-z0-9_\-]+\.svg/.test(read(f)), f + ' must not reference legacy img/art SVG files');
  }
  const keys = Object.keys(artIndex);
  assert.ok(keys.length > 300, 'expected a substantial vocabulary index');
  for (const k of keys) {
    const e = artIndex[k];
    assert.ok(nonEmpty(e.en), 'art index "' + k + '" missing en');
    assert.ok(nonEmpty(e.ar), 'art index "' + k + '" missing ar');
    assert.ok(nonEmpty(e.emoji), 'art index "' + k + '" missing emoji fallback');
    assert.ok(typeof e.src === 'string', 'art index "' + k + '" src must be a string');
    if (e.src) assert.ok(exists(e.src), 'art index "' + k + '" -> missing 3D file ' + e.src);
  }
});

test('every 3D art map entry resolves to a real image file', () => {
  const keys = Object.keys(artMap);
  assert.ok(keys.length >= 100, 'expected at least 100 mapped 3D assets, got ' + keys.length);
  for (const k of keys) assert.ok(exists(artMap[k]), '3D art map "' + k + '" -> missing file ' + artMap[k]);
});

test('word bank entries retain emoji fallback when no dedicated 3D illustration exists', () => {
  assert.ok(Array.isArray(wordsJson) && wordsJson.length > 300, 'expected a substantial word bank');
  const slugs = new Set();
  for (const w of wordsJson) {
    assert.ok(nonEmpty(w.en), 'word entry missing en: ' + JSON.stringify(w));
    assert.ok(nonEmpty(w.ar), 'word "' + w.en + '" missing ar');
    assert.ok(nonEmpty(w.emoji), 'word "' + w.en + '" missing emoji fallback');
    assert.ok(nonEmpty(w.slug), 'word "' + w.en + '" missing slug');
    assert.ok(!slugs.has(w.slug), 'duplicate slug "' + w.slug + '"');
    slugs.add(w.slug);
  }
});

test('letter audio bank is complete (26 letters x name/sound/word/full)', () => {
  for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    for (const k of ['name', 'sound', 'word', 'full']) {
      assert.ok(lettersWavs.has(L + '_' + k + '.wav'), 'missing audio/letters/' + L + '_' + k + '.wav');
    }
  }
});

test('phrase and sentence audio banks match their index ranges', () => {
  for (let i = 0; i < 12; i++) assert.ok(exists('audio/phrases/' + i + '.wav'), 'missing audio/phrases/' + i + '.wav');
  for (let i = 0; i < 10; i++) assert.ok(exists('audio/sentences/' + i + '.wav'), 'missing audio/sentences/' + i + '.wav');
});

test('core vocabulary audio coverage is explicit (missing words fall back to TTS, never to another bank)', () => {
  const core = ['cat', 'dog', 'sun', 'ball', 'fish', 'star', 'tree', 'book', 'milk', 'cake',
    'bird', 'moon', 'apple', 'car', 'house', 'flower', 'banana', 'rabbit', 'table', 'water'];
  for (const w of core) assert.ok(wordWavs.has(w), 'missing recorded audio for core word "' + w + '"');
  assert.ok(wordWavs.size > 400, 'word audio bank unexpectedly small: ' + wordWavs.size);
});
