import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LE = require('../engine.js');

const DAY = LE.DAY;
const T = (y, mo, d, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();

test('phase4: assisted-only does not make performance reliable or skew', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  // only assisted answers
  LE.record(store, { skill: 'recognize', word: 'a1', correct: true, assisted: true }, now - 1 * DAY);
  LE.record(store, { skill: 'recognize', word: 'a2', correct: true, assisted: true }, now - 1 * DAY);
  LE.record(store, { skill: 'recognize', word: 'a3', correct: true, assisted: true }, now - 1 * DAY);
  const perf = LE.computeSkillPerformance(store, { now });
  assert.equal(perf.recognize.attempts, 0);
  assert.equal(perf.recognize.reliable, false);
  assert.equal(perf.recognize.recentReliable, false);
  assert.equal(perf.recognize.weakness, 0);
  // assisted-only must not add a performance skew on top of the mastery baseline
  const base = LE.skillProfile(store, now);
  const withPerf = LE.skillProfile(store, now, { skillPerf: perf });
  assert.equal(withPerf.recognize.weakness, base.recognize.weakness);
});

test('phase4: cumulative counters with recent lastReviewed do not become recent performance', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  ['x1','x2','x3'].forEach(w => {
    LE.record(store, { skill: 'spell', word: w, correct: false }, now - 1 * DAY);
  });
  const perf = LE.computeSkillPerformance(store, { now });
  assert.equal(perf.spell.recentAttempts, 0, 'cumulative counters must not be reported as recent');
  assert.equal(perf.spell.recentReliable, false);
  assert.equal(perf.spell.hasRecentTemporalData, false);
  // historical data still usable, labelled as such
  assert.equal(perf.spell.reliable, true);
});

test('phase4: explicit timestamped attempts drive recent performance', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  const timed = [
    { skill: 'spell', outcome: 'incorrect', at: now - 1000 },
    { skill: 'spell', outcome: 'incorrect', at: now - 2000 },
    { skill: 'spell', outcome: 'independent', at: now - 3000 },
    { skill: 'spell', outcome: 'uncertain', at: now - 4000 }
  ];
  const perf = LE.computeSkillPerformance(store, { now, attempts: timed });
  assert.equal(perf.spell.recentAttempts, 3);
  assert.equal(perf.spell.recentIncorrect, 2);
  assert.equal(perf.spell.uncertain, 1);
  assert.equal(perf.spell.recentReliable, true);
  assert.ok(perf.spell.weakness > 0.5);
});

test('phase4: mixed assisted and real attempts - real used for reliability', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  LE.record(store, { skill: 'listen', word: 'm1', correct: true, assisted: true }, now - 1 * DAY);
  LE.record(store, { skill: 'listen', word: 'm2', correct: false }, now - 1 * DAY);
  LE.record(store, { skill: 'listen', word: 'm3', correct: true }, now - 1 * DAY);
  const perf = LE.computeSkillPerformance(store, { now });
  assert.ok(perf.listen.attempts >= 2);
  assert.equal(perf.listen.assisted, 1);
});

test('phase4: plan order changes when reliable weak skill prioritized (deterministic)', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  // Equal overdue / equal need so only the skill rank can decide the order.
  ['r1','r2','r3'].forEach(w => {
    LE.record(store, { skill: 'recognize', word: w, correct: true }, now - 20 * DAY);
    LE.getRecord(store, 'recognize', w).nextReview = now - 2 * DAY;
  });
  ['l1','l2','l3'].forEach(w => {
    LE.record(store, { skill: 'listen', word: w, correct: true }, now - 20 * DAY);
    LE.getRecord(store, 'listen', w).nextReview = now - 2 * DAY;
  });
  const perf = {
    recognize: { reliable: true, recentReliable: false, accuracy: 0, weakness: 1, attempts: 3, recentAttempts: 0 },
    listen: { reliable: true, recentReliable: false, accuracy: 1, weakness: 0, attempts: 3, recentAttempts: 0 }
  };
  const base = LE.selectPractice(store, { now, maxItems: 6, weightSkills: false, includeNew: false });
  const weighted = LE.selectPractice(store, { now, maxItems: 6, weightSkills: true, includeNew: false, skillPerf: perf });
  // baseline order is alphabetical by key: listen before recognize
  assert.equal(base.plan[0].skill, 'listen');
  assert.equal(weighted.plan[0].skill, 'recognize');
  assert.notDeepEqual(base.plan.map(e => e.key), weighted.plan.map(e => e.key));
  // all due reviews are preserved in both
  assert.deepEqual(base.plan.map(e => e.key).sort(), weighted.plan.map(e => e.key).sort());
});

test('phase4: tie-break deterministic', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  ['a1','a2'].forEach(w => { LE.record(store,{skill:'recognize',word:w,correct:true},now-10*DAY); LE.getRecord(store,'recognize',w).nextReview = now-DAY; });
  ['b1','b2'].forEach(w => { LE.record(store,{skill:'listen',word:w,correct:true},now-10*DAY); LE.getRecord(store,'listen',w).nextReview = now-DAY; });
  const s1 = LE.selectPractice(store, { now, maxItems: 4, weightSkills: true });
  const s2 = LE.selectPractice(store, { now, maxItems: 4, weightSkills: true });
  assert.deepEqual(s1.plan.map(e=>e.key), s2.plan.map(e=>e.key));
});

test('phase4: multiple critical reviews with limited plan', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  // two critical due
  LE.record(store,{skill:'recognize',word:'c1',correct:false},now-2*DAY);
  LE.record(store,{skill:'recognize',word:'c1',correct:false},now-2*DAY);
  LE.getRecord(store,'recognize','c1').nextReview = now-3*DAY;
  LE.record(store,{skill:'listen',word:'c2',correct:false},now-2*DAY);
  LE.record(store,{skill:'listen',word:'c2',correct:false},now-2*DAY);
  LE.getRecord(store,'listen','c2').nextReview = now-3*DAY;
  const sel = LE.selectPractice(store, { now, maxItems: 1, includeNew: false });
  assert.ok(sel.plan.length > 0);
  assert.ok(sel.plan[0].word === 'c1' || sel.plan[0].word === 'c2');
});

test('phase4: empty plan by recency bypass triggers only when needed', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  LE.record(store,{skill:'recognize',word:'a',correct:true},now-10*DAY);
  LE.getRecord(store,'recognize','a').nextReview = now-DAY;
  const sel = LE.selectPractice(store, { now, maxItems: 5, includeNew: false, recentlySeen: { [LE.key('recognize','a')]: now - 1000 } });
  assert.ok(sel.plan.length > 0); // fallback keeps non-empty
});

test('phase4: recency fallback does not trigger when the plan is already non-empty', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  ['a','b'].forEach(w => {
    LE.record(store, { skill: 'recognize', word: w, correct: true }, now - 10 * DAY);
    LE.getRecord(store, 'recognize', w).nextReview = now - DAY;
  });
  const sel = LE.selectPractice(store, {
    now, maxItems: 5, includeNew: false,
    recentlySeen: { [LE.key('recognize', 'a')]: now - 1000 }
  });
  assert.deepEqual(sel.plan.map(e => e.word), ['b'], 'the blocked item must stay out when another item is available');
});

test('phase4: maxPerItem applied to final plan after merge', () => {
  const now = T(2026, 1, 1);
  const store = LE.createStore();
  LE.record(store,{skill:'recognize',word:'bad',correct:false},now-2*DAY);
  LE.record(store,{skill:'recognize',word:'bad',correct:false},now-2*DAY);
  LE.getRecord(store,'recognize','bad').nextReview = now-3*DAY;
  LE.record(store,{skill:'recognize',word:'ok',correct:true},now-10*DAY);
  LE.getRecord(store,'recognize','ok').nextReview = now-DAY;
  const sel = LE.selectPractice(store, { now, maxItems: 5, includeNew: false });
  const keys = sel.plan.map(e=>e.key);
  assert.equal(new Set(keys).size, keys.length);
});
