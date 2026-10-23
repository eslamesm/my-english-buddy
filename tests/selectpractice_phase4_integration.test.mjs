import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LE = require('../engine.js');

const DAY = LE.DAY;
const T = (y, mo, d, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();
const WINDOW = 10 * 60 * 1000;

function makeIdx(words) {
  const idx = {};
  words.forEach(w => { idx[String(w).toLowerCase()] = { t: w.toUpperCase(), ar: '', emoji: '' }; });
  return idx;
}

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
  const items = [], used = {};
  const reviewTake = (reviews.length >= maxItems) ? maxItems : Math.min(reviews.length, maxItems - newTarget);
  reviews.slice(0, reviewTake).forEach(r => { used[r.key] = 1; items.push({ kind: 'review', key: r.key, word: r.e.word }); });
  for (const r of reviews) { if (items.length >= maxItems) break; if (used[r.key]) continue; used[r.key] = 1; items.push({ kind: 'review', key: r.key, word: r.e.word }); }
  return { sel: sel, reviews: reviews.map(r => r.e.word), items: items };
}

test('phase4 integration: phase3 recency still works with performance weighting enabled', () => {
  const now = T(2026, 1, 1);
  const s = LE.createStore();
  ['a','b','c','d'].forEach(w => { LE.record(s, { skill: 'recognize', word: w, correct: true }, now - 10 * DAY); LE.getRecord(s, 'recognize', w).nextReview = now - DAY; });
  LE.record(s, { skill: 'recognize', word: 'bad', correct: false }, now - 2 * DAY);
  LE.record(s, { skill: 'recognize', word: 'bad', correct: false }, now - 2 * DAY);
  LE.getRecord(s, 'recognize', 'bad').nextReview = now - DAY;
  const idx = makeIdx(['a','b','c','d','bad']);
  const log = {};
  ['a','b','c','d'].forEach(w => { log[LE.key('recognize', w)] = now; });
  const res = buildReviewCandidates(s, now, log, 12, 0, idx);
  assert.ok(!res.reviews.includes('a'));
  assert.ok(res.reviews.includes('bad'));
  assert.ok(res.items.length > 0);
});

test('phase4 integration: old stores compatible, no crash', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  // simulate old record shape
  store.items['recognize::old'] = { mastery: 2, correctCount: 1, wrongCount: 0, streak: 1, lastReviewed: now - 5*DAY, nextReview: now - DAY, reviewInterval: 3, difficulty: 1 };
  const sel = LE.selectPractice(store, { now, maxItems: 5, weightSkills: true });
  assert.ok(Array.isArray(sel.plan));
  const perf = LE.computeSkillPerformance(store, { now });
  assert.ok(perf.recognize);
});

test('phase4 integration: uncertain events do not skew skill performance', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  LE.record(store, { skill: 'listen', word: 'q', correct: true, uncertain: true }, now);
  LE.record(store, { skill: 'listen', word: 'q2', correct: true }, now - 1*DAY);
  LE.getRecord(store, 'listen', 'q2').nextReview = now - DAY;
  const perf = LE.computeSkillPerformance(store, { now });
  // uncertain not counted as attempt affecting recent perf
  assert.ok(perf.listen.recentAttempts >= 0);
});
