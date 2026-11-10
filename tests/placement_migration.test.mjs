import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const require_ = createRequire(import.meta.url);
const Placement = require_('../placement.js');

const html = read('index.html');
const sw = read('sw.js');

const legacyProfile = () => ({
  id: 'p1',
  name: 'قديم',
  age: 7,
  avatar: '🦁',
  levelKey: '7-10',
  schoolYear: 'p3',
  createdAt: 1690000000000,
  progress: { 'words::cat': 2 },
  learning: { v: 1, items: { 'recognize::cat': { mastery: 2 } } }
});

/* ------------------------------ migrateProfiles() ------------------------------ */

test('a legacy profile gets a non-destructive placement snapshot', () => {
  const p = legacyProfile();
  const n = Placement.migrateProfiles([p]);
  assert.equal(n, 1);
  assert.equal(p.placement.status, 'none');
  assert.equal(p.placement.grade, 'p3');
  assert.equal(p.placement.assignedLevel, null, 'no assigned level may be invented');
  assert.equal(p.placement.takenAt, null);
  assert.deepEqual(p.placement.answers, []);
  assert.equal(p.levelKey, '7-10', 'levelKey preserved');
  assert.equal(p.schoolYear, 'p3', 'schoolYear preserved');
  assert.deepEqual(p.progress, { 'words::cat': 2 }, 'progress untouched');
  assert.deepEqual(Object.keys(p.learning.items), ['recognize::cat'], 'learning untouched');
  assert.equal(p.levelManual, true, 'levelManual defaults to true');
});

test('existing explicit levelManual (including false) is preserved', () => {
  const manual = legacyProfile();
  const chosen = legacyProfile();
  manual.levelManual = true;
  chosen.levelManual = false;
  const n = Placement.migrateProfiles([manual, chosen]);
  assert.equal(manual.levelManual, true);
  assert.equal(chosen.levelManual, false);
  assert.equal(n, 2);
});

test('a profile that already has a placement is left alone', () => {
  const p = legacyProfile();
  const done = { version: 1, status: 'done', takenAt: 111, grade: 'p3', assignedLevel: '7-10', startUnit: null, bySkill: {}, answers: [{ kind: 'listen', word: 'cat', tier: 3, correct: true }] };
  p.placement = done;
  p.levelManual = false;
  const n = Placement.migrateProfiles([p]);
  assert.equal(p.placement, done, 'same object reference preserved');
  assert.equal(p.placement.status, 'done');
  assert.equal(p.levelManual, false, 'explicit boolean not rewritten');
  assert.equal(n, 0);
});

test('migrateProfiles tolerates bad input and is idempotent', () => {
  assert.equal(Placement.migrateProfiles(undefined), 0);
  assert.equal(Placement.migrateProfiles(null), 0);
  assert.equal(Placement.migrateProfiles([null, undefined, 'x']), 0);

  const p = legacyProfile();
  assert.equal(Placement.migrateProfiles([p]), 1);
  assert.equal(Placement.migrateProfiles([p]), 0, 're-running is a no-op');
});

test('a partially-migrated profile is completed, not clobbered', () => {
  const p = legacyProfile();
  p.placement = null;
  p.levelManual = false;           // only placement is missing
  const n = Placement.migrateProfiles([p]);
  assert.equal(n, 1);
  assert.equal(p.placement.status, 'none');
  assert.equal(p.levelManual, false, 'explicit false not rewritten');
});

/* ------------------------------ wiring ------------------------------ */

test('index.html declares schema v3 and the v3 backup hook', () => {
  assert.match(html, /const SCHEMA_VERSION\s*=\s*3\b/, 'SCHEMA_VERSION must be 3');
  assert.match(html, /englishkids_backup_v3/, 'v3 backup key must exist');
  assert.match(html, /migrateV3\(\)\s*\{|\(function migrateV3\(\)/, 'migrateV3 IIFE present');
  assert.match(html, /migrateProfiles\(/, 'migration delegates to placement.js');
  assert.match(html, /<script src="placement\.js"><\/script>/, 'placement.js loaded by the app');
  assert.match(html, /placementCard/, 'home placement card exists');
  assert.match(html, /placementNote/, 'parent placement note exists');
  assert.match(html, /pcStart/, 'card start button wired');
});

test('sw.js precaches placement.js under CACHE v36', () => {
  assert.match(sw, /englishkids-v36/, 'CACHE must be bumped to v36');
  assert.ok(sw.includes('"./placement.js"'), 'CORE must include ./placement.js');
  assert.ok(sw.includes('"./engine.js"'), 'CORE must keep ./engine.js');
  assert.ok(!/englishkids-v35/.test(sw), 'v35 cache name must be gone');
});
