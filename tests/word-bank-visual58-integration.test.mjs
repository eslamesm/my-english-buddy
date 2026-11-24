import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/visual3d/vocabulary-repair-2026-11-20/manifest.json'),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const mapSource=fs.readFileSync(path.join(root,'assets/visual3d/map.js'),'utf8');
const map=JSON.parse(mapSource.match(/window\.ART_IMG_3D\s*=\s*(\{[\s\S]*?\})\s*;/)[1]);
const p1=html.slice(html.indexOf('  p1:['),html.indexOf('  p2:['));
const p1Keys=new Set([...p1.matchAll(/\{t:'([^']+)'/g)].map(m=>m[1].toLowerCase().replace(/[^a-z0-9]+/g,'')));
test('all 58 reviewed words remain in the P1 curriculum and resolve to their reviewed PNG',()=>{
  assert.equal(manifest.words.length,58);
  for(const item of manifest.words){
    assert.ok(p1Keys.has(item.runtime_key),`missing curriculum word: ${item.word}`);
    assert.equal(map[item.runtime_key],item.path,`wrong image mapping: ${item.word}`);
    assert.ok(fs.existsSync(path.join(root,item.path)),`missing PNG: ${item.path}`);
  }
});
test('Word Bank cards render the mapped 3D image with emoji fallback',()=>{
  assert.match(html,/const visual=picSrc\(w\.t\)/);
  assert.match(html,/bank-visual/);
  assert.match(html,/visualHtml/);
});
