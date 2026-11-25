import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
function load(files){const ctx={console};ctx.globalThis=ctx;vm.createContext(ctx);for(const f of files)vm.runInContext(read(f),ctx,{filename:f});return ctx;}
const ctx=load(['progression-exam.js','stage-results.js','i18n.js','journey.js']);
const {StageResults:R,I18N,ProgressionExam:PE,MEBJourney:J}=ctx;
const fp=(kind,grade,t,extra)=>JSON.stringify(Object.assign({kind,grade,fromTerm:t},extra||{}));

test('stage results group attempts by stage and keep read-only',()=>{
  const prof={progressionExam:{attempts:[
    {fingerprint:fp('term','p1','1'),correct:15,total:20,passed:false,at:1},
    {fingerprint:fp('term','p1','1'),correct:19,total:20,passed:true,at:2},
    {fingerprint:fp('grade','p1','2'),correct:12,total:20,passed:false,at:3}]},stats:{lastExam:{key:'u1',pct:80,correct:8,total:10}}};
  const before=JSON.stringify(prof);
  let r=R.stageResults(prof,'p1','1');assert.equal(r.count,2);assert.equal(r.tries[0].correct,19);assert.equal(r.tries[1].n,1);
  assert.equal(R.stageResults(prof,'p1','2').status,'not-passed');
  assert.equal(R.stageResults(prof,'p2','1').status,'none');
  assert.equal(R.stageResults(null,'p1','1').status,'none');
  assert.equal(R.stageResults({progressionExam:{attempts:[{fingerprint:'bad'}]}},'p1','1').status,'none');
  assert.deepEqual(JSON.parse(JSON.stringify(R.practiceRow(prof,'u1'))),{pct:80,correct:8,total:10,stars:2});
  assert.equal(R.practiceRow(prof,'u2'),null);
  assert.equal(JSON.stringify(prof),before);
});
test('old word-set pass never counts as current',()=>{
  const OLD=fp('term','p1','1'),NEW=fp('term','p1','1',{v:2});
  const p={progressionExam:{attempts:[{fingerprint:OLD,correct:19,total:20,passed:true,at:1}]}};
  assert.equal(R.stageResults(p,'p1','1',OLD).status,'passed');
  assert.equal(R.stageResults(p,'p1','1',NEW).status,'passed-earlier');
  assert.equal(R.stageResults(p,'p1','1').status,'passed-unverified');
  const p3={progressionExam:{attempts:[{fingerprint:OLD,correct:19,total:20,passed:true,at:1},{fingerprint:NEW,correct:10,total:20,passed:false,at:2}]}};
  assert.equal(R.stageResults(p3,'p1','1',NEW).status,'passed-earlier');
});
test('every UI string has Arabic and English; direction logic stays scoped',()=>{
  for(const [k,v] of Object.entries(I18N.S)){assert.ok(v.ar&&v.en,k);}
  assert.equal(I18N.t('nav.home','en'),'Home');assert.equal(I18N.norm('fr'),'ar');
  assert.equal(I18N.digits(20,'ar'),'٢٠');assert.equal(I18N.gradeName('p2','الصف الثاني الابتدائي','ar'),'الصف الثاني');assert.equal(I18N.gradeName('p2','x','en'),'Grade 2');
});
test('stage model: states, candidate and canStart come from the real progression scope',()=>{
  const grades=[{id:'p1'},{id:'p2'}];
  const W=(n,t)=>Array.from({length:n},(_,i)=>({t:'w'+t+i,emoji:'x',ar:'ا',term:t}));
  const units=[{key:'p1',base:'p1',term:'1',grade:'g1',words:W(3,'1')},{key:'p1t2',base:'p1',term:'2',grade:'g1',words:W(3,'2')},{key:'p2',base:'p2',term:null,grade:'g2',words:W(3,'3')}];
  assert.equal(J.candidateFor(units[0],units,grades).kind,'term');
  const c2=J.candidateFor(units[1],units,grades);assert.equal(c2.kind,'grade');assert.equal(c2.toGrade,'p2');assert.equal(J.candidateFor(units[2],units,grades).kind,'complete');
  const prof={id:'x',progress:{},progressionExam:{version:PE.VERSION,attempts:[],pass:null,last:null}};
  const mastery=(p,words)=>({total:words.length,mastered:0,complete:false});
  const d={units,grades,subunits:{},activeUnit:()=>units[1],scopeNow:p=>PE.scope(p,c2,units,{}),CurriculumPath:{mastery},ProgressionExam:PE,StageResults:R};
  const st=J.buildStages(prof,d);
  assert.deepEqual(st.map(s=>s.state),['done','current','locked']);
  assert.ok(st[1].fingerprint&&st[1].canStart);
  assert.equal(st[0].results.status,'none');
  assert.equal(st[2].canStart,false);
  const slots=J.windowSlots(st);assert.equal(slots[2].state,'current');assert.equal(slots[0],null);assert.equal(slots[1].state,'locked');assert.equal(slots[3].state,'done');
  assert.equal(JSON.stringify(prof.progressionExam.attempts),'[]');
});
test('wiring: scripts, device-level language setting, offline cache and untouched rules',()=>{
  const html=read('index.html'),sw=read('sw.js');
  for(const f of ['stage-results.js','i18n.js','journey.js','journey.css']){assert.ok(html.includes(f),f);assert.ok(sw.includes('./'+f),f);assert.ok(fs.existsSync(new URL('../'+f,import.meta.url)),f);}
  for(const f of ['assets/ui/buddy-cut.png','assets/ui/trophy.png','assets/ui/number-blocks.png','assets/ui/ball.png','assets/ui/storybook.png']){assert.ok(sw.includes('./'+f)&&fs.existsSync(new URL('../'+f,import.meta.url)),f);}
  assert.match(html,/SETTINGS_DEFAULTS=\{[^}]*uiLang:'ar'/);
  assert.ok(html.includes("if(settings.uiLang!=='en') settings.uiLang='ar';"));
  assert.ok(html.includes('MEBJourney.syncNav(id)'));
  const pe=read('progression-exam.js');assert.match(pe,/COUNT=20, PASS=90/);
  for(const f of ['journey.js','stage-results.js']){assert.ok(!/progressionExam\.(pass|attempts)\s*=|\.attempts\.push|\.pass\s*=/.test(read(f)),f+' must not write exam data');}
  assert.ok(!/\.progress\[[^\]]*\]\s*=/.test(read('journey.js')),'journey must not write progress');
});
