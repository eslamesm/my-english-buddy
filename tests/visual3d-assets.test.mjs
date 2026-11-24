import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const manifestPath = path.join(root, 'assets/visual3d/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

test('3D visual pilot manifest is present and declares the approved style', () => {
  assert.equal(manifest.style, 'glossy-3d-cartoon');
  assert.ok(manifest.characters && Object.keys(manifest.characters).length >= 6);
});

test('every declared character and object asset exists', () => {
  for (const [key, rel] of Object.entries({ ...manifest.characters, ...manifest.objects })) {
    assert.ok(fs.existsSync(path.join(root, rel)), `${key}: missing ${rel}`);
  }
});

test('3D UI icon pilot contains 12 independent icon files', () => {
  assert.equal(Object.keys(manifest.ui_icons || {}).length, 12);
  for (const [key, rel] of Object.entries(manifest.ui_icons)) {
    assert.ok(fs.existsSync(path.join(root, rel)), `${key}: missing ${rel}`);
  }
});

test('all pilot PNG assets are non-empty files', () => {
  const paths = [
    ...Object.values(manifest.characters),
    ...Object.values(manifest.objects),
    ...Object.values(manifest.ui_icons || {})
  ];
  for (const rel of paths) {
    const stat = fs.statSync(path.join(root, rel));
    assert.ok(stat.size > 5000, `${rel}: unexpectedly small (${stat.size} bytes)`);
  }
});

test('expanded vocabulary pilot includes the expanded independent 3D object batches', () => {
  for (const key of ['ball','fish','goat','hat','ice','juice','kite','lion','monkey','nest','orange','pig','queen','rabbit','tiger','truck','water','fox','yoyo','zebra','egg','tree']) {
    assert.ok(manifest.objects[key], `missing manifest object: ${key}`);
    assert.ok(fs.existsSync(path.join(root, manifest.objects[key])), `missing file for ${key}`);
  }
});

test('second vocabulary batch is wired to the correct independent 3D files in the runtime map', () => {
  const mapText = fs.readFileSync(path.join(root, 'assets/visual3d/map.js'), 'utf8');
  const map = JSON.parse(mapText.slice(mapText.indexOf('=') + 1).replace(/;\s*$/, '').trim());
  for (const key of ['queen','rabbit','tiger','truck','water','fox','yoyo','zebra','egg','tree']) {
    assert.ok(map[key], `${key} is not mapped to a 3D asset`);
    assert.ok(fs.existsSync(path.join(root, map[key])), `${key} target does not exist: ${map[key]}`);
  }
});

test('second vocabulary batch emoji enhancer routes supported symbols to matching assets', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const [emoji, file] of [['👑','queen.png'],['🐰','rabbit.png'],['🐯','tiger.png'],['🚚','truck.png'],['💧','water.png'],['🦊','fox.png'],['🪀','yoyo.png'],['🦓','zebra.png'],['🥚','egg.png'],['🌳','tree.png']]) {
    assert.ok(html.includes(`"${emoji}":"${file}"`), `${emoji} does not map to ${file}`);
  }
});
