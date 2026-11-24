import test from'node:test';import assert from'node:assert/strict';import{createRequire}from'node:module';const require=createRequire(import.meta.url),C=require('../content/context-course.js');
const keys={
'kg2-u1-can-actions':['I can run.','I can jump.','I can kick the ball.','I can catch the ball.','تجري.','تنط.'],
'kg2-u2-clothes-color':['I have a red cap.','My T-shirt is yellow.','My dress is red.','تيشيرت أصفر.','كاب أحمر.','My dress is yellow.'],
'kg2-u3-day-order':['Monday','Wednesday','Thursday','Sunday','Sunday','Friday'],
'kg2-u4-routine-story':['In the morning.','At noon.','At night.','Dinner.','Breakfast.','بروح السرير بالليل.'],
'kg2-u1-visual-one-two':['one','two','one','two','two','one'],
'kg2-u2-visual-three-five':['three','four','five','four','three','five']};
test('eight KG2lessons have independently reviewed keys and own source identity',()=>{assert.equal(C.lessons.filter(l=>l.grade==='kg2').length,8);for(const[id,answers]of Object.entries(keys)){const l=C.lessons.find(l=>l.id===id);assert.deepEqual(l.items.map(q=>q.options[q.answer]),answers);assert.match(l.sourceUrl,/KG2/);assert.ok(l.pages.every(p=>p>=11&&p<=108));}});
test('fictional day ordering avoids real date and all sequence keys follow seven-day ring',()=>{const l=C.lessons.find(l=>l.id==='kg2-u3-day-order'),days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];for(const q of l.items){assert.ok(q.prompt.includes('خيالي'));const today=days.find(d=>q.prompt.includes(d));const n=q.prompt.includes('بكرة')?1:-1;assert.equal(q.options[q.answer],days[(days.indexOf(today)+n+7)%7]);}});
test('routine story stays supported and visual count keys agree with actual scene count',()=>{const l=C.lessons.find(l=>l.id==='kg2-u4-routine-story');assert.equal(l.story.length,5);assert.ok(l.explanation.includes('مش قراءة مستقلة'));for(const l of C.lessons.filter(l=>l.grade==='kg2'&&l.visualModels)){const names=['','one','two','three','four','five','six','seven','eight','nine','ten'];for(const q of l.items)assert.equal(q.options[q.answer],names[q.scene.count]);}});

test('ability models teach catch before a catch meaning check',()=>{assert.ok(C.lessons.find(l=>l.id==='kg2-u1-can-actions').models.includes('I can catch the ball.'));});

test('fictional day prompts isolate the English day inside Arabic text',()=>{for(const q of C.lessons.find(l=>l.id==='kg2-u3-day-order').items){assert.ok(q.prompt.includes('\u2066'));assert.ok(q.prompt.includes('\u2069'));}});
