import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const VP = createRequire(import.meta.url)(path.join(root, 'voice-pack.js'));
const man = JSON.parse(fs.readFileSync(path.join(root, 'audio/voice-manifest.json'), 'utf8'));
test('settings has a voice chooser, default device, offered only for packs the manifest lists', () => {
  assert.match(html, /id="voicePackChips"/);
  assert.match(html, /data-v="device"/);
  assert.match(html, /voicePack\s*[:=]\s*['"]device['"]|settings\.voicePack='device'/);
  assert.match(html, /vpAvail\(\)\.indexOf\(v\)<0\) return/);
  assert.deepEqual(VP.availablePacks(man), ['teacher_m', 'teacher_f']);
});
test('routing: pack clip when listed, null (fallback) when not, phoneme never from pack, device returns null', () => {
  const f = { voicePack: 'teacher_f' };
  assert.equal(VP.resolveClip({ kind: 'word', key: 'apple' }, f, man), 'audio/teacher_f/words/apple.mp3');
  assert.equal(VP.resolveClip({ kind: 'word', key: 'ant' }, f, man), null);
  assert.equal(VP.resolveClip({ kind: 'letter', key: 'Q', variant: 'name' }, f, man), 'audio/teacher_f/letters/Q_name.mp3');
  assert.equal(VP.resolveClip({ kind: 'letter', key: 'Q', variant: 'sound' }, f, man), null);
  assert.equal(VP.resolveClip({ kind: 'word', key: 'apple' }, { voicePack: 'device' }, man), null);
  assert.equal(VP.resolveClip({ kind: 'word', key: 'apple' }, { voicePack: 'bogus' }, man), null);
});
test('speed: one global rate applies to pack and fallback, clamped', () => {
  assert.equal(VP.effectiveRate({ rate: 1.3 }, null), 1.3);
  assert.equal(VP.effectiveRate({ rate: 9 }, null), 1.6);
  assert.ok(Math.abs(VP.effectiveRate({ rate: 0.7 }, 0.8) - 0.56) < 1e-9);
});
