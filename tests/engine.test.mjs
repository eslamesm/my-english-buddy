import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LE = require('../engine.js');

const DAY = LE.DAY;
const T = (y, mo, d, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();

test('new store shape and constants', () => {
  const s = LE.createStore();
  assert.deepEqual(Object.keys(s).sort(), ['items', 'v']);
  assert.equal(s.v, 1);
  assert.deepEqual(LE.INTERVALS, [1, 3, 7, 14, 30]);
  assert.equal(LE.MASTERY_NAMES.length, 5);
});

test('correct answers advance review intervals 1,3,7,14,30 then cap', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 10);
  const seen = [];
  for (let i = 0; i < 7; i++) {
    LE.record(s, { skill: 'pronounce', word: 'apple', correct: true, score: 95 }, now + i * DAY);
    seen.push(LE.getRecord(s, 'pronounce', 'apple').reviewInterval);
  }
  assert.deepEqual(seen, [1, 3, 7, 14, 30, 30, 30]);
});

test('nextReview is a local-day boundary plus interval days', () => {
  const s = LE.createStore();
  const now = T(2026, 3, 5, 22, 40);
  LE.record(s, { skill: 'recognize', word: 'cat', correct: true }, now);
  const rec = LE.getRecord(s, 'recognize', 'cat');
  assert.equal(rec.reviewInterval, 1);
  assert.equal(rec.nextReview, LE.dayStart(now) + 1 * DAY);
  assert.equal(LE.toDayKey(rec.nextReview), LE.toDayKey(now + DAY));
});

test('incorrect answers reduce mastery and schedule earlier review', () => {
  const s = LE.createStore();
  const now = T(2026, 5, 2);
  LE.record(s, { skill: 'spell', word: 'book', correct: true }, now);
  LE.record(s, { skill: 'spell', word: 'book', correct: true }, now + DAY);
  let rec = LE.getRecord(s, 'spell', 'book');
  assert.equal(rec.mastery, 2);
  const before = rec.mastery;
  LE.record(s, { skill: 'spell', word: 'book', correct: false, score: 10 }, now + 2 * DAY);
  rec = LE.getRecord(s, 'spell', 'book');
  assert.ok(rec.mastery < before, 'mastery must drop');
  assert.equal(rec.reviewInterval, 0, 'relearn interval');
  assert.equal(rec.nextReview, LE.dayStart(now + 2 * DAY), 'due again the same day');
  assert.equal(LE.isDue(rec, now + 2 * DAY), true);
});

test('repeated mistakes trigger easier practice (difficulty 0 + weak list)', () => {
  const s = LE.createStore();
  const now = T(2026, 2, 1);
  LE.record(s, { skill: 'listen', word: 'dog', correct: false }, now);
  LE.record(s, { skill: 'listen', word: 'dog', correct: false }, now);
  const rec = LE.getRecord(s, 'listen', 'dog');
  assert.equal(rec.wrongCount, 2);
  assert.equal(rec.difficulty, 0);
  const sel = LE.selectPractice(s, { now });
  assert.ok(sel.weak.some((e) => e.key === 'listen::dog'), 'repeat-error item flagged weak');
});

test('overdue items appear in the due list, most overdue first', () => {
  const s = LE.createStore();
  const t0 = T(2026, 1, 1);
  LE.record(s, { skill: 'recognize', word: 'old', correct: true }, t0);            // due t0+1d
  LE.record(s, { skill: 'recognize', word: 'recent', correct: true }, t0 + 5 * DAY); // due t0+6d
  const now = t0 + 10 * DAY;
  const sel = LE.selectPractice(s, { now });
  assert.deepEqual(sel.due.map((e) => e.word), ['old', 'recent']);
  assert.ok(sel.due[0].overdue > sel.due[1].overdue);
});

test('items are not due before their nextReview day', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 10);
  LE.record(s, { skill: 'recognize', word: 'later', correct: true }, now);
  const rec = LE.getRecord(s, 'recognize', 'later');
  assert.equal(LE.isDue(rec, now), false);
  assert.equal(LE.isDue(rec, LE.endOfDay(now)), false);
  assert.equal(LE.isDue(rec, LE.dayStart(now + DAY)), true);
});

test('new vocabulary is kept separate and mixed with a deliberate policy', () => {
  const s = LE.createStore();
  const t0 = T(2026, 1, 1);
  // 3 due reviews
  ['a', 'b', 'c'].forEach((w) => LE.record(s, { skill: 'recognize', word: w, correct: true }, t0));
  const now = t0 + 2 * DAY;
  // 4 brand-new items
  LE.ensureRecord(s, 'recognize', 'n1');
  LE.ensureRecord(s, 'recognize', 'n2');
  LE.ensureRecord(s, 'recognize', 'n3');
  LE.ensureRecord(s, 'recognize', 'n4');
  const sel = LE.selectPractice(s, { now, maxItems: 10, duePer: 3, newPer: 1 });
  assert.equal(sel.due.length, 3);
  assert.equal(sel.fresh.length, 4);
  // plan interleaves: 3 due, then 1 new (deliberate policy)
  assert.deepEqual(sel.plan.slice(0, 4).map((e) => e.word), ['a', 'b', 'c', 'n1']);
  // fresh items never appear before all due items are exhausted, assuming policy honoured
  const firstFreshIdx = sel.plan.findIndex((e) => e.key.startsWith('recognize::n'));
  assert.equal(firstFreshIdx, 3);
});

test('includeNew false returns only due reviews', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 1);
  LE.record(s, { skill: 'recognize', word: 'a', correct: true }, now);
  LE.ensureRecord(s, 'recognize', 'n1');
  const sel = LE.selectPractice(s, { now: now + 2 * DAY, includeNew: false });
  assert.equal(sel.plan.length, 1);
  assert.equal(sel.plan[0].word, 'a');
});

test('no duplicate review entries and canonical keys', () => {
  const s = LE.createStore();
  LE.record(s, { skill: 'recognize', word: 'Apple', correct: true }, T(2026, 1, 1));
  LE.record(s, { skill: 'recognize', word: ' apple ', correct: true }, T(2026, 1, 1));
  assert.deepEqual(Object.keys(s.items), ['recognize::apple']);
  const rec = LE.getRecord(s, 'recognize', 'APPLE');
  assert.equal(rec.correctCount, 2);
});

test('skills are distinguished for the same word', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 1);
  LE.record(s, { skill: 'listen', word: 'apple', correct: true }, now);
  LE.record(s, { skill: 'spell', word: 'apple', correct: false }, now);
  assert.equal(LE.getRecord(s, 'listen', 'apple').correctCount, 1);
  assert.equal(LE.getRecord(s, 'spell', 'apple').wrongCount, 1);
  assert.equal(LE.getRecord(s, 'pronounce', 'apple'), null);
});

test('pronunciationAttempts and hintsUsed are tracked', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 1);
  LE.record(s, { skill: 'pronounce', word: 'cat', correct: false, score: 20 }, now);
  LE.record(s, { skill: 'pronounce', word: 'cat', correct: true, score: 90, hinted: true }, now);
  const rec = LE.getRecord(s, 'pronounce', 'cat');
  assert.equal(rec.pronunciationAttempts, 2);
  assert.equal(rec.hintsUsed, 1);
});

test('missing / malformed data is handled safely', () => {
  assert.deepEqual(LE.validateStore(null).items, {});
  assert.deepEqual(LE.validateStore('nope').items, {});
  assert.deepEqual(LE.validateStore({ items: [1, 2, 3] }).items, {});
  const s = LE.validateStore({ v: 1, items: { 'recognize::ok': { mastery: 'x', correctCount: -5, nextReview: 'bad' } } });
  const rec = s.items['recognize::ok'];
  assert.equal(rec.mastery, 0);
  assert.equal(rec.correctCount, 0);
  assert.equal(rec.nextReview, null);
  // record() on a broken store must not throw
  assert.equal(LE.record(null, { word: 'x', correct: true }).changed, false);
  assert.equal(LE.record(LE.createStore(), {}).changed, false);
});

test('invalid / inverted dates are dropped (item becomes due)', () => {
  const now = T(2026, 6, 1);
  const s = LE.validateStore({
    v: 1,
    items: { 'recognize::x': { correctCount: 1, lastReviewed: now, nextReview: now - 5 * DAY } }
  }, now);
  const rec = s.items['recognize::x'];
  assert.equal(rec.nextReview, null);
  assert.equal(LE.isDue(rec, now), true, 'history without a valid schedule is due, never lost');
  // future lastReviewed from a clock change is dropped
  const s2 = LE.validateStore({ v: 1, items: { 'recognize::y': { lastReviewed: now + 3 * DAY } } }, now);
  assert.equal(s2.items['recognize::y'].lastReviewed, null);
});

test('date-boundary: answer late at night is due the next local day', () => {
  const s = LE.createStore();
  const lateNight = T(2026, 7, 31, 23, 59);
  LE.record(s, { skill: 'recognize', word: 'midnight', correct: true }, lateNight);
  const rec = LE.getRecord(s, 'recognize', 'midnight');
  assert.equal(LE.toDayKey(rec.nextReview), '2026-08-01');
  assert.equal(LE.isDue(rec, lateNight), false);
  assert.equal(LE.isDue(rec, T(2026, 8, 1, 0, 5)), true);
});

test('legacy progress migration preserves learned words', () => {
  const progress = { 'words::apple': 3, 'words::cat': 1, 'letters::B': 2, 'words::zero': 0 };
  const store = LE.fromLegacyProgress(progress, { now: T(2026, 1, 1), lastAt: T(2025, 12, 20) });
  const apple = LE.getRecord(store, 'recognize', 'apple');   // words -> recognize
  assert.equal(apple.mastery, 4, '3 stars => mastered');
  assert.equal(apple.reviewInterval, 30);
  assert.equal(LE.getRecord(store, 'recognize', 'cat').mastery, 1);
  assert.equal(LE.getRecord(store, 'recognize', 'B').mastery, 2);
  assert.equal(LE.getRecord(store, 'recognize', 'zero'), null, 'zero stars not migrated');
});

test('legacy migration tolerates malformed progress', () => {
  assert.deepEqual(LE.fromLegacyProgress(null).items, {});
  assert.deepEqual(LE.fromLegacyProgress('nope').items, {});
  const store = LE.fromLegacyProgress({ 'nokey': 3, 'words::': 2, 'words::ok': 'x' });
  assert.equal(Object.keys(store.items).length, 0);
});

test('stores are isolated (per-profile)', () => {
  const a = LE.createStore(), b = LE.createStore();
  const now = T(2026, 1, 1);
  LE.record(a, { skill: 'recognize', word: 'x', correct: true }, now);
  LE.record(b, { skill: 'recognize', word: 'y', correct: true }, now);
  assert.ok(a.items['recognize::x'] && !a.items['recognize::y']);
  assert.ok(b.items['recognize::y'] && !b.items['recognize::x']);
});

test('stats aggregation for the parent dashboard', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 1);
  for (let i = 0; i < 4; i++) LE.record(s, { skill: 'recognize', word: 'm', correct: true }, now); // mastered
  LE.record(s, { skill: 'listen', word: 'l', correct: true }, now);                                // learning
  LE.ensureRecord(s, 'spell', 'n');                                                                // fresh
  LE.record(s, { skill: 'spell', word: 'w', correct: false }, now);                                // weak
  const st = LE.stats(s, now + 100 * DAY);
  assert.equal(st.total, 4);
  assert.equal(st.mastered, 1);
  assert.equal(st.fresh, 1);
  assert.ok(st.weak >= 1);
  assert.equal(st.bySkill.recognize.total, 1);
  assert.equal(st.bySkill.spell.total, 2);
});

test('uncertain (recognition failure) does not penalise mastery or reschedule', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 1);
  LE.record(s, { skill: 'pronounce', word: 'cat', correct: true }, now);
  let rec = LE.getRecord(s, 'pronounce', 'cat');
  const m = rec.mastery, nr = rec.nextReview, iv = rec.reviewInterval;
  const res = LE.record(s, { skill: 'pronounce', word: 'cat', correct: false, score: 0, uncertain: true }, now + DAY);
  rec = LE.getRecord(s, 'pronounce', 'cat');
  assert.equal(res.uncertain, true);
  assert.equal(rec.mastery, m);
  assert.equal(rec.nextReview, nr);
  assert.equal(rec.reviewInterval, iv);
  assert.equal(rec.wrongCount, 0);
  assert.equal(rec.pronunciationAttempts, 2);
});

test('deterministic: identical inputs produce identical stores', () => {
  const run = () => {
    const s = LE.createStore();
    const now = T(2026, 1, 1);
    ['a', 'b', 'c'].forEach((w, i) => {
      LE.record(s, { skill: 'recognize', word: w, correct: i !== 1, score: i === 1 ? 20 : 90 }, now + i * DAY);
    });
    return JSON.stringify(s);
  };
  assert.equal(run(), run());
  assert.equal(run(), run());
});

test('v6.1: normalizeDailyNew accepts only configured targets', () => {
  assert.deepEqual(LE.DAILY_NEW_OPTIONS, [3, 5, 10]);
  assert.equal(LE.DAILY_NEW_DEFAULT, 5);
  assert.equal(LE.normalizeDailyNew(3), 3);
  assert.equal(LE.normalizeDailyNew(5), 5);
  assert.equal(LE.normalizeDailyNew('10'), 10);
  assert.equal(LE.normalizeDailyNew(7), 5);
  assert.equal(LE.normalizeDailyNew(0), 5);
  assert.equal(LE.normalizeDailyNew(-3), 5);
  assert.equal(LE.normalizeDailyNew('x'), 5);
  assert.equal(LE.normalizeDailyNew(undefined), 5);
  assert.equal(LE.normalizeDailyNew(999), 5);
});

test('v6.1: skillProfile reports weakness only when data is reliable', () => {
  const now = T(2026, 1, 20);
  const s = LE.createStore();
  // spell: 3 records, all repeatedly wrong -> strong weakness, reliable
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) LE.record(s, { skill: 'spell', word: 'w' + i, correct: false, score: 0 }, now);
  }
  // recognize: only 1 record -> not reliable, weakness must be 0
  LE.record(s, { skill: 'recognize', word: 'solo', correct: false, score: 0 }, now);
  const sp = LE.skillProfile(s, now);
  assert.equal(sp.spell.reliable, true);
  assert.ok(sp.spell.weakness > 0.5);
  assert.equal(sp.recognize.reliable, false);
  assert.equal(sp.recognize.weakness, 0);
  assert.equal(sp.listen.total, 0);
  assert.equal(sp.listen.reliable, false);
});

test('v6.1: weightSkills prioritises the weakest reliable skill without losing overdue coverage', () => {
  const now = T(2026, 2, 5);
  const s = LE.createStore();
  // make spell reliably weak (many wrong, all overdue), recognize strong
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 3; j++) LE.record(s, { skill: 'spell', word: 'sp' + i, correct: false, score: 0 }, now - 10 * DAY);
  }
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 4; j++) LE.record(s, { skill: 'recognize', word: 'rc' + i, correct: true, score: 95 }, now - 10 * DAY);
  }
  const plain = LE.selectPractice(s, { maxItems: 8, includeNew: false });
  const weighted = LE.selectPractice(s, { maxItems: 8, includeNew: false, weightSkills: true });
  assert.equal(weighted.weighted, true);
  // same total coverage, no items lost
  assert.equal(weighted.plan.length, plain.plan.length);
  assert.equal(weighted.due.length, plain.due.length);
  const spellFirst = weighted.plan.filter((e) => e.skill === 'spell').length;
  const spellPlain = plain.plan.filter((e) => e.skill === 'spell').length;
  assert.ok(spellFirst >= spellPlain);
  assert.ok(weighted.plan.some((e) => e.skill === 'spell'));
});

test('v6.1: weightSkills falls back to v6.0 ordering when no skill is reliable', () => {
  const now = T(2026, 2, 5);
  const s = LE.createStore();
  LE.record(s, { skill: 'spell', word: 'one', correct: true, score: 90 }, now - 10 * DAY);
  const plain = LE.selectPractice(s, { maxItems: 8, includeNew: false });
  const weighted = LE.selectPractice(s, { maxItems: 8, includeNew: false, weightSkills: true });
  assert.equal(weighted.weighted, false);
  assert.deepEqual(weighted.plan.map((e) => e.key), plain.plan.map((e) => e.key));
});

test('v6.1: newTarget hard-caps brand-new items placed in the plan', () => {
  const now = T(2026, 3, 1);
  const s = LE.createStore();
  // seed fresh/new items
  for (let i = 0; i < 20; i++) LE.ensureRecord(s, 'recognize', 'new' + i);
  let plan = LE.selectPractice(s, { maxItems: 12, newPer: 1, duePer: 1, newTarget: 3 }).plan;
  assert.equal(plan.filter((e) => e.rec.correctCount === 0 && e.rec.wrongCount === 0 && !e.rec.lastReviewed).length, 3);
  plan = LE.selectPractice(s, { maxItems: 12, newPer: 1, duePer: 1, newTarget: 0 }).plan;
  assert.equal(plan.filter((e) => e.rec.lastReviewed == null).length, 0);
});

test('v6.1: stats exposes per-skill reliability and weakness', () => {
  const now = T(2026, 1, 20);
  const s = LE.createStore();
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) LE.record(s, { skill: 'spell', word: 'sw' + i, correct: false, score: 0 }, now);
  const st = LE.stats(s, now);
  assert.equal(st.bySkill.spell.reliable, true);
  assert.ok(st.bySkill.spell.weakness > 0);
  assert.equal(st.bySkill.listen.reliable, false);
  assert.equal(typeof st.bySkill.recognize.avgMastery, 'number');
});
