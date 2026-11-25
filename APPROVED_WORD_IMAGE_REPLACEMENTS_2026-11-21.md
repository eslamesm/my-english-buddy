# Approved Word Image Replacements — 2026-11-21

Applied the user-approved isolated source-image crops to the existing visual vocabulary assets.

| Word | Asset path |
|---|---|
| Bat | `assets/visual3d/repair2026/bat.png` |
| Mat | `assets/visual3d/repair2026/mat.png` |
| Cup | `assets/visual3d/library1200/cup.png` |
| Leg | `assets/visual3d/library1500/leg.png` |
| Sad | `assets/visual3d/library1500/sad.png` |
| Happy | `assets/visual3d/library1500/happy.png` |
| Angry | `assets/visual3d/library1500/angry.png` |
| Surprised | `assets/visual3d/library1500/surprised.png` |

All replacement files are standalone 512×512 RGBA PNGs with transparent backgrounds. Existing `ART_IMG_3D` keys and paths were retained; no curriculum, learning-engine, SRS, scoring, or student-progress logic was changed.

The service-worker cache key was incremented from `englishkids-v36` to `englishkids-v37` so deployed clients do not keep serving the previous image bytes at unchanged asset URLs.

This is a local development change only. No commit, push, or deployment was performed.
