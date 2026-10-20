import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LE = require('../engine.js');

/* ------------------------------------------------------------------ *
 * v7.0 — coachMessage(): pure, deterministic Smart Coach messaging.
 * Every branch is driven by real, already-measured learner numbers.
 * ------------------------------------------------------------------ */

const shape = (m) => m && typeof m.id === 'string' && typeof m.key === 'string' && typeof m.text === 'string' && m.text.length > 0;

test('coachMessage exists and returns a stable {id,key,text} shape', () => {
  assert.equal(typeof LE.coachMessage, 'function');
  const m = LE.coachMessage({});
  assert.ok(shape(m), 'must return a populated {id,key,text}');
  assert.equal(m.id, 'generic');
});

test('no evidence at all falls back to generic encouragement', () => {
  for (const ctx of [undefined, null, {}, 'x', 42, [], { foo: 'bar' }]) {
    const m = LE.coachMessage(ctx);
    assert.equal(m.id, 'generic', 'ctx=' + JSON.stringify(ctx));
    assert.ok(shape(m));
  }
});

test('priority 1: reliable weakest-skill message wins over everything', () => {
  const m = LE.coachMessage({
    weakestSkill: 'pronounce', skillReliable: true,
    dueCount: 9, streak: 7, todayAttempts: 20, goal: 10,
    independent: 3, incorrect: 0, uncertain: 0, accuracy: 100
  });
  assert.equal(m.id, 'skill');
  assert.equal(m.key, 'skill:pronounce');
});

test('weakest skill is IGNORED unless skillReliable is true (no thin-data claims)', () => {
  const a = LE.coachMessage({ weakestSkill: 'spell', skillReliable: false, dueCount: 2 });
  assert.equal(a.id, 'due', 'unreliable skill must not be claimed');
  const b = LE.coachMessage({ weakestSkill: 'spell', dueCount: 2 });
  assert.equal(b.id, 'due', 'missing skillReliable must not be claimed');
  const c = LE.coachMessage({ weakestSkill: 'bogus', skillReliable: true, dueCount: 2 });
  assert.equal(c.id, 'due', 'unknown skill id must be ignored');
});

test('skill label is included and comes from the canonical label map', () => {
  const m = LE.coachMessage({ weakestSkill: 'listen', skillReliable: true });
  assert.equal(m.id, 'skill');
  assert.ok(m.text.includes(LE.SKILL_LABELS.listen), 'label must appear in message');
});

test('priority 2: due-review reminder when no reliable weak skill', () => {
  const m = LE.coachMessage({ dueCount: 5 });
  assert.equal(m.id, 'due');
  assert.ok(m.text.includes('5'));
});

test('due-review key is stable and bucketed (few/some/many)', () => {
  assert.equal(LE.coachMessage({ dueCount: 1 }).key, 'due:few');
  assert.equal(LE.coachMessage({ dueCount: 5 }).key, 'due:some');
  assert.equal(LE.coachMessage({ dueCount: 12 }).key, 'due:many');
  // same bucket -> same key (stable)
  assert.equal(LE.coachMessage({ dueCount: 6 }).key, LE.coachMessage({ dueCount: 9 }).key);
});

test('priority 3: streak milestone (multiple of 7) beats plain streak but not due', () => {
  assert.equal(LE.coachMessage({ streak: 7 }).id, 'streak7');
  assert.equal(LE.coachMessage({ streak: 14 }).id, 'streak7');
  assert.equal(LE.coachMessage({ streak: 3 }).id, 'streak3');
  assert.equal(LE.coachMessage({ streak: 2 }).id, 'generic', 'short streak with nothing else is generic');
  // due still outranks streak
  assert.equal(LE.coachMessage({ streak: 7, dueCount: 3 }).id, 'due');
});

test('priority 4: daily-goal completion vs progress', () => {
  assert.equal(LE.coachMessage({ todayAttempts: 10, goal: 10 }).id, 'goalDone');
  assert.equal(LE.coachMessage({ todayAttempts: 12, goal: 10 }).id, 'goalDone');
  assert.equal(LE.coachMessage({ todayAttempts: 4, goal: 10 }).id, 'goalProgress');
});

test('invalid goal falls back to the safe default (10) without crashing', () => {
  const m = LE.coachMessage({ todayAttempts: 4, goal: 7 });
  assert.equal(m.id, 'goalProgress');
  assert.ok(m.text.includes('10'), 'default goal 10 should be used');
});

test('priority 5: session messages — perfect, retry, heard (uncertain), good', () => {
  assert.equal(LE.coachMessage({ independent: 3, incorrect: 0, uncertain: 0, accuracy: 100 }).id, 'sessionPerfect');
  assert.equal(LE.coachMessage({ independent: 1, incorrect: 2, accuracy: 33 }).id, 'sessionRetry');
  assert.equal(LE.coachMessage({ uncertain: 2, independent: 0, incorrect: 0 }).id, 'sessionHeard');
  assert.equal(LE.coachMessage({ independent: 2, incorrect: 0, uncertain: 1, accuracy: 100 }).id, 'sessionGood');
});

test('uncertain answers are never described as errors or wrong', () => {
  const m = LE.coachMessage({ uncertain: 3, independent: 0, incorrect: 0 });
  assert.equal(m.id, 'sessionHeard');
  assert.ok(/ليس خطأ|لم أسمع/.test(m.text), 'must be framed as "not heard", not an error');
  assert.ok(!/خطأ\b/.test(m.text.replace('ليس خطأ', '')), 'no other error wording');
});

test('an uncertain-only session outranks a plain independent "good" message', () => {
  const m = LE.coachMessage({ uncertain: 2, independent: 1, incorrect: 0 });
  assert.equal(m.id, 'sessionGood', 'mixed heard+independent -> good, never retry');
  assert.notEqual(m.id, 'sessionRetry');
});

test('priority 6: generic is the final fallback', () => {
  const m = LE.coachMessage({ starNote: 'ignored', random: 'ignored' });
  assert.equal(m.id, 'generic');
});

test('determinism: identical input yields identical output (incl. key/text)', () => {
  const ctx = { dueCount: 6, streak: 4, todayAttempts: 2, goal: 10 };
  assert.equal(JSON.stringify(LE.coachMessage(ctx)), JSON.stringify(LE.coachMessage(ctx)));
});

test('does not mutate its input object', () => {
  const ctx = { weakestSkill: 'spell', skillReliable: true, dueCount: 5, goal: 10 };
  const copy = JSON.stringify(ctx);
  LE.coachMessage(ctx);
  assert.equal(JSON.stringify(ctx), copy);
});

test('malformed / negative / non-finite numbers are sanitised safely', () => {
  const m = LE.coachMessage({ dueCount: -5, streak: NaN, todayAttempts: Infinity, goal: 'x' });
  assert.ok(shape(m));
  assert.equal(m.id, 'generic', 'all-invalid context -> generic');
  // non-finite treated as absent; numeric strings are coerced like the rest of the engine
  assert.equal(LE.coachMessage({ dueCount: '3' }).id, 'due');
  assert.equal(LE.coachMessage({ dueCount: 3 }).id, 'due');
  assert.equal(LE.coachMessage({ dueCount: 'abc' }).id, 'generic');
});

test('ids and keys are stable constants (regression guard)', () => {
  const ids = {
    skill: LE.coachMessage({ weakestSkill: 'listen', skillReliable: true }).id,
    due: LE.coachMessage({ dueCount: 3 }).id,
    streak7: LE.coachMessage({ streak: 7 }).id,
    streak3: LE.coachMessage({ streak: 3 }).id,
    goalDone: LE.coachMessage({ todayAttempts: 10, goal: 10 }).id,
    goalProgress: LE.coachMessage({ todayAttempts: 1, goal: 10 }).id,
    sessionPerfect: LE.coachMessage({ independent: 1, accuracy: 100 }).id,
    sessionRetry: LE.coachMessage({ incorrect: 1, accuracy: 0 }).id,
    sessionHeard: LE.coachMessage({ uncertain: 1 }).id,
    generic: LE.coachMessage({}).id
  };
  assert.deepEqual(ids, {
    skill: 'skill', due: 'due', streak7: 'streak7', streak3: 'streak3',
    goalDone: 'goalDone', goalProgress: 'goalProgress',
    sessionPerfect: 'sessionPerfect', sessionRetry: 'sessionRetry',
    sessionHeard: 'sessionHeard', generic: 'generic'
  });
});

test('SKILL_LABELS export is a stable copy covering all engine skills', () => {
  assert.equal(typeof LE.SKILL_LABELS, 'object');
  LE.SKILLS.forEach(s => assert.equal(typeof LE.SKILL_LABELS[s], 'string'));
});
