/* My English Buddy — Adaptive Learning Engine (v7.0)
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
  const DAILY_NEW_OPTIONS = [3, 5, 10];             // configurable new-words-per-day targets
  const DAILY_NEW_DEFAULT = 5;
  const SKILL_RELIABLE_MIN = 3;                     // records needed before a skill weight is trusted

  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const intOr = (v, d) => { const n = parseInt(v, 10); return isFinite(n) ? n : d; };

  function normalizeWord(w) {
    return String(w == null ? '' : w).trim().toLowerCase().replace(/\s+/g, ' ');
  }
  function normalizeSkill(s) {
    return SKILLS.indexOf(s) >= 0 ? s : 'recognize';
  }
  /* allowed "new words per day" targets; anything else falls back to the default */
  function normalizeDailyNew(v) {
    const n = intOr(v, DAILY_NEW_DEFAULT);
    return DAILY_NEW_OPTIONS.indexOf(n) >= 0 ? n : DAILY_NEW_DEFAULT;
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
      difficulty: 1, pronunciationAttempts: 0, hintsUsed: 0,
      assistedCount: 0
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
    o.assistedCount = Math.max(0, intOr(r.assistedCount, 0));

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
    if (ev.revealed) rec.hintsUsed = (rec.hintsUsed || 0) + 1; // count reveals as assistance
    // ensure backward compat for new fields
    if (rec.assistedCount == null) rec.assistedCount = 0;

    // Speech engine could not recognise clearly: count the attempt but do NOT
    // penalise mastery / reschedule — recognition failure != pronunciation error.
    if (ev.uncertain) return { changed: true, record: rec, uncertain: true, key: key(skill, ev.word), outcome: 'uncertain' };

    rec.lastReviewed = t;

    const assisted = correct && (ev.hinted || ev.revealed || ev.assisted);
    if (correct) {
      if (assisted) {
        // Correct but assisted: do NOT promote mastery independently
        rec.correctCount++;
        rec.streak = Math.max(rec.streak, 0); // don't reset streak harshly, but don't advance it
        rec.assistedCount = (rec.assistedCount || 0) + 1;
        // Keep mastery unchanged for pure assistance; do not advance review interval aggressively
        if (rec.reviewInterval === 0) {
          rec.reviewInterval = 1;
          rec.nextReview = dayStart(t) + rec.reviewInterval * DAY;
        } else {
          // gentle nudge forward but less than independent correct
          rec.nextReview = dayStart(t) + Math.max(1, Math.floor(rec.reviewInterval / 2)) * DAY;
        }
        return { changed: true, record: rec, promoted: false, key: key(skill, ev.word), outcome: 'assisted' };
      }
      rec.correctCount++;
      rec.streak++;
      rec.mastery = clamp(rec.mastery + 1, 0, 4);
      rec.reviewInterval = advanceInterval(rec.reviewInterval);
      rec.nextReview = dayStart(t) + rec.reviewInterval * DAY;
      if (score >= 80 && rec.mastery >= 2) rec.difficulty = clamp(rec.difficulty + 1, 0, 2);
      return { changed: true, record: rec, promoted: rec.mastery > before, key: key(skill, ev.word), outcome: 'independent' };
    } else {
      rec.wrongCount++;
      rec.streak = 0;
      rec.mastery = clamp(rec.mastery - 1, 0, 4);
      if (rec.wrongCount >= 2) rec.mastery = clamp(rec.mastery - 1, 0, 4);  // repeated errors
      rec.reviewInterval = 0;                                              // relearn
      rec.nextReview = dayStart(t);                                        // due immediately (earlier review)
      rec.difficulty = rec.wrongCount >= 2 ? 0 : clamp(rec.difficulty - 1, 0, 1);
      return { changed: true, record: rec, promoted: rec.mastery > before, key: key(skill, ev.word), outcome: 'incorrect' };
    }
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

  /* Per-skill aggregate profile used for skill-weighted selection.
     `weakness` is only meaningful (0..1, higher = weaker) once a skill has at
     least SKILL_RELIABLE_MIN records; otherwise it is 0 so no skill is
     penalised on thin data (conservative fallback). */
  function skillProfile(store, now) {
    const out = {};
    const sum = {};
    SKILLS.forEach((s) => { out[s] = { skill: s, total: 0, mastered: 0, due: 0, weak: 0, avgMastery: 0, reliable: false, weakness: 0 }; sum[s] = 0; });
    const items = (store && store.items) || {};
    Object.keys(items).forEach((k) => {
      const parts = splitKey(k); const rec = items[k]; const o = out[parts.skill];
      if (!o || !rec) return;
      o.total++; sum[parts.skill] += clamp(rec.mastery, 0, 4);
      if (rec.mastery >= 4) o.mastered++;
      if (rec.wrongCount >= 2 || rec.difficulty === 0) o.weak++;
      if (isDue(rec, now)) o.due++;
    });
    SKILLS.forEach((s) => {
      const o = out[s];
      o.avgMastery = o.total ? sum[s] / o.total : 0;
      o.reliable = o.total >= SKILL_RELIABLE_MIN;
      const masteryWeak = 1 - (o.avgMastery / 4);
      const dueRatio = o.total ? Math.min(1, o.due / Math.max(1, o.total)) : 0;
      o.weakness = o.reliable ? clamp(0.6 * masteryWeak + 0.4 * dueRatio, 0, 1) : 0;
    });
    return out;
  }

  /* Select practice items with a deliberate, documented policy:
     - "due" reviews are always preferred (most overdue first, then weakest)
     - brand-new items are only added up to `newPer` for every `duePer` due
       reviews (default 1 new per 3 due) so new words are never mixed in
       arbitrarily with overdue reviews.
     - repeated-error items (difficulty 0 / wrongCount>=2) are surfaced as `weak`
       for easier practice.
     - when `weightSkills` is set AND at least one skill has reliable data,
       ties inside the same overdue-day / weak bucket are ordered toward the
       weakest skill first (variety is preserved because every due item is
       still included in overdue order). With no reliable skill data the
       ordering is identical to v6.0 (conservative fallback).
     - `newTarget` (when provided) hard-caps how many brand-new items may be
       placed in the plan; reviews are never displaced by it. */
  function selectPractice(store, opts) {
    opts = opts || {};
    const now = isNum(opts.now) ? opts.now : Date.now();
    const skills = (opts.skills && opts.skills.length ? opts.skills : SKILLS).map(normalizeSkill);
    const maxItems = Math.max(1, intOr(opts.maxItems, 12));
    const duePer = Math.max(1, intOr(opts.duePer, 3));
    const newPer = Math.max(0, intOr(opts.newPer, 1));
    const includeNew = opts.includeNew !== false;
    const weightSkills = !!opts.weightSkills;
    const newTarget = (opts.newTarget == null) ? Infinity : Math.max(0, intOr(opts.newTarget, 0));
    const recencyWindowMs = isNum(opts.recencyWindowMs) ? opts.recencyWindowMs : 10 * 60 * 1000; // 10 min window

    let rank = null;
    if (weightSkills) {
      const sp = skillProfile(store, now);
      if (SKILLS.some((s) => sp[s].reliable)) {
        rank = {};
        SKILLS.slice().sort((a, b) => (sp[b].weakness - sp[a].weakness) || (a < b ? -1 : 1)).forEach((s, i) => { rank[s] = i; });
      }
    }
    const rankOf = (s) => (rank && rank[s] != null) ? rank[s] : 0;

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
      // Weak if repeated errors or difficulty 0; also consider assisted/incorrect patterns
      const assistedCount = rec.assistedCount || 0;
      const hasAssistedStruggle = assistedCount >= 2 && rec.correctCount >= assistedCount; // many assists
      if (rec.wrongCount >= 2 || rec.difficulty === 0 || hasAssistedStruggle) weak.push(entry);
      if (isDue(rec, now)) {
        entry.overdue = overdueDays(rec, now);
        entry.assistedCount = assistedCount;
        entry.wrongCount = rec.wrongCount || 0;
        entry.mastery = rec.mastery || 0;
        due.push(entry);
      }
    });

    // Enhanced sorting: due by overdue desc, then by need (weakness) - prefer items with more wrongs/assists and lower mastery
    due.sort((a, b) => {
      const aNeed = (a.wrongCount >= 2 ? 2 : 0) + (a.assistedCount >= 2 ? 1 : 0) + (a.mastery < 2 ? 1 : 0);
      const bNeed = (b.wrongCount >= 2 ? 2 : 0) + (b.assistedCount >= 2 ? 1 : 0) + (b.mastery < 2 ? 1 : 0);
      return (b.overdue - a.overdue) || (bNeed - aNeed) || (rankOf(a.skill) - rankOf(b.skill)) || (a.rec.mastery - b.rec.mastery) || (a.key < b.key ? -1 : 1);
    });
    fresh.sort((a, b) => (rankOf(a.skill) - rankOf(b.skill)) || (a.key < b.key ? -1 : 1));
    weak.sort((a, b) => {
      const aNeed = (a.rec.wrongCount || 0) * 2 + (a.rec.assistedCount || 0);
      const bNeed = (b.rec.wrongCount || 0) * 2 + (b.rec.assistedCount || 0);
      return (rankOf(a.skill) - rankOf(b.skill)) || (bNeed - aNeed) || (b.rec.wrongCount - a.rec.wrongCount) || (a.rec.mastery - b.rec.mastery) || (a.key < b.key ? -1 : 1);
    });

    const plan = [];
    const seen = {};
    const recentlySeen = opts.recentlySeen || {}; // key -> timestamp
    let freshUsed = 0;
    const isRecentlySeen = (e) => {
      if (!e || !recentlySeen[e.key]) return false;
      const ts = recentlySeen[e.key];
      if (!isNum(ts)) return false;
      return (now - ts) < recencyWindowMs;
    };
    const push = (e) => {
      if (!e) return;
      if (seen[e.key]) return;
      // Avoid immediate repeat unless it's a critical due item with strong need
      if (isRecentlySeen(e)) {
        const isCriticalDue = e.overdue >= 1 && ((e.wrongCount >= 2) || (e.assistedCount >= 3) || e.rec.difficulty === 0);
        if (!isCriticalDue) return; // skip recent non-critical to reduce repetition
      }
      if (plan.length >= maxItems) return;
      seen[e.key] = 1;
      plan.push(e);
    };
    const pushFresh = (e) => { if (freshUsed >= newTarget) return; const before = plan.length; push(e); if (plan.length > before) freshUsed++; };
    const pool = due.slice();
    const freshPool = fresh.slice();
    const weakPool = weak.slice();
    // Balanced interleaving: prioritize due, sprinkle weak/fresh according to policy
    while (pool.length && plan.length < maxItems) {
      for (let i = 0; i < duePer && pool.length; i++) push(pool.shift());
      if (!includeNew) continue;
      for (let i = 0; i < newPer && freshPool.length; i++) pushFresh(freshPool.shift());
    }
    // top up from remaining due (critical reviews must not be blocked)
    while (plan.length < maxItems && pool.length) push(pool.shift());
    if (includeNew) while (plan.length < maxItems && freshPool.length) pushFresh(freshPool.shift());
    while (plan.length < maxItems && weakPool.length) push(weakPool.shift());

    return { due: due, fresh: fresh, weak: weak, plan: plan, now: now, weighted: !!rank };
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
    const sp = skillProfile(store, now);
    SKILLS.forEach((s) => { out.bySkill[s].reliable = sp[s].reliable; out.bySkill[s].weakness = sp[s].weakness; out.bySkill[s].avgMastery = Math.round(sp[s].avgMastery * 100) / 100; });
    return out;
  }

  /* ---------- session summary (deterministic, for the end-of-session screen) ----------
     Pure function: takes an in-memory list of attempt events and returns a plain
     summary object. No randomness, no storage, no DOM — so it is fully unit-testable.

     Each event is a small object; unknown / malformed events are ignored (safe on
     partial or legacy data):
       { word, skill, outcome, corrected } where outcome is one of:
         'independent' — answered correctly with no help
         'assisted'    — reached the answer only after a hint / reveal (counts as an
                         attempt, never as mastery, never as a "wrong answer")
         'incorrect'   — a genuine wrong answer (not counted for uncertain ASR)
         'uncertain'   — the speech engine could not hear clearly; NOT a language
                         failure and never counted as a mistake
       corrected: true when the learner fixed their own mistake before finishing.

     opts (all optional):
       dailyTarget   new-words target for today (defaults to DAILY_NEW_DEFAULT)
       dailyNewToday number of genuinely-new items met so far today
       dueRemaining  count of items still due for review AFTER this session
       totalItems    number of items in the session (defaults to distinct words seen)

     Result:
       {
         total, independent, assisted, incorrect, uncertain, corrected,
         answered,                 // independent + incorrect (real answers)
         accuracy,                 // 0..100 over real answers
         perfect,                  // all answered items independent, none wrong
         stars,                    // 0..3 child-facing rating
         bySkill: { skill: { total, independent, assisted, incorrect, uncertain } },
         skillsPracticed: [skill...],   // in canonical SKILLS order
         dailyTarget, dailyNewToday, dailyProgress,   // 0..100
         dueRemaining
       }
  */
  function emptySkillTally() { return { total: 0, independent: 0, assisted: 0, incorrect: 0, uncertain: 0 }; }
  function summarizeSession(events, opts) {
    opts = opts || {};
    const out = {
      total: 0, independent: 0, assisted: 0, incorrect: 0, uncertain: 0, corrected: 0,
      answered: 0, accuracy: 0, perfect: false, stars: 0,
      bySkill: {}, skillsPracticed: [],
      dailyTarget: normalizeDailyNew(opts.dailyTarget),
      dailyNewToday: Math.max(0, intOr(opts.dailyNewToday, 0)),
      dailyProgress: 0,
      dueRemaining: Math.max(0, intOr(opts.dueRemaining, 0))
    };
    SKILLS.forEach((s) => { out.bySkill[s] = emptySkillTally(); });

    const list = Array.isArray(events) ? events : [];
    const seenWords = {};
    list.forEach((ev) => {
      if (!ev || typeof ev !== 'object') return;
      const word = normalizeWord(ev.word);
      if (!word) return;
      const skill = normalizeSkill(ev.skill);
      const outcome = ev.outcome;
      if (outcome !== 'independent' && outcome !== 'assisted' && outcome !== 'incorrect' && outcome !== 'uncertain') return;
      seenWords[word] = 1;
      out.total++;
      out[outcome]++;
      const t = out.bySkill[skill];
      t.total++; t[outcome]++;
      if (ev.corrected) out.corrected++;
    });

    out.answered = out.independent + out.incorrect;
    out.accuracy = out.answered ? Math.round((out.independent / out.answered) * 100) : 0;
    out.perfect = out.answered > 0 && out.independent === out.answered && out.incorrect === 0;
    // star rating weighs independent success, ignores uncertain ASR entirely.
    if (out.independent === 0 && out.assisted === 0) out.stars = 0;
    else if (out.incorrect === 0 && out.assisted === 0) out.stars = 3;
    else if (out.accuracy >= 60) out.stars = 2;
    else out.stars = 1;

    out.skillsPracticed = SKILLS.filter((s) => out.bySkill[s].total > 0);
    const distinct = Object.keys(seenWords).length;
    const sessionItems = isNum(opts.totalItems) ? Math.max(0, intOr(opts.totalItems, 0)) : distinct;
    out.sessionItems = sessionItems;
    const denom = Math.max(out.dailyTarget, 1);
    out.dailyProgress = clamp(Math.round((out.dailyNewToday / denom) * 100), 0, 100);
    return out;
  }

  /* ---------- smart coach message (deterministic, for home + session summary) ----------
     Pure function: given a small bag of ALREADY-MEASURED learner numbers, returns a
     stable coaching message. No randomness, no storage, no DOM, no clock, no network —
     fully unit-testable and identical for identical input.

     It never invents personal data: every branch is driven by a real measurement, and
     when the evidence is too thin it falls back to generic encouragement.

     ctx (all optional; malformed values are ignored):
       weakestSkill   skill id ('recognize'|'listen'|'spell'|'pronounce') — ONLY used
                      when `skillReliable` is true, otherwise ignored
       skillReliable  true when the weakest skill has enough records to be trusted
       dueCount       number of items due for review
       streak         consecutive practice days
       todayAttempts  attempts recorded today
       goal           today's attempt goal (e.g. 5/10/20)
       dailyTarget    new-words-per-day target
       dailyNewToday  new words met today
       accuracy       0..100 over real (non-uncertain) answers this session
       stars          0..3 session rating
       independent    independent answers this session
       incorrect      genuine wrong answers this session
       uncertain      speech-recognition "not heard" results this session

     Result: { id, key, text } — `id` is a stable branch identifier, `key` is a stable
     dedupe key (id + deciding numbers) so the UI can avoid repeating the same line. */
  const COACH_SKILL_LABELS = {
    recognize: 'قراءة وتمييز',
    listen: 'استماع',
    spell: 'تهجئة',
    pronounce: 'نطق'
  };
  const COACH_GOAL_OPTIONS = [5, 10, 20];
  function coachMessage(ctx) {
    const c = (ctx && typeof ctx === 'object' && !Array.isArray(ctx)) ? ctx : {};
    const n = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);

    const dueCount = Math.max(0, intOr(c.dueCount, 0));
    const streak = Math.max(0, intOr(c.streak, 0));
    const todayAttempts = Math.max(0, intOr(c.todayAttempts, 0));
    const goalRaw = intOr(c.goal, 0);
    const goal = COACH_GOAL_OPTIONS.indexOf(goalRaw) >= 0 ? goalRaw : 10;
    const dailyTarget = normalizeDailyNew(c.dailyTarget);
    const dailyNewToday = Math.max(0, intOr(c.dailyNewToday, 0));
    const accuracy = clamp(Math.round(n(c.accuracy, 0)), 0, 100);
    const stars = clamp(intOr(c.stars, 0), 0, 3);
    const independent = Math.max(0, intOr(c.independent, 0));
    const incorrect = Math.max(0, intOr(c.incorrect, 0));
    const uncertain = Math.max(0, intOr(c.uncertain, 0));
    const sessionAnswered = independent + incorrect;
    const hasSession = sessionAnswered > 0 || uncertain > 0;

    const skillId = SKILLS.indexOf(c.weakestSkill) >= 0 ? c.weakestSkill : null;
    const skillReliable = c.skillReliable === true;

    const make = (id, key, text) => ({ id: id, key: key, text: text });

    /* 1. Reliable weakest-skill guidance — only when the reliability threshold is met.
          Never claims a weakness on thin data. */
    if (skillId && skillReliable) {
      const label = COACH_SKILL_LABELS[skillId];
      return make('skill', 'skill:' + skillId, 'لاحظتُ أن مهارة «' + label + '» تحتاج تركيزاً أكثر. جرّبنا معاً خطوة بخطوة 🧩');
    }

    /* 2. Due-review reminder */
    if (dueCount > 0) {
      return make('due', 'due:' + (dueCount >= 10 ? 'many' : dueCount >= 5 ? 'some' : 'few'),
        'لديك ' + dueCount + ' كلمة مستحقة للمراجعة. مراجعة قصيرة اليوم تحافظ على قوّتك 🔔');
    }

    /* 3. Streak milestone or encouragement */
    if (streak > 0 && streak % 7 === 0) {
      return make('streak7', 'streak7:' + streak, 'رائع! ' + streak + ' أيام متتالية من التدريب — أسبوع كامل من الالتزام 🌈');
    }
    if (streak >= 3) {
      return make('streak3', 'streak3:' + streak, 'أحسنت! ' + streak + ' أيام متتالية من التدريب. استمرّ هكذا 🔥');
    }

    /* 4. Daily-goal progress or completion */
    if (todayAttempts >= goal) {
      return make('goalDone', 'goalDone:' + goal, 'أكملت هدف اليوم! ' + todayAttempts + ' / ' + goal + ' تمريناً 🎯');
    }
    if (todayAttempts > 0) {
      const left = goal - todayAttempts;
      return make('goalProgress', 'goalProgress:' + todayAttempts + '/' + goal,
        'أنت على الطريق: ' + todayAttempts + ' / ' + goal + ' اليوم. تبقّى ' + left + ' فقط 💪');
    }

    /* 5. Session-specific encouragement from valid results.
          An uncertain-only session is NOT described as wrong — it is gentle. */
    if (hasSession) {
      if (sessionAnswered > 0 && incorrect === 0 && uncertain === 0 && independent > 0) {
        return make('sessionPerfect', 'sessionPerfect', 'جلسة مثالية — كل الإجابات مستقلة وصحيحة، أحسنت 🌟');
      }
      if (sessionAnswered > 0 && incorrect > 0) {
        return make('sessionRetry', 'sessionRetry:' + accuracy, 'تدرّبنا معاً اليوم؛ بعض الكلمات تحتاج مراجعة قصيرة وسنعاود المحاولة 🔁');
      }
      if (sessionAnswered === 0 && uncertain > 0) {
        return make('sessionHeard', 'sessionHeard', 'لم أسمعك بوضوح هذه المرة — هذا ليس خطأ، لنجرّب من جديد بصوت أوضح 🎤');
      }
      if (independent > 0) {
        return make('sessionGood', 'sessionGood:' + stars, 'أحسنت! كان أداؤك جيداً اليوم، واصل التدريب 👍');
      }
    }

    /* 6. Generic encouragement when evidence is insufficient */
    return make('generic', 'generic', 'مرحباً! جاهزون لجلسة تعلّم ممتعة اليوم؟ هيّا نتدرّب 🌱');
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
    DAILY_NEW_OPTIONS: DAILY_NEW_OPTIONS.slice(),
    DAILY_NEW_DEFAULT: DAILY_NEW_DEFAULT,
    DAY: DAY,
    dayStart: dayStart,
    endOfDay: endOfDay,
    toDayKey: toDayKey,
    key: key,
    splitKey: splitKey,
    normalizeWord: normalizeWord,
    normalizeSkill: normalizeSkill,
    normalizeDailyNew: normalizeDailyNew,
    createStore: createStore,
    validateStore: validateStore,
    emptyRecord: emptyRecord,
    getRecord: getRecord,
    ensureRecord: ensureRecord,
    record: record,
    isDue: isDue,
    overdueDays: overdueDays,
    skillProfile: skillProfile,
    selectPractice: selectPractice,
    stats: stats,
    summarizeSession: summarizeSession,
    coachMessage: coachMessage,
    SKILL_LABELS: Object.assign({}, COACH_SKILL_LABELS),
    skillFromMode: skillFromMode,
    fromLegacyProgress: fromLegacyProgress
  };
});
