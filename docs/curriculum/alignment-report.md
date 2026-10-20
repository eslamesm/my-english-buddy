# Curriculum Alignment Report — My English Buddy

- **App version:** v6.8
- **Report generated:** 2026-10-20
- **Jurisdiction:** Egypt
- **Issuing authority of record:** Ministry of Education and Technical Education (وزارة التربية والتعليم والتعليم الفني)
- **Reference academic year (verified from retrieved documents):** **2025/2026**
- **Manifests:** `docs/curriculum/sources.json`, `docs/curriculum/content_mapping.json`

## 1. Purpose and scope

This report establishes a traceable, evidence-based record of how the application's educational
content maps to Egypt's official English curriculum. It is an **audit and documentation milestone**.
No production content was changed in v6.8.

**Update (source-verification follow-up):** the official Ministry English Student Books for
**Primary 1–6 (both terms), KG1 Term 1, KG2 Term 1, Preparatory 1 Term 1 and Preparatory 2 Term 1**
were located and downloaded directly from the Ministry content host, and the items that appear in
the official **Scope & Sequence** vocabulary tables are now marked `verified_exact`. See §3, §5.

## 2. Official source discovery

The starting point was the Ministry of Education electronic learning portal
(`https://moe.gov.eg/ar/elearningenterypage/e-learning/`) and the Ministry's Electronic Library
(`https://ellibrary.moe.gov.eg/`).

Discovery results (all retrieved 2026-10-20):

| Endpoint | Result | Meaning |
| --- | --- | --- |
| `moe.gov.eg/ar/elearningenterypage/e-learning/` | empty | Rendered no content items; no downloadable books/audio/guides. |
| `ellibrary.moe.gov.eg/` | links only | Links to student-book lists for KG / Primary / Preparatory / Secondary. |
| `ellibrary.moe.gov.eg/Books-sec/` | **live** | Secondary book list; loads `./Books-sec/books.json`. |
| `ellibrary.moe.gov.eg/Books-sec/books.json` | **json catalogue** | 96 Secondary books; revealed the Ministry content-host URL scheme. |
| `ellibrary.moe.gov.eg/Books-Kindergarten/` | **HTTP 404** | Book-list page not served. |
| `ellibrary.moe.gov.eg/Books-Primary/` | **HTTP 404** | Book-list page not served. |
| `ellibrary.moe.gov.eg/Books-Preparatory/` | **HTTP 404** | Book-list page not served. |
| `madrasetnaplus.eg/` | requires auth | Official platform; content behind authentication. |

The live `Books-sec/books.json` showed every book link points to the Ministry-owned content host
`https://elearnningcontent.blob.core.windows.net/elearnningcontent/2026/...`. Following that same
scheme directly retrieved the Primary/KG/Preparatory Student Books (the level *pages* are broken,
but the *files* are still served). Third-party search results were used **only to find candidate
file names**; every recorded URL was then downloaded and inspected directly (see §3), so no
alignment rests on a third-party site.

## 3. Source verification status

Sixteen Ministry-hosted English Student Book PDFs were downloaded directly from
`elearnningcontent.blob.core.windows.net` and verified (HTTP 200, `application/pdf`, `%PDF` magic
bytes, non-zero page count, recorded SHA-256). All are the printed **2025/2026** editions.

| Grade | Term 1 book | Term 2 book | Text layer |
| --- | --- | --- | --- |
| KG1 | ✅ verified | ✗ not located | image-only (no extractable text) |
| KG2 | ✅ verified | ✗ not located | image-only (no extractable text) |
| Primary 1 | ✅ verified | ✅ verified | text; **Scope & Sequence vocabulary present** |
| Primary 2 | ✅ verified | ✅ verified | text; Scope & Sequence vocabulary present |
| Primary 3 | ✅ verified | ✅ verified | text; Scope & Sequence vocabulary present |
| Primary 4 | ✅ verified | ✅ verified | text; Scope & Sequence vocabulary present |
| Primary 5 | ✅ verified | ✅ verified | text; Scope & Sequence vocabulary present |
| Primary 6 | ✅ verified | ✅ verified | text; Scope & Sequence vocabulary present |
| Preparatory 1 | ✅ verified | ✗ not located | text; Scope & Sequence vocabulary present |
| Preparatory 2 | ✅ verified | ✗ not located | text |

| Metric | Value |
| --- | --- |
| Official **English Student Book** sources verified | **16** |
| Official Teacher Guide / audio / syllabus sources verified | **0** |
| Grades with **at least one** verified official source | **10 / 10** |
| Grades with **both terms** sourced | **6 / 10** (P1–P6) |
| Grades with explicit source-coverage status recorded | **10 / 10** |

No copyrighted textbook pages are stored in this repository. Only references, page counts, hashes
and short evidence strings are recorded.

## 4. Grades and source-coverage status

| Grade | App structure | Verified official source(s) | Coverage status |
| --- | --- | --- | --- |
| KG1 | unit-structured (Term 1, 4 units) | Term 1 Student Book | `partial_term` |
| KG2 | unit-structured (Term 1, 4 units) | Term 1 Student Book | `partial_term` |
| Primary 1 | unit-structured (Term 1 6 units, Term 2 6 units) | Term 1 + Term 2 Student Books | `full_source_retrieved` |
| Primary 2 | flat list | Term 1 + Term 2 Student Books | `full_source_retrieved` |
| Primary 3 | flat list | Term 1 + Term 2 Student Books | `full_source_retrieved` |
| Primary 4 | flat list | Term 1 + Term 2 Student Books | `full_source_retrieved` |
| Primary 5 | flat list | Term 1 + Term 2 Student Books | `full_source_retrieved` |
| Primary 6 | flat list | Term 1 + Term 2 Student Books | `full_source_retrieved` |
| Preparatory 1 | flat list | Term 1 Student Book | `partial_term` |
| Preparatory 2 | flat list | Term 1 Student Book | `partial_term` |

## 5. Items audited and mapping status

**Total application items audited: 488.**

- Curriculum-aligned vocabulary: **400**
- Supplemental (app-authored) content: **88**

### 5.1 Mapping status counts

| Status | Count | Share of all 488 | Share of curriculum items (400) |
| --- | --- | --- | --- |
| `verified_exact` | **105** | 21.5% | 26.3% |
| `verified_equivalent` | 0 | 0% | 0% |
| `partially_verified` | 0 | 0% | 0% |
| `unverified` | 383 | 78.5% | 73.8% |
| `mismatch` | 0 | 0% | 0% |
| `not_in_source` | 0 | 0% | 0% |

All **105** verified items are curriculum words confirmed **verbatim in the official Ministry
Scope & Sequence vocabulary table** for their grade/term. Every one of the **88** supplemental
(app-authored) items remains `unverified` — none is asserted to be textbook content.

### 5.2 Verified items by grade (item-level denominators)

| Grade | Curriculum items | `verified_exact` | Item verified % |
| --- | --- | --- | --- |
| KG1 | 43 | 0 | 0% |
| KG2 | 36 | 0 | 0% |
| Primary 1 | 167 | 74 | 44.3% |
| Primary 2 | 24 | 10 | 41.7% |
| Primary 3 | 22 | 3 | 13.6% |
| Primary 4 | 22 | 2 | 9.1% |
| Primary 5 | 20 | 2 | 10.0% |
| Primary 6 | 22 | 8 | 36.4% |
| Preparatory 1 | 22 | 6 | 27.3% |
| Preparatory 2 | 22 | 0 | 0% |
| **Total curriculum** | **400** | **105** | **26.3%** |

### 5.3 Denominators (stated explicitly)

- **Percentage of all application items verified against official sources: 105 / 488 = 21.5%.**
- **Percentage of curriculum items verified: 105 / 400 = 26.3%.**
- Items are marked `unverified`, **not** `not_in_source`, wherever the item could not be confirmed
  in the machine-readable text layer. This is deliberate: the official books present vocabulary
  largely as artwork/images outside the text layer, so the **absence** of a word from the text layer
  is **not** evidence that it is absent from the curriculum.
- `not_in_source` is reserved for items positively compared against a located source and not found;
  it is not used in this release.

## 6. Curriculum content by grade (app inventory)

| Grade | Curriculum items |
| --- | --- |
| KG1 | 43 |
| KG2 | 36 |
| Primary 1 (Term 1 + Term 2) | 167 |
| Primary 2 | 24 |
| Primary 3 | 22 |
| Primary 4 | 22 |
| Primary 5 | 20 |
| Primary 6 | 22 |
| Preparatory 1 | 22 |
| Preparatory 2 | 22 |
| **Total curriculum** | **400** |

## 7. Supplemental content (not officially sourced)

These banks are created for the app and are educationally appropriate but are **not** asserted to be
part of any official textbook:

| Bank | Count | Type |
| --- | --- | --- |
| LETTERS | 26 | letter + phonics word |
| CVC | 20 | consonant-vowel-consonant word |
| WORDS | 20 | basic word |
| PHRASES | 12 | daily phrase |
| SENTENCES | 10 | practice sentence |
| **Total supplemental** | **88** | |

## 8. Confirmed discrepancies and corrections

- **Confirmed discrepancies: 0.** No authoritative source contradicts any app item, so no defect can
  be confirmed and **no production content was changed** in v6.8.
- **Corrections applied: none.** The safe-correction policy permits changes only when a reliable
  source confirms the intended correction.

## 9. Audio and illustration mappings

The v6.7 curriculum audit established, within the app's own data:

- 0 curriculum words missing an illustration (SVG).
- 0 curriculum words missing a word-audio file, except a documented set of CVC words that
  intentionally fall back to text-to-speech.

Because no official audio or illustration reference was obtained, **audio/illustration association
against official sources is unverified**. This is an "ambiguous/unverified mapping" item, not a
confirmed defect.

## 10. Intentional review / recycled content

**129 items** are flagged as intentional repetitions (cross-grade / cross-unit revision or
high-frequency words, e.g. `hello`, `goodbye`, `friends`, `happy`, `sad`, `park`). These are
preserved and explicitly flagged in the mapping; none are treated as errors.

## 11. Items requiring human review

- The **383** items not confirmed in the official text layer need human review once the missing
  sources are supplied or the image-based pages are OCR-checked. In particular, all **KG1/KG2**
  items (image-only books) and all **Preparatory 2** items (no Scope & Sequence page in text layer).
- The 11 CVC words without recorded audio (TTS fallback) require confirmation that TTS is acceptable
  for the intended pronunciation.
- The single flagged illustration-vs-emoji difference carried over from v6.4 (`Bag`) still awaits a
  visual reviewer.

## 12. Missing / required documents (source-request list)

Precisely what is needed to move the remaining items from `unverified` to a verified status:

1. Official English **Student Book** PDFs for KG1 **Term 2**, KG2 **Term 2**, Preparatory 1
   **Term 2** and Preparatory 2 **Term 2** (2025/2026 or current).
2. Official English **Teacher Guides** for all ten grades.
3. Official English **audio resource packs** (listening tracks) for all ten grades.
4. An official unit-by-unit **syllabus / vocabulary list** (or OCR-enabled books) so image-based
   vocabulary can be verified.
5. Repair of the Electronic Library book-list sub-pages (books-Kindergarten/Primary/Preparatory
   currently HTTP 404), or an alternate Ministry-hosted direct-download path.

## 13. Limitations

- The Ministry book-list sub-pages returned HTTP 404; the books were still retrieved via the
  Ministry content host using the scheme exposed by `Books-sec/books.json`.
- Official English teaching material (books) was obtained for all ten grades, but only **both terms**
  for Primary 1–6; KG1/KG2/Prep1/Prep2 have Term 1 only.
- The KG1/KG2 books are image-only; their vocabulary cannot be textually verified.
- Vocabulary is frequently presented as artwork, so a word's absence from the text layer is **not**
  evidence of absence from the curriculum (`not_in_source` therefore not used).
- No claim is made that the app's content fully matches the official curriculum. Coverage is partial
  (105/400 curriculum items verified), so the report deliberately does **not** state that the
  curriculum is fully aligned.
- No physical inspector device or screen-reader environment was used for this documentation audit.

## 14. Definition of done — status

The project can now explain, for every one of the 488 items, where it came from and what evidence
supports any alignment claim. For **105** curriculum items, alignment is supported by verbatim
presence in the official 2025/2026 Ministry Scope & Sequence vocabulary. The remaining items are
explicitly marked `unverified` or `supplemental`, with a precise list of the documents required to
verify them.
