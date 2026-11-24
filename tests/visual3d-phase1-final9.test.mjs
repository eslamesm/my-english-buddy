import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const names=['seven','important','easy','difficult','email','performance','argument','advice','pollution'];
test('phase1 final nine assets exist as 512x512 RGBA PNG files',()=>{for(const n of names){const p=path.join(root,'assets/visual3d/phase1-final9',n+'.png');assert.ok(fs.existsSync(p),n+' exists');const b=fs.readFileSync(p);assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a',n+' PNG signature');assert.equal(b.readUInt32BE(16),512,n+' width');assert.equal(b.readUInt32BE(20),512,n+' height');assert.equal(b[25],6,n+' RGBA color type');}});
test('all nine remaining vocabulary keys resolve to existing image assets',()=>{const s=fs.readFileSync(path.join(root,'assets/visual3d/map.js'),'utf8');const map=JSON.parse(s.replace(/^window\.ART_IMG_3D\s*=\s*/,'').replace(/;\s*$/,''));for(const n of names){assert.ok(map[n],n+' mapped');assert.ok(fs.existsSync(path.join(root,map[n])),n+' target exists');}});
