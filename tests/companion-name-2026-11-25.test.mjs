import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const i18n = fs.readFileSync(new URL('../i18n.js', import.meta.url), 'utf8');
test('male companion is named Islam in new-screen copy, brand My English Buddy untouched', () => {
  assert.ok(i18n.includes('كمّل رحلتك مع إسلام'));
  assert.ok(i18n.includes('Continue your journey with Islam'));
  assert.ok(!i18n.includes('بودي'));
  assert.ok(!/with Buddy/.test(i18n));
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('<h1 class="brand">My English Buddy</h1>'));
});
