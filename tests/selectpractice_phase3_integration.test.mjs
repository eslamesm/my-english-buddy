import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LE = require('../engine.js');

const DAY = LE.DAY;
const T = (y, mo, d, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();
const WINDOW = 10 * 60 * 1000;

/* Build a small curriculum index like the app does */
function makeIdx(words) {
  const idx = {};
  words.forEach(w => { idx[String(w).toLowerCase()] = { t: w.toUpperCase(), ar: '', emoji: '' }; });
  return idx;
}

/* Mimic buildSessionHome review-candidate selection exactly as patched */
function buildReviewCandidates(store, now, log, maxItems, newTarget, idx) {
  const sel = LE.selectPractice(store, {
    maxItems: maxItems,
    weightSkills: true,
    newTarget: newTarget,
    recentlySeen: log || {},
    recencyWindowMs: WINDOW
  });
  const dueSet = {};
  sel.due.forEach(e => { dueSet[e.key] = 1; });
  const reviews = [], seenR = {};
  const addRev = (e, reason) => {
    const it = idx[String(e.word).toLowerCase()];
    if (!it) return;
    const key = e.key;
    if (seenR[key]) return;
    seenR[key] = 1;
    reviews.push({ it: it, reason: reason, skill: e.skill, key: key, e: e });
  };
  const cand = [], seenC = {};
  const addC = (e, reason) => {
    if (!e || seenC[e.key]) return;
    if (!idx[String(e.word).toLowerCase()]) return;
    seenC[e.key] = 1;
    cand.push({ e: e, reason: reason });
  };
  sel.due.forEach(e => addC(e, 'مراجعة'));
  sel.weak.forEach(e => addC(e, dueSet[e.key] ? 'مراجعة' : 'يحتاج تثبيتًا'));
  const keep = {};
  LE.filterRecent(cand.map(c => c.e), log || {}, { now: now, recencyWindowMs: WINDOW }).forEach(e => { keep[e.key] = 1; });
  cand.forEach(c => { if (keep[c.e.key]) addRev(c.e, c.reason); });
  // top up as in app
  const items = [], used = {};
  const reviewTake = (reviews.length >= maxItems) ? maxItems : Math.min(reviews.length, maxItems - newTarget);
  reviews.slice(0, reviewTake).forEach(r => { used[r.key] = 1; items.push({ kind: 'review', key: r.key, word: r.e.word }); });
  if (reviews.length < maxItems && newTarget > 0) {
    // minimal fresh placement not required for these tests
  }
  for (const r of reviews) { if (items.length >= maxItems) break; if (used[r.key]) continue; used[r.key] = 1; items.push({ kind: 'review', key: r.key, word: r.e.word }); }
  return { sel: sel, reviews: reviews.map(r => r.e.word), items: items, keepCount: Object.keys(keep).length, candCount: cand.length };
}

test('integration: recently shown normal review is excluded; critical due remains; no empty session', () => {
  const now = T(2026, 1, 1);
  const s = LE.createStore();
  // 4 normal due
  ['a', 'b', 'c', 'd'].forEach(w => { LE.record(s, { skill: 'recognize', word: w, correct: true }, now - 10 * DAY); LE.getRecord(s, 'recognize', w).nextReview = now - DAY; });
  // 1 critical due (2 mistakes)
  LE.record(s, { skill: 'recognize', word: 'bad', correct: false }, now - 2 * DAY);
  LE.record(s, { skill: 'recognize', word: 'bad', correct: false }, now - 2 * DAY);
  LE.getRecord(s, 'recognize', 'bad').nextReview = now - DAY;
  const idx = makeIdx(['a','b','c','d','bad']);
  const log = {};
  ['a','b','c','d'].forEach(w => { log[LE.key('recognize', w)] = now; });
  const res = buildReviewCandidates(s, now, log, 12, 0, idx);
  assert.ok(!res.reviews.includes('a') && !res.reviews.includes('b'), 'normal reviews shown recently must be excluded');
  assert.ok(res.reviews.includes('bad'), 'critical due must remain even if recently seen');
  assert.ok(res.items.length > 0, 'session must not be empty');
});

test('integration: all normal reviews recently seen -> critical remains; fallback only when ALL blocked but all normal', () => {
  const now = T(2026, 1, 1);
  const s = LE.createStore();
  ['a','b'].forEach(w => { LE.record(s, { skill: 'recognize', word: w, correct: true }, now - 10 * DAY); LE.getRecord(s, 'recognize', w).nextReview = now - DAY; });
  const idx = makeIdx(['a','b']);
  const log = { [LE.key('recognize','a')]: now, [LE.key('recognize','b')]: now };
  const res = buildReviewCandidates(s, now, log, 12, 0, idx);
  // both normal -> all blocked -> filterRecent keeps full list
  assert.equal(res.reviews.length, 2, 'fallback must keep non-empty list when all normal blocked');
});

test('integration: newTarget respected; new words still inserted when reviews blocked (not disabled)', () => {
  const now = T(2026, 1, 1);
  const s = LE.createStore();
  ['a','b'].forEach(w => { LE.record(s, { skill: 'recognize', word: w, correct: true }, now - 10 * DAY); LE.getRecord(s, 'recognize', w).nextReview = now - DAY; });
  LE.ensureRecord(s, 'recognize', 'n1');
  LE.ensureRecord(s, 'recognize', 'n2');
  const idx = makeIdx(['a','b','n1','n2']);
  const log = { [LE.key('recognize','a')]: now, [LE.key('recognize','b')]: now };
  const sel = LE.selectPractice(s, { now, maxItems: 10, weightSkills: true, newTarget: 2, recentlySeen: log, recencyWindowMs: WINDOW });
  assert.ok(sel.plan.some(e => e.word === 'n1' || e.word === 'n2'), 'new words must be available despite reviews blocked');
});

test('integration: recency window expires -> items become eligible again', () => {
  const now = T(2026, 1, 1);
  const s = LE.createStore();
  ['a'].forEach(w => { LE.record(s, { skill: 'recognize', word: w, correct: true }, now - 10 * DAY); LE.getRecord(s, 'recognize', w).nextReview = now - DAY; });
  const idx = makeIdx(['a']);
  const logOld = { [LE.key('recognize','a')]: now - WINDOW - 5000 };
  const res = buildReviewCandidates(s, now, logOld, 12, 0, idx);
  assert.ok(res.reviews.includes('a'), 'expired window must re-enable item');
});

test('integration: display-time registration pattern (mark on renderItem) - second build uses updated log', () => {
  const now = T(2026, 1, 1);
  const s = LE.createStore();
  ['a','b','c'].forEach(w => { LE.record(s, { skill: 'recognize', word: w, correct: true }, now - 10 * DAY); LE.getRecord(s, 'recognize', w).nextReview = now - DAY; });
  const idx = makeIdx(['a','b','c']);
  const log = {};
  // first pass - nothing marked
  const r1 = buildReviewCandidates(s, now, log, 12, 0, idx);
  assert.ok(r1.reviews.includes('a'));
  // simulate renderItem marking only 'a' as it appears
  r1.items.forEach(it => { if (it.word === 'a') log[LE.key('recognize', it.word)] = now; });
  // second pass - 'a' excluded, 'b','c' remain (and no empty session)
  const r2 = buildReviewCandidates(s, now, log, 12, 0, idx);
  assert.ok(!r2.reviews.includes('a'), 'item marked at display time must be excluded next session');
  assert.ok(r2.reviews.includes('b') || r2.reviews.includes('c'), 'other items remain available');
  assert.ok(r2.items.length > 0, 'session must not be empty');
});

test('integration: resumeSession key reconstruction matches engine key format', () => {
  const now = T(2026, 1, 1);
  const s = LE.createStore();
  LE.record(s, { skill: 'recognize', word: 'apple', correct: true }, now - 5 * DAY);
  const rec = LE.getRecord(s, 'recognize', 'apple');
  rec.nextReview = now - DAY;
  const k = LE.key('recognize', 'apple');
  const parts = LE.splitKey(k);
  assert.equal(parts.skill, 'recognize');
  assert.equal(parts.word.toLowerCase(), 'apple');
  // ensure we can reconstruct item like resumeSession does
  const idx = makeIdx(['apple']);
  const it = idx[String(parts.word).toLowerCase()];
  assert.ok(it);
});

test('integration: critical due keeps priority even if recently seen (engine + filterRecent)', () => {
  const now = T(2026, 1, 1);
  const s = LE.createStore();
  LE.record(s, { skill: 'recognize', word: 'bad', correct: false }, now - 2 * DAY);
  LE.record(s, { skill: 'recognize', word: 'bad', correct: false }, now - 2 * DAY);
  const rec = LE.getRecord(s, 'recognize', 'bad');
  rec.nextReview = now - 3 * DAY;
  const idx = makeIdx(['bad']);
  const log = { [LE.key('recognize','bad')]: now };
  const res = buildReviewCandidates(s, now, log, 12, 0, idx);
  assert.ok(res.reviews.includes('bad'));
  // engine plan must include it
  const sel = LE.selectPractice(s, { now, maxItems: 12, includeNew: false, recentlySeen: log, recencyWindowMs: WINDOW });
  assert.ok(sel.plan.some(e => e.word === 'bad'));
});
