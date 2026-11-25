import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('.');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/visual3d/manifest.json'),'utf8'));
const map=JSON.parse(fs.readFileSync(path.join(root,'assets/visual3d/map.js'),'utf8').replace(/^\s*window\.ART_IMG_3D\s*=\s*/,'').replace(/;\s*$/,''));
const keys=['dig','share','visit','played','explain','suggest','compare','explore','improve','practice'];
test('library1900 has ten standalone transparent 512px action scenes with matching runtime and manifest entries',()=>{
  for(const key of keys){
    const rel=`assets/visual3d/library1900/${key}.png`;
    assert.equal(manifest.objects[key],key==='played'?'assets/visual3d/meaning-repair/played.webp':rel,`${key} manifest mapping`);
    assert.equal(map[key],key==='played'?'assets/visual3d/meaning-repair/played.webp':rel,`${key} runtime mapping`);
    const file=path.join(root,rel);
    assert.ok(fs.existsSync(file),`${key} file missing`);
    const b=fs.readFileSync(file);
    assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(b.readUInt32BE(16),512);
    assert.equal(b.readUInt32BE(20),512);
    assert.equal(b[25],6);
  }
});
test('library1900 updates exactly ten matching vocabulary audit rows',()=>{
  const rows=fs.readFileSync(path.join(root,'docs/VISUAL3D_WORD_COVERAGE_AUDIT.csv'),'utf8').split(/\r?\n/);
  for(const key of keys){
    const row=rows.find(line=>line.startsWith(`${key},`));
    assert.ok(row,`${key} audit row missing`);
    assert.ok(row.includes('3D linked'),`${key} not marked linked`);
    assert.ok(row.includes(`assets/visual3d/library1900/${key}.png`),`${key} path mismatch`);
  }
});
