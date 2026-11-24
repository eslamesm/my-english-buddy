import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('keeps the primary Egyptian curriculum panel and its grid', () => {
  assert.match(html, /<section id="panel-curr" class="panel">[\s\S]*?<h2[^>]*>📖 المنهج المصري حسب الصف<\/h2>[\s\S]*?id="curGrid"/);
});

test('removes the duplicate bottom homepage curriculum section', () => {
  assert.doesNotMatch(html, /home-curriculum-section|homeCurGrid|Egyptian Curriculum/);
});

test('does not retain a renderer or calls for the removed duplicate section', () => {
  assert.doesNotMatch(html, /function\s+buildHomeCur\s*\(/);
  assert.doesNotMatch(html, /buildHomeCur\s*\(/);
});

test('preserves the primary curriculum renderer and parent permission filtering', () => {
  assert.match(html, /function buildCurGrid\s*\(/);
  assert.match(html, /const allowed=allowedCurricula\(p\)/);
  assert.match(html, /CUR_UNITS\.filter\(u=>allowed\.includes\(u\.base\)\)/);
});
