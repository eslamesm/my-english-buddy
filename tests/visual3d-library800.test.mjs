import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('.');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/visual3d/manifest.json'),'utf8'));
const map=JSON.parse(fs.readFileSync(path.join(root,'assets/visual3d/map.js'),'utf8').replace(/^\s*window\.ART_IMG_3D\s*=\s*/,'').replace(/;\s*$/,''));
test('library800 has 16 standalone 512px transparent PNG assets',()=>{const e=manifest.library800;assert.equal(Object.keys(e).length,16);for(const [k,rel] of Object.entries(e)){const f=path.join(root,rel);assert.ok(fs.existsSync(f),k+' missing');const b=fs.readFileSync(f);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(b.readUInt32BE(16),512);assert.equal(b.readUInt32BE(20),512);assert.equal(b[25],6);assert.equal(map[k],rel)}});
