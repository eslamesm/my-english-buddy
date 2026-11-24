import test from'node:test';import assert from'node:assert/strict';import{createRequire}from'node:module';const require=createRequire(import.meta.url),C=require('../content/context-course.js');
const expected={
'kg1-u1-one-red-circle':['one','red','circle','a red circle','I can see one circle.','واحد.'],
'kg1-u3-three-yellow-stars':['three','yellow','a yellow star','ثلاث نجوم.','three stars','نجمة صفراء.'],
'kg1-u4-four-five-shapes':['four','five','green hearts','orange triangles','triangle','خمسة مثلثات برتقالية.']};
test('three KG1 quantity/color/shape lessons have reviewed keys and honest task labels',()=>{for(const[id,answers]of Object.entries(expected)){const l=C.lessons.find(l=>l.id===id);assert.equal(l.grade,'kg1');assert.equal(l.unit,+id.match(/-u(\d)/)[1]);assert.deepEqual(l.items.map(q=>q.options[q.answer]),answers,id);assert.equal(l.assessment,'practice-only');assert.match(l.explanation,/المعنى|المكتوب/);}});
