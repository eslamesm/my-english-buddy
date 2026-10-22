import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LE = require('../engine.js');

const DAY = LE.DAY;
const T = (y, mo, d, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();

/* A store with `words` learned once and due (nextReview in the past). */
function dueStore(now, words, skill = 'recognize') {
  const s = LE.createStore();
  words.forEach(w => LE.record(s, { skill, word: w, correct: true }, now - 10 * DAY));
  words.forEach(w => { LE.getRecord(s, skill, w).nextReview = now - DAY; });
  return s;
}

test('recency helpers are exported', () => {
  assert.equal(typeof LE.isRecentlyBlocked, 'function');
  assert.equal(typeof LE.isCriticalDue, 'function');
  assert.equal(typeof LE.filterRecent, 'function');
});

test('isCriticalDue: strongly overdue / many mistakes / hardest difficulty are critical', () => {
  assert.equal(LE.isCriticalDue({ overdue: 1, wrongCount: 2, rec: { difficulty: 1 } }), true);
  assert.equal(LE.isCriticalDue({ overdue: 2, assistedCount: 3, rec: { difficulty: 1 } }), true);
  assert.equal(LE.isCriticalDue({ overdue: 1, wrongCount: 0, rec: { difficulty: 0 } }), true);
  // not critical: not overdue yet, or a plain item
  assert.equal(LE.isCriticalDue({ overdue: 0, wrongCount: 5, rec: { difficulty: 0 } }), false);
  assert.equal(LE.isCriticalDue({ overdue: 1, wrongCount: 1, assistedCount: 1, rec: { difficulty: 1 } }), false);
  assert.equal(LE.isCriticalDue(null), false);
});

test('isRecentlyBlocked: an item shown inside the window is blocked', () => {
  const now = T(2026, 1, 1);
  const entry = { key: 'recognize::a', overdue: 0, wrongCount: 0, rec: { difficulty: 1 } };
  assert.equal(LE.isRecentlyBlocked(entry, { 'recognize::a': now - 1000 }, { now }), true);
  // unknown key / bad timestamp / no map are never blocked
  assert.equal(LE.isRecentlyBlocked(entry, { 'recognize::b': now - 1000 }, { now }), false);
  assert.equal(LE.isRecentlyBlocked(entry, { 'recognize::a': 'x' }, { now }), false);
  assert.equal(LE.isRecentlyBlocked(entry, null, { now }), false);
});

test('isRecentlyBlocked: the recency window expires', () => {
  const now = T(2026, 1, 1);
  const entry = { key: 'recognize::a', overdue: 0, wrongCount: 0, rec: { difficulty: 1 } };
  const window = 10 * 60 * 1000;
  assert.equal(LE.isRecentlyBlocked(entry, { 'recognize::a': now - window - 1 }, { now, recencyWindowMs: window }), false);
  assert.equal(LE.isRecentlyBlocked(entry, { 'recognize::a': now - window + 1 }, { now, recencyWindowMs: window }), true);
});

test('isRecentlyBlocked: a critical due review is never blocked', () => {
  const now = T(2026, 1, 1);
  const entry = { key: 'recognize::bad', overdue: 3, wrongCount: 4, rec: { difficulty: 1 } };
  assert.equal(LE.isRecentlyBlocked(entry, { 'recognize::bad': now - 1000 }, { now }), false);
});

test('selectPractice: a recently shown item is skipped, the plan moves on', () => {
  const now = T(2026, 1, 1);
  const s = dueStore(now, ['a', 'b']);
  const sel = LE.selectPractice(s, { now, maxItems: 5, includeNew: false, recentlySeen: { 'recognize::a': now - 1000 } });
  assert.ok(!sel.plan.some(e => e.word === 'a'), 'recently shown item must be skipped');
  assert.ok(sel.plan.some(e => e.word === 'b'), 'the other item stays in the plan');
});

test('selectPractice: a recently shown critical due item is still planned', () => {
  const now = T(2026, 1, 1);
  const s = LE.createStore();
  LE.record(s, { skill: 'recognize', word: 'bad', correct: false }, now - 1 * DAY);
  LE.record(s, { skill: 'recognize', word: 'bad', correct: false }, now - 1 * DAY);
  LE.getRecord(s, 'recognize', 'bad').nextReview = now - 3 * DAY;
  const sel = LE.selectPractice(s, { now, maxItems: 5, includeNew: false, recentlySeen: { 'recognize::bad': now - 1000 } });
  assert.ok(sel.plan.some(e => e.word === 'bad'), 'critical due review must keep its priority');
});

test('selectPractice: the recency window expires and the item comes back', () => {
  const now = T(2026, 1, 1);
  const s = dueStore(now, ['a']);
  const window = 10 * 60 * 1000;
  const sel = LE.selectPractice(s, {
    now, maxItems: 5, includeNew: false, recencyWindowMs: window,
    recentlySeen: { 'recognize::a': now - window - 1 }
  });
  assert.ok(sel.plan.some(e => e.word === 'a'), 'an old timestamp must not block the item');
});

test('selectPractice: the new-word target is not disabled by the recency filter', () => {
  const now = T(2026, 1, 1);
  const s = dueStore(now, ['a']);
  LE.ensureRecord(s, 'recognize', 'n1');
  const sel = LE.selectPractice(s, {
    now, maxItems: 5, newTarget: 1, newPer: 1, duePer: 3,
    recentlySeen: { 'recognize::a': now - 1000 }
  });
  assert.ok(sel.plan.some(e => e.word === 'n1'), 'new words are still placed while a review is blocked');
});

test('filterRecent: recently shown candidates are dropped', () => {
  const now = T(2026, 1, 1);
  const a = { key: 'recognize::a', overdue: 0, wrongCount: 0, rec: { difficulty: 1 } };
  const b = { key: 'recognize::b', overdue: 0, wrongCount: 0, rec: { difficulty: 1 } };
  const kept = LE.filterRecent([a, b], { 'recognize::a': now - 1000 }, { now });
  assert.equal(kept.length, 1);
  assert.equal(kept[0].key, 'recognize::b');
});

test('filterRecent: a critical due candidate survives the filter', () => {
  const now = T(2026, 1, 1);
  const bad = { key: 'recognize::bad', overdue: 2, wrongCount: 3, rec: { difficulty: 1 } };
  const ok = { key: 'recognize::ok', overdue: 0, wrongCount: 0, rec: { difficulty: 1 } };
  const kept = LE.filterRecent([bad, ok], { 'recognize::bad': now - 1000, 'recognize::ok': now - 1000 }, { now });
  assert.equal(kept.length, 1);
  assert.equal(kept[0].key, 'recognize::bad');
});

test('filterRecent: few items are never starved (all blocked -> keep the full list)', () => {
  const now = T(2026, 1, 1);
  const a = { key: 'recognize::a', overdue: 0, wrongCount: 0, rec: { difficulty: 1 } };
  const b = { key: 'recognize::b', overdue: 0, wrongCount: 0, rec: { difficulty: 1 } };
  const seen = { 'recognize::a': now - 1000, 'recognize::b': now - 1000 };
  const kept = LE.filterRecent([a, b], seen, { now });
  assert.equal(kept.length, 2, 'the session must not end up with an empty list');
  assert.deepEqual(kept.map(e => e.key), ['recognize::a', 'recognize::b']);
});

test('filterRecent: an empty candidate list stays empty', () => {
  const now = T(2026, 1, 1);
  assert.deepEqual(LE.filterRecent([], { 'recognize::a': now - 1000 }, { now }), []);
  assert.deepEqual(LE.filterRecent(null, {}, { now }), []);
});

test('filterRecent: the expired window lets the item back in', () => {
  const now = T(2026, 1, 1);
  const a = { key: 'recognize::a', overdue: 0, wrongCount: 0, rec: { difficulty: 1 } };
  const window = 10 * 60 * 1000;
  const kept = LE.filterRecent([a], { 'recognize::a': now - window - 1 }, { now, recencyWindowMs: window });
  assert.equal(kept.length, 1);
});
