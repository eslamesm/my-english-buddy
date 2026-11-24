/* 2026-11-24 - owner-approved: finishLevel celebrates real participation only.
 *
 * A session finished with zero earned stars (the child skipped through with
 * "next" without listening or speaking) must show an encouragement variant
 * (no fanfare emoji, honest star count, no cheer sound). A session with at
 * least one earned star keeps the original celebration and plays the
 * existing cheer clip.
 *
 * Behavioural test: executes the REAL finishLevel extracted from index.html
 * inside a permissive stub harness (a `with` proxy turns every unknown
 * global into a no-op function) and asserts the reward payload + cheer wiring.
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
  const start = html.indexOf(marker);
  if (start < 0) throw new Error('function not found: ' + name);
  const braceStart = html.indexOf('{', start);
  let depth = 0, i = braceStart;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) break; }
  }
  return html.slice(start, i + 1);
}

function makeHarness(starsPerItem, participated=true) {
  const noop = () => {};
  const dummyEl = { classList: { add: noop, remove: noop, toggle: noop }, style: {}, textContent: '', innerHTML: '' };
  const real = {
    // state finishLevel reads/writes
    level: 'letters', wordIndex: 0, itemStars: [], sessionEvents: participated ? [{word:'w0'}] : [],
    sessionStars: 0, pendingExam: false, customMastered: new Set(),
    examEligibleForBonus: false, rewardRevealTimers: [], history: [],
    profiles: {}, activeProfile: 'child1', totalSessionXP: 0,
    dailySessionActive: false,
    list: starsPerItem.map((_, i) => ({ t: 'w' + i })),
    itemStars: (mode, t) => starsPerItem[Number(String(t).slice(1))] || 0,
    modeOfItem: () => 'letters',
    PERFECT_BONUS_MILESTONES: [5, 10, 25], PERFECT_BONUS_AGE: 8,
    document: { getElementById: () => dummyEl, querySelector: () => dummyEl },
    // observed effects
    __played: [], __shown: [], __spoken: [],
    playClip(id) { this.__played.push(id); return Promise.resolve(true); },
    showReward(rw) { this.__shown.push(rw); },
    srvSpeak(t) { this.__spoken.push(t); },
    // deterministic data
    modeItems: () => starsPerItem.map((_, i) => ({ word: 'w' + i })),
    isTest: () => false,
    profileAge: () => 7,
    nowDate: () => '2026-11-24',
    isCustomWordLevel: () => false,
    isCustomLetterLevel: () => false,
    activeProfileData: () => ({}),
    buildAdaptiveEngineSummary: () => '',
    buildAdaptiveSummary: () => '',
    displayName: () => 'Test',
    totalStars: () => 0,
    sessionSummaryHtml: () => '',
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
    'with(__env__){' + extractFunction('finishLevel') + '\n;finishLevel();}',
    sandbox
  );
  return { played: real.__played, shown: real.__shown, spoken: real.__spoken };
}

test('zero earned stars: encouragement variant, no cheer, no fanfare emoji', () => {
  const r = makeHarness([0, 0, 0]);
  assert.equal(r.played.length, 0, 'no cheer clip on an unplayed session');
  assert.equal(r.shown.length, 1, 'a reward/encouragement card is still shown');
  const rw = r.shown[0];
  assert.notEqual(rw.emoji, '🏆');
  assert.notEqual(rw.emoji, '🎉');
  assert.match(rw.sub, /0\/9/, 'honest zero star count is shown');
  assert.equal(rw.stars, '☆☆☆');
  assert.equal(rw.celebrate, false);
});

test('at least one earned star: original celebration plus cheer clip', () => {
  const r = makeHarness([1, 0, 2]);
  assert.deepEqual(r.played, ['cheer'], 'cheer plays on real achievement');
  const rw = r.shown[0];
  assert.ok(rw.emoji === '🏆' || rw.emoji === '🎉');
});

test('zero-length session stays silent', () => {
  const r = makeHarness([]);
  assert.equal(r.played.length, 0);
});

test('old stars without a new session attempt do not trigger celebration', () => {
  const r=makeHarness([3,3,3],false);
  assert.equal(r.played.length,0);
  assert.equal(r.shown[0].celebrate,false);
});
test('actual reward renderer suppresses confetti and success tones only on encouragement', () => {
  for(const celebrate of [false,true,undefined]){
    const els={}; const effects=[];
    const context={
      document:{getElementById(id){ return els[id]||(els[id]={style:{},textContent:'',innerHTML:''}); }},
      confettiBurst(){effects.push('confetti');}, playCorrect(){effects.push('success');},
      go(){}, speakTTS(){}, rewardAgain:null, payload:{celebrate}
    };
    vm.createContext(context);
    vm.runInContext(extractFunction('showReward')+';showReward(payload)',context);
    assert.equal(effects.length,celebrate===false?0:2);
  }
});
