import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'assets/visual3d/library2100');
const names = ['morning-landscape','school-building','books-stack','study-boy','school-bus','family-picnic','playground-swing','spring-flowers','summer-beach','autumn-tree','winter-snowman','sunrise-clock','breakfast-meal','evening-home','starry-night','calendar-clock'];
test('library2100 contains 16 independent 512px PNG assets', () => {
  for (const name of names) {
    const file = path.join(dir, `${name}.png`);
    assert.ok(fs.existsSync(file), `${name} exists`);
    const b = fs.readFileSync(file);
    assert.equal(b.subarray(0,8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(b.readUInt32BE(16), 512, `${name} width`);
    assert.equal(b.readUInt32BE(20), 512, `${name} height`);
    assert.ok(b.length > 1000, `${name} is not empty`);
  }
});
test('calendar, weekdays, months, seasons, and time-of-day keys resolve', () => {
  const source = fs.readFileSync(path.join(root, 'assets/visual3d/map.js'), 'utf8');
  const map = JSON.parse(source.replace(/^window\.ART_IMG_3D\s*=\s*/, '').replace(/;\s*$/, ''));
  for (const key of ['sunday','monday','tuesday','wednesday','thursday','friday','saturday','today','tomorrow','yesterday','week','january','february','march','april','may','june','july','august','september','october','november','december','spring','summer','fall','winter','morning','noon','evening','night']) {
    assert.ok(map[key], `${key} mapped`);
    assert.ok(fs.existsSync(path.join(root, map[key])), `${key} target exists`);
  }
});
