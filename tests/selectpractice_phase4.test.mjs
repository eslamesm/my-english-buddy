import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LE = require('../engine.js');

const DAY = LE.DAY;
const T = (y, mo, d, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();

test('phase4: computeSkillPerformance exists and returns structure', () => {
  assert.equal(typeof LE.computeSkillPerformance, 'function');
  const store = LE.createStore();
  const perf = LE.computeSkillPerformance(store, { now: T(2026,1,1) });
  assert.ok(perf.recognize);
  assert.equal(perf.recognize.reliable, false);
  assert.equal(perf.recognize.recentReliable, false);
});

test('phase4: weak performance in a skill increases its priority when reliable (data-driven)', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  // make recognize weak with recent failures (independent)
  LE.record(store, { skill: 'recognize', word: 'r1', correct: false }, now - 1 * DAY);
  LE.record(store, { skill: 'recognize', word: 'r2', correct: false }, now - 1 * DAY);
  LE.record(store, { skill: 'recognize', word: 'r3', correct: false }, now - 1 * DAY);
  // make listen better (independent)
  LE.record(store, { skill: 'listen', word: 'l1', correct: true }, now - 1 * DAY);
  LE.record(store, { skill: 'listen', word: 'l2', correct: true }, now - 1 * DAY);
  LE.record(store, { skill: 'listen', word: 'l3', correct: true }, now - 1 * DAY);
  // due items in both
  ['r1','r2','r3'].forEach(w => { LE.getRecord(store,'recognize',w).nextReview = now - DAY; });
  ['l1','l2','l3'].forEach(w => { LE.getRecord(store,'listen',w).nextReview = now - DAY; });
  const perf = LE.computeSkillPerformance(store, { now });
  assert.ok(perf.recognize.recentReliable || perf.recognize.reliable);
  const sp = LE.skillProfile(store, now, { skillPerf: perf });
  assert.ok(sp.recognize.weakness >= sp.listen.weakness);
});

test('phase4: insufficient data keeps default behavior compatible', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  LE.record(store, { skill: 'recognize', word: 'a', correct: true }, now - 5 * DAY);
  LE.getRecord(store, 'recognize', 'a').nextReview = now - DAY;
  LE.record(store, { skill: 'listen', word: 'b', correct: true }, now - 5 * DAY);
  LE.getRecord(store, 'listen', 'b').nextReview = now - DAY;
  const perf = LE.computeSkillPerformance(store, { now });
  // with thin data, skillProfile should not be forced into extreme skew by perf alone
  const sp = LE.skillProfile(store, now, { skillPerf: perf });
  assert.ok(sp.recognize.weakness >= 0 && sp.listen.weakness >= 0);
  const sel = LE.selectPractice(store, { now, maxItems: 4, weightSkills: true });
  assert.ok(sel.plan.length >= 1);
});

test('phase4: uncertain does not penalize mastery or create negative bias', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  const res = LE.record(store, { skill: 'recognize', word: 'x', correct: true, uncertain: true }, now);
  assert.equal(res.outcome, 'uncertain');
  const rec = LE.getRecord(store, 'recognize', 'x');
  assert.equal(rec.mastery, 0);
  assert.equal(rec.lastReviewed, null);
  const perf = LE.computeSkillPerformance(store, { now });
  assert.equal(perf.recognize.attempts, 0);
});

test('phase4: maxPerItem prevents same key from appearing twice in plan', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  // create a weak item that might be pushed multiple times via pools
  LE.record(store, { skill: 'recognize', word: 'bad', correct: false }, now - 2 * DAY);
  LE.record(store, { skill: 'recognize', word: 'bad', correct: false }, now - 2 * DAY);
  LE.getRecord(store, 'recognize', 'bad').nextReview = now - 3 * DAY;
  // add another due
  LE.record(store, { skill: 'recognize', word: 'ok', correct: true }, now - 10 * DAY);
  LE.getRecord(store, 'recognize', 'ok').nextReview = now - DAY;
  const sel = LE.selectPractice(store, { now, maxItems: 5, includeNew: false, maxPerItem: 1 });
  const keys = sel.plan.map(e => e.key);
  const set = new Set(keys);
  assert.equal(keys.length, set.size);
});

test('phase4: critical due not blocked by key cap or recency rules', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  LE.record(store, { skill: 'recognize', word: 'bad', correct: false }, now - 2 * DAY);
  LE.record(store, { skill: 'recognize', word: 'bad', correct: false }, now - 2 * DAY);
  LE.getRecord(store, 'recognize', 'bad').nextReview = now - 3 * DAY;
  const sel = LE.selectPractice(store, { now, maxItems: 5, includeNew: false, recentlySeen: { [LE.key('recognize','bad')]: now - 1000 }, maxPerItem: 1 });
  assert.ok(sel.plan.some(e => e.word === 'bad'));
});

test('phase4: session not emptied by filters', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  LE.record(store, { skill: 'recognize', word: 'a', correct: true }, now - 10 * DAY);
  LE.getRecord(store, 'recognize', 'a').nextReview = now - DAY;
  const sel = LE.selectPractice(store, { now, maxItems: 5, includeNew: false, recentlySeen: { [LE.key('recognize','a')]: now - 1000 } });
  assert.ok(sel.plan.length > 0);
});

test('phase4: newTarget respected with performance weighting', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  LE.record(store, { skill: 'recognize', word: 'a', correct: true }, now - 10 * DAY);
  LE.getRecord(store, 'recognize', 'a').nextReview = now - DAY;
  LE.ensureRecord(store, 'recognize', 'n1');
  LE.ensureRecord(store, 'recognize', 'n2');
  const sel = LE.selectPractice(store, { now, maxItems: 5, newTarget: 1, weightSkills: true });
  const freshCount = sel.plan.filter(e => e.key && LE.getRecord(store,e.skill,e.word) && LE.getRecord(store,e.skill,e.word).correctCount===0 && LE.getRecord(store,e.skill,e.word).wrongCount===0 && !LE.getRecord(store,e.skill,e.word).lastReviewed).length;
  // newTarget should limit fresh
  assert.ok(freshCount <= 1);
});
