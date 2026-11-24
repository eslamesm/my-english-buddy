import test from 'node:test';import assert from 'node:assert/strict';import{createRequire}from'node:module';const require=createRequire(import.meta.url),C=require('../content/context-course.js'),E=require('../support-course.js');
const expected={
'kg1-u2-classroom':['desk','book','pencil','eraser','board','I have a book.'],
'kg1-u2-two-blue':['two books','one pencil','اثنان.','blue','square','a blue square'],
'kg1-u3-body-forms':['one arm','two hands','one foot','قدمين.','one eye','two ears'],
'kg1-u3-care-meaning':['غسل اليدين.','تنظيف الأسنان بالفرشاة.','Comb your hair.','غسل الوجه.','Wash your hands.','Brush your teeth.'],
'kg1-u4-family':['This is my mother.','This is my brother.','أختًا.','أبًا.','grandmother','grandfather'],
'kg1-u4-picnic':['شجرة.','زهرة.','grass','I have juice.','شطيرة.','I see a tree.']};
test('six added context lessons have independently reviewed expected meanings',()=>{for(const[id,answers]of Object.entries(expected)){const l=C.lessons.find(l=>l.id===id);assert.deepEqual(l.items.map(q=>q.options[q.answer]),answers,id);assert.equal(l.grade,'kg1');assert.equal(l.unit,+id.match(/-u(\d)/)[1]);assert.equal(l.items.length,6);}});
test('new context checks are meaning practice, not oral, motor or listening assessments',()=>{for(const id of Object.keys(expected)){const l=C.lessons.find(l=>l.id===id);assert.equal(l.assessment,'practice-only');assert.equal(l.coverage,'partial-original-context');assert.ok(l.items.every(q=>q.kind==='choice'));}assert.ok(C.lessons.find(l=>l.id==='kg1-u4-family').explanation.includes('خيالية'));});
test('expansion retains version-one old context results and sessions without grade-gate mutation',()=>{const l=C.lessons[0],a=E.createAttempt(C,l.id,'child','existing-v1');while(a.index<a.queue.length){const q=E.current(C,a,'child');E.answer(C,a,'child',q.id,q.answer);}const r=E.commit(C,E.empty(),a,'child',1);assert.equal(E.normalize(r,C).lessons[l.id].checks[0].correct,6);assert.equal(E.normalize(r,C).version,1);assert.ok(E.validAttempt(C,E.createAttempt(C,l.id,'child','unfinished-v1'),'child'));});
test('context source badge uses the real lesson unit, no fixed unit-one badge',async()=>{const fs=await import('node:fs');const s=fs.readFileSync(new URL('../support-course-ui.js',import.meta.url),'utf8');assert.ok(s.includes("+'، الترم الأول، الوحدة '+l.unit"));assert.ok(!s.includes('مواقف من الوحدة الأولى'));});
