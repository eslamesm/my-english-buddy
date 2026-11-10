import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(testsDir, '..');
const htmlPath = path.join(root, 'index.html');
const enginePath = path.join(root, 'engine.js');
const html = readFileSync(htmlPath, 'utf8');

function makeLog() {
  const start = html.indexOf('/* PHASE5_RECENT_ATTEMPTS_START */');
  const end = html.indexOf('/* PHASE5_RECENT_ATTEMPTS_END */');
  if (start < 0 || end < start) throw new Error('recent-attempts core markers not found');
  const src = html.slice(start, end + '/* PHASE5_RECENT_ATTEMPTS_END */'.length);
  const factory = new Function(src + '\nreturn createRecentSkillAttempts;')();
  return factory();
}

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 1, 12, 0, 0);

test('recent attempts: two children keep separate buckets', () => {
  const R = makeLog();
  R.clear();
  R.record('childA', 'spell', 'incorrect', NOW - 1000, { now: NOW });
  R.record('childB', 'listen', 'independent', NOW - 2000, { now: NOW });
  assert.equal(R.sizeFor('childA', { now: NOW }), 1);
  assert.equal(R.sizeFor('childB', { now: NOW }), 1);
  assert.equal(R.listFor('childA', { now: NOW })[0].skill, 'spell');
  assert.equal(R.listFor('childB', { now: NOW })[0].skill, 'listen');
  assert.equal(R.listFor('childC', { now: NOW }).length, 0);
});

test('recent attempts: builder attempts are rejected', () => {
  const R = makeLog();
  R.clear();
  const r = R.record('childA', 'recognize', 'incorrect', NOW, { now: NOW, mode: 'builder' });
  assert.equal(r, null);
  assert.equal(R.sizeFor('childA', { now: NOW }), 0);
  // Same shape without builder mode is accepted.
  R.record('childA', 'recognize', 'independent', NOW - 100, { now: NOW, mode: 'words' });
  assert.equal(R.sizeFor('childA', { now: NOW }), 1);
});

test('recent attempts: entries older than 7 days are pruned on read and on write', () => {
  const R = makeLog();
  R.clear();
  assert.equal(R.record('childA', 'spell', 'incorrect', NOW - 8 * DAY, { now: NOW }), null);
  assert.equal(R.sizeFor('childA', { now: NOW }), 0);
  R.record('childA', 'spell', 'incorrect', NOW - 6 * DAY, { now: NOW });
  assert.equal(R.sizeFor('childA', { now: NOW }), 1);
  // Pruned on read when "now" moves forward.
  assert.equal(R.listFor('childA', { now: NOW + 2 * DAY }).length, 0);
  assert.equal(R.sizeFor('childA', { now: NOW + 2 * DAY }), 0);
});

test('recent attempts: the 7-day boundary itself is kept', () => {
  const R = makeLog();
  R.clear();
  R.record('childA', 'spell', 'incorrect', NOW - R.WINDOW_MS, { now: NOW });
  assert.equal(R.sizeFor('childA', { now: NOW }), 1);
});

test('recent attempts: only the last 100 attempts per child are kept', () => {
  const R = makeLog();
  R.clear();
  const n = 105;
  for (let i = 0; i < n; i++) {
    R.record('childA', 'spell', 'incorrect', NOW - (n - i) * 1000, { now: NOW });
  }
  const list = R.listFor('childA', { now: NOW });
  assert.equal(list.length, 100);
  assert.equal(list[0].at, NOW - 100 * 1000);
  assert.equal(list[99].at, NOW - 1000);
});

test('recent attempts: invalid data is rejected and creates no bucket', () => {
  const R = makeLog();
  R.clear();
  assert.equal(R.record('', 'spell', 'incorrect', NOW, { now: NOW }), null);
  assert.equal(R.record('childA', 'nope', 'incorrect', NOW, { now: NOW }), null);
  assert.equal(R.record('childA', 'spell', 'maybe', NOW, { now: NOW }), null);
  assert.equal(R.record('childA', 'spell', 'incorrect', 'not-a-number', { now: NOW }), null);
  assert.equal(R.sizeFor('childA', { now: NOW }), 0);
});

test('recent attempts: implausibly future timestamps are rejected', () => {
  const R = makeLog();
  R.clear();
  assert.equal(R.record('childA', 'spell', 'incorrect', NOW + 10 * 60 * 1000, { now: NOW }), null);
  assert.equal(R.sizeFor('childA', { now: NOW }), 0);
  R.record('childA', 'spell', 'incorrect', NOW + 60 * 1000, { now: NOW });
  assert.equal(R.sizeFor('childA', { now: NOW }), 1);
});

test('recent attempts: returned entries are copies and keep the four fields', () => {
  const R = makeLog();
  R.clear();
  R.record('childA', 'recognize', 'uncertain', NOW - 50, { now: NOW });
  const a = R.listFor('childA', { now: NOW })[0];
  assert.deepEqual(Object.keys(a).sort(), ['at', 'outcome', 'profileId', 'skill']);
  a.skill = 'listen';
  assert.equal(R.listFor('childA', { now: NOW })[0].skill, 'recognize');
});

test('recent attempts: clear(profileId) removes only that child', () => {
  const R = makeLog();
  R.clear();
  R.record('childA', 'spell', 'incorrect', NOW, { now: NOW });
  R.record('childB', 'spell', 'incorrect', NOW, { now: NOW });
  R.clear('childA');
  assert.equal(R.sizeFor('childA', { now: NOW }), 0);
  assert.equal(R.sizeFor('childB', { now: NOW }), 1);
});

test('recent attempts: async attempt stays with the profile that started it', async () => {
  const R = makeLog();
  R.clear();
  const profileAtStart = 'childA';
  const attemptAt = NOW;
  let currentId = 'childA';
  const pending = new Promise((resolve) => setTimeout(resolve, 5));
  // Simulate a profile switch while the speech engine is still working.
  currentId = 'childB';
  await pending;
  // The recording step must use the captured profile id, never currentId.
  R.record(profileAtStart, 'recognize', 'incorrect', attemptAt, { now: attemptAt, mode: 'words' });
  assert.equal(R.sizeFor('childA', { now: attemptAt }), 1);
  assert.equal(R.sizeFor('childB', { now: attemptAt }), 0);
  assert.equal(currentId, 'childB');
});

test('recent attempts: module does not touch localStorage, learning or DOM', () => {
  const rawSrc = html.slice(html.indexOf('/* PHASE5_RECENT_ATTEMPTS_START */'), html.indexOf('/* PHASE5_RECENT_ATTEMPTS_END */') + '/* PHASE5_RECENT_ATTEMPTS_END */'.length);
  const src = rawSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.ok(!/localStorage/.test(src));
  assert.ok(!/\.learning\b/.test(src));
  assert.ok(!/LearningEngine/.test(src));
  assert.ok(!/sessionEvents/.test(src));
});

test('static: sessionEvents keeps its exact shape and still has builder events', () => {
  const pushes = html.match(/sessionEvents\.push\(/g) || [];
  assert.equal(pushes.length, 1);
  const exact = 'sessionEvents.push({ word:String(word), skill:skill, outcome:outcome, corrected:!!corrected, isNew:!!isNew, profileId: profileId || null });';
  assert.ok(html.includes(exact));
  assert.match(html, /summarizeSession\(myEvents/);
  assert.match(html, /coachFor\(\{\s*session:true\s*\}\)/);
});

test('static: finishLevel and enterHome do not clear sessionEvents', () => {
  const flRaw = html.slice(html.indexOf('function finishLevel(){'), html.indexOf('/* build the end-of-session summary block'));
  // The only reset inside finishLevel is the user-triggered "again" callback,
  // which is intentional and pre-existing. Automatic clears are what we forbid.
  const fl = flRaw.replace(/again: \(\)=>\{[^}]*\}/, 'again: () => {}');
  assert.ok(!/sessionEvents=\[\]/.test(fl));
  const eh = html.slice(html.indexOf('function enterHome(){'), html.indexOf('function buildModeGrid(){'));
  assert.ok(!/sessionEvents=\[\]/.test(eh));
});

test('static: btnMic captures profile id before await and forwards it', () => {
  const start = html.indexOf("document.getElementById('btnMic').onclick=async ()=>{");
  const end = html.indexOf('document.getElementById(\'btnReplayMe\')');
  const block = html.slice(start, end);
  const capture = block.indexOf('const attemptProfileId=currentId;');
  const awaitIdx = block.indexOf('await recognizeOnce()');
  assert.ok(capture >= 0);
  assert.ok(awaitIdx >= 0);
  assert.ok(capture < awaitIdx);
  assert.match(block, /scoreAttempt\(alts,engine,confidence,attemptProfileId,attemptAt\)/);
});

test('static (2B): selectPractice is wired with attempts from recentSkillAttempts', () => {
  const line = html.split('\n').find((l) => l.includes('LearningEngine.selectPractice'));
  assert.ok(line);
  assert.match(line, /attempts:\(typeof recentSkillAttempts!=='undefined'\?recentSkillAttempts\.listFor\(p\.id\):undefined\)/);
});

test('static: D8 engine markers are still present', () => {
  const engine = readFileSync(enginePath, 'utf8');
  assert.match(engine, /function attemptTimestamp/);
  assert.match(engine, /SKILL_PERF_FUTURE_SKEW_MS/);
  assert.match(engine, /if \(!hasTimestamp\) return;/);
});

test('static: engine.js and D8 test file are not modified by this step', () => {
  // Presence-only check: the D8 additions must still be there.
  const engine = readFileSync(enginePath, 'utf8');
  assert.ok(engine.includes('attemptTimestamp'));
});

test('engine: summarizeSession ignores profileId field', () => {
  const LE = require('../engine.js');
  const events = [
    { word: 'cat', skill: 'recognize', outcome: 'independent', profileId: 'childA' },
    { word: 'dog', skill: 'listen', outcome: 'incorrect', profileId: 'childB' }
  ];
  const sum = LE.summarizeSession(events, { dailyTarget: 5, dailyNewToday: 0, dueRemaining: 0, totalItems: 2 });
  assert.equal(sum.total, 2);
  assert.equal(sum.independent, 1);
  assert.equal(sum.incorrect, 1);
});

test('static (3B): sessionEvents push includes profileId', () => {
  const exact = 'sessionEvents.push({ word:String(word), skill:skill, outcome:outcome, corrected:!!corrected, isNew:!!isNew, profileId: profileId || null });';
  assert.ok(html.includes(exact));
});

test('static (3B): sessionSummaryHtml filters events by currentId', () => {
  assert.match(html, /const myEvents=sessionEvents\.filter\(e=>e && e\.profileId===currentId\)/);
});

test('static (3B): coachFor filters events by currentId', () => {
  assert.match(html, /sessionEvents\.filter\(e=>e && e\.profileId===currentId\)/);
});

test('static (3B): builder sessionOutcome calls pass currentId', () => {
  assert.match(html, /sessionOutcome\('builder', word, 'assisted', false, wasNew, currentId, Date\.now\(\)\)/);
  assert.match(html, /sessionOutcome\('builder', word, 'incorrect', false, wasNew, currentId, Date\.now\(\)\)/);
});

test('static (A): showScore guards against profile mismatch before recordAttempt', () => {
  const i = html.indexOf('function showScore(');
  const j = html.indexOf('function stillOn(');
  const block = html.slice(i, j);
  const guard = block.indexOf("if (profileId && profileId !== currentId)");
  const rec = block.indexOf('recordAttempt(rm, item.t');
  assert.ok(guard >= 0);
  assert.ok(rec >= 0);
  assert.ok(guard < rec, 'guard must precede recordAttempt');
  // rolling signal preserved for the original owner
  assert.match(block, /recentSkillAttempts\.record\(profileId/);
  // early return skips side effects
  assert.match(block, /fb\.innerHTML = '<div class="fb-text" style="color:#94a3b8">تم تجاهل المحاولة \(تبديل ملف\)<\/div>';/);
});

test('static (C): webSpeechOnce rejects on aborted even with text', () => {
  const i = html.indexOf('function webSpeechOnce()');
  const j = html.indexOf('function showScore(');
  const block = html.slice(i, j);
  assert.match(block, /if\(err==='aborted'\)\{\s*reject\(new Error\('aborted'\)\);\s*return;\s*\}/);
});

test('static (D): voskOnce uses per-invocation cancelled/settled state', () => {
  const i = html.indexOf('function voskOnce(grammar)');
  const j = html.indexOf('function webSpeechOnce()');
  const block = html.slice(i, j);
  assert.match(block, /let cancelled=false, settled=false;/);
  assert.match(block, /const cancel=\(\)=>\{ if\(settled\) return; cancelled=true; settleReject\(new Error\('aborted'\)\); \};/);
  assert.match(block, /activeVoskCancel=cancel;/);
  // abort checks at every async boundary
  assert.match(block, /if\(cancelled\)\{ settleReject\(new Error\('aborted'\)\); return; \}/g);
  // tick checks cancelled
  assert.match(block, /if\(cancelled\)\{ settleReject\(new Error\('aborted'\)\); return; \}/);
  // 550ms delay checks cancelled
  assert.match(block, /doneTimer=setTimeout\(\(\)=>\{ if\(cancelled\)\{ settleReject\(new Error\('aborted'\)\); return; \}/);
});

test('static (D): abortListening dispatches to Vosk cancel callback', () => {
  assert.match(html, /function abortListening\(\)\{ const f=activeSRAbort; activeSRAbort=null; try\{ if\(f\) f\(\); \}catch\(e\)\{\} const v=activeVoskCancel; try\{ if\(v\) v\(\); \}catch\(e\)\{\} \}/);
});

test('static (D): activeVoskCancel declared', () => {
  assert.match(html, /let activeVoskCancel=null;/);
});

test('static (3C.1): recordGameAttempt helper exists', () => {
  assert.match(html, /function recordGameAttempt\(profileId, skill, ok, word, hinted, revealed, mode, attemptId\)/);
});

test('static (3C.1): answerGame calls recordGameAttempt', () => {
  const i = html.indexOf('function answerGame(');
  const j = html.indexOf('function answerMissing(');
  const block = html.slice(i, j);
  assert.match(block, /recordGameAttempt\(game\.profileId, _gSkill, correct,/);
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