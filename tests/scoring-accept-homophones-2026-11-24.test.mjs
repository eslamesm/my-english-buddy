/* 2026-11-24 - owner-approved narrow recognition exceptions.
 *
 * The scoring engine compares the RECOGNIZED TEXT with the target word. True
 * homophones (same pronunciation, different spelling) are accepted via the
 * ACCEPT map: sea/see (both exist as targets) and i/eye (audit evidence).
 * Everything else must keep failing: t-shirt/teacher is NOT a homophone and
 * accepting it would reward a wrong word; arbitrary wrong words score low.
 *
 * These tests execute the REAL scoring functions extracted from index.html.
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

function extractBlock(startMarker, endMarker) {
  const s = html.indexOf(startMarker);
  if (s < 0) throw new Error('marker not found: ' + startMarker);
  const e = html.indexOf(endMarker, s);
  if (e < 0) throw new Error('end marker not found after: ' + startMarker);
  return html.slice(s, e);
}

// Extract the pure scoring section: normalize/lev/similarity + ACCEPT + variantScore + bestSimilarity
const scoringSrc =
  extractBlock('function normalize(s)', 'function spellHint') ;

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(scoringSrc + '\n;globalThis.__scoring = { bestSimilarity, ACCEPT };', sandbox);

const { bestSimilarity, ACCEPT } = sandbox.__scoring;

test('approved homophones score as accepted variants (96)', () => {
  assert.equal(bestSimilarity('see', ['sea']), 96, 'sea heard as see');
  assert.equal(bestSimilarity('sea', ['see']), 96, 'see heard as sea');
  assert.equal(bestSimilarity('eye', ['i']), 96, 'i heard as eye');
  assert.equal(bestSimilarity('i', ['eye']), 96, 'eye heard as i');
});

test('t-shirt must NOT accept teacher (audit-observed misrecognition, not a homophone)', () => {
  const acc = ACCEPT['t-shirt'] || [];
  assert.deepEqual(acc, [], 't-shirt has no accepted variants');
  assert.ok(bestSimilarity('teacher', ['t-shirt']) < 80, 'teacher scores below the pass threshold for t-shirt');
});

test('arbitrary wrong words still fail', () => {
  assert.ok(bestSimilarity('doll', ['ball']) < 80, 'doll rejected for ball');
  assert.ok(bestSimilarity('banana', ['sheep']) < 55, 'unrelated word rejected');
});

test('ACCEPT stays a small explicit map (no silent widening)', () => {
  const keys = Object.keys(ACCEPT);
  assert.ok(keys.length <= 15, 'ACCEPT map grew unexpectedly: ' + keys.length);
  for (const k of ['sea', 'see', 'i', 'eye']) assert.ok(k in ACCEPT, k + ' present');
});
