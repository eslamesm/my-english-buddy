import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('.');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/visual3d/manifest.json'),'utf8'));
const mapSource=fs.readFileSync(path.join(root,'assets/visual3d/map.js'),'utf8');
const map=JSON.parse(mapSource.replace(/^\s*window\.ART_IMG_3D\s*=\s*/,'').replace(/;\s*$/,''));
test('library600 has 16 standalone transparent 512px body-part and emotion illustrations',()=>{
 const entries=manifest.library600;
 assert.equal(Object.keys(entries).length,16);
 for(const [key,rel] of Object.entries(entries)){
  const file=path.join(root,rel); assert.ok(fs.existsSync(file),`${key} missing`);
  const b=fs.readFileSync(file); assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(b.readUInt32BE(16),512); assert.equal(b.readUInt32BE(20),512); assert.equal(b[25],6);
 }
});
test('library600 body and emotion vocabulary aliases resolve to matching assets',()=>{
 const expected=['face','head','eyes','eye','ears','ear','nose','mouth','teeth','tooth','tongue','hands','hand','arms','arm','legs','leg','feet','foot','happy','sad','angry','surprised','boy','brother','girl','sister','grandfather','grandmother','teacher','firefighter','policeman','board','crayon','star','eggs','home','pants','chairs'];
 /* 2026-11-24 round 2: board now has a standalone illustration (fixes1124/board.png) */
 for(const key of expected){assert.ok(map[key],`${key} map missing`);assert.ok(fs.existsSync(path.join(root,map[key])),`${key} target missing`)}
});
