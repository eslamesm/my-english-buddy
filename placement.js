/* My English Buddy — adaptive placement test (v1)
   ------------------------------------------------------------------
   Pure, dependency-free, deterministic module. No DOM, no network and
   no curriculum duplication: the host app passes its existing
   CUR_GRADES / CUR_WORDS / CUR_SUBUNITS in. Runs in the browser
   (window.Placement) and in Node (module.exports) so the logic can be
   unit-tested without evaluating index.html.

   Design contract
   ---------------
   - The four AGES keys stay untouched and now mean *difficulty*:
       tier 1 -> '3-5'   tier 2 -> '5-7'   tier 3 -> '7-10'   tier 4 -> '10-14'
   - The default tier comes from the school grade, not the age:
       kg1, kg2        -> tier 1 ('3-5')
       p1              -> tier 2 ('5-7')
       p2, p3, p4      -> tier 3 ('7-10')
       p5, p6, prep1,
       prep2           -> tier 4 ('10-14')
   - Adaptive ladder: start at defaultTier(grade); a correct answer moves one
     tier up and a wrong answer one tier down, clamped to 1..4.
   - Question source: the selected grade plus its immediate neighbours only.
     The tier chooses which of those three grades to draw from:
       offset = clamp(tier - defaultTier(grade), -1, 1)
       grade  = order[clamp(indexOf(grade) + offset, 0, order.length - 1)]
   - Determinism: every draw is driven by
       mulberry32(hash32(seed + '|' + qIndex + '|' + tier))
     so persisting {seed, qIndex, tier, answers} is enough to resume the exact
     same question after a reload or a lost connection.
   - assignedTier = rounded mean of the last 6 question tiers, then walked down
     until at least 2 correct answers exist at that tier (floor is tier 1).
   - bySkill is keyed by question kind, not subject:
       listen | letter | wordPic | picWord | wordWord
   - KG1/KG2/P1 never receive reading-dependent kinds (picWord, wordWord).
   - Every generated question is a single alphabetic word, so the existing
     audio/words/<word>.wav convention always applies. Pictures resolve through
     the app's picSrc()/emoji fallback; every curriculum item carries an emoji.
   ------------------------------------------------------------------ */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.Placement = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = 1;

  const LEVEL_BY_TIER = { 1: '3-5', 2: '5-7', 3: '7-10', 4: '10-14' };
  const TIER_BY_LEVEL = { '3-5': 1, '5-7': 2, '7-10': 3, '10-14': 4 };
  const TIERS = [1, 2, 3, 4];

  /* Grade -> default difficulty tier (approved ticket table). */
  const GRADE_TIER = {
    kg1: 1, kg2: 1,
    p1: 2,
    p2: 3, p3: 3, p4: 3,
    p5: 4, p6: 4, prep1: 4, prep2: 4
  };
  const DEFAULT_ORDER = ['kg1', 'kg2', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'prep1', 'prep2'];

  /* KG1/KG2/P1 must never depend on reading. */
  const READING_FREE_GRADES = ['kg1', 'kg2', 'p1'];
  const NO_READ_KINDS = ['listen', 'letter', 'wordPic'];
  const ALL_KINDS = ['listen', 'letter', 'wordPic', 'picWord', 'wordWord'];

  const STATUS = { NONE: 'none', RUNNING: 'running', DONE: 'done', SKIPPED: 'skipped' };

  const LEN_MIN = 8;
  const LEN_MAX = 12;
  const LEN_DEFAULT = 10;
  const TIER_WINDOW = 6;
  const MIN_CORRECT_AT_TIER = 2;
  const MIN_POOL = 6;
  const OPTION_COUNT = 3;

  /* ------------------------------ helpers ------------------------------ */

  function isNum(v) { return typeof v === 'number' && isFinite(v); }

  function clamp(n, lo, hi) {
    n = Number(n);
    if (!isFinite(n)) n = lo;
    return Math.max(lo, Math.min(hi, Math.round(n)));
  }

  function slug(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function firstLetter(word) {
    return String(word || '').charAt(0).toUpperCase();
  }

  function hash32(str) {
    let h = 2166136261 >>> 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  /* mulberry32 — small, fast, fully deterministic PRNG. */
  function rngFor(seed, index, tier) {
    let a = hash32(String(seed) + '|' + index + '|' + tier) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleWith(arr, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pickWith(arr, rnd) {
    return arr[Math.floor(rnd() * arr.length)];
  }

  function newSeed() {
    return 'p' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e9).toString(36);
  }

  /* ------------------------------ level map ------------------------------ */

  function defaultTier(gradeId) {
    return GRADE_TIER[gradeId] || 1;
  }

  function defaultLevel(gradeId) {
    return LEVEL_BY_TIER[defaultTier(gradeId)];
  }

  function levelForTier(tier) {
    return LEVEL_BY_TIER[clamp(tier, 1, 4)];
  }

  function tierForLevel(levelKey) {
    return TIER_BY_LEVEL[levelKey] || 1;
  }

  function isReadingFree(gradeId) {
    return READING_FREE_GRADES.indexOf(gradeId) >= 0;
  }

  function questionKinds(gradeId) {
    return isReadingFree(gradeId) ? NO_READ_KINDS.slice() : ALL_KINDS.slice();
  }

  function gradeOrder(curriculum) {
    return (curriculum && curriculum.order && curriculum.order.length)
      ? curriculum.order.slice()
      : DEFAULT_ORDER.slice();
  }

  function adjacentGrades(gradeId, order) {
    const o = Array.isArray(order) && order.length ? order : DEFAULT_ORDER;
    const i = o.indexOf(gradeId);
    if (i < 0) return o.slice(0, 3);
    return o.slice(Math.max(0, i - 1), Math.min(o.length, i + 2));
  }

  /* Suggested grade for a tier — used by the parent-facing "far from default"
     hint. Returns the first grade whose default tier matches. */
  function suggestedGradeFor(tier, order) {
    const o = Array.isArray(order) && order.length ? order : DEFAULT_ORDER;
    const t = clamp(tier, 1, 4);
    for (let i = 0; i < o.length; i++) {
      if (defaultTier(o[i]) === t) return o[i];
    }
    return null;
  }

  /* ------------------------------ curriculum ------------------------------ */

  /* Only single alphabetic words are usable: wordFile() maps them to
     audio/words/<lowercase>.wav and picSrc() maps them to img/art/<slug>.svg. */
  function normalizeItem(raw) {
    if (raw == null) return null;
    const word = typeof raw === 'string' ? raw : (raw.t || raw.word || '');
    const s = String(word);
    if (!/^[A-Za-z]+$/.test(s) || s.length < 2) return null;
    return {
      word: s,
      key: s.toLowerCase(),
      emoji: (raw && raw.emoji) || '',
      ar: (raw && raw.ar) || ''
    };
  }

  function createCurriculum(input) {
    input = input || {};
    const grades = Array.isArray(input.grades) ? input.grades : [];
    const words = input.words || {};
    const order = grades.map(function (g) { return g && g.id; }).filter(Boolean);
    const finalOrder = order.length ? order : DEFAULT_ORDER.slice();
    const byGrade = {};
    const seen = {};

    finalOrder.forEach(function (gid) {
      const list = Array.isArray(words[gid]) ? words[gid] : [];
      const out = [];
      list.forEach(function (raw) {
        const it = normalizeItem(raw);
        if (!it || seen[it.key]) return;
        seen[it.key] = 1;
        out.push(it);
      });
      byGrade[gid] = out;
    });

    /* Emergency pool: used only when a grade tier is too small to build
       questions (the ticket's p2..prep2 fallback). Multi-word phrases and
       sentences are dropped by normalizeItem, so in practice this adds WORDS. */
    const fallback = [];
    const fb = input.fallback || {};
    ['words', 'phrases', 'sentences'].forEach(function (k) {
      const list = Array.isArray(fb[k]) ? fb[k] : [];
      list.forEach(function (raw) {
        const it = normalizeItem(raw);
        if (it) fallback.push(it);
      });
    });

    return {
      order: finalOrder,
      byGrade: byGrade,
      subunits: input.subunits || {},
      fallback: fallback,
      log: typeof input.log === 'function' ? input.log : null
    };
  }

  function dedupe(list) {
    const seen = {};
    return list.filter(function (it) {
      if (!it || seen[it.key]) return false;
      seen[it.key] = 1;
      return true;
    });
  }

  function tierGrade(curriculum, grade, tier) {
    const order = gradeOrder(curriculum);
    let base = order.indexOf(grade);
    if (base < 0) base = 0;
    const offset = clamp(clamp(tier, 1, 4) - defaultTier(grade), -1, 1);
    const i = Math.max(0, Math.min(order.length - 1, base + offset));
    return order[i];
  }

  function poolFor(curriculum, grade, tier, used) {
    const gid = tierGrade(curriculum, grade, tier);
    let pool = (curriculum.byGrade[gid] || []).slice();

    if (pool.length < MIN_POOL) {
      adjacentGrades(grade, gradeOrder(curriculum)).forEach(function (g) {
        pool = pool.concat(curriculum.byGrade[g] || []);
      });
    }
    pool = dedupe(pool);

    if (pool.length < MIN_POOL && curriculum.fallback.length) {
      if (curriculum.log) {
        curriculum.log('fallback pool for grade ' + grade + ' tier ' + tier +
          ' (' + pool.length + ' word(s), filling from WORDS/PHRASES/SENTENCES)');
      }
      pool = dedupe(pool.concat(curriculum.fallback));
    }

    if (used && used.length) {
      const u = {};
      used.forEach(function (w) { u[String(w).toLowerCase()] = 1; });
      const fresh = pool.filter(function (it) { return !u[it.key]; });
      if (fresh.length >= OPTION_COUNT) pool = fresh;
    }

    if (pool.length < OPTION_COUNT && curriculum.fallback.length) {
      pool = dedupe(pool.concat(curriculum.fallback));
    }
    return pool;
  }

  /* ------------------------------ questions ------------------------------ */

  function optionOf(it) {
    return { key: it.key, word: it.word, emoji: it.emoji, ar: it.ar };
  }

  function buildForKind(kind, target, pool, rnd) {
    const others = pool.filter(function (x) { return x.key !== target.key; });
    if (others.length < OPTION_COUNT - 1) return null;

    if (kind === 'letter') {
      const L = firstLetter(target.word);
      const taken = {};
      taken[L] = 1;
      const chosen = [];
      shuffleWith(others, rnd).forEach(function (it) {
        if (chosen.length >= OPTION_COUNT - 1) return;
        const fl = firstLetter(it.word);
        if (taken[fl]) return;
        taken[fl] = 1;
        chosen.push(it);
      });
      if (chosen.length < OPTION_COUNT - 1) return null;
      return { kind: kind, target: target, letter: L, options: [optionOf(target)].concat(chosen.map(optionOf)) };
    }

    if (kind === 'wordWord') {
      if (!target.ar) return null;
      const taken = {};
      taken[target.ar] = 1;
      const chosen = [];
      shuffleWith(others, rnd).forEach(function (it) {
        if (chosen.length >= OPTION_COUNT - 1) return;
        if (!it.ar || taken[it.ar]) return;
        taken[it.ar] = 1;
        chosen.push(it);
      });
      if (chosen.length < OPTION_COUNT - 1) return null;
      return { kind: kind, target: target, letter: null, options: [optionOf(target)].concat(chosen.map(optionOf)) };
    }

    if (kind === 'picWord' && !target.emoji) return null;

    /* listen, wordPic and picWord all need pictures for the target. */
    if (!target.emoji) return null;
    const chosen = shuffleWith(others, rnd).slice(0, OPTION_COUNT - 1);
    if (chosen.length < OPTION_COUNT - 1) return null;
    return { kind: kind, target: target, letter: null, options: [optionOf(target)].concat(chosen.map(optionOf)) };
  }

  function buildQuestion(curriculum, state) {
    const index = state.qIndex;
    const tier = clamp(state.tier, 1, 4);
    const grade = state.grade;
    const used = (state.answers || []).map(function (a) { return a && a.word; }).filter(Boolean);
    const rnd = rngFor(state.seed, index, tier);
    const pool = poolFor(curriculum, grade, tier, used);
    if (pool.length < OPTION_COUNT) return null;

    const target = pickWith(pool, rnd);
    const allowed = questionKinds(grade);
    const wanted = allowed[(index + tier) % allowed.length];
    const order = [wanted].concat(allowed.filter(function (k) { return k !== wanted; }));

    let built = null;
    for (let i = 0; i < order.length; i++) {
      built = buildForKind(order[i], target, pool, rnd);
      if (built) break;
    }
    if (!built) return null;

    const options = shuffleWith(built.options, rnd);
    return {
      kind: built.kind,
      tier: tier,
      grade: grade,
      word: target.word,
      emoji: target.emoji,
      ar: target.ar,
      letter: built.letter,
      audio: 'audio/words/' + target.key + '.wav',
      image: 'img/art/' + slug(target.word) + '.svg',
      answerKey: target.key,
      options: options
    };
  }

  /* ------------------------------ state ------------------------------ */

  function start(opts) {
    opts = opts || {};
    const cur = opts.curriculum;
    const order = gradeOrder(cur);
    let grade = opts.grade;
    if (!grade || order.indexOf(grade) < 0) grade = order[0] || 'p1';
    const len = clamp(opts.len == null ? LEN_DEFAULT : opts.len, LEN_MIN, LEN_MAX);
    const state = {
      v: VERSION,
      status: STATUS.RUNNING,
      seed: opts.seed == null ? newSeed() : String(opts.seed),
      grade: grade,
      len: len,
      qIndex: 0,
      tier: defaultTier(grade),
      answers: []
    };
    if (Array.isArray(opts.answers)) {
      state.answers = opts.answers.filter(function (a) {
        return a && a.kind && isNum(a.tier);
      }).map(function (a) {
        return { kind: a.kind, word: a.word, tier: clamp(a.tier, 1, 4), correct: !!a.correct };
      });
    }
    if (isNum(opts.qIndex)) state.qIndex = clamp(opts.qIndex, 0, len);
    if (isNum(opts.tier)) state.tier = clamp(opts.tier, 1, 4);
    return state;
  }

  function resume(saved, opts) {
    if (!saved || saved.status !== STATUS.RUNNING || !saved.seed) return null;
    const o = opts || {};
    return start({
      curriculum: o.curriculum,
      grade: saved.grade,
      len: saved.len,
      seed: saved.seed,
      qIndex: saved.qIndex,
      tier: saved.tier,
      answers: saved.answers
    });
  }

  function nextQuestion(curriculum, state) {
    if (!state || state.status !== STATUS.RUNNING) return null;
    if (state.qIndex >= state.len) return null;
    return buildQuestion(curriculum, state);
  }

  function answer(curriculum, state, choiceKey) {
    if (!state || state.status !== STATUS.RUNNING) {
      return { state: state, question: null, correct: false, finished: true };
    }
    const q = buildQuestion(curriculum, state);
    if (!q) {
      state.status = STATUS.DONE;
      return { state: state, question: null, correct: false, finished: true };
    }
    const choice = String(choiceKey == null ? '' : choiceKey).toLowerCase();
    const correct = choice === q.answerKey;
    state.answers.push({ kind: q.kind, word: q.word, tier: q.tier, correct: correct });
    state.tier = clamp(state.tier + (correct ? 1 : -1), 1, 4);
    state.qIndex += 1;
    const finished = state.qIndex >= state.len;
    if (finished) state.status = STATUS.DONE;
    return { state: state, question: q, correct: correct, finished: finished };
  }

  /* ------------------------------ scoring ------------------------------ */

  function assignTier(answers) {
    const list = Array.isArray(answers) ? answers.filter(function (a) {
      return a && isNum(a.tier);
    }) : [];
    if (!list.length) return 1;
    const last = list.slice(-TIER_WINDOW);
    const avg = last.reduce(function (s, a) { return s + clamp(a.tier, 1, 4); }, 0) / last.length;
    let tier = clamp(Math.round(avg), 1, 4);
    const correctAt = function (t) {
      return list.filter(function (a) { return clamp(a.tier, 1, 4) === t && a.correct; }).length;
    };
    while (tier > 1 && correctAt(tier) < MIN_CORRECT_AT_TIER) tier -= 1;
    return tier;
  }

  function bySkillOf(answers) {
    const out = {};
    ALL_KINDS.forEach(function (k) { out[k] = { asked: 0, correct: 0 }; });
    (answers || []).forEach(function (a) {
      if (!a || !a.kind) return;
      const row = out[a.kind] || (out[a.kind] = { asked: 0, correct: 0 });
      row.asked += 1;
      if (a.correct) row.correct += 1;
    });
    return out;
  }

  function startUnitOf(curriculum, grade, tier) {
    const groups = curriculum.subunits || {};
    const units = groups[grade];
    if (!Array.isArray(units) || !units.length) return null;
    const list = curriculum.byGrade[grade] || [];
    if (!list.length) return units[0].n || 1;
    const band = clamp(tier, 1, 4);
    const bandSize = Math.ceil(list.length / 4);
    const target = list[Math.min(list.length - 1, (band - 1) * bandSize)] || list[0];
    for (let i = 0; i < units.length; i++) {
      const words = Array.isArray(units[i].words) ? units[i].words : [];
      for (let j = 0; j < words.length; j++) {
        const raw = Array.isArray(words[j]) ? words[j][0] : words[j];
        const it = normalizeItem(raw == null ? null : { t: raw });
        if (it && it.key === target.key) return units[i].n || 1;
      }
    }
    return units[0].n || 1;
  }

  function finish(curriculum, state, opts) {
    opts = opts || {};
    const answers = (state && Array.isArray(state.answers)) ? state.answers.slice() : [];
    const grade = state ? state.grade : null;
    const tier = assignTier(answers);
    const primary = READING_FREE_GRADES.indexOf(grade) >= 0;
    if (state) state.status = STATUS.DONE;
    return {
      version: VERSION,
      status: STATUS.DONE,
      takenAt: isNum(opts.now) ? opts.now : Date.now(),
      grade: grade,
      assignedLevel: levelForTier(tier),
      assignedTier: tier,
      startUnit: primary ? startUnitOf(curriculum, grade, tier) : null,
      bySkill: bySkillOf(answers),
      answers: answers,
      seed: state ? state.seed : null,
      len: state ? state.len : 0,
      qIndex: state ? state.qIndex : 0,
      defaultLevel: defaultLevel(grade),
      farFromDefault: Math.abs(tier - defaultTier(grade)) >= 2
    };
  }

  function running(state) {
    return {
      version: VERSION,
      status: STATUS.RUNNING,
      takenAt: null,
      grade: state ? state.grade : null,
      assignedLevel: null,
      assignedTier: null,
      startUnit: null,
      bySkill: bySkillOf(state ? state.answers : []),
      answers: (state && state.answers) ? state.answers.slice() : [],
      seed: state ? state.seed : null,
      len: state ? state.len : 0,
      qIndex: state ? state.qIndex : 0,
      tier: state ? state.tier : 1,
      defaultLevel: defaultLevel(state ? state.grade : null),
      farFromDefault: false
    };
  }

  function skipped(grade, levelKey, opts) {
    opts = opts || {};
    const key = TIER_BY_LEVEL[levelKey] ? levelKey : defaultLevel(grade);
    return {
      version: VERSION,
      status: STATUS.SKIPPED,
      takenAt: isNum(opts.now) ? opts.now : Date.now(),
      grade: grade || null,
      assignedLevel: key,
      assignedTier: tierForLevel(key),
      startUnit: null,
      bySkill: bySkillOf([]),
      answers: [],
      seed: null,
      len: 0,
      qIndex: 0,
      defaultLevel: defaultLevel(grade),
      farFromDefault: false
    };
  }

  function none() {
    return {
      version: VERSION,
      status: STATUS.NONE,
      takenAt: null,
      grade: null,
      assignedLevel: null,
      assignedTier: null,
      startUnit: null,
      bySkill: bySkillOf([]),
      answers: [],
      seed: null,
      len: 0,
      qIndex: 0,
      defaultLevel: null,
      farFromDefault: false
    };
  }

  /* ------------------------------ migration ------------------------------ */

  /* v3 upgrade: legacy profiles get a non-destructive placement snapshot.
     levelKey and schoolYear are preserved untouched; levelManual defaults to
     true so an existing (possibly parent-chosen) level is never
     silently rewritten. Returns the number of profiles migrated. */
  function migrateProfiles(list, opts) {
    opts = opts || {};
    const arr = Array.isArray(list) ? list : [];
    let count = 0;
    arr.forEach(function (p) {
      if (!p || typeof p !== 'object') return;
      let changed = false;
      if (p.placement == null) {
        p.placement = none();
        p.placement.grade = p.schoolYear || null;
        p.placement.takenAt = null;
        changed = true;
      }
      if (typeof p.levelManual !== 'boolean') {
        p.levelManual = true;
        changed = true;
      }
      if (changed) count += 1;
    });
    return count;
  }

  /* ------------------------------ exports ------------------------------ */

  return {
    VERSION: VERSION,
    TIERS: TIERS,
    STATUS: STATUS,
    KINDS: ALL_KINDS,
    LIMITS: { min: LEN_MIN, max: LEN_MAX, default: LEN_DEFAULT, options: OPTION_COUNT },

    defaultTier: defaultTier,
    defaultLevel: defaultLevel,
    levelForTier: levelForTier,
    tierForLevel: tierForLevel,
    isReadingFree: isReadingFree,
    questionKinds: questionKinds,
    adjacentGrades: adjacentGrades,
    suggestedGradeFor: suggestedGradeFor,
    gradeOrder: gradeOrder,

    createCurriculum: createCurriculum,
    start: start,
    resume: resume,
    nextQuestion: nextQuestion,
    answer: answer,
    assignTier: assignTier,
    bySkillOf: bySkillOf,
    finish: finish,
    running: running,
    skipped: skipped,
    none: none,
    migrateProfiles: migrateProfiles
  };
});
