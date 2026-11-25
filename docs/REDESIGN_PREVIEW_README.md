# My English Buddy — Visual Redesign Preview

## Scope of this preview
This is an isolated review build based on the supplied v7.0 project copy. It applies the approved glossy 3D / pastel-purple visual direction as a presentation layer across the existing application screens while preserving existing screen IDs, navigation hooks, form controls, and learning flows.

## Included
- `index.html`: presentation-only CSS layer for welcome, registration, login, dashboard, learning panels, placement test, practice, game, report, stories, rewards, achievements, and profile-related screens.
- `docs/VISUAL_REDESIGN_SCREEN_MAP.md`: screen-by-screen design map and protected boundaries.
- `docs/art/STYLE_REFERENCE_PILOT_BOARD.png`: a visual reference board only; it is not wired as a vocabulary sprite sheet.

## Explicitly unchanged
- `engine.js`
- `placement.js`
- `sw.js`
- `img/art/map.js`
- `img/art/index.json`
- Existing SVG vocabulary assets and audio files
- Curriculum, profile storage, learning state, scoring, speech recognition, TTS, and game-attempt logic

## Important art-library status
The approved 3D art pilot now contains 565 independent PNG files across the art batches (not all mapped to vocabulary): 6 core character portraits, 27 object/vocabulary illustrations, and 12 UI/activity icons. The pilot assets are catalogued in `assets/visual3d/manifest.json` and can be inspected in `visual-art-gallery.html`. The welcome screen, supported emoji UI icons, and a limited set of high-frequency vocabulary keys use these assets. The original 424-entry `img/art/` index remains intact. The 3D runtime map currently resolves 158 of 404 entries in `tools/words.json`; the remaining 246 continue to use the legacy SVG fallback. This is an incremental migration, not a completed replacement of the full art library.

## Validation
- Automated Node test suite: 338 passed, 0 failed (includes the library600 integrity and mapping checks) (includes 5 visual-asset integrity checks).
- `node --check engine.js`, `placement.js`, and `sw.js`: passed.
- Automated browser screenshot validation remains incomplete: headless Chromium did not finish within the build environment timeout. Manual Chrome/Edge visual review is still required before calling the redesign complete.

## Safety of deployment
This is a review ZIP only. No GitHub commit, push, Vercel deployment, or production change was performed.
