/* 2026-11-24 - owner-approved (learning-method proposal item 1): the daily session
 * starts from the placement-assessed level, never below it, and the parent's manual
 * level choice always wins. Existing progress (learning.items) and due reviews are
 * untouched.
 *
 * Migration/regression tests over the REAL newWordsForProfile + allowedCurricula
 * extracted from index.html, with small synthetic curriculum fixtures:
 *  - no placement            -> previous behaviour preserved (starter modes first);
 *  - placement tier 1        -> starter modes kept;
 *  - placement tier >= 2     -> letters/sounds no longer fed as new words;
 *  - higher assessed level   -> mode list rises, never drops;
 *  - startUnit = 3           -> earlier subunits never offered as new words;
 *  - parent manual override  -> placement result ignored entirely;
 *  - learned words           -> still excluded (progress preserved).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(testsDir, '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');

function extractFunction(name) {
  const marker = 'function ' + name + '(';
  let start = html.indexOf(marker);
  if (start < 0) throw new Error('function not found: ' + name);
  if (html.slice(start - 6, start) === 'async ') start -= 6;
  const braceStart = html.indexOf('{', start);
  let depth = 0, i = braceStart;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) break; }
  }
  return html.slice(start, i + 1);
}

function extractBlock(startMarker, endMarker) {
  const s = html.indexOf(startMarker);
  if (s < 0) throw new Error('marker not found: ' + startMarker);
  const e = html.indexOf(endMarker, s);
  if (e < 0) throw new Error('end marker not found: ' + endMarker);
  return html.slice(s, e);
}

const agesSrc = extractBlock('const AGES = [', 'const AVATAR_LIST'); // AGES + levelFromAge

function makeHarness() {
  const noop = () => {};
  const real = {
    CUR_GRADES: [{ id: 'kg1' }, { id: 'kg2' }, { id: 'p1' }, { id: 'p2' }],
    MODE_DATA: {
      sounds: [{ t: 'sss' }],
      letters: [{ t: 'a' }, { t: 'b' }],
      words: [{ t: 'cat' }, { t: 'dog' }],
      cvc: [{ t: 'cvc-one' }],
      phrases: [{ t: 'phrase-one' }],
      sentences: [{ t: 'sentence-one' }],
      'egy:p1': [{ t: 'pen' }, { t: 'book' }, { t: 'bag' }, { t: 'desk' }],
    },
    CUR_UNITS: [
      { key: 'p1', base: 'p1', term: '1', words: [{ t: 'pen' }, { t: 'book' }, { t: 'bag' }, { t: 'desk' }] },
    ],
    CUR_SUBUNITS: {
      p1: [
        { n: 1, words: [['pen']] },
        { n: 2, words: [['book']] },
        { n: 3, words: [['bag']] },
        { n: 4, words: [['desk']] },
      ],
    },
    LearningEngine: { splitKey: (k) => ({ word: k }) },
  };
  const env = new Proxy(real, {
    has: () => true,
    get(t, k) {
      if (k === Symbol.unscopables) return undefined;
      if (k in t) return t[k];
      if (k in globalThis) return globalThis[k];
      return noop;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  const sandbox = { __env__: env };
  vm.createContext(sandbox);
  vm.runInContext(
    'with(__env__){' +
    agesSrc + '\n' +
    extractFunction('validCurriculumIds') + '\n' +
    extractFunction('allowedCurricula') + '\n' +
    extractFunction('activeCurriculumUnit') + '\n' +
    extractFunction('activeCurriculumModeKey') + '\n' +
    extractFunction('newWordsForProfile') +
    '\n;__api={ newWordsForProfile };}',
    sandbox
  );
  return real.__api;
}

const words = (res) => Array.from(res, r => r.it.t); // outer-realm array for deepEqual

function profile(over) {
  return Object.assign({
    levelKey: '5-7', age: 6, levelManual: false,
    learning: { items: {} },
    allowedCurricula: ['p1'],
    placement: null,
  }, over || {});
}

test('no placement: previous behaviour preserved (starter modes first)', () => {
  const api = makeHarness();
  const res = api.newWordsForProfile(profile({ placement: null }), {}, 10);
  assert.deepEqual(words(res).slice(0, 3), ['sss', 'a', 'b'], 'starts with sounds/letters as before');
});

test('placement tier 1 keeps starter modes', () => {
  const api = makeHarness();
  const res = api.newWordsForProfile(profile({
    placement: { status: 'done', grade: 'p1', assignedLevel: '5-7', assignedTier: 1, startUnit: null },
  }), {}, 10);
  assert.ok(words(res).includes('a'), 'letters still offered at tier 1');
});

test('placement tier >= 2 drops letters/sounds for new words', () => {
  const api = makeHarness();
  const res = api.newWordsForProfile(profile({
    placement: { status: 'done', grade: 'p1', assignedLevel: '7-10', assignedTier: 3, startUnit: null },
  }), {}, 10);
  const w = words(res);
  assert.ok(!w.includes('a') && !w.includes('b') && !w.includes('sss'), 'no letter/phonics starters');
  assert.ok(w.includes('cat') || w.includes('cvc-one'), 'level-appropriate words still flow');
});

test('assessed level raises the mode list but never lowers it', () => {
  const api = makeHarness();
  const higher = api.newWordsForProfile(profile({
    placement: { status: 'done', grade: 'p1', assignedLevel: '7-10', assignedTier: 3, startUnit: null },
  }), {}, 10);
  assert.ok(words(higher).includes('sentence-one'), '7-10 sentences available');
  const lower = api.newWordsForProfile(profile({
    levelKey: '7-10',
    placement: { status: 'done', grade: 'p1', assignedLevel: '3-5', assignedTier: 1, startUnit: null },
  }), {}, 10);
  assert.ok(words(lower).includes('sentence-one'), 'kept the higher parent/app level');
});

test('startUnit 3 skips earlier subunits for that grade only', () => {
  const api = makeHarness();
  const res = api.newWordsForProfile(profile({
    placement: { status: 'done', grade: 'p1', assignedLevel: '5-7', assignedTier: 2, startUnit: 3 },
  }), {}, 20);
  const w = words(res);
  assert.ok(!w.includes('pen') && !w.includes('book'), 'subunits 1-2 skipped');
  assert.ok(w.includes('bag') && w.includes('desk'), 'subunits 3+ offered');
});

test('parent manual level choice always wins over placement', () => {
  const api = makeHarness();
  const res = api.newWordsForProfile(profile({
    levelKey: '3-5', levelManual: true,
    placement: { status: 'done', grade: 'p1', assignedLevel: '10-14', assignedTier: 4, startUnit: 4 },
  }), {}, 10);
  const w = words(res);
  assert.deepEqual(w.slice(0, 3), ['sss', 'a', 'b'], 'parent starter level honoured');
  assert.ok(w.includes('pen') && w.includes('book'), 'no startUnit skip under manual choice');
});

test('migration: previously learned words stay excluded (progress preserved)', () => {
  const api = makeHarness();
  const res = api.newWordsForProfile(profile({
    learning: { items: { 'cat': {}, 'bag': {} } },
    placement: { status: 'done', grade: 'p1', assignedLevel: '7-10', assignedTier: 3, startUnit: 1 },
  }), {}, 20);
  const w = words(res);
  assert.ok(!w.includes('cat') && !w.includes('bag'), 'learned words not re-fed as new');
  assert.ok(w.length > 0, 'other new words still flow');
});
