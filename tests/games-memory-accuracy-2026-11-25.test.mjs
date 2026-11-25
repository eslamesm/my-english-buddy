import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const html = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html'), 'utf8');
const i = html.indexOf('function finishMemory('); assert.ok(i > 0);
const src = html.slice(i, html.indexOf('\n}', i) + 2);
function run(pairs, moves) {
  let shown;
  const sb = { memState: { moves, pairs }, stopTimer() {}, recordGame() {}, progressDailyGame() {}, evalAchv() {}, startMemory() {}, Math, showReward: (o) => { shown = o; } };
  vm.createContext(sb); vm.runInContext(src + ';finishMemory()', sb); return shown;
}
test('memory result accuracy never exceeds 100% and perfect play shows 100%', () => {
  assert.match(run(10, 10).sub, /دقة 100%/);
  assert.match(run(10, 20).sub, /دقة 50%/);
  assert.match(run(10, 5).sub, /دقة 100%/);
  assert.match(run(6, 0).sub, /دقة 100%/);
});
test('star thresholds unchanged (original scale)', () => {
  assert.equal(run(10, 10).stars, '⭐⭐⭐');
  assert.equal(run(10, 25).stars, '⭐⭐⭐'); // 80
  assert.equal(run(10, 40).stars, '⭐⭐');   // 50
  assert.equal(run(10, 60).stars, '⭐');
});
