import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapSource = fs.readFileSync(path.join(root, 'assets/visual3d/map.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const approved = {
  bat:'assets/visual3d/repair2026/bat.png',
  legs:'assets/visual3d/library600/legs.png',
  mat:'assets/visual3d/repair2026/mat.png',
  teeth:'assets/visual3d/library600/teeth.png',
  walk:'assets/visual3d/library700/walk.png',
  skip:'assets/visual3d/library700/skip.png',
  jump:'assets/visual3d/library1400/jump.png',
  hands:'assets/visual3d/library600/hands.png',
  feet:'assets/visual3d/library600/feet.png',
  throw:'assets/visual3d/library700/throw.png',
  slide:'assets/visual3d/library1300/slide.png',
  water:'assets/visual3d/water.png',
  hot:'assets/visual3d/repair2026/hot.png', // 2026-11-24: verified standalone thermometer replaces button-tainted library2300/hot.png
  arm:'assets/visual3d/library1500/arm.png',
  hair:'assets/visual3d/library700/hair.png',
  grandmother:'assets/visual3d/library1600/grandmother.png',
  swing:'assets/visual3d/library237/swing.png',
  run:'assets/visual3d/library1400/run.png',
  table:'assets/visual3d/library100/table.png',
  playground:'assets/visual3d/library700/playground.png',
  arms:'assets/visual3d/library600/arms.png',
  grandfather:'assets/visual3d/library1600/grandfather.png',
  bag:'assets/visual3d/library237/bag.png',
  mouth:'assets/visual3d/library600/mouth.png',
  crayon:'assets/visual3d/library237/crayon.png',
  nose:'assets/visual3d/library600/nose.png',
  eyes:'assets/visual3d/library600/eyes.png',
  catch:'assets/visual3d/library1100/catch.png'
};

test('repair2026 contact-sheet crops are not used at runtime', () => {
  for (const bad of ['legs','board','teeth','kick','walk','skip','jump','hands','feet','throw','slide','big','water','arm','hair','grandmother','swing','play','run','table','playground','arms','grandfather','bag','mouth','crayon','nose','eyes','catch']) assert.ok(!mapSource.includes(`\"${bad}\": \"assets/visual3d/repair2026/${bad}.png\"`), `${bad} must not use contact-sheet crop`);
  for (const [key, rel] of Object.entries(approved)) {
    assert.ok(fs.existsSync(path.join(root, rel)), `${key} approved image exists`);
    assert.ok(mapSource.includes(`"${key}": "${rel}"`), `${key} maps to standalone image`);
  }
  const parsed = JSON.parse(mapSource.slice(mapSource.indexOf('=') + 1).replace(/;\s*$/, '').trim());
  // 2026-11-24 round 2: board/kick/big/play now map to standalone generated illustrations in fixes1124/
  for (const key of ['board','kick','big','play']) {
    assert.ok(parsed[key] && parsed[key].startsWith('assets/visual3d/fixes1124/'), `${key} maps to standalone fixes1124 illustration`);
  }
});

test('daily session hides word previews until the lesson starts while in-session images remain enabled', () => {
  const homeStart = html.indexOf('function buildSessionHome(){');
  const launchStart = html.indexOf('function launchSession(', homeStart);
  const homeFn = html.slice(homeStart, launchStart);
  assert.ok(homeStart >= 0 && launchStart > homeStart, 'session home function boundaries exist');
  assert.ok(!homeFn.includes('sessionGrid'), 'pre-session word preview grid is removed');
  assert.ok(!homeFn.includes('picHTML('), 'pre-session words and images are not rendered');
  assert.ok(homeFn.includes('id=\"sessionStart\"'), 'start-session action remains available');
  assert.ok(html.includes("picHTML(item.word||item.t, item.emoji, 'big-img','big-emoji', true)"), 'word image remains rendered inside the active lesson');
});
