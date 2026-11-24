import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const ROOT=path.resolve('.');
for (const batch of ['library200','library300','library400']) {
  test(`${batch} manifest, PNG alpha, and runtime map are complete`,()=>{
    const dir=path.join(ROOT,'assets/visual3d',batch);
    const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
    const files=fs.readdirSync(dir).filter(f=>f.endsWith('.png'));
    assert.equal(files.length,manifest.count);
    assert.ok(files.length>=90);
    const map=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/visual3d/map.js'),'utf8').replace(/^\s*window\.ART_IMG_3D\s*=\s*/,'').replace(/;\s*$/,''));
    for(const item of manifest.assets){
      const b=fs.readFileSync(path.join(ROOT,item.path));
      assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
      assert.equal(b[25],6);
      assert.equal(map[item.key],item.path);
    }
  });
}
