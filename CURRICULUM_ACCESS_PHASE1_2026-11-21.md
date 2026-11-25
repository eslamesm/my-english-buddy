# Curriculum Access Control — Phase 1 Implementation Report

Date: 2026-11-21
Base: `My-English-Buddy-No-Legacy-SVG-Final-2026-11-20 (3).zip`

## Implemented locally

- Replaced the duplicate homepage grade selector with one Egyptian Curriculum section at the bottom of the home screen.
- Added a per-child `allowedCurricula` allowlist and a `curriculumTransition` preference to profile data.
- Existing profiles retain their previously stored `schoolYear` as a compatibility allowlist entry; no learning progress, mastery, or attempt data is migrated or rewritten.
- New child registration requires the parent to explicitly choose a school grade. Age changes no longer silently choose a curriculum.
- Parent settings can enable/disable multiple grades per child. The first enabled grade is stored as the active `schoolYear`.
- Curriculum cards, exam cards, curriculum word-bank additions, and curriculum-backed game pools are filtered to the enabled grades.
- Curriculum lesson, unit, generic mode, and exam entry points check the same allowlist before starting.
- Removing all enabled grades leaves curriculum content unavailable until a parent enables one again.
- The `auto` transition preference is stored as an opt-in to suggest progression after completion; it does not grant access automatically. Explicit parent approval remains required.

## Protected files

SHA-256 comparison against the uploaded archive confirms these files are byte-for-byte unchanged:

- `engine.js`
- `placement.js`
- `sw.js`

No learning-engine, SRS, placement-engine, speech, audio, student progress, or service-worker code was modified.

## Verification

- Inline application JavaScript: `node --check` — PASS.
- Full Node test suite: 387/387 PASS.
- Added `tests/curriculum-access-control.test.mjs` covering allowlist-based access, launch guards, filtered grade listings, and explicit registration grade selection.

## Remaining work / limitations

This is Phase 1, not the full ticket closure:

1. Historical profiles may have an age-derived `schoolYear` persisted by older app versions. Since the stored record does not identify whether the parent selected it or the old age fallback created it, Phase 1 preserves that value for backward compatibility. A parent review/confirmation migration is needed to distinguish explicit authorization safely.
2. The `auto` preference currently records the parent's desired transition policy but deliberately does not unlock a following grade. Completion criteria and parent approval UX need a separate implementation.
3. The app contains general-purpose learning banks and activities that are not fully curriculum-tagged. The curriculum-derived entries are filtered, but a complete source-by-source curriculum mapping is still required before claiming every lesson, story, activity, challenge, and review item is grade-exclusive.
4. Browser smoke-test did not complete in this environment; no claim is made that visual browser verification passed.

## Deployment

Local-only. No commit, push, or production deployment was performed.
