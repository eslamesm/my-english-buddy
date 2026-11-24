import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'assets/visual3d/library-phase1-batch5');
const names = ['grandfather','grandmother','cousin','baby','doctor','teacher','shop','hospital','park','beach','mountain','river','forest','desert','land','sea','island','bridge','road','airport','train','boat','balloon','helicopter','bike','arrow','question','answer','problem','solution','reason','result','plan','check','choose','try','continue','finish','success','failure','care','respect','help','teamwork','share','environment','recycle','save','use','find'];
test('phase 1 batch 5 contains 50 independent 512px RGBA PNG assets', () => {
  for (const name of names) {
    const file = path.join(dir, `${name}.png`);
    assert.ok(fs.existsSync(file), `${name} exists`);
    const png = fs.readFileSync(file);
    assert.equal(png.readUInt32BE(16), 512, `${name} width`);
    assert.equal(png.readUInt32BE(20), 512, `${name} height`);
    assert.equal(png[25], 6, `${name} RGBA`);
  }
});
test('phase 1 batch 5 abstract vocabulary keys resolve to existing image files', () => {
  const source = fs.readFileSync(path.join(root, 'assets/visual3d/map.js'), 'utf8');
  const map = JSON.parse(source.replace(/^window\.ART_IMG_3D\s*=\s*/, '').replace(/;\s*$/, ''));
  for (const key of ['brave','helpful','achievement','challenge','success','knowledge','culture','guide','decision','journey','adventure','confidence','respect','friendly','reason','result','responsibility','environment','technology','effort','participate','organize','present','discuss','ambition','social','future']) {
    assert.ok(map[key], `${key} mapped`);
    assert.ok(fs.existsSync(path.join(root, map[key])), `${key} target exists`);
  }
});
