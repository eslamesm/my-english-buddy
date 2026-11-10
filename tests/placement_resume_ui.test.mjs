import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

/* Phase 2.5 resume-flow coverage. The REAL placement/bootstraps from index.html
   are executed inside a vm sandbox backed by an in-memory DOM stub, and the
   invariants that matter are asserted against observable effects — not source
   text: card visibility, button labels, call counts on Placement.start vs
   Placement.resume, preservation of seed/answers/qIndex, manual-level and
   learner data, and per-profile isolation. */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require_ = createRequire(import.meta.url);
const Placement = require_('../placement.js');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* ---------------- extraction helpers (same approach as tests/curriculum.test.mjs) ---------------- */
function grab(name) {
  const re = new RegExp('const\\s+' + name + '\\s*=');
  const m = re.exec(html);
  if (!m) throw new Error('missing const ' + name);
  const start = m.index + m[0].length;
  let depth = 0, j = start, inStr = false, q = '';
  for (; j < html.length; j++) {
    const ch = html[j];
    if (inStr) { if (ch === '\\') { j++; continue; } if (ch === q) inStr = false; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; q = ch; continue; }
    if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') { depth--; if (depth === 0) { j++; break; } }
  }
  return 'const ' + name + ' = ' + html.slice(start, j) + ';';
}
function grabFunction(name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(html);
  if (!m) throw new Error('missing function ' + name);
  const start = m.index;
  let depth = 0, j = start, inStr = false, q = '';
  for (; j < html.length; j++) {
    const ch = html[j];
    if (inStr) { if (ch === '\\') { j++; continue; } if (ch === q) inStr = false; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; q = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { j++; break; } }
  }
  return html.slice(start, j);
}
function sliceBetween(startMarker, endMarker) {
  const a = html.indexOf(startMarker);
  const b = html.indexOf(endMarker, a);
  if (a < 0 || b < 0) throw new Error('marker not found: ' + startMarker + ' / ' + endMarker);
  return html.slice(a, b);
}

/* ---------------- minimal in-memory DOM stub ---------------- */
function makeElement(id) {
  return {
    id, dataset: {}, style: {}, children: [],
    className: '', classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    innerHTML: '', innerText: '', textContent: '',
    onclick: null, disabled: false, hidden: false, value: ''
  };
}
function makeDocument() {
  const els = {};
  return {
    getElementById(id) { return els[id] || (els[id] = makeElement(id)); },
    createElement() { return makeElement('el' + Math.random().toString(36).slice(2)); },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    addEventListener() {}
  };
}

/* ---------------- fixture ---------------- */
function fixtureProfile(name, over) {
  return Object.assign({
    id: 'p-' + name, name: name, age: 5, avatar: '🦁',
    levelKey: '3-5', schoolYear: 'kg2', levelManual: false,
    createdAt: 1700000000000,
    progress: { 'words::cat': 2 },
    stats: { attempts: 0, timeMs: 0, byMode: {}, daily: {}, recent: [], games: { attempts: 0, correct: 0 }, lastPlayed: null },
    learning: { v: 1, items: { 'recognize::cat': { mastery: 2 } } },
    placement: {
      version: 1, takenAt: null, grade: 'kg2', assignedLevel: null, assignedTier: null,
      startUnit: null,
      bySkill: { listen: { asked: 2, correct: 1 }, letter: { asked: 0, correct: 0 }, wordPic: { asked: 1, correct: 1 }, picWord: { asked: 0, correct: 0 }, wordWord: { asked: 0, correct: 0 } },
      answers: [
        { kind: 'listen', word: 'Milk', tier: 2, correct: true },
        { kind: 'wordPic', word: 'Under', tier: 3, correct: false },
        { kind: 'listen', word: 'Sun', tier: 1, correct: true }
      ],
      status: 'running', seed: 'resume-seed-42', len: 10, qIndex: 3, tier: 1
    }
  }, over || {});
}

/* ---------------- sandbox ---------------- */
const START_SNIPPET = sliceBetween('/* ------------------ PLACEMENT TEST', 'function renderTestDots(){');
const CARD_SNIPPET = sliceBetween('function buildPlacementCard', 'function buildPlacementNote');
const SRC = () => [
  grab('AGES'),
  grab('CUR_GRADES'),
  grab('CUR_WORDS'),
  grab('WORDS'),
  grab('PHRASES'),
  grab('SENTENCES'),
  grabFunction('gradeFromAge'),
  /* startUnitOf() is the only consumer; it runs solely during finish(), which this
     resume-flow coverage never reaches, so a stub keeps the harness self-contained. */
  'var CUR_SUBUNITS = { kg1: [], kg2: [], p1: [], p1t2: [] };',
  'var KG1_T1_UNITS = [], KG2_T1_UNITS = [], P1_T1_UNITS = [], P1_T2_UNITS = [];',
  START_SNIPPET,
  CARD_SNIPPET
].join('\n');

function sandboxFor({ profiles, currentId, confirmResult = true }) {
  const doc = makeDocument();
  const calls = { start: [], resume: [], go: [], renderTestQ: 0, saveProfiles: 0, confirm: [] };

  const SpiesPlacement = Object.create(Placement);
  SpiesPlacement.start = (...a) => { calls.start.push(a); return Placement.start(...a); };
  SpiesPlacement.resume = (...a) => { calls.resume.push(a); return Placement.resume(...a); };

  let active = profiles.find(p => p.id === currentId) || profiles[0];
  const currentProfile = () => active;

  const sandbox = {
    window: undefined, console, document: doc, Placement: SpiesPlacement,
    currentProfile, profiles, currentId,
    go: (screen) => calls.go.push(screen),
    renderTestQ: () => { calls.renderTestQ += 1; },
    saveProfiles: () => { calls.saveProfiles += 1; },
    confirm: (msg) => { calls.confirm.push(msg); return confirmResult; },
    setTimeout
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(SRC(), sandbox);
  return {
    doc, calls, sandbox,
    setActive: (p) => { active = p; },
    run: (src) => vm.runInContext(src, sandbox)
  };
}

/* ---------------- visibility helpers ---------------- */
function cardOf(over) {
  const placement = over.placement;
  const hidden = over.hidden;
  const base = fixtureProfile('h', { placement, placementCardHidden: hidden });
  const sb = sandboxFor({ profiles: [base], currentId: 'p-h' });
  // stub ids used inside buildPlacementCard
  ['placementCard', 'placementCardTitle', 'placementCardText', 'pcStart'].forEach(id => sb.doc.getElementById(id));
  sb.run(`buildPlacementCard();`);
  return {
    sb,
    card: sb.doc.getElementById('placementCard'),
    title: sb.doc.getElementById('placementCardTitle'),
    text: sb.doc.getElementById('placementCardText'),
    btn: sb.doc.getElementById('pcStart')
  };
}

/* ================= A) card visibility / labels ================= */

test('None: start card is visible with the start button', () => {
  const r = cardOf({ placement: { status: 'none' }, hidden: undefined });
  assert.equal(r.card.style.display, 'flex');
  assert.equal(r.card.dataset.mode, 'start');
  assert.match(r.btn.textContent, /ابدأ الاختبار/);
  assert.match(r.title.textContent, /حدد المستوى المناسب لطفلك/);
  assert.equal(r.btn.dataset.mode, 'start');
});

test('Running: resume card is visible with title, count and resume label', () => {
  const r = cardOf({
    placement: { version: 1, len: 10, qIndex: 3, tier: 1, seed: 'seed-9', status: 'running',
      answers: [{ kind: 'listen', word: 'Milk', tier: 2, correct: true }] },
    hidden: undefined
  });
  assert.equal(r.card.style.display, 'flex');
  assert.equal(r.card.dataset.mode, 'resume');
  assert.match(r.title.textContent, /أكمل اختبار/);
  assert.match(r.text.textContent, /1 من 10/);
  assert.match(r.btn.textContent, /استكمال الاختبار/);
  assert.equal(r.btn.dataset.mode, 'resume');
});

test('Done: no card', () => {
  const r = cardOf({ placement: { status: 'done' }, hidden: undefined });
  assert.equal(r.card.style.display, 'none');
});

test('Skipped: no card', () => {
  const r = cardOf({ placement: { status: 'skipped' }, hidden: undefined });
  assert.equal(r.card.style.display, 'none');
});

test('hidden flag is respected for both none and running states', () => {
  assert.equal(cardOf({ placement: { status: 'none' }, hidden: true }).card.style.display, 'none');
  assert.equal(cardOf({ placement: { status: 'running', len: 10, qIndex: 0, tier: 1, seed: 's', answers: [] }, hidden: true }).card.style.display, 'none');
});

/* ================= B) resume preserves the in-progress run ================= */

test('Completing (resume) keeps qIndex, answers, seed and status=running', () => {
  const p = fixtureProfile('resume');
  const sb = sandboxFor({ profiles: [p], currentId: 'p-resume' });
  ['testStars', 'btnSkipTest'].forEach(id => sb.doc.getElementById(id));
  const before = JSON.parse(JSON.stringify(p.placement));

  sb.run('startTest();');

  const after = JSON.parse(sb.run('(function(){return JSON.stringify(profiles.find(x=>x.id===currentId).placement)})()'));
  assert.equal(sb.calls.resume.length, 1, 'Placement.resume must be used');
  assert.equal(sb.calls.start.length, 0, 'Placement.start must NOT be used');
  assert.equal(after.qIndex, before.qIndex, 'qIndex must not reset');
  assert.equal(after.seed, before.seed, 'seed must not change');
  assert.equal(after.answers.length, before.answers.length, 'answers must be kept');
  assert.deepEqual(after.answers, before.answers);
  assert.equal(after.status, 'running');
  assert.equal(sb.calls.go.length, 1);
  assert.equal(sb.calls.go[0], 'test');
});

test('resume re-enters the renderer (renderTestQ called, question at qIndex)', () => {
  const p = fixtureProfile('resume2');
  const sb = sandboxFor({ profiles: [p], currentId: 'p-resume2' });
  ['testStars', 'btnSkipTest'].forEach(id => sb.doc.getElementById(id));
  sb.run('startTest();');
  assert.equal(sb.calls.renderTestQ, 1);
});

/* ================= D) retest with confirmation ================= */

function sliceStatement(nameFragment) {
  const a = html.indexOf(nameFragment);
  if (a < 0) throw new Error('statement not found: ' + nameFragment);
  const b = html.indexOf('};', a);
  if (b < 0) throw new Error('statement terminator not found for ' + nameFragment);
  return html.slice(a, b + 2);
}
const btnRetestLine = sliceStatement("document.getElementById('btnRetest').onclick");

function retestHarness({ fixture, confirmResult }) {
  const sb = sandboxFor({ profiles: [fixture], currentId: fixture.id, confirmResult });
  ['testStars', 'btnSkipTest', 'btnRetest'].forEach(id => sb.doc.getElementById(id));
  assert.ok(btnRetestLine, 'btnRetest wiring exists');
  sb.run(btnRetestLine);
  return { sb, btn: sb.doc.getElementById('btnRetest') };
}

test('9 Retest with a running placement confirm-checks before starting fresh', () => {
  const running = fixtureProfile('retest-running');
  const ok = retestHarness({ fixture: running, confirmResult: true });
  ok.btn.onclick();
  assert.equal(ok.sb.calls.confirm.length, 1, 'confirm() must be asked for a running test');
  assert.match(ok.sb.calls.confirm[0], /اختبار/, 'the confirmation must mention the test');
  assert.equal(ok.sb.calls.start.length, 1, 'after confirmation, a fresh test starts');
  assert.equal(ok.sb.calls.resume.length, 0, 'resume path is not used for an explicit retest');
  const placement = JSON.parse(ok.sb.run('(function(){return JSON.stringify(profiles.find(x=>x.id===currentId).placement)})()'));
  assert.equal(placement.qIndex, 0, 'fresh run starts at question 1');
  assert.equal(placement.status, 'running');
});

test('9b Retest cancelled by the user keeps the in-progress state untouched', () => {
  const running = fixtureProfile('retest-cancel');
  const { sb, btn } = retestHarness({ fixture: running, confirmResult: false });
  const before = JSON.parse(JSON.stringify(running.placement));
  btn.onclick();
  assert.equal(sb.calls.confirm.length, 1);
  assert.equal(sb.calls.start.length, 0, 'a fresh test must NOT begin after cancel');
  assert.equal(sb.calls.resume.length, 0);
  assert.equal(running.placement.qIndex, before.qIndex, 'qIndex preserved');
  assert.equal(running.placement.seed, before.seed, 'seed preserved');
  assert.equal(running.placement.answers.length, before.answers.length, 'answers preserved');
});

test('retest on a completed run asks nothing and starts fresh', () => {
  const done = fixtureProfile('retest-done', { placement: { status: 'done', seed: 'old-seed', len: 10, qIndex: 10, tier: 4, answers: [] } });
  const { sb, btn } = retestHarness({ fixture: done, confirmResult: true });
  btn.onclick();
  assert.equal(sb.calls.confirm.length, 0, 'no confirm needed when nothing is in flight');
  assert.equal(sb.calls.start.length, 1);
});

/* ================= 10 — no auto-resume on mere render ================= */

test('10 rendering the home card never starts or resumes a test', () => {
  const running = fixtureProfile('render-only');
  const r = cardOf({ placement: running.placement, hidden: undefined });
  assert.equal(r.sb.calls.start.length, 0);
  assert.equal(r.sb.calls.resume.length, 0);
  assert.equal(running.placement.status, 'running');
  assert.equal(running.placement.qIndex, 3);
});

/* ================= 11/12 — learner data and manual level ================= */

test('11/12 resume leaves levelManual, levelKey, learning, progress and stats untouched', () => {
  const p = fixtureProfile('intact', { levelManual: true, levelKey: '10-14' });
  const before = JSON.parse(JSON.stringify({
    levelManual: p.levelManual, levelKey: p.levelKey, schoolYear: p.schoolYear,
    progress: p.progress, stats: p.stats, learning: p.learning
  }));
  const sb = sandboxFor({ profiles: [p], currentId: 'p-intact' });
  ['testStars', 'btnSkipTest'].forEach(id => sb.doc.getElementById(id));
  sb.run('startTest();');
  assert.equal(p.levelManual, before.levelManual);
  assert.equal(p.levelKey, before.levelKey);
  assert.equal(p.schoolYear, before.schoolYear);
  assert.deepEqual(p.progress, before.progress);
  assert.deepEqual(p.stats, before.stats);
  assert.deepEqual(p.learning, before.learning);
});

/* ================= 13 — profile isolation ================= */

test('13 switching profiles does not resume another profile’s in-flight test', () => {
  const a = fixtureProfile('iso-a', { placement: { status: 'running', len: 10, qIndex: 3, tier: 1, seed: 'seed-A', answers: [] } });
  const b = fixtureProfile('iso-b', { placement: { status: 'none', seed: null, len: 10, qIndex: 0, tier: 1, answers: [] } });
  const sb = sandboxFor({ profiles: [a, b], currentId: 'p-iso-a' });
  ['testStars', 'btnSkipTest'].forEach(id => sb.doc.getElementById(id));

  sb.setActive(a);
  sb.run('startTest();');
  assert.equal(sb.calls.resume.length, 1);
  assert.equal(a.placement.seed, 'seed-A', 'profile A resume uses its own seed');
  assert.equal(b.placement.status, 'none', 'profile B untouched by A’s resume');

  sb.setActive(b);
  // B starts a fresh test of its own; A’s state must stay frozen
  sb.run('startTest();');
  assert.equal(b.placement.status, 'running');
  assert.equal(a.placement.status, 'running');
  assert.equal(a.placement.seed, 'seed-A', 'A keeps its seed while B starts fresh');
});
