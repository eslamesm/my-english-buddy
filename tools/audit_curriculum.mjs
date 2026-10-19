import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const html = read('index.html');

// ---- extract curriculum structures from index.html ----
const grab = (name) => {
  const i = html.indexOf('const ' + name + '=');
  if (i < 0) throw new Error('not found: ' + name);
  const start = html.indexOf('=', i) + 1;
  let depth = 0, j = start, inStr = false, q = '';
  for (; j < html.length; j++) {
    const ch = html[j];
    if (inStr) { if (ch === '\\') { j++; continue; } if (ch === q) inStr = false; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; q = ch; continue; }
    if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') { depth--; if (depth === 0) { j++; break; } }
  }
  const expr = html.slice(start, j);
  return eval('(' + expr + ')');
};

const CUR_GRADES = grab('CUR_GRADES');
const CUR_WORDS = grab('CUR_WORDS');
const P1_T1_UNITS = grab('P1_T1_UNITS');
const P1_T2_UNITS = grab('P1_T2_UNITS');
const KG1_T1_UNITS = grab('KG1_T1_UNITS');
const KG2_T1_UNITS = grab('KG2_T1_UNITS');

const artIndex = JSON.parse(read('img/art/index.json'));
const artMap = JSON.parse(read('img/art/map.js').replace(/^\s*window\.ART_IMG_ALL\s*=/, '').replace(/;\s*$/, ''));
const wordsJson = JSON.parse(read('tools/words.json'));
const artFiles = new Set(fs.readdirSync(path.join(ROOT, 'img/art')).filter(f => f.endsWith('.svg')).map(f => f.replace(/\.svg$/, '')));
const wordWavs = new Set(fs.readdirSync(path.join(ROOT, 'audio/words')).filter(f => f.endsWith('.wav')).map(f => f.replace(/\.wav$/, '').toLowerCase()));
const slugOf = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

const subunits = { kg1: KG1_T1_UNITS, kg2: KG2_T1_UNITS, p1: P1_T1_UNITS, p1t2: P1_T2_UNITS };
// treat P1 Term 1 and Term 2 as separate audit rows (distinct terms)
const gradeIds = ['kg1', 'kg2', 'p1', 'p1t2', 'p2', 'p3', 'p4', 'p5', 'p6', 'prep1', 'prep2'];

const report = { generatedFor: 'v6.7', grades: [], totals: {}, issues: {} };
const seenById = {};
const dupWithinGrade = {};
const spellIssues = [];

const norm = (t) => String(t).trim();

function classifyWord(t) {
  const s = slugOf(t);
  return {
    text: t,
    id: s,
    art: artFiles.has(s) ? ('img/art/' + s + '.svg') : null,
    artMap: artMap[s] || (artIndex[s] && artIndex[s].src) || null,
    audio: wordWavs.has(norm(t).toLowerCase()) ? ('audio/words/' + norm(t).toLowerCase() + '.wav') : null
  };
}

for (const g of CUR_GRADES) {
  const gid = g.id;
  const rows = (gid === 'p1') ? ['p1', 'p1t2'] : [gid];
  for (const rowId of rows) {
  const gradeEntry = { id: rowId, grade: g.grade, ages: g.ages, terms: [], units: [], status: 'unverified', source: null };
  if (subunits[rowId]) {
    const term = (rowId === 'p1' || rowId === 'p1t2') ? (rowId === 'p1' ? '1' : '2') : '1';
    gradeEntry.terms.push(term);
    const us = subunits[rowId];
    for (const u of us) {
      const items = u.words.map(w => {
        const c = classifyWord(w[0]);
        return { unit: u.n, text: w[0], slug: c.id, emoji: w[1], ar: w[2], art: c.art, artMap: c.artMap, audio: c.audio };
      });
      gradeEntry.units.push({ n: u.n, title: u.title, ar: u.ar, count: items.length, items });
    }
    gradeEntry.status = 'partially_verified';
    gradeEntry.source = (rowId === 'kg1') ? 'English_language_kg1_t1.pdf (referenced in code comment; file NOT in repo)'
      : (rowId === 'kg2') ? 'English_language_kg2_t1.pdf (referenced in code comment; file NOT in repo)'
      : (rowId === 'p1') ? 'Connect Primary 1 Term 1 book (2022/2023) — referenced in code comment; file NOT in repo'
      : 'Connect Primary 1 Term 2 book (2025/2026) — referenced in code comment; file NOT in repo';
  } else {
    gradeEntry.status = 'unverified';
    gradeEntry.source = 'no unit structure / no source in repo';
    gradeEntry.terms.push(null);
    const flat = (CUR_WORDS[rowId] || []);
    const items = flat.map(w => {
      const c = classifyWord(w.t);
      return { unit: null, text: w.t, slug: c.id, emoji: w.emoji, ar: w.ar, art: c.art, artMap: c.artMap, audio: c.audio };
    });
    gradeEntry.units.push({ n: null, title: '(flat list, no unit metadata)', ar: null, count: items.length, items });
  }
  // duplicates within grade (flat list)
  const flat = [];
  gradeEntry.units.forEach(u => u.items.forEach(it => flat.push(it)));
  const bySlug = {};
  flat.forEach(it => { bySlug[it.slug] = (bySlug[it.slug] || 0) + 1; });
  gradeEntry.duplicatesWithinGrade = Object.entries(bySlug).filter(([, c]) => c > 1).map(([s, c]) => ({ slug: s, count: c }));
  gradeEntry.uniqueWords = Object.keys(bySlug).length;
  gradeEntry.totalItems = flat.length;
  report.grades.push(gradeEntry);
  flat.forEach(it => { seenById[it.slug] = (seenById[it.slug] || 0) + 1; });
  }
}

// cross-grade duplicates
report.totals.items = report.grades.reduce((a, g) => a + g.totalItems, 0);
report.totals.uniqueWordsAcrossGrades = Object.keys(seenById).length;

// spelling / capitalization / punctuation flags
for (const g of report.grades) {
  for (const u of g.units) {
    for (const it of u.items) {
      const t = it.text;
      if (/^\s|\s$/.test(t)) spellIssues.push({ slug: it.slug, text: t, issue: 'leading/trailing space' });
      if (/[ ]{2,}/.test(t)) spellIssues.push({ slug: it.slug, text: t, issue: 'double space' });
      if (/[.,;:!?]$/.test(t)) spellIssues.push({ slug: it.slug, text: t, issue: 'trailing punctuation' });
      if (t === t.toUpperCase() && t.length > 1 && /[A-Z]/.test(t) && !/^(TV)$/.test(t)) spellIssues.push({ slug: it.slug, text: t, issue: 'ALL-CAPS' });
      // suspicious unicode / control
      if (/[\u0000-\u001f]/.test(t)) spellIssues.push({ slug: it.slug, text: t, issue: 'control char' });
    }
  }
}
report.issues.spelling = spellIssues;

// missing mappings
const missingArt = [], missingAudio = [];
for (const g of report.grades) {
  for (const u of g.units) {
    for (const it of u.items) {
      if (!it.art) missingArt.push({ grade: g.id, unit: u.n, text: it.text, slug: it.slug });
      if (!it.audio) missingAudio.push({ grade: g.id, unit: u.n, text: it.text, slug: it.slug });
    }
  }
}
report.issues.missingArt = missingArt;
report.issues.missingAudio = missingAudio;

// grade-term-unit metadata consistency
report.issues.metaConsistency = [];
for (const g of report.grades) {
  if (g.units.length && g.units.some(u => typeof u.n !== 'number' || !u.title)) {
    report.issues.metaConsistency.push({ grade: g.id, problem: 'unit missing n/title' });
  }
}

// cross-check words.json coverage vs curriculum
const wordsJsonSlugs = new Set(wordsJson.map(w => w.slug));
const curSlugs = new Set(Object.keys(seenById));
report.totals.curriculumUnique = curSlugs.size;
report.totals.wordsJsonEntries = wordsJson.length;
report.issues.curriculumWordsNotInWordsJson = [...curSlugs].filter(s => !wordsJsonSlugs.has(s));
report.issues.artIndexNotInArtFiles = Object.keys(artIndex).filter(k => !artFiles.has(slugOf((artIndex[k].src || '').split('/').pop().replace(/\.svg$/, ''))));
report.issues.artMapNotInArtFiles = Object.keys(artMap).filter(k => !artFiles.has(slugOf((artMap[k] || '').split('/').pop().replace(/\.svg$/, ''))));

// duplicates across grade repeated intentionally (revision)
const crossDup = Object.entries(seenById).filter(([, c]) => c > 1).map(([s, c]) => ({ slug: s, count: c })).sort((a, b) => b.count - a.count);
report.issues.crossGradeRepeats = crossDup.slice(0, 60);
report.issues.crossGradeRepeatCount = crossDup.length;

fs.writeFileSync(path.join(ROOT, 'tools/curriculum_audit.json'), JSON.stringify(report, null, 2));
console.log('Wrote tools/curriculum_audit.json');
console.log('grades:', report.grades.length, 'total items:', report.totals.items, 'unique:', report.totals.uniqueWordsAcrossGrades);
console.log('spelling flags:', spellIssues.length, 'missing art:', missingArt.length, 'missing audio:', missingAudio.length);
console.log('cross-grade repeat slugs:', crossDup.length);
