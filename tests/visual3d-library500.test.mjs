import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const ROOT=path.resolve('.');
test('library500 has 25 independent 512px RGBA PNG illustrations and manifest entries',()=>{
  const dir=path.join(ROOT,'assets/visual3d/library500');
  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/visual3d/manifest.json'),'utf8'));
  const files=fs.readdirSync(dir).filter(f=>f.endsWith('.png'));
  assert.equal(files.length,25);
  assert.equal(Object.keys(manifest.library500).length,25);
  for(const [name,asset] of Object.entries(manifest.library500)){
    assert.ok(fs.existsSync(path.join(ROOT,asset)),`${name} missing`);
    const b=fs.readFileSync(path.join(ROOT,asset));
    assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(b[25],6,`${name} must have alpha channel`);
  }
});
test('library500 vocabulary aliases resolve to the new standalone assets',()=>{
  const source=fs.readFileSync(path.join(ROOT,'assets/visual3d/map.js'),'utf8');
  const map=JSON.parse(source.replace(/^\s*window\.ART_IMG_3D\s*=\s*/,'').replace(/;\s*$/,''));
  for(const key of ['alarmclock','pencilcase','scissors','glue','crayons','calculator','desklamp','sofa','wardrobe','mirror','padlock','mug','plate','spoon','fork','waterbottle']){
    assert.ok(map[key],`${key} missing from runtime map`);
    assert.ok(fs.existsSync(path.join(ROOT,map[key])),`${key} target missing`);
  }
});
