import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const batches={
 library2200:['farmer','baker','nurse','engineer','pilot','tourist','museum','pyramid','station','church','living-room','kitchen','dining-room','bathroom','street','class'],
 library2300:['run','jump','read','listen','speak','drink','eat','sleep','happy','sad','angry','scared','tired','hot','cold','big-small']
};
test('batches 2200 and 2300 contain 32 independent 512px RGBA PNG assets',()=>{
 for(const [folder,names] of Object.entries(batches)) for(const name of names){
  const file=path.join(root,'assets/visual3d',folder,`${name}.png`);
  assert.ok(fs.existsSync(file),`${folder}/${name} exists`);
  const bytes=fs.readFileSync(file);
  assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a',`${name} PNG signature`);
  assert.equal(bytes.readUInt32BE(16),512,`${name} width`);
  assert.equal(bytes.readUInt32BE(20),512,`${name} height`);
  assert.equal(bytes[25],6,`${name} RGBA color type`);
  assert.ok(bytes.length>1000,`${name} non-empty`);
 }
});
test('new 2200/2300 semantic keys resolve to real image files',()=>{
 const src=fs.readFileSync(path.join(root,'assets/visual3d/map.js'),'utf8');
 const map=JSON.parse(src.replace(/^window\.ART_IMG_3D\s*=\s*/,'').replace(/;\s*$/,''));
 const keys=['farmer','baker','nurse','engineer','pilot','tourist','museum','pyramid','station','church','living room','kitchen','dining room','bathroom','street','class','run','jump','read','listen','speak','drink','eat','sleep','happy','sad','angry','scared','tired','hot','cold','big','small'];
 /* 2026-11-24 round 2: big now has a standalone illustration (fixes1124/big.png) */
 for(const key of keys){assert.ok(map[key],`${key} mapped`);assert.ok(fs.existsSync(path.join(root,map[key])),`${key} target exists`);}
});
test('manifest declares all 32 assets from batches 2200 and 2300',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(root,'assets/visual3d/manifest.json'),'utf8'));
 for(const [folder,names] of Object.entries(batches)) for(const name of names){
  const key=`${folder}/${name}`; assert.ok(m.objects[key],`${key} in manifest`);
  assert.ok(fs.existsSync(path.join(root,m.objects[key])),`${key} file exists`);
 }
});
