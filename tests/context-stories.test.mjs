import test from'node:test';import assert from'node:assert/strict';import{createRequire}from'node:module';import{readFileSync}from'node:fs';const require=createRequire(import.meta.url),C=require('../content/context-course.js');
const expected={
'kg1-u1-story-club':['Lina','Sami','one','red','يودّع لينا.','one red circle'],
'kg1-u2-story-bag':['Omar','blue','a book','two','حقيبته.','The book is in the bag.'],
'kg1-u3-story-drawing':['Mona','a face','two','one','yellow','النجمة الصفراء.'],
'kg1-u4-story-garden':['Nour','in a garden','a tree','four','green','Grandma']};
test('four original supported stories have explicit stories, unit links and independently reviewed keys',()=>{for(const[id,answers]of Object.entries(expected)){const l=C.lessons.find(l=>l.id===id);assert.equal(l.grade,'kg1');assert.equal(l.unit,+id.match(/-u(\d)/)[1]);assert.equal(l.story.length,4);assert.ok(l.story.every(t=>t.length<65));assert.deepEqual(l.items.map(q=>q.options[q.answer]),answers);assert.match(l.explanation,/مش حكاية الكتاب/);assert.match(l.explanation,/مش بنقيّم الحفظ أو النطق/);}});
test('original story context remains visible both on introduction and during questions',()=>{const ui=readFileSync(new URL('../support-course-ui.js',import.meta.url),'utf8');assert.ok(ui.includes('appendText(l.explanation);prewritingPanel(l);storyPanel(l);'));assert.ok(ui.includes("root.replaceChildren();storyPanel(l);appendText('السؤال '"));assert.ok(ui.includes("line.dir='ltr'"));});
