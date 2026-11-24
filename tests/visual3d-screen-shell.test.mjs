import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('.');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('all 13 application screens remain present after visual-layer changes',()=>{
 const ids=['welcome','register','login','home','test','practice','game','reward','report','rewards','achv','story','storyread'];
 for(const id of ids) assert.match(html,new RegExp(`id=["']screen-${id}["']`),`screen-${id} missing`);
});
test('shared approved visual layer styles all screens without replacing screen IDs',()=>{
 assert.match(html,/\.screen\s*\{/);
 assert.match(html,/\.card[\s\S]{0,500}\.settings/);
 assert.match(html,/@media\s*\(max-width:\s*700px\)/);
 assert.match(html,/prefers-reduced-motion/);
});
test('core visual flows retain their original interactive DOM hooks',()=>{
 for(const id of ['practiceCard','teacherBar','progressDots','gPrompt','gOptions','testPrompt','testOpts','testFeedback','storyTitle','storySents','storyQuizWrap','storyListHome','achvGridHome','rewardsGridHome']) {
  assert.ok(html.includes(`id="${id}"`),`${id} missing`);
 }
});
