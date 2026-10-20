import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const readText = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const sources = readJSON('docs/curriculum/sources.json');
const mapping = readJSON('docs/curriculum/content_mapping.json');
const report = readText('docs/curriculum/alignment-report.md');

const GRADE_IDS = ['kg1', 'kg2', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'prep1', 'prep2'];
const VALID_STATUS = new Set(['verified_exact', 'verified_equivalent', 'partially_verified', 'unverified', 'mismatch', 'not_in_source']);
const VALID_SOURCE_STATUS = new Set([...VALID_STATUS, 'unavailable']);

test('sources.json: required top-level fields present', () => {
  for (const f of ['schemaVersion', 'academicYear', 'jurisdiction', 'issuingAuthority', 'sources', 'grades']) {
    assert.ok(sources[f] !== undefined, 'missing field ' + f);
  }
  assert.equal(sources.jurisdiction, 'Egypt');
});

test('sources.json: all ten supported grades have explicit coverage status', () => {
  assert.equal(sources.grades.length, 10);
  const byId = Object.fromEntries(sources.grades.map((g) => [g.grade, g]));
  for (const gid of GRADE_IDS) {
    assert.ok(byId[gid], 'grade missing: ' + gid);
    assert.ok(byId[gid].coverageStatus, 'grade ' + gid + ' missing coverageStatus');
  }
});

test('sources.json: source IDs are unique', () => {
  const ids = sources.sources.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate source ids');
});

test('sources.json: every source has required metadata fields', () => {
  for (const s of sources.sources) {
    for (const f of ['id', 'resourceType', 'issuingAuthority', 'sourceUrl', 'retrievedAt', 'verificationStatus', 'notes']) {
      assert.ok(s[f] !== null && s[f] !== undefined && s[f] !== '', 'source ' + s.id + ' missing ' + f);
    }
    assert.ok(VALID_SOURCE_STATUS.has(s.verificationStatus), 'source ' + s.id + ' bad status ' + s.verificationStatus);
  }
});

test('sources.json: no placeholder URL is counted as verified', () => {
  for (const s of sources.sources) {
    if (s.verificationStatus === 'verified_exact' || s.verificationStatus === 'partially_verified') {
      assert.notEqual(s.sourceUrl, null, s.id + ' verified but null url');
      assert.ok(/^https?:\/\//.test(s.sourceUrl), s.id + ' verified but url not absolute: ' + s.sourceUrl);
      assert.ok(!/example\.com|placeholder|TODO|xxx/i.test(s.sourceUrl), s.id + ' verified but placeholder url');
    }
  }
});

test('sources.json: a book source is verified only with downloadable evidence (sha256, url, pages)', () => {
  const bookTypes = new Set(['student_book', 'workbook', 'teacher_guide', 'audio', 'syllabus']);
  for (const s of sources.sources) {
    if (bookTypes.has(s.resourceType) && s.verificationStatus === 'verified_exact') {
      assert.ok(/^[0-9a-f]{64}$/i.test(s.sha256 || ''), s.id + ' verified book without valid sha256');
      assert.ok(/^https?:\/\//.test(s.sourceUrl || ''), s.id + ' verified book without absolute url');
      assert.ok(Number.isInteger(s.pageCount) && s.pageCount > 0, s.id + ' verified book without positive pageCount');
      assert.ok(s.officialTitle && s.academicYear, s.id + ' verified book missing title/year');
    }
    if (bookTypes.has(s.resourceType) && s.sha256 !== null && s.sha256 !== undefined) {
      assert.ok(/^[0-9a-f]{64}$/i.test(s.sha256), s.id + ' invalid sha256');
    }
  }
});

test('sources.json: verifiedSourceCount counts verified book/audio/guide sources (no overstatement)', () => {
  const bookTypes = new Set(['student_book', 'workbook', 'teacher_guide', 'audio', 'syllabus']);
  const verifiedBooks = sources.sources.filter((s) => bookTypes.has(s.resourceType) && s.verificationStatus === 'verified_exact');
  assert.equal(sources.verifiedSourceCount, verifiedBooks.length, 'verifiedSourceCount should equal verified book/audio/guide sources');
});

test('sources.json: source request list is present and non-trivial', () => {
  assert.ok(Array.isArray(sources.sourceRequestList) && sources.sourceRequestList.length >= 10, 'sourceRequestList too short');
});

test('content_mapping.json: schema + statuses valid', () => {
  assert.equal(typeof mapping.schemaVersion, 'string');
  assert.ok(Array.isArray(mapping.validStatuses));
  assert.ok(Array.isArray(mapping.items) && mapping.items.length > 0);
  for (const it of mapping.items) {
    assert.ok(VALID_STATUS.has(it.matchStatus), 'item ' + it.itemId + ' invalid status ' + it.matchStatus);
    assert.equal(typeof it.itemId, 'string');
    assert.equal(typeof it.text, 'string');
    assert.equal(typeof it.contentType, 'string');
  }
});

test('content_mapping.json: item IDs are unique', () => {
  const ids = mapping.items.map((i) => i.itemId);
  assert.equal(new Set(ids).size, ids.length, 'duplicate item ids');
});

test('content_mapping.json: no mismatch/verified status without an authoritative source', () => {
  for (const it of mapping.items) {
    if (['verified_exact', 'verified_equivalent', 'partially_verified', 'mismatch', 'not_in_source'].includes(it.matchStatus)) {
      assert.ok(it.sourceId, 'item ' + it.itemId + ' has status ' + it.matchStatus + ' but no sourceId');
      assert.ok(sources.sources.some((s) => s.id === it.sourceId), 'item ' + it.itemId + ' references unknown source ' + it.sourceId);
    }
  }
});

test('content_mapping.json: every sourceId reference resolves to sources.json', () => {
  const known = new Set(sources.sources.map((s) => s.id));
  for (const it of mapping.items) {
    if (it.sourceId) assert.ok(known.has(it.sourceId), 'unknown source ref ' + it.sourceId + ' on ' + it.itemId);
  }
});

test('content_mapping.json: totals.byStatus matches actual item counts', () => {
  const counted = {};
  mapping.validStatuses.forEach((s) => counted[s] = 0);
  mapping.items.forEach((i) => counted[i.matchStatus]++);
  assert.deepEqual(mapping.totals.byStatus, counted, 'totals mismatch');
  assert.equal(mapping.totals.items, mapping.items.length);
});

test('content_mapping.json: supplemental items are distinguished and curriculum items carry a grade', () => {
  for (const it of mapping.items) {
    if (it.supplemental) {
      assert.ok(it.contentType.startsWith('cu') === false, 'supplemental item has curriculum contentType: ' + it.itemId);
    } else if (it.contentType === 'curriculum_word') {
      assert.ok(GRADE_IDS.includes(it.grade), 'curriculum item missing valid grade: ' + it.itemId);
    }
  }
});

test('content_mapping.json: intentional review items are flagged, not silently dropped', () => {
  const flagged = mapping.items.filter((i) => i.intentionalReview === true);
  assert.ok(flagged.length >= 1, 'expected some intentional-review flags');
});

test('content_mapping.json: covers all app banks (letters/cvc/words/phrases/sentences present)', () => {
  const banks = new Set(mapping.items.filter((i) => i.supplemental).map((i) => i.appBank));
  for (const b of ['LETTERS', 'CVC', 'WORDS', 'PHRASES', 'SENTENCES']) assert.ok(banks.has(b), 'missing bank ' + b);
});

test('alignment-report.md: exists and does not overstate alignment', () => {
  assert.ok(report.length > 500, 'report too short');
  assert.ok(/unverified/i.test(report), 'report should mention unverified items');
  assert.ok(/source/i.test(report), 'report should mention sources');
  // must not claim full/complete official alignment
  assert.ok(!/100%\s*(of\s*)?(the\s*)?(curriculum\s*)?(is\s*)?aligned/i.test(report), 'report overstates alignment (100% aligned)');
  assert.ok(/denominator/i.test(report) || /could be checked/i.test(report), 'report should state denominators clearly');
});

test('alignment-report.md: total item count is consistent with the mapping data', () => {
  const total = mapping.totals.items;
  assert.ok(report.includes(String(total)), 'report does not mention total item count ' + total);
});

test('content_mapping.json: verified items carry an evidence reference (defensible alignment)', () => {
  const verified = mapping.items.filter((i) => ['verified_exact', 'verified_equivalent', 'partially_verified'].includes(i.matchStatus));
  assert.ok(verified.length > 0, 'expected at least one verified item');
  for (const it of verified) {
    assert.ok(it.evidenceRef && it.evidenceRef.length > 10, 'verified item without evidence: ' + it.itemId);
    assert.ok(it.sourceId, 'verified item without sourceId: ' + it.itemId);
  }
});

test('content_mapping.json: supplemental items are never marked verified', () => {
  for (const it of mapping.items) {
    if (it.supplemental) {
      assert.equal(it.matchStatus, 'unverified', 'supplemental item must stay unverified: ' + it.itemId);
    }
  }
});
