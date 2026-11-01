# Photo-to-model loop: placement gate accepts measured, agent-reviewed changes

Task `loop-measured-approval` · area **The whole resort** · priority P1 · tooling

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`

## Photos to build from


## Build

Slice 2 of docs/PHOTO_LOOP_PRD.md. placement_verification.py and check_placement_changes.py accept the 'Measured approval' records in docs/PLACEMENT_VERIFICATION.md (two solved cameras or one plus the aerial, rms <= 0.3 m with worst and held-out points, reviewed by a different agent). Stop flagging features whose geometry is unchanged when only shared renderer code changed.

## Do not

Walking and collision stay paused. Do not mark looks or placement as matching without the measured or reviewed evidence the PRD requires.

## Done when

- [ ] Tests: valid record accepted; self-review, single source, over-tolerance and stale records rejected
- [ ] Renderer-only edits no longer flag unchanged features
- [ ] Standard handover checks pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `loop-measured-approval` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
