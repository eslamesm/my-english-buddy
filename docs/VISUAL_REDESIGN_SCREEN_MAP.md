# My English Buddy — Visual Redesign Screen Map
Version: 1.0  
Status: Approved visual direction / planning artifact  
Scope: All application screens, art library, and backgrounds

## 1. Approved visual direction

The approved reference is the bright, polished, glossy 3D cartoon style supplied by the user and the approved My English Buddy home-screen concept.

Core rules:
- Rounded, friendly 3D characters with expressive faces and large, readable features.
- Bright purple/lavender as the primary identity, supported by blue, pink, yellow, and soft pastel accents.
- White or very light rounded cards, soft shadows, smooth gradients, and generous spacing.
- Illustrated environments appropriate to the activity: sky, clouds, gardens, classrooms, and story scenes.
- Vocabulary illustrations are standalone assets; the word label remains application text, not baked into the image.
- Female characters and girls must have their hair fully covered by a hijab in every scene. No visible hair.
- Keep character identity, clothing palette, proportions, and rendering consistent between assets.
- Do not use the rejected photographic/realistic family illustration style or mix it with the approved glossy 3D cartoon style.

## 2. Source-project audit

This map is based on the independent project copy inspected for this task.

| Item | Observed result |
|---|---:|
| HTML sections | 25 |
| SVG files in `img/art/` | 425 |
| Entries in `img/art/index.json` | 424 |
| Entries in `img/art/map.js` | 424 |
| Automated test files | 20 |
| Main application UI file | `index.html` |
| Learning engine | `engine.js` |
| Placement logic | `placement.js` |
| Service worker | `sw.js` |

### Asset-index note

`hero.svg` exists in `img/art/` but is not present in either `img/art/index.json` or `img/art/map.js`. The other 424 SVG asset names align with the two indexes. `hero.svg` is referenced directly by the HTML, so it must not be deleted or renamed during asset migration. This is an inventory finding, not a defect correction.

## 3. Screen-by-screen visual map

The following is a visual redesign map, not a proposal to change the behavior of these screens. Existing IDs, event handlers, data flow, and navigation destinations must be preserved.

### A. Entry and child profile

| Existing section ID | Current role evidenced by source | Visual direction |
|---|---|---|
| `screen-welcome` | Welcome / start screen | Full-bleed illustrated hero scene, approved child mascot, soft cloud/sky environment, clear primary start card/button. Keep the existing start action. |
| `screen-register` | Child registration: age, school, level, avatar, create/skip | Friendly grouped rounded cards; large selectable chips; avatar presented as a 3D character; retain all existing fields and create/skip behavior. |
| `screen-login` | “Who is playing?” profile chooser | Profile cards with consistent 3D avatars, clear child-name and selection hierarchy; preserve profile selection and add-child action. |

### B. Home and learning hub

| Existing section ID | Current role evidenced by source | Visual direction |
|---|---|---|
| `screen-home` | Main dashboard, progress, activities, levels, learning sections | Use the approved dashboard concept as the master layout: mascot/hero area, progress card, daily challenge, category/activity cards, family/character artwork, and clear navigation. Preserve all current dashboard destinations and live values. |
| `panel-session` | Daily learning session (`sessionHome`) | A focused “today’s learning” card with a clear session-start action, progress indicator, and friendly teacher/mascot illustration. |
| `panel-games` | Games catalog (`gameGrid`) | Colorful game tiles with one distinct 3D illustration per game; avoid changing game identifiers or launch handlers. |
| `panel-curr` | Egyptian curriculum by grade (`curGrid`, `curUnits`) | Grade cards with book/learning imagery, age/grade labels, progress indicators, and a clean unit list. Keep curriculum data unchanged. |
| `panel-smart` | Pronunciation / speech intelligence (`smartGrid`) | Microphone and listening visuals, calm audio-focused scene, clear skill cards; do not change recognition or speech logic. |
| `panel-similar` | Similar words (`similarGrid`) | Comparison cards that make the word distinction visually obvious; preserve existing word pairs and practice actions. |
| `panel-bank` | Word bank (`bankFilters`, `bankPractice`, `bankGrid`) | Search/filter chips and vocabulary cards using the approved standalone 3D art; preserve filters and practice behavior. |
| `panel-exam` | Exam mode (`examGrid`, `examUnits`) | Exam/worksheet visual language with clear grade and unit choices; preserve exam selection and scoring behavior. |
| `panel-stories` | Short stories (`storyListHome`) | Illustrated story covers with consistent characters and scene backgrounds; preserve story IDs and reading destinations. |
| `panel-achv` | Achievements preview (`achvGridHome`) | Trophy/badge cards with celebratory 3D icons, keeping earned/locked states and values intact. |
| `panel-rewards` | Rewards and avatars preview (`rewardsHeroHome`, `rewardsGridHome`) | Reward-shop presentation with character/avatar previews and clear reward cards; preserve purchase/unlock rules. |
| `panel-daily` | Daily challenges (`dailyListHome`) | Challenge cards with target/progress illustration and readable completion states; keep challenge logic intact. |
| `panel-lead` | Leaderboard (`leaderboard`) | Clean ranking list with avatar thumbnails, rank markers, and restrained celebration; preserve ranking data and order. |

### C. Learning and assessment flows

| Existing section ID | Current role evidenced by source | Visual direction |
|---|---|---|
| `screen-test` | Placement/assessment test (`testPrompt`, `testOpts`, `testFeedback`) | Distraction-free question canvas, large prompt art, clear answer cards, visible step progress, friendly feedback states. Do not change test flow or placement scoring. |
| `screen-practice` | Main practice flow (`practiceCard`, `teacherBar`, `progressDots`) | Central vocabulary/skill card, teacher/mascot support, clear replay/mute controls, large response area, calm progress strip. Keep audio controls and answer classification unchanged. |
| `screen-game` | Active game (`gPrompt`, `gOptions`, score/time/question count) | Immersive game scene with a focused play area, readable timer/score, large option tiles, and distinct success/error feedback. Preserve game mechanics and attempt recording. |
| `screen-reward` | Session/game completion (“Well done”) | Celebratory 3D scene, earned stars and summary cards, clear next/retry actions. Preserve summary values and callbacks. |
| `screen-report` | Parent gate and parent settings/report | Adult-oriented but visually consistent settings panel; prioritize legibility and privacy; preserve parent gate, report, print, update, and settings controls. |

### D. Rewards and content destinations

| Existing section ID | Current role evidenced by source | Visual direction |
|---|---|---|
| `screen-rewards` | Full rewards and avatars screen | Large reward hero, organized reward cards, avatar previews, clear locked/available states; preserve reward state and actions. |
| `screen-achv` | Full achievements screen | Achievement grid with consistent trophy/badge illustrations and readable progress/earned states. |
| `screen-story` | Story catalog | Large illustrated story cards, consistent character model sheets, clear reading entry points. |
| `screen-storyread` | Story reading (`storyTitle`, `storySents`, `storyQuizWrap`) | Storybook scene background, readable sentence panel, optional narration controls, quiz transition; preserve sentence content and audio sequencing. |

## 4. Shared component system

Apply consistently across screens:
1. **Navigation:** preserve current destinations and responsive behavior; visual changes only.
2. **Cards:** rounded corners, soft elevation, consistent padding, and clear selected/disabled states.
3. **Buttons:** large touch targets, strong primary/secondary hierarchy, visible focus states.
4. **Typography:** rounded, child-friendly headings; highly legible body text; maintain Arabic/English readability and directionality.
5. **Progress:** consistent stars, progress bars, completion markers, and labels.
6. **Feedback:** success, retry, hint, and disabled states must remain visually distinguishable without relying on color alone.
7. **Illustrations:** use matching 3D style and consistent scale/cropping; no text baked into vocabulary art.
8. **Backgrounds:** activity-specific scenes with restrained detail so the learning prompt remains the visual focus.

## 5. Art-library migration plan

Do not bulk-replace the existing 425 SVG files in one operation.

### Batch 0 — Character/style lock
- Lock the approved boy, father, mother, daughter, family, and cat visual identities.
- The mother and daughter must always wear full hijab coverage with no hair visible.
- Produce transparent/isolated character assets and separate scene backgrounds where needed.
- Review silhouette, expression, crop, color consistency, and image quality before proceeding.

### Batch 1 — Core high-frequency vocabulary
- Start with the most frequently used words and foundational objects/animals from the existing index.
- Generate each word as an independent image.
- Keep filenames/keys stable unless a mapping change is explicitly documented.
- Update neither `index.json` nor `map.js` until the replacement asset passes review.

### Batch 2 — Curriculum expansion
- Continue by grade/unit and verify every asset against the actual English/Arabic entry in the source index.
- Flag ambiguous or mismatched legacy artwork for human review rather than guessing.

### Batch 3 — Activities and story scenes
- Produce reusable scene backgrounds and activity-specific illustrations.
- Keep backgrounds separate from vocabulary objects wherever possible.

### Batch 4 — Remaining library and cleanup
- Complete the remaining mapped assets.
- Retain legacy files until references are audited and all tests pass.
- Remove or archive unused assets only after a reference scan confirms they are unused.

## 6. Protected implementation boundaries

The redesign must preserve:
- `engine.js` and all Learning Engine behavior.
- `placement.js` and placement/resume behavior.
- SRS, mastery, recent attempts, session events, answer classification, and game-attempt recording.
- Child profiles, localStorage keys/data, and migration behavior.
- Curriculum content and identifiers.
- Audio, TTS, microphone, and speech-recognition lifecycle.
- Existing DOM IDs, event handlers, and navigation destinations unless a separately reviewed compatibility plan is approved.

Primary visual work may touch `index.html`, CSS, and the art assets/indexing files only after the relevant batch is approved. No production repository changes, commits, or deployments are included in this planning step.

## 7. Verification gates

Each screen or art batch must pass:
- DOM/ID and event-handler compatibility check.
- Existing automated test suite.
- Visual review at desktop, tablet, and mobile sizes.
- Keyboard navigation and visible focus review.
- Text contrast and touch-target review.
- Art mapping check: every referenced image exists and points to the intended word.
- Audio/practice/game smoke tests for affected flows.

## 8. Recommended execution order

1. Approve the character/style lock and create the first six standalone character assets.
2. Build a reusable UI token/component layer.
3. Redesign the entry/profile screens.
4. Redesign the home/learning hub.
5. Redesign practice, test, and game flows.
6. Redesign stories, rewards, achievements, and parent screens.
7. Migrate the vocabulary art in reviewed batches.
8. Run full regression and visual QA before requesting production approval.
