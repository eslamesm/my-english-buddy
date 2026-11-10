import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const html = read('index.html');
const require_ = createRequire(import.meta.url);
const Placement = require_('../placement.js');

// --- extract curriculum structures from the shipped app (same helper as curriculum.test.mjs) ---
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
const CUR_WORDS_RAW = grab('CUR_WORDS');
const KG1_T1_UNITS = grab('KG1_T1_UNITS');
const KG2_T1_UNITS = grab('KG2_T1_UNITS');
const P1_T1_UNITS = grab('P1_T1_UNITS');
const P1_T2_UNITS = grab('P1_T2_UNITS');

const flat = (units) => units.flatMap((u) => u.words.map((w) => ({ t: w[0], emoji: w[1], ar: w[2] })));
const WORDS_DATA = Object.assign({}, CUR_WORDS_RAW, {
  kg1: flat(KG1_T1_UNITS),
  kg2: flat(KG2_T1_UNITS),
  p1: [...flat(P1_T1_UNITS), ...flat(P1_T2_UNITS)]
});
const SUBUNITS = { kg1: KG1_T1_UNITS, kg2: KG2_T1_UNITS, p1: P1_T1_UNITS, p1t2: P1_T2_UNITS };
const CUR = Placement.createCurriculum({ grades: CUR_GRADES, words: WORDS_DATA, subunits: SUBUNITS });

const GRADES = ['kg1', 'kg2', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'prep1', 'prep2'];

/** Play a whole test with a fixed answer policy; returns the question log + result. */
function play(grade, seed, policy) {
  const state = Placement.start({ curriculum: CUR, grade, seed, len: 10 });
  const questions = [];
  for (;;) {
    const q = Placement.nextQuestion(CUR, state);
    if (!q) break;
    questions.push(q);
    const correct = policy === 'all' ? true : policy === 'none' ? false : policy(q, questions.length - 1);
    const key = correct ? q.answerKey : q.options.find((o) => o.key !== q.answerKey).key;
    const res = Placement.answer(CUR, state, key);
    assert.equal(res.correct, correct, 'answer() must agree with the chosen option');
    if (res.finished) break;
  }
  const result = Placement.finish(CUR, state);
  return { questions, result, state };
}

const countBy = (list, fn) => list.reduce((m, x) => { const k = fn(x); m[k] = (m[k] || 0) + 1; return m; }, {});

/* ------------------------------ level map ------------------------------ */

test('grade -> default level follows the approved table', () => {
  const expected = {
    kg1: '3-5', kg2: '3-5',
    p1: '5-7',
    p2: '7-10', p3: '7-10', p4: '7-10',
    p5: '10-14', p6: '10-14', prep1: '10-14', prep2: '10-14'
  };
  GRADES.forEach((g) => {
    assert.equal(Placement.defaultLevel(g), expected[g], g);
    assert.equal(Placement.levelForTier(Placement.defaultTier(g)), expected[g], g);
  });
});

test('tier <-> level round trip and clamping', () => {
  ['3-5', '5-7', '7-10', '10-14'].forEach((lvl) => {
    assert.equal(Placement.levelForTier(Placement.tierForLevel(lvl)), lvl);
  });
  assert.equal(Placement.levelForTier(0), '3-5');
  assert.equal(Placement.levelForTier(9), '10-14');
  assert.equal(Placement.tierForLevel('nope'), 1);
});

test('adjacent grades are the immediate neighbours only', () => {
  assert.deepEqual(Placement.adjacentGrades('p1', GRADES), ['kg2', 'p1', 'p2']);
  assert.deepEqual(Placement.adjacentGrades('kg1', GRADES), ['kg1', 'kg2']);
  assert.deepEqual(Placement.adjacentGrades('prep2', GRADES), ['prep1', 'prep2']);
});

test('reading-free grades exclude picWord and wordWord', () => {
  ['kg1', 'kg2', 'p1'].forEach((g) => {
    assert.equal(Placement.isReadingFree(g), true);
    const kinds = Placement.questionKinds(g);
    assert.ok(!kinds.includes('picWord'), g + ' picWord');
    assert.ok(!kinds.includes('wordWord'), g + ' wordWord');
    assert.ok(kinds.includes('listen'), g + ' listen');
    assert.ok(kinds.includes('letter'), g + ' letter');
    assert.ok(kinds.includes('wordPic'), g + ' wordPic');
  });
  ['p2', 'p6', 'prep2'].forEach((g) => {
    assert.equal(Placement.isReadingFree(g), false);
    assert.deepEqual(Placement.questionKinds(g).sort(), ['letter', 'listen', 'picWord', 'wordPic', 'wordWord']);
  });
});

/* ------------------------------ determinism ------------------------------ */

test('same seed + same answers = identical questions and result', () => {
  const a = play('p3', 'seed-42', (q, i) => i % 3 !== 0);
  const b = play('p3', 'seed-42', (q, i) => i % 3 !== 0);
  assert.equal(a.questions.length, 10);
  assert.deepEqual(a.questions, b.questions);
  const strip = (r) => { const c = { ...r }; delete c.takenAt; return c; };
  assert.deepEqual(strip(a.result), strip(b.result));
});

test('a different seed produces a different question sequence', () => {
  const a = play('p4', 'seed-a', () => true);
  const b = play('p4', 'seed-b', () => true);
  assert.notDeepEqual(a.questions.map((q) => q.word), b.questions.map((q) => q.word));
});

test('question length is configurable but clamped to 8..12', () => {
  assert.equal(Placement.start({ curriculum: CUR, grade: 'p1', len: 4 }).len, 8);
  assert.equal(Placement.start({ curriculum: CUR, grade: 'p1', len: 30 }).len, 12);
  assert.equal(Placement.start({ curriculum: CUR, grade: 'p1' }).len, 10);
  const s = Placement.start({ curriculum: CUR, grade: 'p1', len: 12, seed: 'x' });
  let n = 0;
  for (;;) { const q = Placement.nextQuestion(CUR, s); if (!q) break; Placement.answer(CUR, s, q.answerKey); n++; }
  assert.equal(n, 12);
});

/* ------------------------------ adaptivity ------------------------------ */

test('all correct answers climb to tier 4 / 10-14', () => {
  GRADES.forEach((g) => {
    const { result } = play(g, 'up-' + g, 'all');
    assert.equal(result.assignedTier, 4, g);
    assert.equal(result.assignedLevel, '10-14', g);
  });
});

test('all wrong answers fall to tier 1 / 3-5', () => {
  GRADES.forEach((g) => {
    const { result } = play(g, 'down-' + g, 'none');
    assert.equal(result.assignedTier, 1, g);
    assert.equal(result.assignedLevel, '3-5', g);
  });
});

test('tiers move one step per answer inside 1..4', () => {
  const state = Placement.start({ curriculum: CUR, grade: 'p1', seed: 'steps' });
  assert.equal(state.tier, 2);
  const q1 = Placement.nextQuestion(CUR, state);
  Placement.answer(CUR, state, q1.answerKey);
  assert.equal(state.tier, 3);
  const q2 = Placement.nextQuestion(CUR, state);
  Placement.answer(CUR, state, q2.answerKey);
  assert.equal(state.tier, 4);
  const q3 = Placement.nextQuestion(CUR, state);
  Placement.answer(CUR, state, q3.answerKey);
  assert.equal(state.tier, 4, 'tier clamps at 4');
  const q4 = Placement.nextQuestion(CUR, state);
  Placement.answer(CUR, state, q4.options.find((o) => o.key !== q4.answerKey).key);
  assert.equal(state.tier, 3);
});

test('assignedTier = rounded mean of last 6 tiers, guarded by >= 2 correct at that tier', () => {
  const tierOf = (tiers, correctFlags) => Placement.assignTier(
    tiers.map((t, i) => ({ kind: 'wordPic', word: 'w' + i, tier: t, correct: !!correctFlags[i] }))
  );
  // last six average 3 -> 3, with 3 correct at tier 3
  assert.equal(tierOf([1, 1, 1, 1, 3, 3, 3, 3, 3, 3], [0, 0, 0, 0, 1, 1, 1, 0, 0, 0]), 3);
  // average rounds to 4 but zero correct at tier 4 -> walk down to 2 (only tier with 2 correct)
  assert.equal(tierOf([2, 2, 4, 4, 4, 4, 4, 4], [1, 1, 0, 0, 0, 0, 0, 0]), 2);
  // never below tier 1
  assert.equal(tierOf([1, 1, 1, 1], [0, 0, 0, 0]), 1);
  // empty answers -> tier 1
  assert.equal(Placement.assignTier([]), 1);
  // only the last six count
  assert.equal(tierOf([4, 4, 4, 4, 2, 2, 2, 2, 2, 2], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]), 2);
});

test('farFromDefault marks results two or more tiers away from the grade', () => {
  const up = play('kg1', 'far', 'all').result;
  assert.equal(up.defaultLevel, '3-5');
  assert.equal(up.assignedLevel, '10-14');
  assert.equal(up.farFromDefault, true);

  const mid = play('p3', 'mid', (q, i) => i < 5).result;
  assert.equal(mid.farFromDefault, Math.abs(mid.assignedTier - Placement.defaultTier('p3')) >= 2);
});

test('suggestedGradeFor maps a tier back to the first grade with that default', () => {
  assert.equal(Placement.suggestedGradeFor(1, GRADES), 'kg1');
  assert.equal(Placement.suggestedGradeFor(2, GRADES), 'p1');
  assert.equal(Placement.suggestedGradeFor(3, GRADES), 'p2');
  assert.equal(Placement.suggestedGradeFor(4, GRADES), 'p5');
});

/* ------------------------------ question pool ------------------------------ */

test('questions come from the selected grade plus immediate neighbours only', () => {
  GRADES.forEach((g) => {
    const allowed = new Set(Placement.adjacentGrades(g, GRADES));
    const allowedWords = new Set(
      [...allowed].flatMap((gid) => WORDS_DATA[gid].map((w) => w.t.toLowerCase()))
    );
    for (let s = 0; s < 4; s++) {
      const { questions } = play(g, 'scope-' + g + '-' + s, (q, i) => i < 6);
      questions.forEach((q) => {
        assert.ok(allowedWords.has(q.word.toLowerCase()), g + ' leaked ' + q.word);
        q.options.forEach((o) => {
          assert.ok(allowedWords.has(o.word.toLowerCase()), g + ' option leaked ' + o.word);
        });
      });
      assert.ok(questions.length > 0);
    }
  });
});

test('KG1/KG2/P1 never get a reading-dependent question', () => {
  ['kg1', 'kg2', 'p1'].forEach((g) => {
    for (let s = 0; s < 5; s++) {
      const { questions } = play(g, 'noread-' + g + '-' + s, (q, i) => i % 2 === 0);
      questions.forEach((q) => {
        assert.ok(['listen', 'letter', 'wordPic'].includes(q.kind), g + ' got ' + q.kind);
      });
    }
  });
});

test('every question has 3 unique options, exactly one of which is correct', () => {
  GRADES.forEach((g) => {
    const { questions } = play(g, 'opts-' + g, (q, i) => i % 2 === 0);
    questions.forEach((q) => {
      assert.equal(q.options.length, 3, q.word);
      assert.equal(new Set(q.options.map((o) => o.key)).size, 3, q.word);
      assert.equal(q.options.filter((o) => o.key === q.answerKey).length, 1, q.word);
      const shown = q.kind === 'wordWord' ? q.options.map((o) => o.ar) : q.options.map((o) => o.word);
      assert.equal(new Set(shown).size, 3, q.word + ' has duplicate displayed labels');
    });
  });
});

test('letter questions have one unambiguous starting letter', () => {
  ['kg1', 'p1'].forEach((g) => {
    for (let s = 0; s < 6; s++) {
      const { questions } = play(g, 'letters-' + g + '-' + s, (q, i) => i % 2 === 1);
      questions.filter((q) => q.kind === 'letter').forEach((q) => {
        assert.ok(q.letter, 'letter missing');
        const matching = q.options.filter((o) => o.word.charAt(0).toUpperCase() === q.letter);
        assert.equal(matching.length, 1, 'ambiguous letter question for ' + q.letter);
      });
    }
  });
});

test('bySkill covers all five skill types and totals the answers', () => {
  const { result } = play('p4', 'skills', (q, i) => i % 2 === 0);
  assert.deepEqual(Object.keys(result.bySkill).sort(), ['letter', 'listen', 'picWord', 'wordPic', 'wordWord']);
  let asked = 0;
  let correct = 0;
  Object.values(result.bySkill).forEach((row) => { asked += row.asked; correct += row.correct; });
  assert.equal(asked, result.answers.length);
  assert.equal(correct, result.answers.filter((a) => a.correct).length);
});

/* ------------------------------ resume ------------------------------ */

test('a running test resumes at the same question after serialisation', () => {
  const state = Placement.start({ curriculum: CUR, grade: 'p2', seed: 'resume-1' });
  for (let i = 0; i < 4; i++) {
    const q = Placement.nextQuestion(CUR, state);
    Placement.answer(CUR, state, i % 2 ? q.answerKey : q.options.find((o) => o.key !== q.answerKey).key);
  }
  const saved = JSON.parse(JSON.stringify(Placement.running(state)));
  assert.equal(saved.status, 'running');
  assert.equal(saved.qIndex, 4);

  const resumed = Placement.resume(saved);
  assert.ok(resumed);
  assert.equal(resumed.qIndex, 4);
  assert.equal(resumed.tier, state.tier);
  assert.deepEqual(resumed.answers, state.answers);
  assert.deepEqual(Placement.nextQuestion(CUR, resumed), Placement.nextQuestion(CUR, state));

  // finishing the resumed test matches finishing the original one
  const continueFrom = (s) => {
    for (;;) {
      const q = Placement.nextQuestion(CUR, s);
      if (!q) break;
      Placement.answer(CUR, s, q.answerKey);
    }
    return Placement.finish(CUR, s);
  };
  const a = continueFrom(resumed);
  const b = continueFrom(state);
  assert.deepEqual(a.answers, b.answers);
  assert.equal(a.assignedLevel, b.assignedLevel);
});

test('resume rejects missing / finished / skipped placements', () => {
  assert.equal(Placement.resume(null), null);
  assert.equal(Placement.resume({ status: 'done', seed: 'x' }), null);
  assert.equal(Placement.resume({ status: 'skipped', seed: 'x' }), null);
  assert.equal(Placement.resume({ status: 'none' }), null);
});

test('a serialised skipped placement keeps the chosen level', () => {
  const sk = Placement.skipped('p5', '10-14');
  assert.equal(sk.status, 'skipped');
  assert.equal(sk.assignedLevel, '10-14');
  assert.equal(sk.assignedTier, 4);
  assert.equal('seed' in sk, true);
});

/* ------------------------------ fallback ------------------------------ */

test('grades without a question bank fall back instead of throwing', () => {
  const logs = [];
  const empty = Placement.createCurriculum({
    grades: CUR_GRADES,
    words: {},
    fallback: { words: [{ t: 'cat', emoji: '🐱', ar: 'قطة' }, { t: 'dog', emoji: '🐶', ar: 'كلب' }, { t: 'sun', emoji: '☀️', ar: 'شمس' }, { t: 'book', emoji: '📕', ar: 'كتاب' }, { t: 'ball', emoji: '⚽', ar: 'كرة' }, { t: 'fish', emoji: '🐟', ar: 'سمكة' }, { t: 'star', emoji: '⭐', ar: 'نجمة' }, { t: 'tree', emoji: '🌳', ar: 'شجرة' }] },
    log: (m) => logs.push(m)
  });
  const state = Placement.start({ curriculum: empty, grade: 'p2', seed: 'fallback' });
  const q = Placement.nextQuestion(empty, state);
  assert.ok(q, 'fallback must still produce a question');
  assert.ok(q.options.length === 3);
  assert.ok(logs.some((m) => /fallback/.test(m)), 'fallback should be logged');
});

test('createCurriculum ignores multi-word and non-alphabetic entries', () => {
  const cur = Placement.createCurriculum({
    grades: [{ id: 'x' }],
    words: { x: [{ t: 'Good Morning', emoji: '🌅' }, { t: 'T-Shirt', emoji: '👕' }, { t: 'Cat', emoji: '🐱' }, { t: 'cat', emoji: '🐱' }, { t: 'A', emoji: '🅰️' }] }
  });
  assert.deepEqual(cur.byGrade.x.map((w) => w.word), ['Cat']);
});

/* ------------------------------ assets ------------------------------ */

const ART = new Set(fs.readdirSync(path.join(ROOT, 'img', 'art')).map((f) => f.toLowerCase()));
const AUDIO = new Set(fs.readdirSync(path.join(ROOT, 'audio', 'words')).map((f) => f.toLowerCase()));
const slug = (w) => String(w).toLowerCase().replace(/[^a-z0-9]+/g, '');

test('every generated question and option has audio and a picture (or emoji fallback)', () => {
  const seen = [];
  GRADES.forEach((g) => {
    ['asset-a', 'asset-b', 'asset-c'].forEach((seed) => {
      const { questions } = play(g, seed + '-' + g, (q, i) => (i + seed.length) % 3 !== 0);
      questions.forEach((q) => {
        seen.push(q);
        const items = [q.word, ...q.options.map((o) => o.word)].map((w) => w.toLowerCase());
        items.forEach((w) => {
          assert.ok(AUDIO.has(w + '.wav'), 'missing audio for ' + w + ' (' + g + ')');
        });
        const own = q.word.toLowerCase();
        assert.ok(ART.has(slug(own) + '.svg') || q.emoji, 'missing art + emoji for ' + own);
      });
    });
  });
  assert.ok(seen.length >= 30, 'expected a broad sample, got ' + seen.length);
});

test('audio paths in questions follow audio/words/<word>.wav', () => {
  const { questions } = play('p3', 'paths', () => true);
  questions.forEach((q) => {
    assert.equal(q.audio, 'audio/words/' + q.word.toLowerCase() + '.wav');
    assert.ok(AUDIO.has(q.word.toLowerCase() + '.wav'));
  });
});

/* ------------------------------ start units ------------------------------ */

test('startUnit is set for KG1/KG2/P1 and null for older grades', () => {
  ['kg1', 'kg2', 'p1'].forEach((g) => {
    const { result } = play(g, 'unit-' + g, (q, i) => i % 2 === 0);
    assert.ok(Number.isInteger(result.startUnit) && result.startUnit >= 1, g + ' startUnit=' + result.startUnit);
  });
  ['p2', 'p5', 'prep2'].forEach((g) => {
    assert.equal(play(g, 'unit-' + g, () => true).result.startUnit, null, g);
  });
});

/* ------------------------------ persistence shape ------------------------------ */

test('finished placement matches the profile shape the app stores', () => {
  const result = play('p3', 'shape', (q, i) => i % 3 !== 0).result;
  ['version', 'takenAt', 'grade', 'assignedLevel', 'startUnit', 'bySkill', 'answers', 'status']
    .forEach((k) => assert.ok(k in result, 'missing ' + k));
  assert.equal(result.status, 'done');
  assert.equal(result.version, 1);
  assert.ok(typeof result.takenAt === 'number');
  assert.ok(Array.isArray(result.answers));
  assert.ok(result.answers.length >= 8 && result.answers.length <= 12);
  result.answers.forEach((a) => {
    assert.ok(['listen', 'letter', 'wordPic', 'picWord', 'wordWord'].includes(a.kind));
    assert.equal(typeof a.correct, 'boolean');
    assert.ok(a.tier >= 1 && a.tier <= 4);
  });
  // survives a round trip through JSON (localStorage)
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
});

test('bySkill is a stable shape even before the first answer', () => {
  const blank = Placement.none();
  assert.equal(blank.status, 'none');
  assert.deepEqual(Object.keys(blank.bySkill).sort(), ['letter', 'listen', 'picWord', 'wordPic', 'wordWord']);
  const running = Placement.running(Placement.start({ curriculum: CUR, grade: 'p1', seed: 's' }));
  assert.equal(running.status, 'running');
  assert.deepEqual(Object.keys(running.bySkill).sort(), ['letter', 'listen', 'picWord', 'wordPic', 'wordWord']);
});

test('answer() ignores input once the test is finished', () => {
  const state = Placement.start({ curriculum: CUR, grade: 'p1', seed: 'done', len: 8 });
  for (;;) {
    const q = Placement.nextQuestion(CUR, state);
    if (!q) break;
    Placement.answer(CUR, state, q.answerKey);
  }
  assert.equal(state.status, 'done');
  const before = state.answers.length;
  const res = Placement.answer(CUR, state, 'whatever');
  assert.equal(res.finished, true);
  assert.equal(state.answers.length, before);
  assert.equal(Placement.nextQuestion(CUR, state), null);
});

test('question kinds are distributed across the allowed set', () => {
  const { questions } = play('p4', 'kinds', (q, i) => i % 2 === 0);
  const counts = countBy(questions, (q) => q.kind);
  assert.ok(Object.keys(counts).length >= 3, 'expected a mix of kinds, got ' + JSON.stringify(counts));
});
