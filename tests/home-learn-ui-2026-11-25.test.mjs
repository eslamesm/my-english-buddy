import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const j=fs.readFileSync(new URL('../journey.js',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../journey.css',import.meta.url),'utf8'),idx=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),i18n=fs.readFileSync(new URL('../i18n.js',import.meta.url),'utf8'),sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
test('map check only when isDone, earlier-not-mastered is ring',()=>{assert.match(j,/d=isDone\(st\),ear=st\.state==='done'&&!d/);});
test('map pill is motivation not eligibility',()=>{assert.ok(!/T\('phrase\.next'\)\)\+'<\/div>'/.test(j));assert.match(i18n,/phrase\.today/);});
test('legend ar+en present and used on home and map',()=>{assert.match(i18n,/'legend':\{ar:/);assert.ok((j.match(/mj-leg/g)||[]).length>=2);});
test('nav re-renders on language change',()=>{assert.match(j,/function rerender\(\)[^\n]*renderNav/);});
test('home icons exist and are cached',()=>{for(const f of ['number-blocks','ball','storybook','trophy']){assert.ok(fs.existsSync(new URL('../assets/ui/'+f+'.png',import.meta.url)));assert.ok(sw.includes('assets/ui/'+f+'.png'));}});
test('learn cards carry mode data and colors, handlers untouched',()=>{assert.match(idx,/el\.dataset\.mode=m/);assert.match(css,/data-mode=words/);assert.match(idx,/el\.onclick=\(\)=>startMode\(m\)/);});
test('legacy home reachable (toggle) and not removed',()=>{assert.match(j,/mj-legacy/);assert.match(idx,/id="modeGrid"/);});
