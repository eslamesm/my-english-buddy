import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LE = require('../engine.js');

const DAY = LE.DAY;
const T = (y, mo, d, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();

function makeStore(now) {
  const store = LE.createStore();
  ['r1', 'r2', 'r3'].forEach((w) => {
    LE.record(store, { skill: 'recognize', word: w, correct: true }, now - 20 * DAY);
    LE.getRecord(store, 'recognize', w).nextReview = now - 2 * DAY;
  });
  ['s1', 's2', 's3'].forEach((w) => {
    LE.record(store, { skill: 'spell', word: w, correct: true }, now - 20 * DAY);
    LE.getRecord(store, 'spell', w).nextReview = now - 2 * DAY;
  });
  return store;
}

test('phase5 wiring: recent incorrect attempts in a skill change plan ordering toward it', () => {
  const now = T(2026, 1, 1);
  const store = makeStore(now);
  const base = LE.selectPractice(store, { now, maxItems: 6, weightSkills: true, includeNew: false });
  const attempts = [
    { skill: 'spell', outcome: 'incorrect', at: now - 1000 },
    { skill: 'spell', outcome: 'incorrect', at: now - 2000 },
    { skill: 'spell', outcome: 'incorrect', at: now - 3000 }
  ];
  const withRecent = LE.selectPractice(store, { now, maxItems: 6, weightSkills: true, includeNew: false, attempts: attempts });
  // With 3 recent failures in spell, spell should be ranked first.
  assert.equal(withRecent.plan[0].skill, 'spell', 'recent failures should prioritize spell');
  assert.notDeepEqual(withRecent.plan.map((e) => e.key), base.plan.map((e) => e.key));
});

test('phase5 wiring: explicit empty attempts keeps the baseline plan', () => {
  const now = T(2026, 1, 1);
  const store = makeStore(now);
  const base = LE.selectPractice(store, { now, maxItems: 6, weightSkills: true, includeNew: false });
  const empty = LE.selectPractice(store, { now, maxItems: 6, weightSkills: true, includeNew: false, attempts: [] });
  assert.deepEqual(empty.plan.map((e) => e.key), base.plan.map((e) => e.key));
});

test('phase5 wiring: undefined attempts keeps the baseline plan', () => {
  const now = T(2026, 1, 1);
  const store = makeStore(now);
  const base = LE.selectPractice(store, { now, maxItems: 6, weightSkills: true, includeNew: false });
  const undef = LE.selectPractice(store, { now, maxItems: 6, weightSkills: true, includeNew: false, attempts: undefined });
  assert.deepEqual(undef.plan.map((e) => e.key), base.plan.map((e) => e.key));
});

test('phase5 wiring: uncertain attempts do not change plan ordering', () => {
  const now = T(2026, 1, 1);
  const store = makeStore(now);
  const base = LE.selectPractice(store, { now, maxItems: 6, weightSkills: true, includeNew: false });
  const attempts = [
    { skill: 'recognize', outcome: 'uncertain', at: now - 1000 },
    { skill: 'recognize', outcome: 'uncertain', at: now - 2000 },
    { skill: 'recognize', outcome: 'uncertain', at: now - 3000 }
  ];
  const withUncertain = LE.selectPractice(store, { now, maxItems: 6, weightSkills: true, includeNew: false, attempts: attempts });
  assert.deepEqual(withUncertain.plan.map((e) => e.key), base.plan.map((e) => e.key));
});

test('phase5 wiring: old attempts (>7 days) do not change plan ordering', () => {
  const now = T(2026, 1, 1);
  const store = makeStore(now);
  const base = LE.selectPractice(store, { now, maxItems: 6, weightSkills: true, includeNew: false });
  const attempts = [
    { skill: 'recognize', outcome: 'incorrect', at: now - 8 * DAY },
    { skill: 'recognize', outcome: 'incorrect', at: now - 8 * DAY },
    { skill: 'recognize', outcome: 'incorrect', at: now - 8 * DAY }
  ];
  const withOld = LE.selectPractice(store, { now, maxItems: 6, weightSkills: true, includeNew: false, attempts: attempts });
  assert.deepEqual(withOld.plan.map((e) => e.key), base.plan.map((e) => e.key));
});

test('phase5 wiring: cross-profile attempts do not affect another profile store', () => {
  const now = T(2026, 1, 1);
  const storeA = makeStore(now);
  const storeB = makeStore(now);
  const baseB = LE.selectPractice(storeB, { now, maxItems: 6, weightSkills: true, includeNew: false });
  // A has recent failures in spell; B's plan with no attempts must stay baseline.
  const attemptsA = [
    { skill: 'spell', outcome: 'incorrect', at: now - 1000 },
    { skill: 'spell', outcome: 'incorrect', at: now - 2000 },
    { skill: 'spell', outcome: 'incorrect', at: now - 3000 }
  ];
  const bWithEmpty = LE.selectPractice(storeB, { now, maxItems: 6, weightSkills: true, includeNew: false, attempts: [] });
  assert.deepEqual(bWithEmpty.plan.map((e) => e.key), baseB.plan.map((e) => e.key));
  // Demonstrate that passing A's attempts WOULD change B's plan (proves isolation matters).
  const bWithA = LE.selectPractice(storeB, { now, maxItems: 6, weightSkills: true, includeNew: false, attempts: attemptsA });
  assert.notDeepEqual(bWithA.plan.map((e) => e.key), baseB.plan.map((e) => e.key));
});

test('phase5 wiring: selectPractice does not mutate the store', () => {
  const now = T(2026, 1, 1);
  const store = makeStore(now);
  const before = JSON.stringify(store);
  LE.selectPractice(store, { now, maxItems: 6, weightSkills: true, includeNew: false, attempts: [{ skill: 'spell', outcome: 'incorrect', at: now - 1000 }] });
  assert.equal(JSON.stringify(store), before);
});

test('phase5 wiring: selectPractice does not mutate mastery/nextReview/reviewInterval', () => {
  const now = T(2026, 1, 1);
  const store = makeStore(now);
  const snapshot = (s) => JSON.stringify(s.items);
  const before = snapshot(store);
  LE.selectPractice(store, { now, maxItems: 6, weightSkills: true, includeNew: false, attempts: [{ skill: 'spell', outcome: 'incorrect', at: now - 1000 }, { skill: 'spell', outcome: 'incorrect', at: now - 2000 }, { skill: 'spell', outcome: 'incorrect', at: now - 3000 }] });
  assert.equal(snapshot(store), before);
});

test('phase5 wiring: selectPractice does not mutate the attempts array', () => {
  const now = T(2026, 1, 1);
  const store = makeStore(now);
  const attempts = [{ skill: 'spell', outcome: 'incorrect', at: now - 1000 }];
  const before = JSON.stringify(attempts);
  LE.selectPractice(store, { now, maxItems: 6, weightSkills: true, includeNew: false, attempts: attempts });
  assert.equal(JSON.stringify(attempts), before);
});

test('phase5 wiring: weightSkills false ignores attempts', () => {
  const now = T(2026, 1, 1);
  const store = makeStore(now);
  const base = LE.selectPractice(store, { now, maxItems: 6, weightSkills: false, includeNew: false });
  const attempts = [
    { skill: 'spell', outcome: 'incorrect', at: now - 1000 },
    { skill: 'spell', outcome: 'incorrect', at: now - 2000 },
    { skill: 'spell', outcome: 'incorrect', at: now - 3000 }
  ];
  const withRecent = LE.selectPractice(store, { now, maxItems: 6, weightSkills: false, includeNew: false, attempts: attempts });
  assert.deepEqual(withRecent.plan.map((e) => e.key), base.plan.map((e) => e.key));
});