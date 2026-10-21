import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LE = require('../engine.js');

const DAY = LE.DAY;
const T = (y, mo, d, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();

test('selectPractice: due before new respects duePer/newPer', () => {
  const s = LE.createStore();
  const t0 = T(2026, 1, 1);
  ['a', 'b', 'c'].forEach(w => LE.record(s, { skill: 'recognize', word: w, correct: true }, t0));
  const now = t0 + 2 * DAY;
  LE.ensureRecord(s, 'recognize', 'n1');
  LE.ensureRecord(s, 'recognize', 'n2');
  LE.ensureRecord(s, 'recognize', 'n3');
  LE.ensureRecord(s, 'recognize', 'n4');
  const sel = LE.selectPractice(s, { now, maxItems: 10, duePer: 3, newPer: 1 });
  assert.equal(sel.plan.slice(0, 4).map(e => e.word).join(','), 'a,b,c,n1');
});

test('selectPractice: wrongCount affects priority among similar items', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 1);
  LE.record(s, { skill: 'recognize', word: 'easy', correct: true }, now - 5 * DAY);
  LE.record(s, { skill: 'recognize', word: 'hard', correct: false }, now - 1 * DAY);
  LE.record(s, { skill: 'recognize', word: 'hard', correct: false }, now - 1 * DAY);
  const recEasy = LE.getRecord(s, 'recognize', 'easy');
  const recHard = LE.getRecord(s, 'recognize', 'hard');
  recEasy.nextReview = now - DAY;
  recHard.nextReview = now - DAY;
  const sel = LE.selectPractice(s, { now, maxItems: 5, includeNew: false });
  assert.equal(sel.plan[0].word, 'hard');
});

test('selectPractice: assistedCount increases need', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 1);
  LE.record(s, { skill: 'recognize', word: 'assist', correct: true, hinted: true }, now - 3 * DAY);
  LE.record(s, { skill: 'recognize', word: 'assist', correct: true, hinted: true }, now - 2 * DAY);
  LE.record(s, { skill: 'recognize', word: 'ok', correct: true }, now - 3 * DAY);
  const recAssist = LE.getRecord(s, 'recognize', 'assist');
  const recOk = LE.getRecord(s, 'recognize', 'ok');
  recAssist.nextReview = now - DAY;
  recOk.nextReview = now - DAY;
  const sel = LE.selectPractice(s, { now, maxItems: 5, includeNew: false });
  assert.equal(sel.plan[0].word, 'assist');
});

test('selectPractice: uncertain never counts as an error and never increases weakness', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 1);
  // a word learned once, then answered with an unclear recognition
  LE.record(s, { skill: 'recognize', word: 'unc', correct: true }, now - 5 * DAY);
  LE.record(s, { skill: 'recognize', word: 'unc', correct: false, uncertain: true }, now - 2 * DAY);
  const recUnc = LE.getRecord(s, 'recognize', 'unc');

  // uncertain must not be stored as a mistake
  assert.equal(recUnc.wrongCount, 0, 'uncertain must not increase wrongCount');
  assert.equal(recUnc.mastery, 1, 'uncertain must not reduce mastery');
  assert.equal(recUnc.difficulty, 1, 'uncertain must not lower difficulty');
  assert.equal(recUnc.streak, 1, 'uncertain must not break the streak');

  // and it must not flag the item as weak
  const sel = LE.selectPractice(s, { now, includeNew: false });
  assert.ok(!sel.weak.some(e => e.word === 'unc'), 'uncertain must not mark the item weak');
  assert.ok(sel.due.some(e => e.word === 'unc'), 'a learned word stays reviewable after an uncertain attempt');
});

test('selectPractice: a word with only uncertain attempts is not treated as an error', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 1);
  LE.record(s, { skill: 'recognize', word: 'unc', correct: false, uncertain: true }, now - 2 * DAY);
  const rec = LE.getRecord(s, 'recognize', 'unc');
  assert.equal(rec.wrongCount, 0);
  assert.equal(rec.mastery, 0);
  const sel = LE.selectPractice(s, { now, includeNew: false });
  assert.ok(!sel.weak.some(e => e.word === 'unc'), 'must not be weak');
  assert.ok(!sel.due.some(e => e.word === 'unc'), 'must not be scheduled as a failed review');
});

test('selectPractice: recency via recentlySeen avoids immediate repeat', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 1);
  LE.record(s, { skill: 'recognize', word: 'a', correct: true }, now - 10 * DAY);
  LE.record(s, { skill: 'recognize', word: 'b', correct: true }, now - 10 * DAY);
  const recA = LE.getRecord(s, 'recognize', 'a');
  const recB = LE.getRecord(s, 'recognize', 'b');
  recA.nextReview = now - DAY;
  recB.nextReview = now - DAY;
  const sel = LE.selectPractice(s, { now, maxItems: 1, includeNew: false, recentlySeen: { 'recognize::a': now - 1000 } });
  assert.equal(sel.plan.length, 1);
  assert.equal(sel.plan[0].word, 'b');
});

test('selectPractice: critical due item is not blocked by recency', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 1);
  LE.record(s, { skill: 'recognize', word: 'bad', correct: false }, now - 1 * DAY);
  LE.record(s, { skill: 'recognize', word: 'bad', correct: false }, now - 1 * DAY);
  const recBad = LE.getRecord(s, 'recognize', 'bad');
  recBad.nextReview = now - DAY;
  const sel = LE.selectPractice(s, { now, maxItems: 1, includeNew: false, recentlySeen: { 'recognize::bad': now - 1000 } });
  assert.equal(sel.plan.length, 1);
  assert.equal(sel.plan[0].word, 'bad');
});

test('selectPractice: respects skills filter, newTarget, includeNew, newPer, duePer', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 1);
  LE.record(s, { skill: 'recognize', word: 'a', correct: true }, now);
  const recA = LE.getRecord(s, 'recognize', 'a');
  recA.nextReview = now - DAY;
  LE.ensureRecord(s, 'recognize', 'n1');
  LE.ensureRecord(s, 'spell', 'x');
  const sel = LE.selectPractice(s, { now, maxItems: 5, skills: ['recognize'], includeNew: true, newPer: 1, duePer: 2, newTarget: 0 });
  assert.equal(sel.plan.length, 1);
  assert.equal(sel.plan[0].skill, 'recognize');
});

test('selectPractice: old call style with no new options still works', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 1);
  LE.record(s, { skill: 'recognize', word: 'a', correct: true }, now);
  const sel = LE.selectPractice(s, { now });
  assert.ok(sel && Array.isArray(sel.plan));
});

test('selectPractice: no duplicate keys and no empty plan when items exist', () => {
  const s = LE.createStore();
  const now = T(2026, 1, 1);
  for (let i = 0; i < 5; i++) {
    LE.record(s, { skill: 'recognize', word: 'w' + i, correct: true }, now);
  }
  for (let i = 0; i < 5; i++) {
    const r = LE.getRecord(s, 'recognize', 'w' + i);
    r.nextReview = now - DAY;
  }
  const sel = LE.selectPractice(s, { now, maxItems: 10, includeNew: false });
  assert.ok(sel.plan.length > 0);
  const keys = sel.plan.map(e => e.key);
  assert.equal(new Set(keys).size, keys.length);
});
