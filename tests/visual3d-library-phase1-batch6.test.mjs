import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'assets/visual3d/library-phase1-batch6');
const names = ['hello','binoculars','smell-flower','microscope','idea','teamwork','trophy','gift','treasure','compass','map','sandcastle','balloon','sailboat','airplane','train','bicycle','traffic-light','fruit-basket','juice','salad','cheese','bread','birthday-cake','computer','backpack','notebook','desk','globe','books'];
test('phase 1 batch 6 contains 30 independent 512px RGBA PNG assets', () => {
  for (const name of names) {
    const file = path.join(dir, `${name}.png`);
    assert.ok(fs.existsSync(file), `${name} exists`);
    const png = fs.readFileSync(file);
    assert.equal(png.readUInt32BE(16), 512);
    assert.equal(png.readUInt32BE(20), 512);
    assert.equal(png[25], 6);
  }
});
test('phase 1 batch 6 vocabulary keys resolve to existing files', () => {
  const source = fs.readFileSync(path.join(root, 'assets/visual3d/map.js'), 'utf8');
  const map = JSON.parse(source.replace(/^window\.ART_IMG_3D\s*=\s*/, '').replace(/;\s*$/, ''));
  for (const key of ['interesting','holiday','famous','inventor','internet','message','camera','skill','experience','opinion','climate','opportunity']) {
    assert.ok(map[key]); assert.ok(fs.existsSync(path.join(root, map[key])));
  }
});
