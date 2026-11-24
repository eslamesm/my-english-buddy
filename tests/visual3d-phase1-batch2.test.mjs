import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'assets/visual3d/library-phase1-batch2');
const keys = ['taste','touch','meat','warm','tea','english','math','science','art','music','help','share','wonderful','explore','health','medicine'];
test('phase 1 batch 2 contains 16 independent RGBA vocabulary assets', () => {
  for (const key of keys) {
    const file = path.join(dir, `${key}.png`);
    assert.ok(fs.existsSync(file), `${key} image exists`);
    const buf = fs.readFileSync(file);
    assert.equal(buf.toString('hex',0,8), '89504e470d0a1a0a');
    assert.equal(buf.readUInt32BE(16), 512);
    assert.equal(buf.readUInt32BE(20), 512);
  }
});
test('phase 1 batch 2 runtime mappings resolve to existing image files', () => {
  const source = fs.readFileSync(path.join(root,'assets/visual3d/map.js'),'utf8');
  const map = JSON.parse(source.replace(/^window\.ART_IMG_3D\s*=\s*/,'').replace(/;\s*$/,''));
  for (const key of ['taste','touch','warm','english','math','science','art','music','wonderful','health','medicine']) {
    assert.ok(map[key], `${key} mapping exists`);
    assert.ok(fs.existsSync(path.join(root,map[key])), `${key} target exists`);
  }
});
