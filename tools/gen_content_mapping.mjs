import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Curated alignment evidence produced by tools/verify_curriculum_sources (see sources.json).
// Maps itemId -> { matchStatus, evidenceRef }. Items absent from this map remain 'unverified'.
const ALIGNMENT = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/curriculum_alignment_map.json'), 'utf8'));
const alignFor = (id) => ALIGNMENT[id] || null;
const evidenceBase = 'Official 2025/2026 Egyptian MOE Student Book (Ministry content host elearnningcontent.blob.core.windows.net)';

const grab = (name) => {
  const re = new RegExp('const\\s+' + name + '\\s*=');
  const m = re.exec(html);
  if (!m) throw new Error('not found: ' + name);
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

const slugOf = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const CT = { letters: 'letter', cvc: 'cvc_word', words: 'word', phrases: 'phrase', sentences: 'sentence', curriculum: 'curriculum_word' };

const items = [];
const push = (o) => items.push(o);

// ---- curriculum items (unit-structured grades) ----
const unitGrades = { kg1: { u: KG1_T1_UNITS, term: 'term1' }, kg2: { u: KG2_T1_UNITS, term: 'term1' }, p1: { u: P1_T1_UNITS, term: 'term1' }, p1t2: { u: P1_T2_UNITS, term: 'term2' } };
for (const [gid, meta] of Object.entries(unitGrades)) {
  meta.u.forEach((unit) => {
    unit.words.forEach((w) => {
      const itemId = 'cur:' + gid + ':' + meta.term + ':u' + unit.n + ':' + slugOf(w[0]);
      const a = alignFor(itemId);
      push({
        itemId,
        text: w[0],
        grade: gid === 'p1t2' ? 'p1' : gid,
        term: meta.term,
        unit: unit.n,
        lesson: null,
        contentType: CT.curriculum,
        sourceId: a ? 'moe-scope-2025' : null,
        evidenceRef: a ? a.evidenceRef : null,
        matchStatus: a ? a.matchStatus : 'unverified',
        intentionalReview: false,
        reviewerNotes: a
          ? 'Listed in the official 2025/2026 Ministry Scope & Sequence vocabulary for this grade/term.'
          : 'App structure imported from a source referenced only in a code comment; not confirmed in the machine-readable text layer of the retrieved official book.'
      });
    });
  });
}
// ---- curriculum items (flat-list grades) ----
for (const g of CUR_GRADES) {
  const gid = g.id;
  if (unitGrades[gid]) continue;
  const flat = CUR_WORDS[gid] || [];
  flat.forEach((w) => {
    const itemId = 'cur:' + gid + ':' + slugOf(w.t);
    const a = alignFor(itemId);
    push({
      itemId,
      text: w.t,
      grade: gid,
      term: null,
      unit: null,
      lesson: null,
      contentType: CT.curriculum,
      sourceId: a ? 'moe-scope-2025' : null,
      evidenceRef: a ? a.evidenceRef : null,
      matchStatus: a ? a.matchStatus : 'unverified',
      intentionalReview: false,
      reviewerNotes: a
        ? 'Listed in the official 2025/2026 Ministry Scope & Sequence vocabulary for this grade.'
        : 'Flat word list with no unit metadata; not confirmed in the machine-readable text layer of the retrieved official book.'
    });
  });
}
// ---- supplemental banks ----
LETTERS.forEach((l) => push({ itemId: 'sup:letters:' + l.t.toLowerCase(), text: l.t + ' (' + l.word + ')', grade: null, term: null, unit: null, lesson: null, contentType: CT.letters, sourceId: null, evidenceRef: null, matchStatus: 'unverified', intentionalReview: false, supplemental: true, appBank: 'LETTERS', reviewerNotes: 'App-authored phonics/letter bank (supplemental). Not asserted to be textbook content.' }));
CVC.forEach((c) => push({ itemId: 'sup:cvc:' + slugOf(c.t), text: c.t, grade: null, term: null, unit: null, lesson: null, contentType: CT.cvc, sourceId: null, evidenceRef: null, matchStatus: 'unverified', intentionalReview: false, supplemental: true, appBank: 'CVC', reviewerNotes: 'App-authored CVC practice bank (supplemental).' }));
WORDS.forEach((w) => push({ itemId: 'sup:words:' + slugOf(w.t), text: w.t, grade: null, term: null, unit: null, lesson: null, contentType: CT.words, sourceId: null, evidenceRef: null, matchStatus: 'unverified', intentionalReview: false, supplemental: true, appBank: 'WORDS', reviewerNotes: 'App-authored basic word bank (supplemental).' }));
PHRASES.forEach((p) => push({ itemId: 'sup:phrases:' + slugOf(p.t), text: p.t, grade: null, term: null, unit: null, lesson: null, contentType: CT.phrases, sourceId: null, evidenceRef: null, matchStatus: 'unverified', intentionalReview: false, supplemental: true, appBank: 'PHRASES', reviewerNotes: 'App-authored daily-phrase bank (supplemental).' }));
SENTENCES.forEach((s) => push({ itemId: 'sup:sentences:' + slugOf(s.t), text: s.t, grade: null, term: null, unit: null, lesson: null, contentType: CT.sentences, sourceId: null, evidenceRef: null, matchStatus: 'unverified', intentionalReview: false, supplemental: true, appBank: 'SENTENCES', reviewerNotes: 'App-authored sentence bank (supplemental).' }));

// ---- mark intentional cross-grade repeats within curriculum ----
const curByText = {};
items.filter((i) => i.contentType === CT.curriculum).forEach((i) => { const k = slugOf(i.text); (curByText[k] = curByText[k] || []).push(i); });
Object.values(curByText).forEach((arr) => {
  if (arr.length > 1) { arr.forEach((i) => { i.intentionalReview = true; i.reviewerNotes += ' Repeated across grades/units (intentional revision/high-frequency word).'; }); }
});

const statuses = ['verified_exact', 'verified_equivalent', 'partially_verified', 'unverified', 'mismatch', 'not_in_source'];
const counts = {};
statuses.forEach((s) => counts[s] = 0);
items.forEach((i) => { counts[i.matchStatus]++; });

const out = {
  schemaVersion: '1.1.0',
  generatedAt: '2026-10-20',
  appVersion: 'v6.8',
  note: 'Generated by tools/gen_content_mapping.mjs. Every application item is listed. Items confirmed against the official 2025/2026 Egyptian MOE Student Books (Scope & Sequence vocabulary; see sources.json) are marked verified_exact/partially_verified. All other items remain unverified because the official books were retrieved but their vocabulary is largely presented as images outside the machine-readable text layer, so absence cannot be asserted (not_in_source is NOT used). Supplemental app-authored banks are never asserted as textbook content.',
  validStatuses: statuses,
  totals: { items: items.length, byStatus: counts },
  items
};

fs.writeFileSync(path.join(ROOT, 'docs/curriculum/content_mapping.json'), JSON.stringify(out, null, 2));
console.log('Wrote docs/curriculum/content_mapping.json');
console.log('items:', items.length, 'byStatus:', JSON.stringify(counts));
console.log('curriculum:', items.filter(i => i.contentType === CT.curriculum).length,
  'supplemental:', items.filter(i => i.supplemental).length,
  'intentionalReview:', items.filter(i => i.intentionalReview).length);
