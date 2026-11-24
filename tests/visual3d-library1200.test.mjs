import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('.');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/visual3d/manifest.json'),'utf8'));
const map=JSON.parse(fs.readFileSync(path.join(root,'assets/visual3d/map.js'),'utf8').replace(/^\s*window\.ART_IMG_3D\s*=\s*/,'').replace(/;\s*$/,''));
test('library1200 contains 100 standalone 512px transparent PNG vocabulary assets',()=>{
 const entries=manifest.library1200; assert.equal(Object.keys(entries).length,100);
 for(const [key,rel] of Object.entries(entries)){
  const f=path.join(root,rel); assert.ok(fs.existsSync(f),key+' missing'); const b=fs.readFileSync(f);
  assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a'); assert.equal(b.readUInt32BE(16),512); assert.equal(b.readUInt32BE(20),512); assert.equal(b[25],6); assert.ok(b.length>5000); assert.ok(map[key] && fs.existsSync(path.join(root,map[key])));
 }
});
test('all runtime image map paths resolve to real files',()=>{for(const [key,rel] of Object.entries(map)){assert.ok(fs.existsSync(path.join(root,rel)),`${key} -> ${rel}`)}});
