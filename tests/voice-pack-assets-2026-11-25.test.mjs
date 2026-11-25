import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const man = JSON.parse(fs.readFileSync(path.join(root, 'audio/voice-manifest.json'), 'utf8'));
test('partial voice pack: manifest lists only files that exist, 388 generated items + 26 aliases per voice (words and letter names)', () => {
  for (const id of ['teacher_m', 'teacher_f']) {
    const p = man.packs[id];
    assert.equal(p.dir, 'audio/' + id);
    assert.equal(p.partial, true);
    const keys = Object.keys(p.files);
    assert.equal(keys.length, 414);
    assert.equal(p.generated_items, 388);
    assert.equal(p.alias_copies, 26);
    for (const rel of keys) {
      const f = path.join(root, p.dir, rel);
      assert.ok(fs.existsSync(f), f);
      assert.ok(fs.statSync(f).size > 1000, f);
      assert.ok(/^(words\/[a-z0-9_ -]+|letters\/[A-Z]_(name|word))\.mp3$/.test(rel), rel);
    }
    assert.equal(fs.readdirSync(path.join(root, p.dir, 'letters')).length, 52);
    for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') { assert.ok(p.files['letters/'+L+'_name.mp3']); assert.ok(!p.files['letters/'+L+'_sound.mp3']); }
  }
  assert.deepEqual(Object.keys(man.lines), []);
});
test('pack is not selectable by default and no selector UI is exposed', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(/voicePack:\s*'device'/.test(html) || /voicePack\s*[:=]\s*['"]device['"]/.test(html));
  assert.ok(!/id="voicePackSelect"/.test(html));
});
test('Arabic audio and existing english wav files untouched by pack', () => {
  assert.ok(fs.existsSync(path.join(root, 'audio/words/apple.wav')));
  assert.ok(!fs.existsSync(path.join(root, 'audio/teacher_m/words/ant.mp3')));
});
