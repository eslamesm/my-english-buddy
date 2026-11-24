import test from 'node:test';import assert from 'node:assert/strict';import{createRequire}from'node:module';const require=createRequire(import.meta.url),X=require('../content/grammar-expansion.js'),C=require('../content/support-course.js'),E=require('../support-course.js');
const expected={
'g-can':['swim','run','cannot','jump','read','I can sing.'],
'g-be-negative':['am','is','are','not','are','He is not happy.'],
'g-be-question':['Is','Are','Am','is','am','Is she happy?'],
'g-simple-base':['play','read','like','walk','drink','play'],
'g-simple-third':['plays','reads','likes','goes','has','drinks'],
'g-do-question':['Do','Does','play','Do','have','Does he like milk?']};
test('six expansion lessons have separately reviewed expected language answers',()=>{assert.equal(X.lessons.length,6);for(const l of X.lessons)assert.deepEqual(l.items.map(q=>q.options[q.answer]),expected[l.id],l.id);});
test('new grammar is optional independent support, not automatic Ministry grade coverage',()=>{assert.equal(X.officialAlignment,false);for(const l of X.lessons){assert.equal(l.alignment,'independent-support');assert.equal(l.ministryEdition,null);assert.equal(l.kind,'grammar');assert.equal(l.items.length,6);assert.equal(l.builders.length,2);}});
test('expansion preserves prior version-one independent progress and unfinished sessions',()=>{let r=E.empty();for(const id of ['g-be','g-can','g-do-question']){const a=E.createAttempt(C,id,'child1','try-'+id);while(a.index<a.queue.length){const q=E.current(C,a,'child1');E.answer(C,a,'child1',q.id,q.answer);}r=E.commit(C,r,a,'child1',1000);assert.equal(r.lessons[id].checks[0].correct,6);}assert.equal(E.normalize(r,C).lessons['g-be'].checks.length,1);assert.equal(Object.keys(r.lessons).length,3);const a=E.createAttempt(C,'g-be','child1','saved-v1');assert.ok(E.validAttempt(C,a,'child1'));});
test('browser and offline load grammar dependency before support catalog',async()=>{const fs=await import('node:fs');const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');assert.ok(html.indexOf('src="content/grammar-expansion.js"')<html.indexOf('src="content/support-course.js"'));assert.ok(sw.includes('"./content/grammar-expansion.js"'));});
