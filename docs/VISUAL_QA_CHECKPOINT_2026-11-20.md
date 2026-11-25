# Visual QA checkpoint — 2026-11-20

## Confirmed

- All 13 screen sections remain present: welcome, register, login, home, test, practice, game, reward, report, rewards, achievements, story catalog, and story reader.
- Shared visual CSS applies the approved rounded-card, pastel-purple, glossy visual language, with responsive rules and reduced-motion handling.
- Core practice, test, game, story, rewards, and achievement DOM hooks remain present.
- All 526 3D runtime map entries resolve to existing files.
- The row-level vocabulary audit identifies 196/404 entries with direct 3D mappings and 208/404 entries still using legacy fallback (after Batch 700).
- Mother, daughter, and family primary assets were visually inspected; the selected female characters have full hijab coverage and no visible hair.
- 347 automated tests pass after Batch 700.
- Inline JavaScript syntax checks pass; `engine.js`, `placement.js`, `sw.js`, and the 3D map syntax checks pass.
- Protected-file SHA-256 comparisons against the isolated baseline are identical for `engine.js`, `placement.js`, `sw.js`, `img/art/map.js`, and `img/art/index.json`.

## Not confirmed

- Headless Chromium screenshot generation timed out twice; therefore no automated desktop/mobile visual screenshot sign-off is claimed.
- Browser interaction smoke tests for audio, TTS, microphone recognition, navigation, practice, games, and reports remain pending manual browser validation.
- The 3D migration of all 404 vocabulary entries is incomplete (208 still fall back to legacy SVG).
- Story-specific backgrounds and all game-specific scenes have not all been redrawn.

## Release gate

Do not mark the project complete and do not create the final review ZIP until the outstanding items above are resolved and the full desktop/mobile review passes. No deployment or production repository mutation is authorized by this checkpoint.


## Batch 700 follow-up

- Added 16 independent 3D PNG assets; 15 are direct vocabulary mappings and one is a reusable greeting illustration.
- Updated manifest, runtime map, gallery, and coverage audit.
- Assigned existing forest/zoo scene assets to the Little Bird and At the Zoo story cards.
- Full automated test suite: 347 passed, 0 failed.
