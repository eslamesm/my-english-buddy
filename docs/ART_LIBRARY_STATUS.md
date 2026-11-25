# My English Buddy — 3D Art Library Status

## Approved visual direction

Glossy 3D cartoon, bright purple/lavender identity with pastel blue, pink, yellow and green accents. Female characters (mother and daughter) must have full hijab coverage with no visible hair. Vocabulary assets are standalone images without embedded words or labels.

## Current inventory

- 565 independent PNG files under `assets/visual3d/`.
- 512×512 RGBA assets in the approved production batches.
- Character portraits: father, mother, son, daughter, family, cat, plus additional community-character variants.
- UI/activity icon assets: 12 independent icons.
- Vocabulary and object batches: `library100`, `library200`, `library300`, `library400`, `library500`, `library600`.
- Runtime map: `assets/visual3d/map.js` (732 keys; all targets exist after Batch 1900).
- Manifest: `assets/visual3d/manifest.json`.
- Review gallery: `visual-art-gallery.html`.

## Batch 600 — body parts and emotions (2026-11-20)

- Added 16 standalone transparent PNG illustrations at 512×512 in `assets/visual3d/library600/`.
- Concepts: boy-face, eyes, ears, nose, mouth, teeth, tongue, hands, arms, legs, feet, heart, happy-face, sad-face, angry-face, surprised-face.
- Added runtime aliases for face/head, singular/plural body-part terms, and emotion words.
- Added `library600` entries to the manifest and the gallery.
- Female character spot-check: the selected `mother.png`, `daughter.png`, and `family.png` assets show full hijab coverage with no visible hair. Some legacy/batch variants are not selected as runtime mother/daughter aliases.

## Vocabulary coverage checkpoint

- `tools/words.json`: 404 vocabulary entries.
- 255 of 404 normalized English vocabulary keys resolve directly through the 3D runtime map after Batch 1900.
- 149 entries still use the existing legacy SVG fallback. They are not counted as 3D-complete.
- The legacy art map still resolves all 404 vocabulary entries.
- Detailed row-level status: `docs/VISUAL3D_WORD_COVERAGE_AUDIT.csv`.

## Integration and protection

- The 3D map is loaded into the existing `IMG` lookup; unmatched keys retain their legacy SVG fallback.
- Original `img/art/map.js` and `img/art/index.json` remain unchanged.
- `engine.js`, `placement.js`, `sw.js`, curriculum data, localStorage behavior, scoring, SRS, speech recognition, and TTS remain unchanged.
- No GitHub commit, push, or Vercel deployment has been performed.

## Verification

- Automated Node test suite: 341 passed, 0 failed (after the current body/emotion and screen-shell tests are included).
- Inline JavaScript syntax check: passed.
- `engine.js`, `placement.js`, `sw.js`, and `assets/visual3d/map.js` syntax checks: passed.
- 3D runtime map target audit: 526 entries, 0 missing targets.
- Automated Chromium screenshot validation remains incomplete because headless Chromium timed out in this environment. Manual Chrome/Edge review is still required before final delivery.

## Batch 700 — people, places, food and actions (2026-11-20)

- Added 16 standalone 512×512 PNG assets under `assets/visual3d/library700/`.
- Concepts: men, hello, greeting, friends, classroom, playground, hair, mower, fruits, chocolate, chips, walk, run, jump, skip, throw.
- Added 15 direct vocabulary mappings; `greeting` is an additional reusable scene key, not a separate vocabulary row.
- Updated the runtime map, manifest, gallery, and row-level coverage audit.
- Assigned existing matching story scenes to the Little Bird and At the Zoo stories.

## Remaining work — not complete

1. Produce and review matching 3D illustrations for the remaining 208 vocabulary entries, including phrase/action/abstract concepts that need scene illustrations rather than arbitrary object substitutions.
2. Review all story backgrounds and game-specific illustrations.
3. Complete visual review of all 13 screens at desktop, tablet, and mobile sizes.
4. Smoke-test navigation, audio, TTS, microphone recognition, practice, games, and reports in a real browser.
5. Create the final independent ZIP only after the above gates pass.

## Batch 1900 — action scenes (2026-11-20)

- Added 10 standalone 512×512 transparent PNG illustrations under `assets/visual3d/library1900/`.
- Concepts: dig, share, visit, played, explain, suggest, compare, explore, improve, practice.
- Added direct runtime mappings and manifest entries for all ten concepts.
- Updated the row-level vocabulary audit from 245 to 255 directly linked vocabulary entries.
- Added dedicated automated checks for file signatures, dimensions, alpha channel, manifest/runtime mappings, and audit rows.
