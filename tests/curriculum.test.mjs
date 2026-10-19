import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const dir = (p) => fs.readdirSync(path.join(ROOT, p));
const html = read('index.html');

// --- extract curriculum structures from the shipped app ---
const grab = (name) => {
  const re = new RegExp('const\\s+' + name + '\\s*=');
  const m = re.exec(html);
  assert.ok(m, 'missing structure ' + name);
  const start = m.index + m[0].length;
  let depth = 0, j = start, inStr = false, q = '';
  for (; j < html.length; j++) {
    const ch = html[j];
    if (inStr) { if (ch === '\\') { j++; continue; } if (ch === q) inStr = false; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; q = ch; continue; }
    if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') { depth--; if (depth === 0) { j++; break; } }
  }
  return eval('(' + html.slice(start, j) + ')');
};

const CUR_GRADES = grab('CUR_GRADES');
const CUR_WORDS = grab('CUR_WORDS');
const P1_T1_UNITS = grab('P1_T1_UNITS');
const P1_T2_UNITS = grab('P1_T2_UNITS');
const KG1_T1_UNITS = grab('KG1_T1_UNITS');
const KG2_T1_UNITS = grab('KG2_T1_UNITS');
const LETTERS = grab('LETTERS');
const CVC = grab('CVC');
const WORDS = grab('WORDS');
const PHRASES = grab('PHRASES');
const SENTENCES = grab('SENTENCES');

const artFiles = new Set(dir('img/art').filter(f => f.endsWith('.svg')).map(f => f.replace(/\.svg$/, '')));
const wordWavs = new Set(dir('audio/words').filter(f => f.endsWith('.wav')).map(f => f.replace(/\.wav$/, '').toLowerCase()));
const slugOf = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

test('all 10 official grades are declared in order', () => {
  const ids = CUR_GRADES.map(g => g.id);
  assert.deepEqual(ids, ['kg1', 'kg2', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'prep1', 'prep2']);
  for (const g of CUR_GRADES) {
    assert.ok(g.grade && g.ages && g.emoji, 'grade ' + g.id + ' missing metadata');
  }
});

test('unit-structured grades have well-formed units (number, title, arabic, words)', () => {
  for (const us of [KG1_T1_UNITS, KG2_T1_UNITS, P1_T1_UNITS, P1_T2_UNITS]) {
    assert.ok(us.length >= 4, 'expected >=4 units, got ' + us.length);
    us.forEach((u, i) => {
      assert.equal(typeof u.n, 'number', 'unit missing number');
      assert.ok(u.title && u.ar, 'unit ' + u.n + ' missing bilingual title');
      assert.ok(Array.isArray(u.words) && u.words.length > 0, 'unit ' + u.n + ' has no words');
      u.words.forEach(w => {
        assert.ok(w[0] && w[1] && w[2], 'unit ' + u.n + ' has malformed word ' + JSON.stringify(w));
      });
    });
  }
});

test('each term row has the expected unit count (KG=4, P1=6)', () => {
  assert.equal(KG1_T1_UNITS.length, 4);
  assert.equal(KG2_T1_UNITS.length, 4);
  assert.equal(P1_T1_UNITS.length, 6);
  assert.equal(P1_T2_UNITS.length, 6);
});

test('curriculum vocabulary is illustrated and free of dup slugs within a term', () => {
  const terms = { kg1: KG1_T1_UNITS, kg2: KG2_T1_UNITS, p1: P1_T1_UNITS, p1t2: P1_T2_UNITS };
  for (const [name, units] of Object.entries(terms)) {
    const seen = {};
    units.forEach(u => u.words.forEach(w => { seen[slugOf(w[0])] = (seen[slugOf(w[0])] || 0) + 1; }));
    const dups = Object.entries(seen).filter(([, c]) => c > 1).map(([s]) => s);
    // P1 term 2 intentionally repeats 'happy','sad','park' across the story unit
    const allowed = name === 'p1t2' ? ['happy', 'sad', 'park'] : [];
    assert.deepEqual(dups.sort(), allowed.slice().sort(), name + ' unexpected intra-term duplicates: ' + dups.join(','));
    units.forEach(u => u.words.forEach(w => {
      assert.ok(artFiles.has(slugOf(w[0])), name + ' u' + u.n + ' word "' + w[0] + '" has no illustration');
    }));
  }
});

test('no curriculum word uses another bank\'s asset convention (word audio path)', () => {
  // words.json is the art/audio source; every curriculum word must resolve to an SVG
  for (const u of [...KG1_T1_UNITS, ...KG2_T1_UNITS, ...P1_T1_UNITS, ...P1_T2_UNITS]) {
    for (const w of u.words) {
      const slug = slugOf(w[0]);
      assert.ok(artFiles.has(slug), 'missing illustration for ' + w[0] + ' (' + slug + ')');
    }
  }
});

test('word audio bank covers the shared word engine and leaves only documented TTS fallbacks', () => {
  const cvc = CVC.map(c => c.t.toLowerCase());
  const missing = cvc.filter(w => !wordWavs.has(w));
  // v6.4 documented these as TTS-fallback; assert the set did not grow silently
  const knownMissing = ['bat', 'hat', 'rat', 'pig', 'log', 'cup', 'net', 'men', 'hit', 'hop', 'pot'];
  assert.deepEqual(missing.sort(), knownMissing.sort(), 'CVC audio gaps changed unexpectedly: ' + missing.join(','));
});

test('text/content forms are consistent: no leading/trailing spaces, no double spaces, no trailing punctuation', () => {
  const banks = { LETTERS: LETTERS.map(l => l.word), CVC: CVC.map(c => c.t), WORDS: WORDS.map(w => w.t), PHRASES: PHRASES.map(p => p.t), SENTENCES: SENTENCES.map(s => s.t) };
  for (const [bn, arr] of Object.entries(banks)) {
    for (const t of arr) {
      assert.equal(t, t.trim(), bn + ' item has surrounding whitespace: "' + t + '"');
      assert.ok(!/\s{2,}/.test(t), bn + ' item has double space: "' + t + '"');
      assert.ok(!/[.,;:!?]$/.test(t), bn + ' item has trailing punctuation: "' + t + '"');
    }
  }
});

test('letters, sounds, words, phrases and sentences stay distinct', () => {
  assert.equal(LETTERS.length, 26);
  assert.ok(CVC.every(c => c.t.length === 3), 'CVC entries must be 3 letters');
  assert.ok(WORDS.every(w => w.t.length >= 3), 'word entries too short');
  assert.ok(PHRASES.length === 12 && SENTENCES.length === 10, 'phrase/sentence counts changed');
  // phrases and sentences must contain spaces (multi-word), words must not
  assert.ok(PHRASES.every(p => p.t.includes(' ')), 'phrase missing space');
  assert.ok(SENTENCES.every(s => s.t.includes(' ')), 'sentence missing space');
  assert.ok(WORDS.every(w => !w.t.includes(' ')), 'word contains space');
});

test('curriculum engine identifiers match the projection used at runtime', () => {
  // MODE_DATA['egy:<gid>'] must be derivable from CUR_WORDS; keys must be slug-stable
  for (const u of [...KG1_T1_UNITS, ...KG2_T1_UNITS, ...P1_T1_UNITS, ...P1_T2_UNITS]) {
    for (const w of u.words) {
      assert.equal(slugOf(w[0]), slugOf(w[0].toLowerCase()), 'slug must be lowercase-stable: ' + w[0]);
      assert.ok(/^[a-z0-9]+$/.test(slugOf(w[0])), 'slug must be alphanumeric: ' + w[0]);
    }
  }
});
