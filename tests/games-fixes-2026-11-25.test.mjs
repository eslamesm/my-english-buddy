/* 2026-11-25 games review fixes: pure helpers extracted from the REAL index.html. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const s = html.indexOf('/* GAMES_FIX_START');
const e = html.indexOf('/* keyboard + screen-reader access', s);
assert.ok(s > 0 && e > s, 'helper block present');
const sb = {};
vm.createContext(sb);
vm.runInContext(html.slice(s, e) + '\n;globalThis.H={SORT_CATEGORIES,sortBuildRound,sortCategoryOf,rushResultSub,builderTilesFor,memoryFaceHtml};', sb);
const H = sb.H;
const ident = (a) => a.slice();
const W = (...t) => t.map((x) => ({ t: x, emoji: 'x' }));
const CORE = W('cat','dog','sun','ball','fish','star','tree','book','milk','cake','bird','moon','apple','car','house','flower','banana','rabbit','table','water');

test('core 20 words: only animal+food usable, every queued word has a category (old bug: colors with no words)', () => {
  for (const d of ['easy', 'normal', 'hard']) {
    for (let i = 0; i < 50; i++) {
      const shuffle = (a) => a.slice().sort(() => Math.random() - 0.5);
      const r = H.sortBuildRound(CORE, d, shuffle, 2);
      assert.equal(r.useCats.length, 2);
      assert.ok(!r.useCats.some((c) => c.key === 'color'));
      assert.ok(r.cands.length >= 4);
      r.cands.forEach((w) => assert.ok(H.sortCategoryOf(r.useCats, w), w.t));
    }
  }
});

test('hard uses 3 categories only when the pool has words for all 3', () => {
  const pool = CORE.concat(W('red', 'blue', 'green'));
  const r = H.sortBuildRound(pool, 'hard', ident, 2);
  assert.equal(r.useCats.length, 3);
  r.cands.forEach((w) => assert.ok(H.sortCategoryOf(r.useCats, w)));
  assert.equal(H.sortBuildRound(pool, 'easy', ident, 2).useCats.length, 2);
});

test('fewer than two usable categories returns an empty round, never a wrong one', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(H.sortBuildRound(W('cat', 'sun', 'ball'), 'easy', ident, 2))), { useCats: [], cands: [] });
  assert.equal(H.sortBuildRound([], 'normal', ident, 2).cands.length, 0);
});

test('sortCategoryOf is case-insensitive and null for unknown words', () => {
  const cats = H.SORT_CATEGORIES.slice(0, 2);
  assert.equal(H.sortCategoryOf(cats, { t: 'Cat' }).key, 'animal');
  assert.equal(H.sortCategoryOf(cats, { t: 'table' }), null);
});

test('rush result text uses the real duration', () => {
  assert.match(H.rushResultSub(5, 30, false), /5 في 30 ثانية/);
  assert.match(H.rushResultSub(5, 45, false), /في 45 ثانية/);
  assert.ok(!/٦٠/.test(H.rushResultSub(5, 45, true)));
  assert.match(H.rushResultSub(3, 60, true), /رقم قياسي/);
  assert.ok(!/رقم قياسي/.test(H.rushResultSub(0, 60, true)));
});

test('builder tiles: all letters present plus exactly 2 distractors not in the word', () => {
  for (const w of ['cat', 'ball', 'apple', 'table']) {
    const letters = w.split('');
    const t = H.builderTilesFor(letters, ident);
    assert.equal(t.length, letters.length + 2);
    letters.forEach((c) => assert.ok(t.includes(c)));
    const extra = t.slice(letters.length);
    extra.forEach((c) => assert.ok(!letters.includes(c)));
    assert.equal(new Set(extra).size, 2);
  }
});

test('memory face shows emoji and the word, and escapes markup', () => {
  const h = H.memoryFaceHtml({ emoji: '🐱', t: 'cat' });
  assert.match(h, /mem-emoji">🐱/);
  assert.match(h, /mem-word" dir="ltr">cat/);
  assert.ok(!/<script/.test(H.memoryFaceHtml({ emoji: 'x', t: '<script>' })));
});

test('patch leaves learning code untouched: no learnEvent/LearningEngine inside the helper block', () => {
  const block = html.slice(s, html.indexOf('/* GAMES_FIX_END */'));
  assert.ok(!/learnEvent|LearningEngine|bumpWordStar|recordGame|progress\[/.test(block));
});
