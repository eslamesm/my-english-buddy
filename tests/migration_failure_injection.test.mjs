import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

/* Phase 2.2 failure-injection coverage. These tests extract the REAL migration
   code (migrateV2 / migrateV3 IIFEs and the storage helpers) from index.html
   byte-for-byte, run it in a VM sandbox backed by an in-memory localStorage
   with controllable write failures, and assert the actual SKV / PKEY / backup
   values afterwards — not just source ordering. */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require_ = createRequire(import.meta.url);
const Placement = require_('../placement.js');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* ---------------- extraction helpers ---------------- */
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
function grabIife(name) {
  const re = new RegExp('\\(function\\s+' + name + '\\s*\\(');
  const m = re.exec(html);
  if (!m) throw new Error('missing iife ' + name);
  const start = m.index;
  let depth = 0, j = start, inStr = false, q = '';
  for (; j < html.length; j++) {
    const ch = html[j];
    if (inStr) { if (ch === '\\') { j++; continue; } if (ch === q) inStr = false; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; q = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        j += 1;
        while (j < html.length && /[ \t\r\n();]/.test(html[j])) j++;
        break;
      }
    }
  }
  return html.slice(start, j);
}
const line = (name) => (html.match(new RegExp('const\\s+' + name + '[^\\n]*')) || [''])[0] + ';';

/* ---------------- deterministic sandbox ---------------- */
function makeContext({ profiles = [], currentId = null, placementGlobal = Placement, failSet = new Set(), seedSku = null } = {}) {
  const storage = new Map();
  if (profiles.length) storage.set('englishkids_profiles_v3', JSON.stringify(profiles));
  if (currentId) storage.set('englishkids_current_v3', JSON.stringify(currentId));
  if (seedSku) storage.set('englishkids_schema_v', seedSku);
  const logs = [];
  const storageWarn = (m) => logs.push('warn:' + m);
  const consoleStub = { log(...a) { logs.push('log:' + a.join(' ')); }, warn(...a) { logs.push('warn:' + a.join(' ')); } };
  const localStorage = {
    getItem(k) { const v = storage.get(k); return v === undefined ? null : v; },
    setItem(k, v) { if (failSet.has(k)) throw new Error('QuotaExceededError'); storage.set(k, String(v)); },
    removeItem(k) { storage.delete(k); }
  };
  const LearningEngine = {
    DAILY_NEW_DEFAULT: 5,
    createStore() { return { v: 1, items: {} }; },
    validateStore(v) { return (v && typeof v === 'object' && !Array.isArray(v) && v.items) ? v : { v: 1, items: {} }; },
    normalizeDailyNew(v) { return [3, 5, 10].indexOf(parseInt(v, 10)) >= 0 ? parseInt(v, 10) : 5; },
    fromLegacyProgress() { return { v: 1, items: {} }; }
  };
  const sandbox = {
    window: undefined, localStorage, console: consoleStub, storageWarn, LearningEngine,
    Date, JSON, Object, Array, Math, Number, String, Boolean, Set, Map, RegExp, Error, TypeError,
    parseInt, parseFloat, isFinite, isNaN, encodeURIComponent, decodeURIComponent
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  if (placementGlobal) sandbox.Placement = placementGlobal;
  vm.createContext(sandbox);
  vm.runInContext([
    grab('AGES'),
    grab('CUR_GRADES'),
    grab('AVATAR_LIST'),
    grabFunction('levelFromAge'),
    grabFunction('gradeFromAge'),
    grabFunction('lsGet'),
    grabFunction('lsSet'),
    grabFunction('sanitizeProfile'),
    grabFunction('sanitizeProfiles'),
    grabFunction('persistRepairs'),
    grabFunction('seedLearningFromProgress'),
    line('PKEY'),
    line('SCHEMA_VERSION')
  ].join('\n'), sandbox);
  vm.runInContext('var rawProfiles = (function(){ try{ return JSON.parse(localStorage.getItem("englishkids_profiles_v3") || "[]"); }catch(e){ return []; } })();', sandbox);
  vm.runInContext('var profiles = sanitizeProfiles(rawProfiles);', sandbox);
  vm.runInContext('var currentId = (function(){ var v=null; try{ v=JSON.parse(localStorage.getItem("englishkids_current_v3") || "null"); }catch(e){} var ok = typeof v==="string" && profiles.some(function(p){return p.id===v;}); return ok? v : (profiles.length?profiles[0].id:null); })();', sandbox);
  return {
    storage,
    logs,
    run: (src) => vm.runInContext(src, sandbox),
    probe: (src) => vm.runInContext(src, sandbox),
    storedProfiles: () => JSON.parse(storage.get('englishkids_profiles_v3'))
  };
}

const legacy = (id, over) => Object.assign({
  id, name: 'قديم' + id, age: 7, avatar: '🦁', levelKey: '7-10', schoolYear: 'p3',
  createdAt: 1690000000000,
  progress: { 'words::cat': 2 },
  stats: { attempts: 6, timeMs: 5000, byMode: {}, daily: {}, recent: ['x'], games: { attempts: 1, correct: 1 }, lastPlayed: 1700000000000 },
  learning: { v: 1, items: {} }
}, over || {});

const v2 = (ctx) => ctx.run(grabIife('migrateV2'));
const v3 = (ctx) => ctx.run(grabIife('migrateV3'));
const schema = (ctx) => ctx.storage.get('englishkids_schema_v');

/* ---------- F1 — PKEY write failure does not bump SKV ---------- */

test('F1-v2: failed profile write leaves SKV below 2 and retries cleanly', () => {
  const ctx = makeContext({ profiles: [legacy('f1a')], currentId: 'f1a', failSet: new Set(['englishkids_profiles_v3']) });
  v2(ctx);
  assert.notEqual(schema(ctx), '2', 'SKV must not reach 2 when the PKEY write fails');
  const stored = ctx.storedProfiles()[0];
  assert.equal(stored.levelKey, '7-10', 'levelKey preserved after failed v2');
  assert.equal(stored.schoolYear, 'p3', 'schoolYear preserved after failed v2');

  // transient failure heals: retry completes fully
  ctx.storage.delete('englishkids_profiles_v3');
  const ctx2 = makeContext({ profiles: [stored], currentId: 'f1a' });
  v2(ctx2);
  assert.equal(schema(ctx2), '2', 'retry bumps SKV to 2');
  assert.deepEqual(ctx2.storedProfiles()[0].progress, { 'words::cat': 2 }, 'progress survives retry');
});

test('F1-v3: failed profile write leaves SKV at 2 and stores no partial migration', () => {
  const ctx = makeContext({
    profiles: [legacy('f1b'), legacy('f1c')],
    currentId: 'f1b',
    failSet: new Set(['englishkids_profiles_v3'])
  });
  v2(ctx);                       // v2's write also fails here; SKV stays undefined/below 2
  const skvAfterV2 = schema(ctx);
  v3(ctx);                       // v3 reaches the PKEY write, then fails
  assert.equal(schema(ctx), skvAfterV2, 'SKV must not advance past the failed v3');
  assert.equal(schema(ctx), undefined, 'SKV must stay at whatever v2 left it');
  const stored = ctx.storedProfiles();
  assert.deepEqual(stored.map(p => p.placement === undefined), [true, true], 'placement absent for ALL profiles');

  const ctx2 = makeContext({ profiles: stored, currentId: 'f1b' });  // retry, storage healthy
  v2(ctx2);
  v3(ctx2);
  assert.equal(schema(ctx2), '3', 'retry completes the full upgrade');
  assert.ok(ctx2.storedProfiles().every(p => p.placement && p.placement.status === 'none'));
});

/* ---------- F2 — backup failure aborts the v3 migration ---------- */

test('F2-v3: failed backup write aborts migration before PKEY is touched', () => {
  const ctx = makeContext({ profiles: [legacy('f2a')], currentId: 'f2a', failSet: new Set(['englishkids_backup_v3']) });
  v2(ctx);
  const before = ctx.storage.get('englishkids_profiles_v3');
  v3(ctx);
  assert.equal(schema(ctx), '2', 'SKV must stay at 2 when the backup cannot be created');
  assert.equal(ctx.storage.get('englishkids_profiles_v3'), before, 'PKEY untouched by the aborted migration');
  assert.equal(ctx.storage.get('englishkids_backup_v3'), undefined, 'no half-made backup left behind');
  assert.equal(ctx.storedProfiles()[0].placement, undefined, 'no placement applied');

  const ctx2 = makeContext({ profiles: ctx.storedProfiles(), currentId: 'f2a' });  // retry healthy
  v2(ctx2);
  v3(ctx2);
  assert.equal(schema(ctx2), '3');
  assert.equal(ctx2.storedProfiles()[0].placement.status, 'none');
  assert.ok(typeof ctx2.storage.get('englishkids_backup_v3') === 'string', 'backup written on retry');
});

test('F2-v3: existing backup is used as-is and blocks nothing', () => {
  const marker = '{"previous":"backup"}';
  const ctx = makeContext({
    profiles: [legacy('f2b')],
    currentId: 'f2b',
    failSet: new Set(['englishkids_backup_v3']),   // backup write would fail, but must not be attempted
    seedSku: '2'
  });
  ctx.storage.set('englishkids_backup_v3', marker);
  v3(ctx);
  assert.equal(schema(ctx), '3', 'migration completes when the backup already exists');
  assert.equal(ctx.storage.get('englishkids_backup_v3'), marker, 'existing backup is not overwritten');
  assert.equal(ctx.storedProfiles()[0].placement.status, 'none', 'placement applied');
});

/* ---------- idempotency ---------- */

test('migration is fully idempotent across two runs (SKV and PKEY bytes)', () => {
  const ctx = makeContext({ profiles: [legacy('idem')], currentId: 'idem' });
  v2(ctx);
  v3(ctx);
  const skv = schema(ctx);
  const pkey = ctx.storage.get('englishkids_profiles_v3');
  v2(ctx);
  v3(ctx);
  assert.equal(schema(ctx), skv, 'SKV unchanged on second run');
  assert.equal(ctx.storage.get('englishkids_profiles_v3'), pkey, 'PKEY byte-identical on second run');
});

/* ---------- learner data is never touched ---------- */

test('migration preserves learning store and progress records', () => {
  const learning = { v: 1, items: { 'recognize::cat': { mastery: 3, streak: 2 } } };
  const ctx = makeContext({ profiles: [legacy('keep', { learning })], currentId: 'keep' });
  v2(ctx);
  v3(ctx);
  const stored = ctx.storedProfiles()[0];
  assert.equal(stored.levelKey, '7-10');
  assert.equal(stored.schoolYear, 'p3');
  assert.deepEqual(stored.learning, learning, 'learning store preserved verbatim');
  assert.deepEqual(stored.progress, { 'words::cat': 2 }, 'progress preserved verbatim');
  assert.equal(stored.placement.status, 'none');
  assert.equal(stored.levelManual, true, 'levelManual defaults to true for legacy profiles');
});
