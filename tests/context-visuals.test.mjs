import test from'node:test';import assert from'node:assert/strict';import{createRequire}from'node:module';import{readFileSync}from'node:fs';const require=createRequire(import.meta.url),C=require('../content/context-course.js');
const expected={
'kg1-u1-visual-one-circle':['one','red','circle','one','red','circle'],
'kg1-u2-visual-two-squares':['two','blue','square','two','blue','square'],
'kg1-u3-visual-three-stars':['three','yellow','star','three','yellow','star'],
'kg1-u4-visual-four-five-shapes':['four','green','heart','five','orange','triangle']};
test('four visual lessons use real scene data and independently reviewed keys',()=>{for(const[id,answers]of Object.entries(expected)){const l=C.lessons.find(l=>l.id===id);assert.equal(l.grade,'kg1');assert.equal(l.items.length,6);assert.deepEqual(l.items.map(q=>q.options[q.answer]),answers);assert.ok(l.visualModels.length);for(const q of l.items){assert.ok(q.scene.count>=1&&q.scene.count<=5);assert.ok(['circle','square','star','heart','triangle'].includes(q.scene.shape));assert.ok(['red','blue','yellow','green','orange'].includes(q.scene.color));assert.match(q.prompt,/الرسم/);}assert.match(l.explanation,/مساعدة/);assert.match(l.explanation,/مش قياس نظر/);}});
test('visual scenes are self-contained SVG with optional accessible descriptions, no remote art',()=>{const s=readFileSync(new URL('../support-course-ui.js',import.meta.url),'utf8');assert.ok(s.includes("if(q.scene)scenePanel(q.scene)"));assert.ok(s.includes("createElementNS(ns,'svg')"));assert.ok(s.includes("node('details')"));assert.ok(s.includes('وصف نصي بديل'));});

test('visual question heading is neutral and never repeats the teaching lesson title',()=>{const s=readFileSync(new URL('../support-course-ui.js',import.meta.url),'utf8');assert.ok(s.includes("setHeader((q.scene||q.positionScene)?'نشوف الرسم ونجرب':l.title);root.replaceChildren();storyPanel(l);"));});
