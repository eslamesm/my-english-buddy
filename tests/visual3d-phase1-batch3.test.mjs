import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'assets/visual3d/library-phase1-batch3');
const keys = ['binoculars','magnify','idea','cooperate','climb','bicycle','balloon','boat','plane','train','traffic-light','map','compass','fair','trophy','treasure','gift','fruit-basket','juice','sandcastle'];
test('phase 1 batch 3 contains 20 independent 512px PNG assets', () => {
  for (const key of keys) {
    const file = path.join(dir, `${key}.png`);
    assert.ok(fs.existsSync(file), `${key} image exists`);
    const b = fs.readFileSync(file);
    assert.equal(b.toString('hex',0,8), '89504e470d0a1a0a');
    assert.equal(b.readUInt32BE(16),512);
    assert.equal(b.readUInt32BE(20),512);
  }
});
test('new research and cooperation vocabulary mappings resolve', () => {
  const src = fs.readFileSync(path.join(root,'assets/visual3d/map.js'),'utf8');
  const map = JSON.parse(src.replace(/^window\.ART_IMG_3D\s*=\s*/,'').replace(/;\s*$/,''));
  for (const key of ['research','cooperation']) {
    assert.ok(map[key]);
    assert.ok(fs.existsSync(path.join(root,map[key])));
  }
});
