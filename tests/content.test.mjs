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
const artMap = JSON.parse(read('img/art/map.js').replace(/^\s*window\.ART_IMG_ALL\s*=/, '').replace(/;\s*$/, ''));
const wordsJson = JSON.parse(read('tools/words.json'));
const artFiles = new Set(dir('img/art').filter((f) => f.endsWith('.svg')).map((f) => f.replace(/\.svg$/, '')));
const wordWavs = new Set(dir('audio/words').filter((f) => f.endsWith('.wav')).map((f) => f.replace(/\.wav$/, '').toLowerCase()));
const lettersWavs = new Set(dir('audio/letters').filter((f) => f.endsWith('.wav')));
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

test('every art index entry is well-formed and its SVG exists', () => {
  const keys = Object.keys(artIndex);
  assert.ok(keys.length > 300, 'expected a substantial art library, got ' + keys.length);
  for (const k of keys) {
    const e = artIndex[k];
    assert.ok(nonEmpty(e.en), 'art index "' + k + '" missing en');
    assert.ok(nonEmpty(e.ar), 'art index "' + k + '" missing ar');
    assert.ok(nonEmpty(e.emoji), 'art index "' + k + '" missing emoji');
    assert.ok(nonEmpty(e.src), 'art index "' + k + '" missing src');
    const file = String(e.src).split('/').pop().replace(/\.svg$/, '');
    assert.ok(artFiles.has(file), 'art index "' + k + '" -> missing file ' + e.src);
  }
});

test('every art map entry resolves to a real SVG', () => {
  const keys = Object.keys(artMap);
  assert.ok(keys.length > 300, 'expected a substantial art map, got ' + keys.length);
  for (const k of keys) {
    const file = String(artMap[k]).split('/').pop().replace(/\.svg$/, '');
    assert.ok(artFiles.has(file), 'art map "' + k + '" -> missing file ' + artMap[k]);
  }
});

test('words.json entries are well-formed, uniquely slugged, and illustrated', () => {
  assert.ok(Array.isArray(wordsJson) && wordsJson.length > 300, 'expected a substantial word bank');
  const slugs = new Set();
  for (const w of wordsJson) {
    assert.ok(nonEmpty(w.en), 'word entry missing en: ' + JSON.stringify(w));
    assert.ok(nonEmpty(w.ar), 'word "' + w.en + '" missing ar');
    assert.ok(nonEmpty(w.emoji), 'word "' + w.en + '" missing emoji');
    assert.ok(nonEmpty(w.slug), 'word "' + w.en + '" missing slug');
    assert.ok(!slugs.has(w.slug), 'duplicate slug "' + w.slug + '"');
    slugs.add(w.slug);
    assert.ok(artFiles.has(w.slug), 'word "' + w.en + '" has no illustration ' + w.slug + '.svg');
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
