/* 2026-11-24 - owner-approved (learning-method proposal item 5, audit finding 14):
 * never derive the child's grade from age - ask explicitly; and home progress
 * counts every activated grade, not only the first.
 *
 * Behavioural tests over the REAL startTest / renderTestGradePick /
 * learnerPathStats extracted from index.html inside a stub harness.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(testsDir, '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');

function extractFunction(name) {
  const marker = 'function ' + name + '(';
  let start = html.indexOf(marker);
  if (start < 0) throw new Error('function not found: ' + name);
  if (html.slice(start - 6, start) === 'async ') start -= 6;
  const braceStart = html.indexOf('{', start);
  let depth = 0, i = braceStart;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) break; }
  }
  return html.slice(start, i + 1);
}

function extractBlock(startMarker, endMarker) {
  const s = html.indexOf(startMarker);
  const e = html.indexOf(endMarker, s);
  if (s < 0 || e < 0) throw new Error('marker missing: ' + startMarker);
  return html.slice(s, e);
}

const agesSrc = extractBlock('const AGES = [', 'const AVATAR_LIST');

function makeDom() {
  const noop = () => {};
  const mkEl = () => {
    const el = { classList: { add: noop, remove: noop, toggle: noop }, style: {}, textContent: '', innerHTML: '', children: [], appendChild(c) { this.children.push(c); } };
    return el;
  };
  const byId = {};
  return {
    byId, mkEl,
    document: {
      getElementById: (id) => (byId[id] || (byId[id] = mkEl())),
      querySelector: () => mkEl(),
      createElement: () => mkEl(),
      querySelectorAll: () => [],
    },
  };
}

function makeStartTestHarness(profile) {
  const noop = () => {};
  const dom = makeDom();
  const calls = { placementStart: [], screens: [], toasts: [] };
  const real = {
    document: dom.document,
    CUR_GRADES: [{ id: 'kg1', emoji: '🧒', grade: 'KG1' }, { id: 'p1', emoji: '1️⃣', grade: 'أولى ابتدائي' }, { id: 'p2', emoji: '2️⃣', grade: 'تانية ابتدائي' }],
    Placement: {
      LIMITS: { default: 10 },
      resume: () => null,
      start: (o) => { calls.placementStart.push(o); return { grade: o.grade, qIndex: 0, len: 10, answers: [] }; },
      running: (s) => s,
    },
    tst: null,
    currentProfile: () => profile,
    goHomeSafe: noop,
    placementCurriculum: () => ({ fake: true }),
    placementProfileGrade: (p) => {
      const g = p && p.schoolYear;
      return (g && ['kg1', 'p1', 'p2'].includes(g)) ? g : 'AGE-GUESSED';
    },
    saveProfiles: noop,
    go: (s) => calls.screens.push(s),
    renderTestQ: noop,
    buildSchoolChips: noop,
    buildCurGrid: noop,
    esc: (s) => String(s),
    toast: (m) => calls.toasts.push(m),
  };
  const env = new Proxy(real, {
    has: () => true,
    get(t, k) {
      if (k === Symbol.unscopables) return undefined;
      if (k in t) return t[k];
      if (k in globalThis) return globalThis[k];
      return noop;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  const sandbox = { __env__: env };
  vm.createContext(sandbox);
  vm.runInContext(
    'with(__env__){' + extractFunction('renderTestGradePick') + '\n' + extractFunction('startTest') + '\n;__api={ startTest };}',
    sandbox
  );
  return { api: real.__api, calls, dom, profile };
}

test('profile without schoolYear: grade picker shown, no age-guessed test starts', () => {
  const p = { name: 'kid', age: 8, schoolYear: null, allowedCurricula: [], placement: null };
  const h = makeStartTestHarness(p);
  h.api.startTest();
  assert.equal(h.calls.placementStart.length, 0, 'no placement test started before a grade is picked');
  const opts = h.dom.byId['testOpts'];
  assert.equal(opts.children.length, 3, 'one chip per grade');
  assert.match(h.dom.byId['testPrompt'].innerHTML, /لن نخمّنه من العمر/);
});

test('picking a grade stores it and starts the test for that grade', () => {
  const p = { name: 'kid', age: 8, schoolYear: null, allowedCurricula: [], placement: null };
  const h = makeStartTestHarness(p);
  h.api.startTest();
  h.dom.byId['testOpts'].children[1].onclick(); // pick p1
  assert.equal(p.schoolYear, 'p1');
  assert.deepEqual(Array.from(p.allowedCurricula), ['p1']); // vm-realm array
  assert.equal(h.calls.placementStart.length, 1, 'test started after the explicit pick');
  assert.equal(h.calls.placementStart[0].grade, 'p1');
});

test('profile with schoolYear: test starts directly, no picker', () => {
  const p = { name: 'kid', age: 8, schoolYear: 'p2', allowedCurricula: ['p2'], placement: null };
  const h = makeStartTestHarness(p);
  h.api.startTest();
  assert.equal(h.calls.placementStart.length, 1);
  assert.equal(h.calls.placementStart[0].grade, 'p2');
  assert.ok(!h.dom.byId['testOpts'] || h.dom.byId['testOpts'].children.length === 0, 'no picker rendered');
});

test('home progress counts every activated grade, not only the first', () => {
  const noop = () => {};
  const real = {
    AGES: null, // real AGES injected below
    MODE_DATA: {
      words: [{ t: 'w1' }],
      'egy:p1': [{ t: 'p1a' }, { t: 'p1b' }],
      'egy:p2': [{ t: 'p2a' }, { t: 'p2b' }, { t: 'p2c' }],
    },
    CUR_GRADES: [{ id: 'p1' }, { id: 'p2' }],
    currentProfile: () => ({ levelKey: '3-5', age: 5, schoolYear: 'p1', allowedCurricula: ['p1', 'p2'] }),
    itemStars: () => 0,
    totalStars: () => 0,
    currentStreak: () => 0,
    todayAttempts: () => 0,
    settings: { goal: 10 },
  };
  const env = new Proxy(real, {
    has: () => true,
    get(t, k) {
      if (k === Symbol.unscopables) return undefined;
      if (k in t) return t[k];
      if (k in globalThis) return globalThis[k];
      return noop;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  const sandbox = { __env__: env };
  vm.createContext(sandbox);
  vm.runInContext(
    'with(__env__){' + agesSrc + '\n' + extractFunction('validCurriculumIds') + '\n' + extractFunction('allowedCurricula') + '\n' + extractFunction('learnerPathStats') + '\n;__api={ learnerPathStats };}',
    sandbox
  );
  const stats = real.__api.learnerPathStats();
  assert.equal(stats.total, 1 + 2 + 3, 'level modes + BOTH grades counted');
});
