import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('.');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/visual3d/manifest.json'),'utf8'));
const mapSource=fs.readFileSync(path.join(root,'assets/visual3d/map.js'),'utf8');
const map=JSON.parse(mapSource.replace(/^\s*window\.ART_IMG_3D\s*=\s*/,'').replace(/;\s*$/,''));
test('library237 contains 16 standalone transparent 512px vocabulary illustrations',()=>{
 const entries=manifest.library237; assert.equal(Object.keys(entries).length,16);
 for(const [key,rel] of Object.entries(entries)){const f=path.join(root,rel);assert.ok(fs.existsSync(f),`${key} missing`);const b=fs.readFileSync(f);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(b.readUInt32BE(16),512);assert.equal(b.readUInt32BE(20),512);assert.equal(b[25],6)}
});
test('new vocabulary assets are mapped to existing files',()=>{for(const key of ['bat','mat','rat','log','cup','nut','net','pot','desk','swing','slide']){assert.ok(map[key],`${key} map missing`);assert.ok(fs.existsSync(path.join(root,map[key])),`${key} target missing`)}});
test('story and game scene SVG assets exist and are referenced by the app',()=>{
 for(const rel of Object.values(manifest.scenes)){assert.ok(fs.existsSync(path.join(root,rel)),`${rel} missing`)}
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const id of ['cat-story','school-story','ball-story','game-meadow']) assert.ok(html.includes(`assets/visual3d/scenes/${id}.svg`),`${id} not wired`);
});
