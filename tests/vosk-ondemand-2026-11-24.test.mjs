/* 2026-11-24 - owner-approved: offline recognition model downloads on demand only.
 *
 * 1. Opening a practice mode (startMode) must NOT trigger the 41MB model download,
 *    even when recMode is offline/auto. The download starts only when offline
 *    recognition is actually requested (recognition flow) or via the explicit
 *    parent-settings preload button.
 * 2. The on-demand download reports visible progress (downloaded MB / total MB).
 * 3. A network failure rejects cleanly, purges the bad cached copy, counts the
 *    failure, and after repeated failures ensureVosk short-circuits without
 *    fetching again.
 *
 * Behavioural: executes the REAL startMode/ensureVosk extracted from index.html
 * inside a stubbed harness (a `with` proxy turns unknown globals into no-ops).
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
  if (html.slice(start - 6, start) === 'async ') start -= 6; // keep async so throws become rejections
  const braceStart = html.indexOf('{', start);
  let depth = 0, i = braceStart;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) break; }
  }
  return html.slice(start, i + 1);
}

function makeEnv(extra) {
  const noop = () => {};
  const dummyEl = { classList: { add: noop, remove: noop, toggle: noop }, style: {}, textContent: '', innerHTML: '' };
  const real = Object.assign({
    document: { getElementById: () => dummyEl, querySelector: () => dummyEl, querySelectorAll: () => [] },
    MODE_DATA: { letters: [{ t: 'a' }] },
    settings: { recMode: 'offline' },
    currentMode: '', list: [], index: 0, sessionStars: 0, sessionEvents: [],
    voskModel: null,
    __ensureCalls: 0,
    ensureVosk() { this.__ensureCalls++; return Promise.resolve({}); },
  }, extra || {});
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
  return { env, real };
}

test('startMode never triggers the offline model download (offline and auto)', async () => {
  for (const recMode of ['offline', 'auto']) {
    const { env, real } = makeEnv({ settings: { recMode } });
    const sandbox = { __env__: env };
    vm.createContext(sandbox);
    vm.runInContext('with(__env__){' + extractFunction('startMode') + '\n;startMode("letters");}', sandbox);
    assert.equal(real.__ensureCalls, 0, 'no ensureVosk call for recMode=' + recMode);
  }
});

/* --- ensureVosk network-failure and progress behaviour --- */

function makeVoskHarness({ fetchImpl, voskFactory }) {
  const noop = () => {};
  const statusLog = [];
  const purgeLog = [];
  const real = {
    isFile: false,
    window: { Vosk: { createModel: voskFactory || (async () => ({ fakeModel: true })) } },
    loadScript: async () => {},
    updateVoskStatus: (m) => statusLog.push(m),
    purgeVoskCache: async () => purgeLog.push(1),
    fetch: fetchImpl,
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
    'with(__env__){ let voskModel=null, voskLoading=null, voskFailed=false, voskFails=0;\n' +
    extractFunction('ensureVosk') +
    '\n;__api={ ensureVosk, state:()=>({voskModel,voskFailed,voskFails}) };}',
    sandbox
  );
  return { api: real.__api, statusLog, purgeLog };
}

function streamResponse(chunks, totalSize) {
  return {
    ok: true,
    headers: { get: (h) => (h === 'content-length' ? String(totalSize) : 'application/gzip') },
    body: {
      getReader() {
        let i = 0;
        return { read: async () => (i < chunks.length ? { done: false, value: chunks[i++] } : { done: true }) };
      },
    },
  };
}

test('on-demand download streams with visible MB progress', async () => {
  const chunk = new Uint8Array(2 * 1024 * 1024); // 2MB per chunk
  const total = 41 * 1024 * 1024;
  const h = makeVoskHarness({ fetchImpl: async () => streamResponse([chunk, chunk, chunk], total) });
  const m = await h.api.ensureVosk();
  assert.ok(m && m.fakeModel, 'model returned');
  const progressMsgs = h.statusLog.filter(s => s.includes('ميجا'));
  assert.ok(progressMsgs.length >= 3, 'progress updates emitted: ' + progressMsgs.length);
  assert.ok(progressMsgs[0].includes('/ 41'), 'total size shown');
  assert.ok(h.statusLog.some(s => s.includes('جاهز')), 'ready status at the end');
});

test('network failure: rejects, purges cache, counts failures, then short-circuits', async () => {
  let fetches = 0;
  const h = makeVoskHarness({ fetchImpl: async () => { fetches++; throw new Error('network down'); } });
  await assert.rejects(h.api.ensureVosk(), /vosk-model-fetch/);
  assert.equal(h.api.state().voskFails, 1);
  assert.equal(h.purgeLog.length, 1, 'bad cached copy purged');
  assert.ok(h.statusLog.some(s => s.includes('أعد المحاولة')), 'retry status shown');
  await assert.rejects(h.api.ensureVosk(), /vosk-model-fetch/);
  assert.equal(h.api.state().voskFailed, true, 'marked unavailable after 2 failures');
  await assert.rejects(h.api.ensureVosk(), /vosk-unavailable/);
  assert.equal(fetches, 2, 'no further fetch once unavailable');
});

test('download progress is visible in both practice and parent settings and clears at completion', () => {
  const nodes={};
  for(const id of ['voskStatus','voskPracticeStatus','voskProgress','voskPracticeProgress']) nodes[id]={hidden:true,textContent:'',removeAttribute(){}};
  const s={document:{getElementById:id=>nodes[id]}};
  vm.createContext(s); vm.runInContext(extractFunction('updateVoskStatus'),s);
  s.updateVoskStatus('12 / 40 MB',12,40);
  for(const id of ['voskProgress','voskPracticeProgress']){
    assert.equal(nodes[id].hidden,false); assert.equal(nodes[id].value,12); assert.equal(nodes[id].max,40);
  }
  assert.equal(nodes.voskPracticeStatus.textContent,'12 / 40 MB');
  s.updateVoskStatus('ready');
  assert.equal(nodes.voskPracticeProgress.hidden,true);
});

test('changing recognition preference alone never downloads a model', () => {
  const handler=html.split('\n').find(x=>x.startsWith("document.querySelectorAll('#recChips .chip')")&&x.includes('addEventListener'));
  assert.ok(handler);
  assert.ok(!handler.includes('ensureVosk'), 'preference selection is not a download request');
});
