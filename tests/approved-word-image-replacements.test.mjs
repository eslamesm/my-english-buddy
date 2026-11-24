import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const map = fs.readFileSync(path.join(root, 'assets/visual3d/map.js'), 'utf8');
const replacements = {
  bat: 'assets/visual3d/repair2026/bat.png',
  mat: 'assets/visual3d/repair2026/mat.png',
  cup: 'assets/visual3d/library1200/cup.png',
  leg: 'assets/visual3d/library1500/leg.png',
  sad: 'assets/visual3d/library1500/sad.png',
  happy: 'assets/visual3d/library1500/happy.png',
  angry: 'assets/visual3d/library1500/angry.png',
  surprised: 'assets/visual3d/library1500/surprised.png',
};

test('all eight approved word images remain mapped to their intended assets', () => {
  for (const [word, asset] of Object.entries(replacements)) {
    assert.match(map, new RegExp(`\\"${word}\\"\\s*:\\s*\\"${asset.replaceAll('/', '\\/')}\\"`), `${word} mapping`);
    assert.ok(fs.existsSync(path.join(root, asset)), `${word} asset exists`);
  }
});

test('all eight approved replacement images are valid 512px RGBA PNG files', () => {
  for (const [word, asset] of Object.entries(replacements)) {
    const bytes = fs.readFileSync(path.join(root, asset));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG', `${word} PNG signature`);
    assert.equal(bytes.readUInt32BE(16), 512, `${word} width`);
    assert.equal(bytes.readUInt32BE(20), 512, `${word} height`);
    assert.equal(bytes[25], 6, `${word} RGBA color type`);
  }
});
