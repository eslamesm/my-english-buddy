# My English Buddy — Phase 1 Visual Integration Audit

## Scope completed in this working copy
- Integrated `assets/visual3d/map.js` into the existing application load order; it loads after the legacy art map and before the application script.
- `IMG` merges `window.ART_IMG_3D`, and `picSrc()` uses the same normalized key convention as the 404-word curriculum.
- Added the nine final vocabulary assets and repaired five normalized aliases: `getup`, `gotobed`, `gotoschool`, `shakehands`, `diningroom`.
- Added dedicated glossy color swatches for blue, red, yellow, and green; corrected the Farm, Hot, Play, and Kick mappings to more relevant available artwork.
- Updated `assets/visual3d/manifest.json` to include the normalized curriculum aliases and corrected mappings.

## Verified results
- Curriculum: 404/404 entries resolve to a real 3D asset.
- 3D map: 894 keys; zero missing target files.
- Curriculum target assets: 404/404 decode, are 512×512, and have alpha transparency.
- Unique target image files: 352; 25 files are shared across multiple curriculum entries and are listed in `PHASE1_SHARED_IMAGE_REVIEW.csv` for additional semantic review. A searchable 404-word visual gallery is included as `visual3d-vocabulary-review.html`.
- HTML static visual references: zero missing.
- All 13 screen sections remain present. Responsive viewport and CSS breakpoints are present for mobile, tablet, and desktop.
- Automated suite: 382/382 passing.
- SHA-256 hashes of `engine.js`, `placement.js`, and `sw.js` are unchanged versus the source working copy.

## Important limitations
- A live Chromium screenshot run was attempted for desktop and mobile, but Chromium did not complete startup in this execution environment (it timed out even on `about:blank`). Therefore live visual rendering and interactive mobile/desktop acceptance are **not certified** here. Static reference, responsive CSS, image decode, and automated tests did pass.
- 25 shared-image groups still need human semantic approval; a mapping/file check is not a substitute for visual review of each use. The full list is in `mab-phase1-shared-image-review.csv`.
- No GitHub commit, push, Vercel deployment, or production changes were made.
