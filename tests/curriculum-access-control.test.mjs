import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('curriculum access is parent allowlist based, not age based',()=>{
  assert.match(html,/function allowedCurricula\(p\)/);
  assert.match(html,/function curriculumAccess\(p, gid\)/);
  assert.match(html,/p\.allowedCurricula/);
  assert.doesNotMatch(html,/const cur=p\.schoolYear\|\|gradeFromAge\(p\.age\)/);
});
test('curriculum launch and exam entry points enforce the same access gate',()=>{
  for(const fn of ['startCur','startCurDirect','startCurUnit','startMode','startExamSel','startExam']){
    const at=html.indexOf(`function ${fn}(`); assert.ok(at>=0,`missing ${fn}`);
    const body=html.slice(at,html.indexOf('\n}',at)+2);
    assert.match(body,/curriculumAccess\(/,`${fn} must check curriculum permission`);
  }
});
test('curriculum lists and exam cards only expose parent-enabled grades',()=>{
  assert.match(html,/CUR_UNITS\.filter\(u=>allowed\.includes\(u\.base\)\)/);
  assert.match(html,/CUR_UNITS\.filter\(x=>allowed\.includes\(x\.base\)\)/);
  assert.match(html,/function curriculumWords\(\).*allowedCurricula\(p\)/);
});
test('registration requires an explicitly selected grade and does not infer one from age',()=>{
  assert.match(html,/if\(!reg\.schoolYear\)\{ toast\('اختر الصف الدراسي من المنهج المصري أولاً/);
  assert.match(html,/schoolYear:null/);
});
