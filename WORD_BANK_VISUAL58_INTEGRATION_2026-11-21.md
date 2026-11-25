# Word Bank — 58 Reviewed Vocabulary Images Integration

## Scope
Integrated the 58 reviewed vocabulary PNGs into the existing Word Bank presentation without creating duplicate curriculum records.

## Findings and implementation
- All 58 reviewed terms already exist in the P1 curriculum vocabulary source (`CUR_WORDS.p1`).
- The Word Bank already sources P1 vocabulary through the parent's enabled-curriculum allowlist, so the terms remain subject to the existing parent curriculum access rules.
- The gap was visual: Word Bank cards displayed emoji only, even when an approved 3D PNG existed.
- Added all 58 reviewed 512x512 RGBA PNG files under `assets/visual3d/vocabulary-repair-2026-11-20/`.
- Merged all 58 normalized keys into `assets/visual3d/map.js`, preserving the existing map entries and pointing each reviewed key to its corresponding PNG.
- Updated Word Bank cards to display `picSrc(word)` when a mapped illustration exists, with the previous emoji as fallback.
- Added a focused regression test covering all 58 curriculum terms, map entries, physical image files, and Word Bank image rendering.

## Protected scope
- No changes to `engine.js`, `placement.js`, `sw.js`, curriculum records, parent access rules, scoring, SRS, student data, or localStorage schema.
- No commit, push, or deployment.

## Validation
- `node --check assets/visual3d/map.js`: PASS
- Focused Word Bank integration tests: 2/2 PASS
- Full Node test suite: 389/389 PASS
- Existing map-integrity tests confirm all runtime image paths resolve to real files.
