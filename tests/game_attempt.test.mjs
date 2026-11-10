import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(testsDir, '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');

function extractMarkers(startMarker, endMarker) {
  const s = html.indexOf(startMarker);
  const e = html.indexOf(endMarker);
  if (s < 0 || e < s) throw new Error('markers not found: ' + startMarker);
  return html.slice(s, e + endMarker.length);
}

function makeRecentLog() {
  const src = extractMarkers('/* PHASE5_RECENT_ATTEMPTS_START */', '/* PHASE5_RECENT_ATTEMPTS_END */');
  const factory = new Function(src + '\nreturn createRecentSkillAttempts;')();
  return factory();
}

/* Browser parity (D6): in the real page, `recentSkillAttempts` is declared as a
   top-level `const`, which creates a global lexical binding visible to page
   scripts but NOT a property on `window`. We reproduce that topology exactly:
   bind a real global variable, and leave `window` unset so that any remaining
   dependency on `window.recentSkillAttempts` would fail instead of masking the
   helper's behavior like the injected-window topology used to do. */
function makeHelper(R) {
  globalThis.recentSkillAttempts = R;
  delete globalThis.window;
  const src = extractMarkers('/* PHASE5_GAME_ATTEMPT_START */', '/* PHASE5_GAME_ATTEMPT_END */');
  return new Function(src + '\nreturn { recordGameAttempt: recordGameAttempt, recordedGameAttempts: recordedGameAttempts };');
}

const NOW = Date.UTC(2026, 0, 1, 12, 0, 0);

test('regression (D6): recording works via global lexical binding without any window property', () => {
  const R = makeRecentLog();
  R.clear();
  const h = makeHelper(R)();
  // Exact browser topology, established by makeHelper BEFORE use:
  assert.equal(globalThis.recentSkillAttempts, R);   // bare global binding exists
  assert.equal(typeof globalThis.window, 'undefined'); // no window shortcut exists
  h.recordGameAttempt('childA', 'listen', true, 'cat', false, false, 'listen', 'd6:probe');
  assert.equal(R.sizeFor('childA', { now: NOW }), 1);
  const e = R.listFor('childA', { now: NOW })[0];
  assert.equal(e.outcome, 'independent');
  assert.equal(e.skill, 'listen');
  assert.equal(R.listFor('childB', { now: NOW }).length, 0);
});

test('game attempt: independent recorded once (lexical-binding helper)', () => {
  const R = makeRecentLog();
  R.clear();
  const h = makeHelper(R)();
  h.recordGameAttempt('childA', 'listen', true, 'cat', false, false, 'listen', 'listen:0');
  assert.equal(R.sizeFor('childA', { now: NOW }), 1);
  const e = R.listFor('childA', { now: NOW })[0];
  assert.equal(e.outcome, 'independent');
  assert.equal(e.skill, 'listen');
});

test('game attempt: assisted recorded when hinted', () => {
  const R = makeRecentLog();
  R.clear();
  const h = makeHelper(R)();
  h.recordGameAttempt('childA', 'spell', true, 'dog', true, false, 'spell', 'spell:0');
  assert.equal(R.sizeFor('childA', { now: NOW }), 1);
  assert.equal(R.listFor('childA', { now: NOW })[0].outcome, 'assisted');
});

test('game attempt: assisted recorded when revealed', () => {
  const R = makeRecentLog();
  R.clear();
  const h = makeHelper(R)();
  h.recordGameAttempt('childA', 'recognize', true, 'dog', false, true, 'listen', 'listen:1');
  assert.equal(R.sizeFor('childA', { now: NOW }), 1);
  assert.equal(R.listFor('childA', { now: NOW })[0].outcome, 'assisted');
});

test('game attempt: incorrect recorded', () => {
  const R = makeRecentLog();
  R.clear();
  const h = makeHelper(R)();
  h.recordGameAttempt('childA', 'recognize', false, 'bat', false, false, 'listen', 'listen:2');
  assert.equal(R.sizeFor('childA', { now: NOW }), 1);
  assert.equal(R.listFor('childA', { now: NOW })[0].outcome, 'incorrect');
});

test('game attempt: missing profileId → no record', () => {
  const R = makeRecentLog();
  R.clear();
  const h = makeHelper(R)();
  h.recordGameAttempt(null, 'recognize', true, 'cat', false, false, 'listen', 'listen:3');
  assert.equal(R.sizeFor('childA', { now: NOW }), 0);
});

test('game attempt: missing word → no record', () => {
  const R = makeRecentLog();
  R.clear();
  const h = makeHelper(R)();
  h.recordGameAttempt('childA', 'recognize', true, '', false, false, 'listen', 'listen:4');
  assert.equal(R.sizeFor('childA', { now: NOW }), 0);
});

test('game attempt: invalid skill → no record', () => {
  const R = makeRecentLog();
  R.clear();
  const h = makeHelper(R)();
  h.recordGameAttempt('childA', 'nope', true, 'cat', false, false, 'listen', 'listen:5');
  assert.equal(R.sizeFor('childA', { now: NOW }), 0);
});

test('game attempt: excluded games (builder/memory/count/exam/rush/daily) → no record', () => {
  const R = makeRecentLog();
  R.clear();
  const h = makeHelper(R)();
  for (const mode of ['builder', 'memory', 'count', 'exam', 'rush', 'daily']) {
    h.recordGameAttempt('childA', 'recognize', true, 'cat', false, false, mode, mode + ':0');
  }
  assert.equal(R.sizeFor('childA', { now: NOW }), 0);
});

test('game attempt: dedup same attemptId → one entry; attemptId not consumed on rejection', () => {
  const R = makeRecentLog();
  R.clear();
  const h = makeHelper(R)();
  h.recordGameAttempt('childA', 'listen', true, 'cat', false, false, 'listen', 'game:0');
  h.recordGameAttempt('childA', 'listen', true, 'cat', false, false, 'listen', 'game:0'); // duplicate
  assert.equal(R.sizeFor('childA', { now: NOW }), 1);
  // rejected call (invalid skill) must not consume the attemptId
  h.recordGameAttempt('childA', 'nope', true, 'cat', false, false, 'listen', 'game:1');
  h.recordGameAttempt('childA', 'listen', true, 'cat', false, false, 'listen', 'game:1');
  assert.equal(R.sizeFor('childA', { now: NOW }), 2);
});

test('game attempt: different attemptId → two entries', () => {
  const R = makeRecentLog();
  R.clear();
  const h = makeHelper(R)();
  h.recordGameAttempt('childA', 'listen', true, 'cat', false, false, 'listen', 'game:0');
  h.recordGameAttempt('childA', 'listen', false, 'dog', false, false, 'listen', 'game:1');
  assert.equal(R.sizeFor('childA', { now: NOW }), 2);
});

test('game attempt: recordGameAttempt does not mutate SRS/stars/sessionEvents', () => {
  // Behavioral: recordGameAttempt only calls recentSkillAttempts.record.
  // Verify by checking the helper source has no SRS/stats/stars/sessionEvents calls.
  const src = extractMarkers('/* PHASE5_GAME_ATTEMPT_START */', '/* PHASE5_GAME_ATTEMPT_END */');
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.ok(!/learnEvent/.test(codeOnly));
  assert.ok(!/LearningEngine\.record/.test(codeOnly));
  assert.ok(!/bumpWordStar/.test(codeOnly));
  assert.ok(!/recordGame\b/.test(codeOnly));
  assert.ok(!/sessionOutcome/.test(codeOnly));
  assert.ok(!/sessionEvents/.test(codeOnly));
  assert.ok(!/saveProfiles/.test(codeOnly));
  assert.ok(!/setItemStars/.test(codeOnly));
  assert.ok(!/p\.progress/.test(codeOnly));
});

test('static (D6): index.html has no residual window.recentSkillAttempts dependency', () => {
  assert.ok(!html.includes('window.recentSkillAttempts'));
});

test('static (D6): game helper guard is typeof-based on the bare identifier', () => {
  const src = extractMarkers('/* PHASE5_GAME_ATTEMPT_START */', '/* PHASE5_GAME_ATTEMPT_END */');
  assert.match(src, /if\(typeof recentSkillAttempts!=='undefined'\)\{/);
});

test('static (D6): selectPractice wiring passes attempts via typeof guard', () => {
  assert.match(html, /attempts:\(typeof recentSkillAttempts!=='undefined'\?recentSkillAttempts\.listFor\(p\.id\):undefined\)/);
});

test('static (3C.1): answerGame calls recordGameAttempt', () => {
  const i = html.indexOf('function answerGame(');
  const j = html.indexOf('function answerMissing(');
  const block = html.slice(i, j);
  assert.match(block, /recordGameAttempt\(game\.profileId,/);
});

test('static (3C.1): answerMissing calls recordGameAttempt', () => {
  const i = html.indexOf('function answerMissing(');
  const j = html.indexOf('function answerCount(');
  const block = html.slice(i, j);
  assert.match(block, /recordGameAttempt\(game\.profileId, 'recognize', ok,/);
});

test('static (3C.1): answerSort calls recordGameAttempt', () => {
  const i = html.indexOf('function answerSort(');
  const j = html.indexOf('function answerBoss(');
  const block = html.slice(i, j);
  assert.match(block, /recordGameAttempt\(game\.profileId, 'recognize', ok,/);
});

test('static (3C.1): answerBoss calls recordGameAttempt', () => {
  const i = html.indexOf('function answerBoss(');
  const j = html.indexOf('function answerExam(');
  const block = html.slice(i, j);
  assert.match(block, /recordGameAttempt\(game\.profileId, 'recognize', ok,/);
});

test('static (3C.1): answerSimilar calls recordGameAttempt', () => {
  const i = html.indexOf('function answerSimilar(');
  const j = html.indexOf('function finishSimilar(');
  const block = html.slice(i, j);
  assert.match(block, /recordGameAttempt\(game\.profileId, 'recognize', ok,/);
});

test('static (3C.1): answerCount does NOT call recordGameAttempt', () => {
  const i = html.indexOf('function answerCount(');
  const j = html.indexOf('function answerSort(');
  const block = html.slice(i, j);
  assert.ok(!/recordGameAttempt/.test(block));
});

test('static (3C.1): answerExam does NOT call recordGameAttempt', () => {
  const i = html.indexOf('function answerExam(');
  const j = html.indexOf('function finishExam(');
  const block = html.slice(i, j);
  assert.ok(!/recordGameAttempt/.test(block));
});

test('static (3C.1): memory does NOT call recordGameAttempt', () => {
  const i = html.indexOf('function flipMemory(');
  const j = html.indexOf('function finishMemory(');
  const block = html.slice(i, j);
  assert.ok(!/recordGameAttempt/.test(block));
});

test('static (3C.1): game objects include profileId', () => {
  const matches = html.match(/profileId: currentId/g) || [];
  assert.ok(matches.length >= 10, 'at least 10 game initializations should include profileId');
});
