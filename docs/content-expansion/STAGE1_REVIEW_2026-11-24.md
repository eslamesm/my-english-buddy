# Stage 1 review snapshot, 24 November 2026

## Implemented in the separate development copy

- Six foundation listening/meaning supports and six beginner grammar supports: 72 keyed checks, 12 model-assisted sentence builders. Explain, model, practice, feedback and retry. No microphone or child recording needed by these new courses.
- Four additional original first-unit context lessons, six meaning checks each. KG1 greetings and feelings; P1 introduction and classroom command meaning. Grade-filtered, source-book/page-linked. Partial scope only.
- Child-specific independent results and unfinished-attempt resume. No new cap on completed history. Failure to save does not prune legacy progress. Replacing unfinished work asks first. Stale controls and late audio cannot mutate another view or child.
- Whole-word models use existing offline WAVs; phrases use device TTS with a visible notice. Failed or incomplete playback does not unlock listening answers. No isolated-phoneme or blending claims.
- Text recognition metrics are labeled as text match, not articulation accuracy. Existing scores/history and grade-transition policy unchanged. Participation certificate avoids an ambiguous combined activity percentage.
- Fixed blank certificate/report printing and report truncation. Print report flows across pages, preserving final activity row. Certificate and report controls are outside the hidden application wrapper.
- Cache v46 includes all four new runtime scripts and the 24 used word WAVs. Existing learning/grade code not replaced by a new scoring model.

## Verification

513 automated tests pass in the full suite. Browser exercises cover all six grammar keyed outcomes, all twelve assisted builders, six foundation item kinds (mocked playback for item-state plumbing only), actual whole-word playback, actual offline reload/audio, detached-control child isolation, late audio cancellation, failed-save rollback, 20-second never-finishing WAV failure, final-result retry, per-course history retention across reload, grade-filtered contextual activities, and declining unfinished-attempt replacement.

Visual review includes 320/390/1280 lesson/list/result layouts, 320 report detail, actual rendered A4 participation certificate, and all three pages of a seeded report. Browser mock audio is not a review of sound quality or proof of learning effectiveness.

## Not complete

This snapshot does not complete the Ministry curriculum, either audited first unit, the second course-expansion phase, isolated phoneme references, tracing, all listening/oral tasks, or official assessments. It does not establish independent KG reading usability: a parent is asked to assist non-readers. T2 books, guides and official audio availability remain open beyond checked sources. P1 existing two-term vocabulary gate is not evidence of current full-year objective coverage.

Official first-unit references and audit details are in the two page-audit documents and the first-slice map. Those distinguish vocabulary overlap, missing activity, independent support and partial contextual implementation. No source textbook art/dialogue or PDF bytes are application assets.

## Release state

Local review only. No GitHub push, live deployment, paid voice service or settings change performed in this work. Delivered cache-v44 cumulative patch remains unchanged. Merge with the older GitHub source, clean application test, final review and production rollback route remain release gates.
