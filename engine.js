/* My English Buddy — Adaptive Learning Engine (v6.0)
   ------------------------------------------------------------------
   Pure, dependency-free, offline-first module. No DOM, no network,
   no language framework. Runs in the browser (window.LearningEngine)
   and in Node (module.exports) so it can be unit-tested independently
   of the UI.

   Data model (per learner profile, stored as profile.learning):
     {
       v: 1,
       items: {
         "skill::word": {
           mastery: 0..4,            // 0 new,1 learning,2 familiar,3 proficient,4 mastered
           correctCount, wrongCount,
           streak,                   // consecutive correct answers
           lastReviewed: ms|null,
           nextReview:   ms|null,    // local-day midnight + reviewInterval days
           reviewInterval: days,     // 0 = relearning (due now), else 1,3,7,14,30
           difficulty: 0..2,         // 0 easy,1 normal,2 hard (lower after repeated errors)
           pronunciationAttempts,
           hintsUsed
         }
       }
     }
   ------------------------------------------------------------------ */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.LearningEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DAY = 86400000;
  const INTERVALS = [1, 3, 7, 14, 30];              // days — defaults, adapt with performance
  const SKILLS = ['recognize', 'listen', 'spell', 'pronounce'];
  const MASTERY_NAMES = ['new', 'learning', 'familiar', 'proficient', 'mastered'];
  const STORE_VERSION = 1;
  const MAX_STAGE = INTERVALS.length - 1;

  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const intOr = (v, d) => { const n = parseInt(v, 10); return isFinite(n) ? n : d; };

  function normalizeWord(w) {
    return String(w == null ? '' : w).trim().toLowerCase().replace(/\s+/g, ' ');
  }
  function normalizeSkill(s) {
    return SKILLS.indexOf(s) >= 0 ? s : 'recognize';
  }
  function key(skill, word) {
    return normalizeSkill(skill) + '::' + normalizeWord(word);
  }
  function splitKey(k) {
    const s = String(k);
    const i = s.indexOf('::');
    return i >= 0 ? { skill: normalizeSkill(s.slice(0, i)), word: s.slice(i + 2) } : { skill: 'recognize', word: s };
  }

  /* ---------- local-day helpers (timezone / DST safe) ---------- */
  function dayStart(ts) {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }
  function endOfDay(ts) { return dayStart(ts) + DAY - 1; }
  function toDayKey(ts) {
    const d = new Date(ts);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  /* ---------- record helpers ---------- */
  function emptyRecord() {
    return {
      mastery: 0, correctCount: 0, wrongCount: 0, streak: 0,
      lastReviewed: null, nextReview: null, reviewInterval: 0,
      difficulty: 1, pronunciationAttempts: 0, hintsUsed: 0
    };
  }

  function sanitizeRecord(r, now) {
    const o = emptyRecord();
    if (!r || typeof r !== 'object' || Array.isArray(r)) return o;
    o.mastery = clamp(intOr(r.mastery, 0), 0, 4);
    o.correctCount = Math.max(0, intOr(r.correctCount, 0));
    o.wrongCount = Math.max(0, intOr(r.wrongCount, 0));
    o.streak = Math.max(0, intOr(r.streak, 0));
    o.difficulty = clamp(intOr(r.difficulty, 1), 0, 2);
    o.pronunciationAttempts = Math.max(0, intOr(r.pronunciationAttempts, 0));
    o.hintsUsed = Math.max(0, intOr(r.hintsUsed, 0));

    let ri = intOr(r.reviewInterval, 0);
    if (ri < 0) ri = 0;
    if (ri > 0 && INTERVALS.indexOf(ri) < 0) {
      // accept legacy/near values but normalise to the closest configured interval
      let best = INTERVALS[0], bd = Infinity;
      INTERVALS.forEach((v) => { const d = Math.abs(v - ri); if (d < bd) { bd = d; best = v; } });
      ri = best;
    }
    o.reviewInterval = ri;

    const n = now == null ? Date.now() : now;
    let lr = isNum(r.lastReviewed) && r.lastReviewed > 0 ? Math.floor(r.lastReviewed) : null;
    let nr = isNum(r.nextReview) && r.nextReview > 0 ? Math.floor(r.nextReview) : null;
    // invalid / inverted dates are dropped so the item simply becomes due
    if (nr != null && lr != null && nr < lr) nr = null;
    if (lr != null && lr > n + DAY) lr = null;             // future lastReviewed (clock change) -> drop
    if (nr != null && nr > n + INTERVALS[MAX_STAGE] * DAY * 2) nr = null;
    o.lastReviewed = lr;
    o.nextReview = nr;
    return o;
  }

  function createStore() { return { v: STORE_VERSION, items: {} }; }

  function validateStore(store, now) {
    const out = createStore();
    if (!store || typeof store !== 'object' || Array.isArray(store)) return out;
    const items = store.items && typeof store.items === 'object' && !Array.isArray(store.items) ? store.items : {};
    Object.keys(items).forEach((k) => {
      const parts = splitKey(k);
      if (!parts.word) return;
      const rec = sanitizeRecord(items[k], now);
      out.items[key(parts.skill, parts.word)] = rec;   // canonical key, de-duplicates
    });
    return out;
  }

  function getRecord(store, skill, word) {
    if (!store || !store.items) return null;
    return store.items[key(skill, word)] || null;
  }
  function ensureRecord(store, skill, word) {
    if (!store || typeof store !== 'object') return null;
    if (!store.items || typeof store.items !== 'object' || Array.isArray(store.items)) store.items = {};
    const k = key(skill, word);
    if (!store.items[k]) store.items[k] = emptyRecord();
    return store.items[k];
  }

  /* ---------- interval progression ---------- */
  function advanceInterval(cur) {
    if (!cur || cur <= 0) return INTERVALS[0];
    let i = INTERVALS.indexOf(cur);
    if (i < 0) { i = MAX_STAGE - 1; }
    return INTERVALS[Math.min(MAX_STAGE, i + 1)];
  }

  /* ---------- core: record an answer ---------- */
  function record(store, ev, now) {
    if (!store || typeof store !== 'object') return { changed: false, record: null };
    if (!ev || !ev.word) return { changed: false, record: null };
    const t = isNum(now) ? now : Date.now();
    const skill = normalizeSkill(ev.skill);
    const correct = !!ev.correct;
    const score = isNum(ev.score) ? clamp(Math.round(ev.score), 0, 100) : (correct ? 100 : 0);

    const rec = ensureRecord(store, skill, ev.word);
    const before = rec.mastery;
    if (skill === 'pronounce') rec.pronunciationAttempts++;
    if (ev.hinted) rec.hintsUsed++;
    // Speech engine could not recognise clearly: count the attempt but do NOT
    // penalise mastery / reschedule — recognition failure != pronunciation error.
    if (ev.uncertain) return { changed: true, record: rec, uncertain: true, key: key(skill, ev.word) };

    rec.lastReviewed = t;

    if (correct) {
      rec.correctCount++;
      rec.streak++;
      rec.mastery = clamp(rec.mastery + 1, 0, 4);
      rec.reviewInterval = advanceInterval(rec.reviewInterval);
      rec.nextReview = dayStart(t) + rec.reviewInterval * DAY;
      if (score >= 80 && rec.mastery >= 2) rec.difficulty = clamp(rec.difficulty + 1, 0, 2);
    } else {
      rec.wrongCount++;
      rec.streak = 0;
      rec.mastery = clamp(rec.mastery - 1, 0, 4);
      if (rec.wrongCount >= 2) rec.mastery = clamp(rec.mastery - 1, 0, 4);  // repeated errors
      rec.reviewInterval = 0;                                              // relearn
      rec.nextReview = dayStart(t);                                        // due immediately (earlier review)
      rec.difficulty = rec.wrongCount >= 2 ? 0 : clamp(rec.difficulty - 1, 0, 1);
    }
    return { changed: true, record: rec, promoted: rec.mastery > before, key: key(skill, ev.word) };
  }

  /* ---------- due / selection ---------- */
  function isDue(rec, now) {
    if (!rec) return false;
    // An item with history but no valid schedule (dropped invalid date) is
    // treated as due so it is not silently lost; a brand-new item is not due.
    if (rec.nextReview == null) return !!(rec.lastReviewed || rec.correctCount > 0);
    return rec.nextReview <= endOfDay(now == null ? Date.now() : now);
  }
  function overdueDays(rec, now) {
    if (!rec || rec.nextReview == null) return 0;
    const t = now == null ? Date.now() : now;
    return Math.max(0, Math.floor((dayStart(t) - dayStart(rec.nextReview)) / DAY));
  }

  /* Select practice items with a deliberate, documented policy:
     - "due" reviews are always preferred (most overdue first, then weakest)
     - brand-new items are only added up to `newPer` for every `duePer` due
       reviews (default 1 new per 3 due) so new words are never mixed in
       arbitrarily with overdue reviews.
     - repeated-error items (difficulty 0 / wrongCount>=2) are surfaced as `weak`
       for easier practice. */
  function selectPractice(store, opts) {
    opts = opts || {};
    const now = isNum(opts.now) ? opts.now : Date.now();
    const skills = (opts.skills && opts.skills.length ? opts.skills : SKILLS).map(normalizeSkill);
    const maxItems = Math.max(1, intOr(opts.maxItems, 12));
    const duePer = Math.max(1, intOr(opts.duePer, 3));
    const newPer = Math.max(0, intOr(opts.newPer, 1));
    const includeNew = opts.includeNew !== false;

    const due = [], fresh = [], weak = [];
    const items = (store && store.items) || {};
    Object.keys(items).forEach((k) => {
      const parts = splitKey(k);
      if (skills.indexOf(parts.skill) < 0) return;
      const rec = items[k];
      if (!rec) return;
      const entry = { key: k, skill: parts.skill, word: parts.word, rec: rec };
      const isNew = rec.correctCount === 0 && rec.wrongCount === 0 && !rec.lastReviewed;
      if (isNew) { fresh.push(entry); return; }
      if (rec.wrongCount >= 2 || rec.difficulty === 0) weak.push(entry);
      if (isDue(rec, now)) { entry.overdue = overdueDays(rec, now); due.push(entry); }
    });

    due.sort((a, b) => (b.overdue - a.overdue) || (a.rec.mastery - b.rec.mastery) || (a.key < b.key ? -1 : 1));
    fresh.sort((a, b) => (a.key < b.key ? -1 : 1));
    weak.sort((a, b) => (b.rec.wrongCount - a.rec.wrongCount) || (a.rec.mastery - b.rec.mastery));

    const plan = [];
    const seen = {};
    const push = (e) => { if (e && !seen[e.key] && plan.length < maxItems) { seen[e.key] = 1; plan.push(e); } };
    const pool = due.slice();
    const freshPool = fresh.slice();
    const weakPool = weak.slice();
    while (pool.length && plan.length < maxItems) {
      for (let i = 0; i < duePer && pool.length; i++) push(pool.shift());
      if (!includeNew) continue;
      for (let i = 0; i < newPer && freshPool.length; i++) push(freshPool.shift());
    }
    // top up from remaining due, then fresh only if still short
    while (plan.length < maxItems && pool.length) push(pool.shift());
    if (includeNew) while (plan.length < maxItems && freshPool.length) push(freshPool.shift());
    while (plan.length < maxItems && weakPool.length) push(weakPool.shift());

    return { due: due, fresh: fresh, weak: weak, plan: plan, now: now };
  }

  /* ---------- aggregate stats (for the parent dashboard) ---------- */
  function stats(store, now) {
    const out = {
      total: 0, mastered: 0, proficient: 0, learning: 0, fresh: 0,
      due: 0, weak: 0, bySkill: {}, byMastery: [0, 0, 0, 0, 0]
    };
    SKILLS.forEach((s) => { out.bySkill[s] = { total: 0, mastered: 0, due: 0 }; });
    const items = (store && store.items) || {};
    Object.keys(items).forEach((k) => {
      const parts = splitKey(k); const rec = items[k]; if (!rec) return;
      out.total++;
      out.byMastery[clamp(rec.mastery, 0, 4)]++;
      const bs = out.bySkill[parts.skill]; if (bs) bs.total++;
      const isNew = rec.correctCount === 0 && rec.wrongCount === 0 && !rec.lastReviewed;
      if (isNew) { out.fresh++; return; }
      if (rec.mastery >= 4) { out.mastered++; if (bs) bs.mastered++; }
      else if (rec.mastery === 3) out.proficient++;
      else out.learning++;
      if (rec.wrongCount >= 2 || rec.difficulty === 0) out.weak++;
      if (isDue(rec, now)) { out.due++; if (bs) bs.due++; }
    });
    return out;
  }

  /* ---------- legacy migration ---------- */
  /* stars (0..3) from the v5.x `progress` map -> engine record.
     3 stars (fully learned in the old model) becomes mastery 4 (mastered). */
  const STARS_TO_MASTERY = [0, 1, 2, 4];
  function skillFromMode(mode) {
    const m = String(mode || '');
    if (m === 'letters' || m === 'sounds') return 'recognize';
    if (m === 'listen') return 'listen';
    if (m === 'spell') return 'spell';
    if (m === 'recall') return 'pronounce';
    if (m === 'review') return 'pronounce';
    return 'recognize';
  }
  function fromLegacyProgress(progress, opts) {
    opts = opts || {};
    const now = isNum(opts.now) ? opts.now : Date.now();
    const store = createStore();
    if (!progress || typeof progress !== 'object' || Array.isArray(progress)) return store;
    Object.keys(progress).forEach((k) => {
      const i = k.indexOf('::');
      if (i < 0) return;
      const mode = k.slice(0, i); const word = k.slice(i + 2);
      if (!word) return;
      const stars = clamp(intOr(progress[k], 0), 0, 3);
      if (stars <= 0) return;
      const skill = skillFromMode(mode);
      const rec = emptyRecord();
      rec.mastery = STARS_TO_MASTERY[stars];
      rec.correctCount = Math.max(1, stars * 2);
      rec.wrongCount = Math.max(0, 3 - stars);
      rec.streak = stars >= 2 ? 2 : stars;
      rec.difficulty = stars >= 3 ? 2 : 1;
      rec.reviewInterval = stars >= 3 ? INTERVALS[MAX_STAGE] : INTERVALS[clamp(stars - 1, 0, MAX_STAGE)];
      rec.lastReviewed = isNum(opts.lastAt) ? opts.lastAt : null;
      rec.nextReview = stars >= 3 ? dayStart(now) + rec.reviewInterval * DAY : dayStart(now);
      store.items[key(skill, word)] = rec;
    });
    return store;
  }

  return {
    VERSION: STORE_VERSION,
    INTERVALS: INTERVALS.slice(),
    SKILLS: SKILLS.slice(),
    MASTERY_NAMES: MASTERY_NAMES.slice(),
    DAY: DAY,
    dayStart: dayStart,
    endOfDay: endOfDay,
    toDayKey: toDayKey,
    key: key,
    splitKey: splitKey,
    normalizeWord: normalizeWord,
    normalizeSkill: normalizeSkill,
    createStore: createStore,
    validateStore: validateStore,
    emptyRecord: emptyRecord,
    getRecord: getRecord,
    ensureRecord: ensureRecord,
    record: record,
    isDue: isDue,
    overdueDays: overdueDays,
    selectPractice: selectPractice,
    stats: stats,
    skillFromMode: skillFromMode,
    fromLegacyProgress: fromLegacyProgress
  };
});
