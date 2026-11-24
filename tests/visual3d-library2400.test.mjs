import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const names = ['sky','toe','pets','jungle','on','building','animals','friend','weather','tennis','swimming','cartoon'];
const relocated = ['before','after']; // 2026-11-24 fix round 2: distinct generated images linked via fixes1124/

test('library2400 contains 14 independent 512px RGBA images with transparency', () => {
  for (const name of names) {
    const file = path.join(root, 'assets/visual3d/library2400', `${name}.png`);
    assert.ok(fs.existsSync(file), `${name} file exists`);
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.readUInt32BE(16), 512, `${name} width`);
    assert.equal(bytes.readUInt32BE(20), 512, `${name} height`);
    assert.equal(bytes[25], 6, `${name} is RGBA with alpha channel`);
  }
});

test('library2400 semantic keys resolve to the matching independent assets', () => {
  const source = fs.readFileSync(path.join(root, 'assets/visual3d/map.js'), 'utf8');
  const map = JSON.parse(source.replace(/^window\.ART_IMG_3D\s*=\s*/, '').replace(/;\s*$/, ''));
  for (const name of names) {
    assert.equal(map[name], `assets/visual3d/library2400/${name}.png`, `${name} map target`);
    assert.ok(fs.existsSync(path.join(root, map[name])), `${name} target exists`);
  }
  for (const name of relocated) {
    assert.equal(map[name], `assets/visual3d/fixes1124/${name}.png`, `${name} bound to distinct generated image`);
    assert.ok(fs.existsSync(path.join(root, map[name])), `${name} target exists`);
  }
  // FIXED 2026-11-24 round 2: before/after must stay distinct (regression guard for the audit defect).
  const hb = fs.readFileSync(path.join(root, map['before']));
  const ha = fs.readFileSync(path.join(root, map['after']));
  assert.ok(!hb.equals(ha), 'before/after must not be byte-identical');
});
