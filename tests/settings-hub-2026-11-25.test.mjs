import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ids = ['speedChips','speedRange','voicePackRow','voicePackChips','btnVoicePackTest','recChips','btnMicTest','sfxChips','voiceSel','diffChips','themeChips','goalChips','btnPreload','teacherChips','teacherAudioChips','teacherVoiceSel','teacherRateRange','teacherPitchRange','teacherVolumeRange','btnRetest','schoolYearChips','curriculumTransition'];
const body = html.slice(html.indexOf('id="parentBody"'), html.indexOf('id="parentBody"') + 60000);
test('settings hub keeps every control id once, inside parentBody', () => {
  for (const id of ids) {
    const n = html.split(`id="${id}"`).length - 1;
    assert.equal(n, 1, `${id} appears ${n} times`);
    assert.ok(body.includes(`id="${id}"`), `${id} not inside parentBody`);
  }
});
test('hub has six topic rows and a separate report screen', () => {
  for (const k of ['voice','teacher','learning','curriculum','mic','look','report']) assert.ok(html.includes(`id="sp-${k}"`), k);
  assert.equal((html.match(/class="sh-row"/g) || []).length, 6);
  assert.ok(html.includes('data-go="report"'));
  assert.ok(html.includes('id="reportBody"'));
});
test('voice labels and teacher-display label', () => {
  for (const t of ['صوت الجهاز','>معلم<','>معلمة<','إظهار المعلّمة في الدروس','من يقرأ الكلمات']) assert.ok(html.includes(t), t);
});
test('hubShow refreshes saved state', () => {
  assert.match(html, /function hubShow\(id\)[^]*?applySettingsUI\(\)/);
});
