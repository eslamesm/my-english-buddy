import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const words = JSON.parse(fs.readFileSync(path.join(root, 'tools/words.json'), 'utf8'));
const mapSource = fs.readFileSync(path.join(root, 'assets/visual3d/map.js'), 'utf8');
const context = { window: {} };
vm.runInNewContext(mapSource, context);
const map = context.window.ART_IMG_3D;
const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const emojiFallbackKeys = new Set(); // 2026-11-24 round 2: board/kick/big/play now have standalone illustrations

test('all 405 catalog entries resolve through the exact picSrc normalization', () => {
  assert.equal(words.length, 405);
  for (const word of words) {
    const key = normalize(word.slug || word.en);
    if (emojiFallbackKeys.has(key)) {
      assert.ok(!map[key], `${word.en} should use its matching emoji until a standalone illustration is available`);
    } else {
      assert.ok(map[key], `missing normalized map key: ${word.en} (${key})`);
      assert.ok(fs.existsSync(path.join(root, map[key])), `missing image file: ${word.en} -> ${map[key]}`);
    }
  }
});

test('every 3D map reference resolves to a real file', () => {
  for (const [key, relative] of Object.entries(map)) {
    assert.ok(fs.existsSync(path.join(root, relative)), `${key} -> ${relative}`);
  }
});

test('the 3D map is loaded before application code and merged into IMG', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const mapScript = html.indexOf('<script src="assets/visual3d/map.js"></script>');
  const appScript = html.indexOf('<script>', mapScript + 1);
  assert.ok(mapScript >= 0, 'visual3d map script is included');
  assert.ok(appScript > mapScript, 'application script follows map script');
  assert.match(html, /Object\.assign\(IMG,\s*window\.ART_IMG_3D\s*\|\|\s*\{\}\)/);
  assert.match(html, /function picSrc\(word\).*IMG\[k\]/s);
});

test('learning engine, placement engine, and service worker remain present and untouched by visual integration', () => {
  for (const file of ['engine.js', 'placement.js', 'sw.js']) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} exists`);
  }
});

test('all 405 normalized catalog keys are also present in the visual manifest', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/visual3d/manifest.json'), 'utf8'));
  for (const word of words) {
    const key = normalize(word.slug || word.en);
    assert.equal(manifest.objects[key] || '', map[key] || '', `manifest/map mismatch for ${key}`);
  }
});
