# Legacy SVG vocabulary library retirement — 2026-11-20

- Deleted 425 legacy vocabulary SVG files from `img/art/`.
- Retained application logos/icons and the 10 story/game scene SVGs outside `img/art/`.
- Removed legacy SVG map loading and fallback assignments from `index.html`.
- Vocabulary runtime image lookup now uses `assets/visual3d/map.js`; missing 3D assets fall back to each word's emoji in the existing UI renderer.
- Updated placement image references to the 3D map with an empty-path fallback.
- Removed deleted SVGs from the service-worker precache list and replaced the hero SVG with the existing family 3D PNG.
- Updated content tests to validate the new asset policy.
- No edits to `engine.js`, student data, localStorage logic, curriculum content, or audio assets.
- 3D map entries retained: 894; entries with missing files excluded from metadata: 0.
- No deployment, commit, or push performed.
