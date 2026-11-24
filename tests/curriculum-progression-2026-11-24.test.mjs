import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

/* Extract the embedded pure evaluator and load it for behavioral tests. */
function loadPath() {
  const m = html.match(/\/\* CURRICULUM PATH EVALUATOR BEGIN[\s\S]*?const CurriculumPath=\(function\(\)\{[\s\S]*?\}\)\(\);\n\/\* CURRICULUM PATH EVALUATOR END \*\//);
  assert.ok(m, 'embedded CurriculumPath block not found');
  return new Function(m[0] + '\nreturn CurriculumPath;')();
}

const GRADES = [
  { id: 'kg1' }, { id: 'kg2' }, { id: 'p1' }, { id: 'p2' }
];
const UNITS = [
  { key: 'kg1', base: 'kg1', term: '1', words: [{ t: 'cat' }, { t: 'dog' }] },
  { key: 'kg2', base: 'kg2', term: '1', words: [{ t: 'sun' }] },
  { key: 'p1', base: 'p1', term: '1', words: [{ t: 'pen' }, { t: 'book' }] },
  { key: 'p1t2', base: 'p1', term: '2', words: [{ t: 'ruler' }] },
  { key: 'p2', base: 'p2', term: null, words: [{ t: 'window' }] }
];
const stars = (obj) => ({ progress: Object.fromEntries(Object.entries(obj).map(([k, v]) => ['words::' + k, v])) });

test('evaluator: no grade -> none; unmastered -> not-mastered', () => {
  const CP = loadPath();
  assert.equal(CP.evaluate({}, GRADES, UNITS).reason, 'no-grade');
  const p = { schoolYear: 'kg1', progress: {} };
  assert.equal(CP.evaluate(p, GRADES, UNITS).reason, 'not-mastered');
});

test('evaluator: full-grade mastery advances to next grade, term resets to 1', () => {
  const CP = loadPath();
  const p = { schoolYear: 'kg1', ...stars({ cat: 3, dog: 3 }) };
  const t = CP.evaluate(p, GRADES, UNITS);
  assert.equal(t.kind, 'grade');
  assert.equal(t.toGrade, 'kg2');
  assert.equal(t.toTerm, '1');
});

test('evaluator: p1 term1 mastery advances to term2 only, then grade after both terms', () => {
  const CP = loadPath();
  const p1 = { schoolYear: 'p1', curriculumTerm: '1', ...stars({ pen: 3, book: 3 }) };
  const t1 = CP.evaluate(p1, GRADES, UNITS);
  assert.equal(t1.kind, 'term');
  assert.equal(t1.toGrade, 'p1');
  assert.equal(t1.toTerm, '2');
  const p2 = { schoolYear: 'p1', curriculumTerm: '2', ...stars({ pen: 3, book: 3, ruler: 3 }) };
  const t2 = CP.evaluate(p2, GRADES, UNITS);
  assert.equal(t2.kind, 'grade');
  assert.equal(t2.toGrade, 'p2');
});

test('evaluator: placement stars never count; only whitelisted modes count', () => {
  const CP = loadPath();
  const p = { schoolYear: 'kg1', progress: { 'placement::cat': 3, 'game::dog': 3 } };
  assert.equal(CP.evaluate(p, GRADES, UNITS).reason, 'not-mastered');
  const q = { schoolYear: 'kg1', progress: { 'egy:kg1::cat': 3, 'review::dog': 3 } };
  assert.equal(CP.evaluate(q, GRADES, UNITS).kind, 'grade');
});

test('evaluator: empty or missing next-grade content holds the transition', () => {
  const CP = loadPath();
  const grades = [{ id: 'g1' }, { id: 'g2' }];
  const units = [{ key: 'g1', base: 'g1', term: null, words: [{ t: 'a' }] }];
  const p = { schoolYear: 'g1', ...stars({ a: 3 }) };
  assert.equal(CP.evaluate(p, grades, units).reason, 'next-content-missing');
  assert.equal(CP.evaluate({ schoolYear: 'g1', ...stars({ a: 3 }) }, [{ id: 'g1' }], units).kind, 'complete');
});

test('apply/undo: snapshot restores grade, term and allowed list; undo pauses auto', () => {
  const CP = loadPath();
  const p = { schoolYear: 'kg1', allowedCurricula: ['kg1'], ...stars({ cat: 3, dog: 3 }) };
  const t = CP.evaluate(p, GRADES, UNITS);
  const ev = CP.apply(p, t, 123);
  assert.equal(p.schoolYear, 'kg2');
  assert.deepEqual(p.allowedCurricula, ['kg1', 'kg2']);
  assert.equal(p.curriculumNotice, ev);
  assert.equal(CP.undo(p), true);
  assert.equal(p.schoolYear, 'kg1');
  assert.deepEqual(p.allowedCurricula, ['kg1']);
  assert.equal(p.curriculumAutoPaused, true);
  assert.equal(p.curriculumNotice, null);
});

test('apply/undo: stale undo rejected after a later manual change', () => {
  const CP = loadPath();
  const p = { schoolYear: 'kg1', allowedCurricula: ['kg1'], ...stars({ cat: 3, dog: 3 }) };
  CP.apply(p, CP.evaluate(p, GRADES, UNITS), 1);
  p.schoolYear = 'p2'; // parent manually changed the grade after the transition
  assert.equal(CP.undo(p), false);
});

test('wiring: new-word pool uses the active grade/term mode only', () => {
  assert.match(html, /function activeCurriculumUnit\(p\)/);
  assert.match(html, /function activeCurriculumModeKey\(p\)/);
  const at = html.indexOf('function newWordsForProfile(');
  const body = html.slice(at, html.indexOf('\n}', at));
  assert.match(body, /const activeMode=activeCurriculumModeKey\(p\); if\(activeMode\) modes\.push\(activeMode\);/);
  assert.doesNotMatch(body, /allowedCurricula\(p\)\.forEach\(id=>modes\.push\('egy:'\+id\)\)/);
});

test('wiring: Rush pool uses active curriculum words; index keeps all allowed words', () => {
  assert.match(html, /pool: adaptiveWords\(uniqByWord\(\[\.\.\.wordBank\(\), \.\.\.activeCurriculumWords\(currentProfile\(\)\)\]\), 24, 'words'\)/);
  assert.match(html, /function curriculumWords\(\).*allowedCurricula\(p\)/);
});

test('wiring: evaluation runs after each session and when the parent dashboard opens', () => {
  const fl = html.indexOf('function finishLevel()');
  assert.ok(fl >= 0);
  assert.match(html.slice(fl, fl + 4000), /maybeAdvanceCurriculum\(currentProfile\(\)\)/);
  const bs = html.indexOf('function buildSchoolChips()');
  assert.match(html.slice(bs, bs + 900), /maybeAdvanceCurriculum\(p,\{silent:true\}\)/);
});

test('policy: parent (default) parks a suggestion; auto applies and notifies with undo', () => {
  assert.match(html, /p\.curriculumPending=\{version:1,kind:t\.kind/);
  assert.match(html, /CurriculumPath\.apply\(p,t,Date\.now\(\)\)/);
  assert.match(html, /id="tnUndo"/);
  assert.match(html, /id="tnApprove"/);
  assert.match(html, /id="tnResume"/);
  assert.match(html, /id="transitionNotice"/);
});

test('migration: sanitizeProfile preserves progression fields and new profiles seed them', () => {
  assert.match(html, /o\.curriculumTerm=\(o\.schoolYear==='p1'&&o\.curriculumTerm==='2'\)\?'2':'1';/);
  assert.match(html, /o\.curriculumAutoPaused=!!o\.curriculumAutoPaused;/);
  assert.match(html, /o\.curriculumNotice=\(o\.curriculumNotice&&typeof o\.curriculumNotice==='object'/);
  assert.match(html, /o\.curriculumPending=\(o\.curriculumPending&&typeof o\.curriculumPending==='object'/);
  assert.match(html, /curriculumTransition:'auto', curriculumPolicyVersion:2, curriculumTerm:'1', curriculumAutoPaused:false, curriculumNotice:null, curriculumPending:null/);
});

test('policy select labels describe the real behavior (no stale approval wording)', () => {
  assert.match(html, /<option value="parent">اقتراح انتقال بعد الإتقان والنجاح بالاختبار \(بموافقة ولي الأمر\)<\/option>/);
  assert.match(html, /<option value="auto">انتقال تلقائي بعد الإتقان والنجاح بالاختبار \(إشعار مع تراجع\)<\/option>/);
});

test('runtime: sw.js cache bumped to v47 for the grammar expansion bytes', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(sw, /englishkids-v62/);
});


test('apply rejects stale term and disabled curriculum',()=>{
  const CP=loadPath();
  const t={kind:'term',fromGrade:'p1',toGrade:'p1',fromTerm:'1',toTerm:'2'};
  assert.equal(CP.apply({schoolYear:'p1',curriculumTerm:'2',allowedCurricula:['p1']},t,1),null);
  assert.equal(CP.apply({schoolYear:'p1',curriculumTerm:'1',allowedCurricula:[]},t,1),null);
});

test('undo does not overwrite a later curriculum access change',()=>{
  const CP=loadPath();
  const p={schoolYear:'kg1',allowedCurricula:['kg1'],...stars({cat:3,dog:3})};
  CP.apply(p,CP.evaluate(p,GRADES,UNITS),1);
  p.allowedCurricula.push('p1');
  assert.equal(CP.undo(p),false);
  assert.deepEqual(p.allowedCurricula,['kg1','kg2','p1']);
});

test('UI pending approval revalidates current mastery and transition parameters',()=>{
  assert.match(html,/const live=CurriculumPath.evaluate\(p,CUR_GRADES,CUR_UNITS\)/);
  assert.match(html,/every\(k=>live\[k\]===pd\[k\]\)/);
  assert.match(html,/ev.automatic\?'تم الانتقال تلقائيًا':'تم الانتقال بموافقتك'/);
});


test('recent attempt log initializes before automatic startup or reload enters home',()=>{
  assert.ok(html.indexOf('const recentSkillAttempts = createRecentSkillAttempts();') < html.indexOf('var startupAction;'));
});

test('legacy migration is explicit and parent-gated; new profiles use real auto',()=>{
  assert.match(html,/o.curriculumPolicyVersion=o.curriculumPolicyVersion===2\?2:1/);
  assert.match(html,/id="tnEnableAuto"/);
  assert.match(html,/id="tnKeepParent"/);
  assert.match(html,/p.curriculumPolicyVersion!==2\|\|p.curriculumAutoPaused/);
  assert.match(html,/curriculumTransition:'auto', curriculumPolicyVersion:2/);
});


test('policy select is bounded on mobile despite long option labels',()=>{
  assert.match(html,/id="curriculumTransition" class="input" style="width:100%;max-width:100%;min-width:0;box-sizing:border-box"/);
});
