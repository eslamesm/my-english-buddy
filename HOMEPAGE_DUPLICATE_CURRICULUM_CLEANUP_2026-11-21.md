# Homepage Duplicate Curriculum Section Cleanup — 2026-11-21

## Scope
Removed only the duplicated bottom-of-homepage Egyptian Curriculum block. The primary `#panel-curr` curriculum section remains unchanged.

## Changes
- Removed the bottom `.home-curriculum-section` markup and `#homeCurGrid` container.
- Removed the duplicate-only `buildHomeCur()` renderer and its startup/profile-refresh calls.
- Kept `buildCurGrid()`, `#panel-curr`, `#curGrid`, `#curUnits`, and the existing `allowedCurricula()` permission filtering intact.

## Protected behavior
No curriculum records, parent settings, student progress, Learning Engine, SRS, lesson/game/story links, or other screens were changed.

## Validation
- Added `tests/home-duplicate-curriculum-section.test.mjs` for DOM retention/removal and permission-filtering invariants.
- Run the Node test suite before handoff.
- Browser responsive visual verification remains a manual check in the local development browser.

## Deployment
Local-only change. No commit, push, or deployment.
