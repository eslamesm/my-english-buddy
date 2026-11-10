/* Phase 3D.1 - focused regression tests for the async recognition lifecycle.
 *
 * R1: cancellation must never fall through from Web Speech into Vosk, and a
 *     cancelled Vosk attempt must never acquire or keep a microphone.
 * R2: a recognition result is bound to the attempt context captured when it
 *     started; stale results are rejected before any score or recording.
 *
 * These tests execute the REAL functions extracted from index.html inside a
 * small, deterministic harness (fake DOM, clock, media and recognizer). They
 * are behavioural: they assert rejected/started/recorded outcomes, not source
 * string shape. A few static assertions at the end pin the wiring only.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(testsDir, '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');

/* ------------------------------------------------------------------ */
/* source extraction                                                   */
/* ------------------------------------------------------------------ */

function extractFunction(name) {
  const marker = 'function ' + name + '(';
  let start = html.indexOf(marker);
  if (start < 0) throw new Error('function not found: ' + name);
  if (start >= 6 && html.slice(start - 6, start) === 'async ') start -= 6;
  let i = html.indexOf('{', start);
  if (i < 0) throw new Error('body not found: ' + name);

  let depth = 0;
  let mode = 'code';
  for (; i < html.length; i++) {
    const ch = html[i];
    const next = html[i + 1];
    if (mode === 'code') {
      if (ch === '/' && next === '/') { mode = 'line'; i++; continue; }
      if (ch === '/' && next === '*') { mode = 'block'; i++; continue; }
      if (ch === "'") { mode = 'single'; continue; }
      if (ch === '"') { mode = 'double'; continue; }
      if (ch === '`') { mode = 'template'; continue; }
      if (ch === '{') { depth++; continue; }
      if (ch === '}') {
        depth--;
        if (depth === 0) return html.slice(start, i + 1);
        continue;
      }
    } else if (mode === 'line') {
      if (ch === '\n') mode = 'code';
    } else if (mode === 'block') {
      if (ch === '*' && next === '/') { mode = 'code'; i++; }
    } else {
      /* single, double or template string */
      if (ch === '\\') { i++; continue; }
      if ((mode === 'single' && ch === "'") ||
          (mode === 'double' && ch === '"') ||
          (mode === 'template' && ch === '`')) mode = 'code';
    }
  }
  throw new Error('unterminated function: ' + name);
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

/* ------------------------------------------------------------------ */
/* deterministic clock (setTimeout/setInterval + Date.now)             */
/* ------------------------------------------------------------------ */

function makeClock() {
  let now = 1000;
  let seq = 0;
  const timers = new Map();
  return {
    Date: { now: () => now },
    setTimeout(fn, ms) {
      const id = ++seq;
      timers.set(id, { fn, at: now + ms, every: null });
      return id;
    },
    setInterval(fn, ms) {
      const id = ++seq;
      timers.set(id, { fn, at: now + ms, every: ms });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    clearInterval(id) { timers.delete(id); },
    async advance(ms) {
      const target = now + ms;
      for (;;) {
        let pick = null;
        for (const entry of timers) {
          const t = entry[1];
          if (t.at <= target && (!pick || t.at < pick.t.at)) pick = { id: entry[0], t };
        }
        if (!pick) break;
        now = pick.t.at;
        if (pick.t.every) pick.t.at += pick.t.every;
        else timers.delete(pick.id);
        try { pick.t.fn(); } catch (e) { /* surfaced by the awaited promise */ }
        await Promise.resolve();
      }
      now = target;
    }
  };
}

/* ------------------------------------------------------------------ */
/* R1 harnesses                                                         */
/* ------------------------------------------------------------------ */

function buildRecognizeHarness(opts = {}) {
  const src = extractFunction('recognizeOnce');
  const factory = new Function(
    'settings', 'navigator', 'isAndroid', 'SR', 'grammarFor',
    'webSpeechOnce', 'voskOnce', 'activeRecognitionCtx',
    src + '\nreturn recognizeOnce;'
  );
  return factory(
    { recMode: opts.recMode || 'auto' },
    { onLine: opts.online !== false },
    !!opts.isAndroid,
    opts.sr === false ? null : function SR() {},
    () => 'grammar',
    opts.webSpeechOnce,
    opts.voskOnce,
    opts.ctx
  );
}

function fakeAudioContext() {
  const node = () => ({ connect() {}, disconnect() {} });
  return {
    state: 'running',
    sampleRate: 48000,
    destination: {},
    resume: async () => {},
    createMediaStreamSource: () => node(),
    createScriptProcessor: () => Object.assign(node(), { onaudioprocess: null }),
    createGain: () => Object.assign(node(), { gain: { value: 0 } })
  };
}

function fakeStream() {
  const track = { stopCalls: 0, stop() { this.stopCalls++; } };
  return { track, getTracks: () => [track] };
}

function makeModel(recs) {
  return {
    KaldiRecognizer: class {
      constructor() {
        this.handlers = {};
        recs.push(this);
      }
      setWords() {}
      on(name, fn) { this.handlers[name] = fn; }
      acceptWaveform() {}
      retrieveFinalResult() {}
      remove() {}
    }
  };
}

function buildVoskHarness(opts = {}) {
  const clock = makeClock();
  const recs = [];
  const model = makeModel(recs);
  const state = { gumCalls: 0, ensureCalls: 0 };
  const src = extractFunction('voskOnce');
  const factory = new Function(
    'activeRecognitionCtx', 'ensureVosk', 'ensureRecCtx', 'makeRecorder',
    'micLevelShow', 'micHint', 'micLevelSet', 'currentMode', 'list', 'index',
    'navigator', 'Date', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    `let activeVoskCancel=null;
     ${src}
     return {
       voskOnce,
       cancel: () => { const c = activeVoskCancel; if (c) c(); },
       snapshot: () => activeVoskCancel,
       setCtx: (c) => { activeRecognitionCtx = c; }
     };`
  );
  const api = factory(
    opts.ctx || { cancelled: false },
    () => { state.ensureCalls++; return opts.ensureVosk ? opts.ensureVosk() : Promise.resolve(model); },
    () => fakeAudioContext(),
    () => null,
    () => {}, () => {}, () => {},
    'words',
    [{ t: 'cat', spoken: 'cat', _mode: 'words' }],
    0,
    {
      mediaDevices: {
        getUserMedia: () => {
          state.gumCalls++;
          return opts.getUserMedia ? opts.getUserMedia() : Promise.resolve(fakeStream());
        }
      }
    },
    clock.Date, clock.setTimeout, clock.setInterval, clock.clearTimeout, clock.clearInterval
  );
  return Object.assign(api, { clock, recs, model, state });
}

/* ------------------------------------------------------------------ */
/* R2 harness                                                          */
/* ------------------------------------------------------------------ */

function buildScoreHarness() {
  const src = [
    'let currentId="A", profileEpoch=0, list=[], index=0, currentMode="words";',
    'let activeRecognitionCtx=null, recognitionSeq=0, scoreAttemptContext=null;',
    'let profiles=[{id:"A"},{id:"B"}];',
    'let sessionStars=0, smartFailCount=0, dailySessionActive=false;',
    'let game=null;',
    'const calls={ record:[], recordAttempt:[], persist:0, tones:0 };',
    'const fb={innerHTML:"",dataset:{}};',
    'const card={classList:{add(){},remove(){}}};',
    'const nextBtn={classList:{add(){},remove(){}}};',
    'const document={getElementById:(id)=> id==="feedback"?fb : id==="practiceCard"?card : id==="btnNext"?nextBtn : null};',
    'const recentSkillAttempts={record:(...a)=>calls.record.push(a)};',
    'const LearningEngine={skillFromMode:(m)=>m};',
    'const modeOfItem=(it)=>(it&&it._mode)||currentMode;',
    'const isUncertain=()=>false;',
    'const normalize=(s)=>String(s||"").toLowerCase().trim();',
    'const spellHint=()=>"<div>hint</div>";',
    'const recallReveal=()=>{};',
    'const recordAttempt=(...a)=>calls.recordAttempt.push(a);',
    'const persistSession=()=>{calls.persist++;};',
    'const itemStars=()=>0; const setItemStars=()=>{};',
    'const updateSessionStars=()=>{}; const renderDots=()=>{};',
    'const playCorrect=()=>{}; const confettiBurst=()=>{}; const speakTTS=()=>{};',
    'const playTone=()=>{calls.tones++;};',
    'const smartRelisten=()=>{}; const teacherReact=()=>{};',
    'const bestSimilarity=(alt,targets)=>{ let b=0; for(const t of targets){ if(String(alt).toLowerCase()===String(t).toLowerCase()) b=Math.max(b,95); } return b; };',
    extractFunction('isRecognitionContextValid'),
    extractFunction('scoreAttempt'),
    extractFunction('showScore'),
    `return {
       scoreAttempt,
       calls,
       fb,
       set(o){
         if(o.currentId!==undefined) currentId=o.currentId;
         if(o.profileEpoch!==undefined) profileEpoch=o.profileEpoch;
         if(o.list!==undefined) list=o.list;
         if(o.index!==undefined) index=o.index;
         if(o.currentMode!==undefined) currentMode=o.currentMode;
         if(o.activeRecognitionCtx!==undefined) activeRecognitionCtx=o.activeRecognitionCtx;
         if(o.recognitionSeq!==undefined) recognitionSeq=o.recognitionSeq;
         if(o.scoreAttemptContext!==undefined) scoreAttemptContext=o.scoreAttemptContext;
       }
     };`
  ].join('\n');
  return new Function(src)();
}

function buildContextHarness() {
  const src = [
    'let currentId="A", profileEpoch=0, list=[], index=0, currentMode="words";',
    'let activeRecognitionCtx=null, recognitionSeq=0;',
    'let activeSRAbort=null, activeVoskCancel=null;',
    extractFunction('beginRecognitionContext'),
    extractFunction('isRecognitionContextValid'),
    extractFunction('endRecognitionContext'),
    extractFunction('abortListening'),
    `return {
       beginRecognitionContext, isRecognitionContextValid, endRecognitionContext, abortListening,
       set(o){
         if(o.currentId!==undefined) currentId=o.currentId;
         if(o.profileEpoch!==undefined) profileEpoch=o.profileEpoch;
         if(o.list!==undefined) list=o.list;
         if(o.index!==undefined) index=o.index;
         if(o.currentMode!==undefined) currentMode=o.currentMode;
       },
       get: () => ({ activeRecognitionCtx, recognitionSeq, activeSRAbort, activeVoskCancel })
     };`
  ].join('\n');
  return new Function(src)();
}

/* ------------------------------------------------------------------ */
/* profile epoch transition harness (Phase 3D.1B)                      */
/* ------------------------------------------------------------------ */

function extractStartupState() {
  const startMarker = 'const rawProfiles=lsGet(PKEY, []);';
  const endMarker = 'let profileEpoch=0;';
  const start = html.indexOf(startMarker);
  if (start < 0) throw new Error('startup profile state block not found');
  const end = html.indexOf(endMarker, start);
  if (end < 0) throw new Error('startup profile epoch init not found');
  return html.slice(start, end + endMarker.length);
}

/* Executes the REAL startup identity block, saveProfiles/saveCurrent,
 * currentProfile and the recognition-context/score functions. Storage is a
 * deterministic in-memory map; `declineStorage()` makes lsSet() mimic a quota
 * failure so epoch decisions can be proven independent of persistence. */
function buildEpochHarness(opts = {}) {
  const storedProfiles = opts.profiles || [{ id: 'A' }, { id: 'B' }];
  const storedCurrent = opts.storedCurrent === undefined ? 'A' : opts.storedCurrent;
  const src = [
    'const PKEY="p", CKEY="c";',
    'const store=Object.create(null);',
    'let storageOk=true;',
    'const lsGet=(k,d)=>{ if(!(k in store)) return d; try{ return JSON.parse(store[k]); }catch(e){ return d; } };',
    'const lsSet=(k,v)=>{ if(!storageOk) return false; try{ const data=JSON.stringify(v); if(data===undefined) return false; store[k]=data; return true; }catch(e){ return false; } };',
    'function sanitizeProfiles(raw){ return Array.isArray(raw)?raw.filter(Boolean):[]; }',
    'store[PKEY]=JSON.stringify(' + JSON.stringify(storedProfiles) + ');',
    storedCurrent === null ? '' : 'store[CKEY]=JSON.stringify(' + JSON.stringify(storedCurrent) + ');',
    extractStartupState(),
    extractFunction('saveProfiles'),
    extractFunction('saveCurrent'),
    extractFunction('currentProfile'),
    'let list=[], index=0, currentMode="words";',
    'let sessionStars=0, smartFailCount=0, dailySessionActive=false;',
    'let game=null;',
    'const calls={ record:[], recordAttempt:[], persist:0 };',
    'const fb={innerHTML:"",dataset:{}};',
    'const card={classList:{add(){},remove(){}}};',
    'const nextBtn={classList:{add(){},remove(){}}};',
    'const document={getElementById:(id)=> id==="feedback"?fb : id==="practiceCard"?card : id==="btnNext"?nextBtn : null};',
    'const recentSkillAttempts={record:(...a)=>calls.record.push(a)};',
    'const LearningEngine={skillFromMode:(m)=>m};',
    'const modeOfItem=(it)=>(it&&it._mode)||currentMode;',
    'const isUncertain=()=>false;',
    'const normalize=(s)=>String(s||"").toLowerCase().trim();',
    'const spellHint=()=>"<div>hint</div>";',
    'const recallReveal=()=>{};',
    'const recordAttempt=(...a)=>calls.recordAttempt.push(a);',
    'const persistSession=()=>{calls.persist++;};',
    'const itemStars=()=>0; const setItemStars=()=>{};',
    'const updateSessionStars=()=>{}; const renderDots=()=>{};',
    'const playCorrect=()=>{}; const confettiBurst=()=>{}; const speakTTS=()=>{};',
    'const playTone=()=>{};',
    'const smartRelisten=()=>{}; const teacherReact=()=>{};',
    'const bestSimilarity=(alt,targets)=>{ let b=0; for(const t of targets){ if(String(alt).toLowerCase()===String(t).toLowerCase()) b=Math.max(b,95); } return b; };',
    'let activeRecognitionCtx=null, recognitionSeq=0, scoreAttemptContext=null, activeSRAbort=null, activeVoskCancel=null;',
    extractFunction('beginRecognitionContext'),
    extractFunction('isRecognitionContextValid'),
    extractFunction('endRecognitionContext'),
    extractFunction('abortListening'),
    extractFunction('scoreAttempt'),
    extractFunction('showScore'),
    `return {
       saveCurrent, saveProfiles, currentProfile,
       beginRecognitionContext, isRecognitionContextValid, endRecognitionContext,
       scoreAttempt, calls, fb,
       setList(items){ list=items; index=0; },
       setIndex(i){ index=i; },
       setMode(m){ currentMode=m; },
       setScoreContext(c){ scoreAttemptContext=c; },
       setCurrentId(id){ currentId=id; },
       declineStorage(){ storageOk=false; },
       restoreStorage(){ storageOk=true; },
       storageKeys(){ return Object.keys(store); },
       get(){ return { currentId, savedCurrentId, profileEpoch,
         recordCount: calls.record.length, attemptCount: calls.recordAttempt.length,
         persistCount: calls.persist, scored: fb.dataset.scored }; }
     };`
  ].join('\n');
  return new Function(src)();
}

function setupR2() {
  const h = buildScoreHarness();
  const item = { t: 'cat', spoken: 'cat', _mode: 'words' };
  const list = [item];
  const ctx = {
    generation: 1, cancelled: false, profileId: 'A', profileEpoch: 0,
    item, listRef: list, indexAtStart: 0, mode: 'words', startedAt: 1
  };
  h.set({
    currentId: 'A', profileEpoch: 0, list, index: 0, currentMode: 'words',
    activeRecognitionCtx: ctx, recognitionSeq: 1
  });
  const attempt = (alts = ['cat']) => {
    h.set({ scoreAttemptContext: ctx });
    h.scoreAttempt(alts, 'online', null, ctx.profileId, 111);
  };
  return { h, item, list, ctx, attempt };
}

/* ================================================================== */
/* R1 - Vosk must never start after cancellation                       */
/* ================================================================== */

test('R1.1: a cancelled context never starts Vosk after Web Speech rejection', async () => {
  const ctx = { cancelled: true };
  let voskCalls = 0;
  const recognize = buildRecognizeHarness({
    ctx,
    webSpeechOnce: () => Promise.reject(new Error('aborted')),
    voskOnce: () => { voskCalls++; return Promise.resolve({ alts: ['cat'], confidence: null }); }
  });
  await assert.rejects(recognize(), /aborted/);
  assert.equal(voskCalls, 0);
});

test('R1.2: navigation during Web Speech produces no fallback and no result', async () => {
  const ctx = { cancelled: false };
  let rejectWeb;
  const web = new Promise((_, reject) => { rejectWeb = reject; });
  let voskCalls = 0;
  let scored = false;
  const recognize = buildRecognizeHarness({
    ctx,
    webSpeechOnce: () => web,
    voskOnce: () => { voskCalls++; return Promise.resolve({ alts: ['cat'], confidence: null }); }
  });
  const pending = recognize().then((v) => { scored = true; return v; });
  await flush();
  /* abortListening() invalidates the live context synchronously */
  ctx.cancelled = true;
  rejectWeb(new Error('aborted'));
  await assert.rejects(pending, /aborted/);
  assert.equal(voskCalls, 0);
  assert.equal(scored, false);
});

test('R1.3: cancellation during Vosk model initialization prevents mic acquisition', async () => {
  let resolveModel;
  const deferred = new Promise((resolve) => { resolveModel = resolve; });
  const h = buildVoskHarness({ ensureVosk: () => deferred });
  const pending = h.voskOnce('cat');
  assert.equal(h.state.gumCalls, 0);
  h.cancel();
  await assert.rejects(pending, /aborted/);
  resolveModel(h.model);
  await flush();
  assert.equal(h.state.gumCalls, 0);
});

test('R1.4: cancellation while getUserMedia is pending stops the late tracks', async () => {
  let resolveGum;
  const gum = new Promise((resolve) => { resolveGum = resolve; });
  const stream = fakeStream();
  const h = buildVoskHarness({ getUserMedia: () => gum });
  const pending = h.voskOnce('cat');
  await flush();
  assert.equal(h.state.gumCalls, 1);
  h.cancel();
  resolveGum(stream);
  await assert.rejects(pending, /aborted/);
  await flush();
  assert.ok(stream.track.stopCalls > 0, 'late getUserMedia stream must be stopped');
});

test('R1.5: a fresh recognition works normally after a cancelled one', async () => {
  const h = buildVoskHarness();
  const first = h.voskOnce('cat');
  h.cancel();
  await assert.rejects(first, /aborted/);

  h.setCtx({ cancelled: false });
  const second = h.voskOnce('cat');
  await flush();
  assert.equal(h.recs.length, 1);
  h.recs[0].handlers.result({ result: { text: 'cat' } });
  await h.clock.advance(2000);
  const value = await second;
  assert.deepEqual(value.alts, ['cat']);
});

test('R1.6: genuine Web Speech failure without cancellation still falls back to Vosk', async () => {
  const ctx = { cancelled: false };
  let voskCalls = 0;
  const recognize = buildRecognizeHarness({
    ctx,
    webSpeechOnce: () => Promise.reject(new Error('network')),
    voskOnce: () => { voskCalls++; return Promise.resolve({ alts: ['cat'], confidence: null }); }
  });
  const value = await recognize();
  assert.equal(voskCalls, 1);
  assert.equal(value.engine, 'offline');
  assert.deepEqual(value.alts, ['cat']);
});

test('R1.7: an old cancellation cannot cancel a newer recognition', async () => {
  const oldCtx = { cancelled: true };
  const newCtx = { cancelled: false };
  let voskCalls = 0;
  const recognize = buildRecognizeHarness({
    ctx: newCtx,
    webSpeechOnce: () => Promise.reject(new Error('network')),
    voskOnce: () => { voskCalls++; return Promise.resolve({ alts: ['cat'], confidence: null }); }
  });
  const value = await recognize();
  assert.equal(voskCalls, 1);
  assert.deepEqual(value.alts, ['cat']);
  assert.equal(oldCtx.cancelled, true);
  assert.equal(newCtx.cancelled, false);

  /* the retained cancel handle of a settled Vosk attempt is inert */
  const h = buildVoskHarness();
  const first = h.voskOnce('cat');
  const oldCancel = h.snapshot();
  h.cancel();
  await assert.rejects(first, /aborted/);
  h.setCtx({ cancelled: false });
  const second = h.voskOnce('cat');
  await flush();
  oldCancel();
  h.recs[h.recs.length - 1].handlers.result({ result: { text: 'cat' } });
  await h.clock.advance(2000);
  assert.deepEqual((await second).alts, ['cat']);
});

/* ================================================================== */
/* R2 - results are bound to the immutable attempt context             */
/* ================================================================== */

test('R2.1: A->B profile switch during recognition rejects the stale result', () => {
  const { h, attempt, ctx } = setupR2();
  h.set({ currentId: 'B', profileEpoch: 1 });
  attempt();
  assert.equal(h.calls.record.length, 0);
  assert.equal(h.calls.recordAttempt.length, 0);
  assert.equal(h.fb.dataset.scored, undefined);
  assert.equal(ctx.profileId, 'A');
});

test('R2.2: A->B->A rejects the stale result because the epoch changed', () => {
  const { h, attempt } = setupR2();
  h.set({ currentId: 'B', profileEpoch: 1 });
  h.set({ currentId: 'A', profileEpoch: 2 });
  attempt();
  assert.equal(h.calls.record.length, 0);
  assert.equal(h.calls.recordAttempt.length, 0);
  assert.equal(h.fb.dataset.scored, undefined);
});

test('R2.3: changing the current item during recognition rejects the result', () => {
  const { h, attempt } = setupR2();
  const other = { t: 'dog', spoken: 'dog', _mode: 'words' };
  h.set({ list: [other], index: 0 });
  attempt(['cat']);
  assert.equal(h.calls.record.length, 0);
  assert.equal(h.calls.recordAttempt.length, 0);
});

test('R2.4: navigating away and back to the same item rejects the old result', () => {
  const { h, attempt, item } = setupR2();
  /* a rebuilt list holds the very same item object, but it is a new session */
  h.set({ list: [item], index: 0 });
  attempt();
  assert.equal(h.calls.record.length, 0);
  assert.equal(h.calls.recordAttempt.length, 0);
});

test('R2.5: a newer recognition attempt supersedes the older context', () => {
  const { h, ctx } = setupR2();
  const fresh = { ...ctx, generation: 2 };
  h.set({ activeRecognitionCtx: fresh, recognitionSeq: 2, scoreAttemptContext: ctx });
  h.scoreAttempt(['cat'], 'online', null, ctx.profileId, 111);
  assert.equal(h.calls.record.length, 0);
  assert.equal(h.calls.recordAttempt.length, 0);

  /* control: the newer context itself is still valid */
  h.set({ scoreAttemptContext: fresh });
  h.scoreAttempt(['cat'], 'online', null, fresh.profileId, 111);
  assert.equal(h.calls.record.length, 1);
  assert.equal(h.calls.recordAttempt.length, 1);
});

test('R2.6: a valid recognition for the unchanged original item succeeds', () => {
  const { h, attempt } = setupR2();
  attempt();
  assert.equal(h.fb.dataset.scored, '1');
  assert.equal(h.calls.record.length, 1);
  assert.equal(h.calls.recordAttempt.length, 1);
  assert.equal(h.calls.recordAttempt[0][1], 'cat');
});

test('R2.7: a stale result never calls recordAttempt or recentSkillAttempts.record', () => {
  const cases = [
    ({ h }) => h.set({ currentId: 'B', profileEpoch: 1 }),
    ({ h }) => { h.set({ currentId: 'B', profileEpoch: 1 }); h.set({ currentId: 'A', profileEpoch: 2 }); },
    ({ h }) => h.set({ list: [{ t: 'dog', spoken: 'dog' }], index: 0 }),
    ({ h, ctx }) => h.set({ activeRecognitionCtx: { ...ctx, generation: 2 }, recognitionSeq: 2 })
  ];
  for (const mutate of cases) {
    const s = setupR2();
    mutate(s);
    s.h.set({ scoreAttemptContext: s.ctx });
    s.h.scoreAttempt(['cat'], 'online', null, 'A', 111);
    assert.equal(s.h.calls.record.length, 0);
    assert.equal(s.h.calls.recordAttempt.length, 0);
    assert.equal(s.h.fb.dataset.scored, undefined);
  }
});

test('R2.8: a valid result records exactly once', () => {
  const { h, attempt } = setupR2();
  attempt();
  assert.equal(h.calls.record.length, 1);
  assert.equal(h.calls.recordAttempt.length, 1);
  assert.equal(h.calls.persist, 0);
});

/* ================================================================== */
/* context token behaviour                                              */
/* ================================================================== */

test('context: profile epoch defeats A->B->A identity equality', () => {
  const h = buildContextHarness();
  const list = [{ t: 'cat', spoken: 'cat' }];
  h.set({ list, index: 0, currentId: 'A', profileEpoch: 0, currentMode: 'words' });
  const ctx = h.beginRecognitionContext();
  assert.equal(h.isRecognitionContextValid(ctx), true);
  h.set({ currentId: 'B', profileEpoch: 1 });
  assert.equal(h.isRecognitionContextValid(ctx), false);
  h.set({ currentId: 'A', profileEpoch: 2 });
  assert.equal(h.isRecognitionContextValid(ctx), false);

  const next = h.beginRecognitionContext();
  assert.equal(h.isRecognitionContextValid(next), true);
});

test('context: item/list/mode changes invalidate the token', () => {
  const h = buildContextHarness();
  const item = { t: 'cat', spoken: 'cat' };
  const list = [item];
  h.set({ list, index: 0, currentId: 'A', profileEpoch: 0, currentMode: 'words' });
  const ctx = h.beginRecognitionContext();
  h.set({ index: 1 });
  assert.equal(h.isRecognitionContextValid(ctx), false);
  h.set({ index: 0, list: [item] });
  assert.equal(h.isRecognitionContextValid(ctx), false);
  h.set({ list, index: 0, currentMode: 'recall' });
  assert.equal(h.isRecognitionContextValid(ctx), false);
});

test('context: an old abort guard cannot invalidate a newer attempt', () => {
  const h = buildContextHarness();
  h.set({ list: [{ t: 'cat', spoken: 'cat' }], index: 0, currentMode: 'words' });
  const old = h.beginRecognitionContext();
  const oldGuard = h.get().activeSRAbort;
  assert.equal(typeof oldGuard, 'function');

  const newer = h.beginRecognitionContext();
  assert.equal(old.cancelled, true);
  assert.equal(h.isRecognitionContextValid(old), false);

  oldGuard();
  assert.equal(newer.cancelled, false);
  assert.equal(h.isRecognitionContextValid(newer), true);

  h.abortListening();
  assert.equal(newer.cancelled, true);
  assert.equal(h.isRecognitionContextValid(newer), false);
});

/* ================================================================== */
/* profile epoch transitions (Phase 3D.1B)                             */
/* ================================================================== */

test('E1: initial identity does not increment the epoch', () => {
  const stored = buildEpochHarness({ storedCurrent: 'A' });
  assert.equal(stored.get().currentId, 'A');
  assert.equal(stored.get().savedCurrentId, 'A');
  assert.equal(stored.get().profileEpoch, 0);
  stored.saveCurrent();
  assert.equal(stored.get().profileEpoch, 0);

  /* no usable stored identity: startup sanitizes to the first profile */
  const fresh = buildEpochHarness({ storedCurrent: null });
  assert.equal(fresh.get().currentId, 'A');
  assert.equal(fresh.get().savedCurrentId, 'A');
  fresh.saveCurrent();
  assert.equal(fresh.get().profileEpoch, 0);
});

test('E2: saving the same active profile does not increment the epoch', () => {
  const h = buildEpochHarness({ storedCurrent: 'A' });
  h.saveCurrent();
  h.saveCurrent();
  h.saveCurrent();
  assert.equal(h.get().profileEpoch, 0);
  assert.equal(h.get().currentId, 'A');
  assert.equal(h.get().savedCurrentId, 'A');
});

test('E3: re-selecting the same profile keeps a valid recognition context', () => {
  const h = buildEpochHarness({ storedCurrent: 'A' });
  h.setList([{ t: 'cat', spoken: 'cat' }]);
  const ctx = h.beginRecognitionContext();
  assert.equal(h.isRecognitionContextValid(ctx), true);

  h.saveCurrent(); /* selection handler re-saves the already-active profile */
  assert.equal(h.get().profileEpoch, 0);
  assert.equal(h.isRecognitionContextValid(ctx), true);
});

test('E4: A->B increments the epoch and invalidates the old context', () => {
  const h = buildEpochHarness({ storedCurrent: 'A' });
  h.setList([{ t: 'cat', spoken: 'cat' }]);
  const ctx = h.beginRecognitionContext();
  assert.equal(h.isRecognitionContextValid(ctx), true);

  h.setCurrentId('B');
  h.saveCurrent();
  assert.equal(h.get().profileEpoch, 1);
  assert.equal(h.isRecognitionContextValid(ctx), false);
});

test('E5: B->A increments again and does not revive the original context', () => {
  const h = buildEpochHarness({ storedCurrent: 'A' });
  h.setList([{ t: 'cat', spoken: 'cat' }]);
  const ctx = h.beginRecognitionContext();

  h.setCurrentId('B');
  h.saveCurrent();
  h.setCurrentId('A');
  h.saveCurrent();
  assert.equal(h.get().profileEpoch, 2);
  assert.equal(h.get().savedCurrentId, 'A');
  assert.equal(h.isRecognitionContextValid(ctx), false);
});

test('E6: a new context after returning to A is valid', () => {
  const h = buildEpochHarness({ storedCurrent: 'A' });
  h.setList([{ t: 'cat', spoken: 'cat' }]);
  h.beginRecognitionContext();

  h.setCurrentId('B');
  h.saveCurrent();
  h.setCurrentId('A');
  h.saveCurrent();

  const next = h.beginRecognitionContext();
  assert.equal(next.profileEpoch, 2);
  assert.equal(h.isRecognitionContextValid(next), true);
});

test('E7: ordinary saveProfiles persistence does not increment the epoch', () => {
  const h = buildEpochHarness({ storedCurrent: 'A' });
  h.setList([{ t: 'cat', spoken: 'cat' }]);
  const ctx = h.beginRecognitionContext();

  h.currentProfile().progress = { cat: 3 };
  h.saveProfiles();
  assert.equal(h.get().profileEpoch, 0);
  assert.equal(h.isRecognitionContextValid(ctx), true);
});

test('E8: a valid attempt records exactly once', () => {
  const h = buildEpochHarness({ storedCurrent: 'A' });
  h.setList([{ t: 'cat', spoken: 'cat' }]);
  const ctx = h.beginRecognitionContext();

  h.setScoreContext(ctx);
  h.scoreAttempt(['cat'], 'online', 0.95, 'A', 123);
  assert.equal(h.get().attemptCount, 1);
  assert.equal(h.get().recordCount, 1);
  assert.equal(h.get().scored, '1');

  h.endRecognitionContext(ctx);
  h.setScoreContext(ctx);
  h.scoreAttempt(['cat'], 'online', 0.95, 'A', 123);
  assert.equal(h.get().attemptCount, 1);
  assert.equal(h.get().recordCount, 1);
});

test('E9: a stale attempt records nothing', () => {
  const h = buildEpochHarness({ storedCurrent: 'A' });
  h.setList([{ t: 'cat', spoken: 'cat' }]);
  const ctx = h.beginRecognitionContext();

  h.setCurrentId('B');
  h.saveCurrent();
  h.setScoreContext(ctx);
  h.scoreAttempt(['cat'], 'online', 0.95, 'A', 123);
  assert.equal(h.get().attemptCount, 0);
  assert.equal(h.get().recordCount, 0);
  assert.equal(h.get().scored, undefined);

  /* A->B->A must not revive the same identity */
  h.setCurrentId('A');
  h.saveCurrent();
  h.setScoreContext(ctx);
  h.scoreAttempt(['cat'], 'online', 0.95, 'A', 123);
  assert.equal(h.get().attemptCount, 0);
  assert.equal(h.get().recordCount, 0);
});

test('E10: epoch transitions stay correct when lsSet declines persistence', () => {
  const h = buildEpochHarness({ storedCurrent: 'A' });
  h.setList([{ t: 'cat', spoken: 'cat' }]);
  const ctx = h.beginRecognitionContext();

  h.declineStorage();
  h.setCurrentId('B');
  h.saveCurrent();
  assert.equal(h.get().profileEpoch, 1);
  assert.equal(h.get().savedCurrentId, 'B');
  assert.equal(h.isRecognitionContextValid(ctx), false);

  /* the failed write is not retried as a new transition */
  h.saveCurrent();
  assert.equal(h.get().profileEpoch, 1);

  h.setCurrentId('A');
  h.saveCurrent();
  assert.equal(h.get().profileEpoch, 2);

  h.restoreStorage();
  h.saveCurrent();
  assert.equal(h.get().profileEpoch, 2);
  assert.equal(h.get().savedCurrentId, 'A');
  assert.deepEqual(h.storageKeys().sort(), ['c', 'p']);
});

/* ================================================================== */
/* wiring (static, minimal)                                            */
/* ================================================================== */

test('static: saveCurrent bumps the profile epoch only on an identity transition', () => {
  assert.match(html, /function saveCurrent\(\)\{ if\(currentId!==savedCurrentId\)\{ profileEpoch\+\+; savedCurrentId=currentId; \} lsSet\(CKEY, currentId\); \}/);
  assert.match(html, /let savedCurrentId = currentId;/);
  assert.doesNotMatch(html, /function saveCurrent\(\)\{ profileEpoch\+\+;/);
});

test('static: the mic flow begins and ends the recognition context', () => {
  const start = html.indexOf("document.getElementById('btnMic').onclick=async ()=>{");
  const end = html.indexOf("document.getElementById('btnReplayMe')");
  assert.ok(start >= 0 && end > start);
  const block = html.slice(start, end);
  assert.match(block, /const rctx=beginRecognitionContext\(\);/);
  assert.match(block, /endRecognitionContext\(rctx\)/);
  assert.ok(block.indexOf('beginRecognitionContext()') < block.indexOf('await recognizeOnce()'));
});

test('static: showScore validates the attempt context before writing results', () => {
  const start = html.indexOf('function showScore(');
  const end = html.indexOf('function stillOn(');
  const block = html.slice(start, end);
  const guard = block.indexOf('if(rctx && !isRecognitionContextValid(rctx)) return;');
  const record = block.indexOf('recordAttempt(rm, item.t');
  const roll = block.indexOf('recentSkillAttempts.record(profileId');
  assert.ok(guard >= 0);
  assert.ok(record > guard);
  assert.ok(roll > guard);
});
