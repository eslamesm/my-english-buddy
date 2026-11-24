import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'assets/visual3d/library-phase1-batch4');
const names = ['get-up','go-to-bed','shake-hands','apple','three-blocks','see-binoculars','hear-headphones','smell-flower','stars','knowledge-science','help-friend','share-books','science-project','family-picnic','temperature','headache'];
test('phase 1 batch 4 assets exist as 512px RGBA PNGs', () => {
  for (const name of names) {
    const file = path.join(dir, `${name}.png`);
    assert.ok(fs.existsSync(file), `${name} exists`);
    const png = fs.readFileSync(file);
    assert.equal(png.readUInt32BE(16), 512, `${name} width`);
    assert.equal(png.readUInt32BE(20), 512, `${name} height`);
    assert.equal(png[25], 6, `${name} uses RGBA color type`);
  }
});
test('phase 1 batch 4 vocabulary keys resolve to existing assets', () => {
  const source = fs.readFileSync(path.join(root, 'assets/visual3d/map.js'), 'utf8');
  const map = JSON.parse(source.replace(/^window\.ART_IMG_3D\s*=\s*/, '').replace(/;\s*$/, ''));
  for (const key of ['get up','go to bed','shake hands','one','three','see','hear','smell','subject','temperature','headache','plan','homework','project','group','encourage']) {
    assert.ok(map[key], `${key} mapped`);
    assert.ok(fs.existsSync(path.join(root, map[key])), `${key} target exists`);
  }
});
