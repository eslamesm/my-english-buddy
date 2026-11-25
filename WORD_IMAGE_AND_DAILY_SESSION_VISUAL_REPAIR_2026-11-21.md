# Word Image and Daily Session Visual Repair — 2026-11-21

## Findings
- The Word Bank renderer already used `picSrc(word)`, but `assets/visual3d/map.js` overrode the approved aliases with several `repair2026` files.
- Visual inspection found that many `repair2026` PNGs were cropped fragments of review/contact-sheet layouts rather than standalone illustrations. Examples included `water`, `table`, `playground`, `walk`, `mouth`, `nose`, `eyes`, and several others.
- Daily Session cards rendered `SKILL_META` glyphs (`🔤`, etc.) instead of the selected word's own visual.

## Changes
- Repointed 28 affected word aliases to existing standalone illustrations with matching semantic content.
- Kept the already-approved standalone `bat` and `mat` images.
- Removed runtime image mappings for `board`, `kick`, `big`, and `play` where no suitable standalone illustration was available. The app now falls back to each word's own emoji rather than displaying a wrong/cropped image.
- Updated `manifest.json` to match runtime mappings and omit deliberately-unmapped fallbacks.
- Updated Daily Session cards to call `picHTML(word, emoji, ...)`, so each card uses its own mapped illustration with the matching emoji fallback.
- Added contained 88×88 session image styling; Word Bank's existing `object-fit: contain` behavior remains intact.
- Kept all original PNG files, including the suspect `repair2026` files, in the project for audit/rollback. No source images were deleted.

## Scope protection
- No changes to `engine.js`, `placement.js`, scoring, SRS, curriculum selection, recognition, audio playback, profiles, or Service Worker.
- Only `index.html`, `assets/visual3d/map.js`, `assets/visual3d/manifest.json`, and relevant regression tests were updated.

## Validation
- `node --test tests/*.mjs`: 396 passed, 0 failed.
- The image-map tests verify all mapped paths exist and the deliberately-unmapped keys use the app's emoji fallback.
