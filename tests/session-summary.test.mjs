import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LE = require('../engine.js');

/* ------------------------------------------------------------------ *
 * v6.9 — summarizeSession(): pure, deterministic end-of-session recap
 * ------------------------------------------------------------------ */

test('summarizeSession exists and returns a stable empty shape', () => {
  const s = LE.summarizeSession([], {});
  assert.equal(typeof LE.summarizeSession, 'function');
  assert.equal(s.total, 0);
  assert.equal(s.independent, 0);
  assert.equal(s.assisted, 0);
  assert.equal(s.incorrect, 0);
  assert.equal(s.uncertain, 0);
  assert.equal(s.accuracy, 0);
  assert.equal(s.perfect, false);
  assert.equal(s.stars, 0);
  assert.deepEqual(s.skillsPracticed, []);
  assert.equal(s.dailyTarget, LE.DAILY_NEW_DEFAULT);
  assert.equal(s.dueRemaining, 0);
});

test('no history at all is handled safely (null / non-array / garbage)', () => {
  assert.equal(LE.summarizeSession(null).total, 0);
  assert.equal(LE.summarizeSession(undefined).total, 0);
  assert.equal(LE.summarizeSession('nope').total, 0);
  assert.equal(LE.summarizeSession([null, 1, 'x', {}, { word: '' }]).total, 0);
});

test('independent-only session is perfect with 3 stars', () => {
  const ev = [
    { word: 'cat', skill: 'recognize', outcome: 'independent' },
    { word: 'dog', skill: 'listen', outcome: 'independent' },
    { word: 'egg', skill: 'spell', outcome: 'independent' }
  ];
  const s = LE.summarizeSession(ev);
  assert.equal(s.total, 3);
  assert.equal(s.independent, 3);
  assert.equal(s.answered, 3);
  assert.equal(s.accuracy, 100);
  assert.equal(s.perfect, true);
  assert.equal(s.stars, 3);
  assert.deepEqual(s.skillsPracticed, ['recognize', 'listen', 'spell']);
});

test('incorrect answers lower accuracy and are not counted as independent', () => {
  const ev = [
    { word: 'cat', skill: 'recognize', outcome: 'independent' },
    { word: 'dog', skill: 'recognize', outcome: 'incorrect' },
    { word: 'egg', skill: 'recognize', outcome: 'incorrect' },
    { word: 'fox', skill: 'recognize', outcome: 'independent' }
  ];
  const s = LE.summarizeSession(ev);
  assert.equal(s.answered, 4);
  assert.equal(s.independent, 2);
  assert.equal(s.incorrect, 2);
  assert.equal(s.accuracy, 50);
  assert.equal(s.perfect, false);
  assert.equal(s.stars, 1);
});

test('uncertain ASR is recorded but never counted as a mistake', () => {
  const ev = [
    { word: 'cat', skill: 'pronounce', outcome: 'uncertain' },
    { word: 'dog', skill: 'pronounce', outcome: 'uncertain' },
    { word: 'egg', skill: 'pronounce', outcome: 'independent' }
  ];
  const s = LE.summarizeSession(ev);
  assert.equal(s.uncertain, 2);
  assert.equal(s.incorrect, 0);
  assert.equal(s.answered, 1);
  assert.equal(s.independent, 1);
  assert.equal(s.accuracy, 100);
  assert.equal(s.perfect, true);
  assert.equal(s.stars, 3);
});

test('assisted answers count as attempts but never as independent success', () => {
  const ev = [
    { word: 'cat', skill: 'spell', outcome: 'assisted' },
    { word: 'dog', skill: 'spell', outcome: 'assisted' }
  ];
  const s = LE.summarizeSession(ev);
  assert.equal(s.total, 2);
  assert.equal(s.assisted, 2);
  assert.equal(s.independent, 0);
  assert.equal(s.answered, 0);
  assert.equal(s.incorrect, 0);
  assert.equal(s.perfect, false);
  assert.equal(s.stars, 1);
});

test('mixed assisted + independent + uncertain gives 2 stars when accuracy is high enough', () => {
  const ev = [
    { word: 'cat', skill: 'recognize', outcome: 'independent' },
    { word: 'dog', skill: 'recognize', outcome: 'independent' },
    { word: 'egg', skill: 'recognize', outcome: 'independent' },
    { word: 'fox', skill: 'recognize', outcome: 'independent' },
    { word: 'ant', skill: 'recognize', outcome: 'assisted' },
    { word: 'bee', skill: 'recognize', outcome: 'uncertain' }
  ];
  const s = LE.summarizeSession(ev);
  assert.equal(s.stars, 2);
  assert.equal(s.accuracy, 100);
});

test('bySkill tally is per-skill and skillsPracticed follows canonical SKILLS order', () => {
  const ev = [
    { word: 'a', skill: 'spell', outcome: 'independent' },
    { word: 'b', skill: 'recognize', outcome: 'independent' },
    { word: 'c', skill: 'listen', outcome: 'incorrect' },
    { word: 'd', skill: 'spell', outcome: 'uncertain' }
  ];
  const s = LE.summarizeSession(ev);
  assert.equal(s.bySkill.spell.total, 2);
  assert.equal(s.bySkill.spell.independent, 1);
  assert.equal(s.bySkill.spell.uncertain, 1);
  assert.equal(s.bySkill.listen.incorrect, 1);
  assert.deepEqual(s.skillsPracticed, ['recognize', 'listen', 'spell']);
});

test('unknown skill normalises to recognize (conservative), unknown outcome ignored', () => {
  const ev = [
    { word: 'a', skill: 'bogus', outcome: 'independent' },
    { word: 'b', skill: 'recognize', outcome: 'whatever' }
  ];
  const s = LE.summarizeSession(ev);
  assert.equal(s.total, 1);
  assert.equal(s.bySkill.recognize.total, 1);
  assert.deepEqual(s.skillsPracticed, ['recognize']);
});

test('daily-target progress is clamped 0..100 and derived from new words today', () => {
  const ev = [{ word: 'a', skill: 'recognize', outcome: 'independent' }];
  assert.equal(LE.summarizeSession(ev, { dailyTarget: 5, dailyNewToday: 2 }).dailyProgress, 40);
  assert.equal(LE.summarizeSession(ev, { dailyTarget: 5, dailyNewToday: 5 }).dailyProgress, 100);
  assert.equal(LE.summarizeSession(ev, { dailyTarget: 5, dailyNewToday: 99 }).dailyProgress, 100);
  assert.equal(LE.summarizeSession(ev, { dailyTarget: 5, dailyNewToday: -3 }).dailyProgress, 0);
});

test('invalid daily target falls back to the safe default; dueRemaining is non-negative', () => {
  const ev = [{ word: 'a', skill: 'recognize', outcome: 'independent' }];
  assert.equal(LE.summarizeSession(ev, { dailyTarget: 7 }).dailyTarget, LE.DAILY_NEW_DEFAULT);
  assert.equal(LE.summarizeSession(ev, { dueRemaining: -4 }).dueRemaining, 0);
  assert.equal(LE.summarizeSession(ev, { dueRemaining: 12 }).dueRemaining, 12);
});

test('corrected answers are tallied separately without changing independent/incorrect counts', () => {
  const ev = [
    { word: 'cat', skill: 'spell', outcome: 'independent', corrected: true },
    { word: 'dog', skill: 'spell', outcome: 'independent' }
  ];
  const s = LE.summarizeSession(ev);
  assert.equal(s.corrected, 1);
  assert.equal(s.independent, 2);
  assert.equal(s.accuracy, 100);
});

test('totalItems defaults to distinct words but can be overridden by opts', () => {
  const ev = [
    { word: 'Cat', skill: 'recognize', outcome: 'independent' },
    { word: 'cat', skill: 'listen', outcome: 'independent' }
  ];
  assert.equal(LE.summarizeSession(ev).sessionItems, 1);
  assert.equal(LE.summarizeSession(ev, { totalItems: 10 }).sessionItems, 10);
});

test('summarizeSession is deterministic (same input -> same output)', () => {
  const ev = [
    { word: 'cat', skill: 'recognize', outcome: 'independent' },
    { word: 'dog', skill: 'listen', outcome: 'incorrect' }
  ];
  const a = JSON.stringify(LE.summarizeSession(ev, { dailyTarget: 5, dailyNewToday: 3, dueRemaining: 2 }));
  const b = JSON.stringify(LE.summarizeSession(ev, { dailyTarget: 5, dailyNewToday: 3, dueRemaining: 2 }));
  assert.equal(a, b);
});

test('does not mutate the input event list', () => {
  const ev = [{ word: 'cat', skill: 'recognize', outcome: 'independent' }];
  const copy = JSON.stringify(ev);
  LE.summarizeSession(ev, { dailyTarget: 5 });
  assert.equal(JSON.stringify(ev), copy);
});
