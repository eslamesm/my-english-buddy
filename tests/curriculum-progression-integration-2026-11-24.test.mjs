import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const engine=fs.readFileSync(new URL('../progression-exam.js',import.meta.url),'utf8');
const cp=html.slice(html.indexOf('const CurriculumPath=(function(){'),html.indexOf('/* CURRICULUM PATH EVALUATOR END */'));
function fn(name){let a=html.indexOf('function '+name+'('),b=html.indexOf('\n}',a);return html.slice(a,b+2);}
function harness(){const env={calls:0};const context={};vm.runInNewContext(engine,context);const PE=context.ProgressionExam; const api=new Function('env','ProgressionExam',cp+`
const CUR_GRADES=[{id:'a'},{id:'b'},{id:'c'}];
const CUR_UNITS=[{key:'a',base:'a',term:'1',words:[{t:'cat'}]},{key:'b',base:'b',term:'1',words:[{t:'dog'}]},{key:'c',base:'c',term:'1',words:[{t:'sun'}]}];
const CUR_SUBUNITS={};
function allowedCurricula(p){return p.allowedCurricula||[];}
function saveProfiles(){env.calls++;} function buildSchoolChips(){} function buildCurGrid(){} function toast(){} function gradeTermLabel(){return '';}
`+fn('progressionPassed')+fn('activeCurriculumUnit')+fn('maybeAdvanceCurriculum')+`
function pass(p){const t=CurriculumPath.evaluate(p,CUR_GRADES,CUR_UNITS),s=ProgressionExam.scope(p,t,CUR_UNITS,{});return ProgressionExam.commit(p,s,{attemptId:'test-'+p.schoolYear,profileId:p.id,fingerprint:s.fingerprint,total:s.total,correct:s.total,wrong:[]});}
return {maybeAdvanceCurriculum,activeCurriculumUnit,CurriculumPath,pass};`)(env,PE);return {env,...api};}
const profile=()=>({id:'child-a',schoolYear:'a',allowedCurricula:['a'],curriculumPolicyVersion:2,curriculumTransition:'auto',progress:{'words::cat':3}});
test('mastery alone never advances, even with an old ordinary exam90% result',()=>{const h=harness(),p=profile();p.stats={lastExam:{pct:100,correct:10,total:10}};h.maybeAdvanceCurriculum(p);assert.equal(p.schoolYear,'a');assert.equal(p.curriculumPending,undefined);});
test('dedicated passing test enables automatic path and preserves learning state',()=>{const h=harness(),p=profile();p.learning={items:{unchanged:1}};p.stats={attempts:7};h.pass(p);const before=JSON.stringify([p.progress,p.learning,p.stats]);h.maybeAdvanceCurriculum(p);assert.equal(p.schoolYear,'b');assert.equal(p.curriculumNotice.automatic,true);assert.equal(JSON.stringify([p.progress,p.learning,p.stats]),before);});
test('unread notice never requires approval of next automatic move but a NEW pass is required',()=>{const h=harness(),p=profile();h.pass(p);h.maybeAdvanceCurriculum(p);p.progress['words::dog']=3;h.maybeAdvanceCurriculum(p);assert.equal(p.schoolYear,'b');h.pass(p);h.maybeAdvanceCurriculum(p);assert.equal(p.schoolYear,'c');});
test('legacy ambiguous policy cannot silently activate auto even with pass',()=>{const h=harness(),p=profile();h.pass(p);delete p.curriculumPolicyVersion;assert.equal(h.maybeAdvanceCurriculum(p),null);assert.equal(p.schoolYear,'a');});
test('parent policy requires pass before any pending transition',()=>{const h=harness(),p=profile();p.curriculumTransition='parent';h.maybeAdvanceCurriculum(p);assert.equal(p.curriculumPending,undefined);h.pass(p);h.maybeAdvanceCurriculum(p);assert.equal(p.schoolYear,'a');assert.equal(p.curriculumPending.toGrade,'b');});
test('empty allowlist stops curriculum words and transitions despite a pass',()=>{const h=harness(),p=profile();h.pass(p);p.allowedCurricula=[];assert.equal(h.activeCurriculumUnit(p),null);assert.equal(h.maybeAdvanceCurriculum(p),null);assert.equal(p.schoolYear,'a');});
test('undo prevents reload-like re-evaluation despite retained pass',()=>{const h=harness(),p=profile();h.pass(p);h.maybeAdvanceCurriculum(p);assert.equal(h.CurriculumPath.undo(p),true);assert.equal(h.maybeAdvanceCurriculum(p),null);assert.equal(p.schoolYear,'a');});
