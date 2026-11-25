# v49 offline UI repair, internal review

## Root causes and changes

- Welcome son image and home family image were eager decorative IMG elements with no error handler. Their fixed-size boxes remained visible after an offline failure. A capture-phase handler now starts in the head, hides failed decorative images, and removes the welcome artwork's reserved space when its character is unavailable.
- The existing visual enhancer replaced emoji content with network image elements without preserving a working error fallback. It now attaches a self-contained inline SVG fallback and marks recovered containers so the observer cannot continually retry the same failing image.
- Missing system emoji glyphs also affected controls. Control icons, navigation icons, heading icons and the home profile now use inline SVG with text labels retained. Updates inside existing containers are observed too. This does not replace lesson word pictures with arbitrary UI icons; the existing per-word picture fallback stays unchanged.
- Cache version v48 to v49 only. CORE entries and fetch/cache behavior are byte-identical after normalizing that version. No new service, external icon font or precached image was added.
- Adopted the release review's preservation policy: legacy SVG files can remain, runtime must not reference them. Actual art index paths and every 3D map file are still checked. No SVG was deleted.

## Verification

525 tests pass. Separate real Chromium test: disk cache disabled, visual3d requests blocked before first visit, service worker installed, any core PNGs explicitly removed from CacheStorage, zero cached visual3d PNGs confirmed. Server process stopped before offline reload. Welcome, profile creation/manual skip and home worked. No visible broken IMG elements, no uncaught page errors, and no horizontal page overflow at 320px. Actual welcome 390px and home 320/390px screenshots inspected. Both large empty/broken artwork boxes are gone; action icons remain visible without fonts or images. Vocabulary-picture identity is outside this UI-only icon replacement.

## Authoritative mapping order

Use the map in this delta last. It includes v48's six added context lessons and the later P1 Unit 2 page audit. Do not overlay the earlier U4 audit map after this file. Page audits indicate examined sources, not full implemented curriculum coverage.

No hosted File revision, GitHub push, deployment or production change has been made.
