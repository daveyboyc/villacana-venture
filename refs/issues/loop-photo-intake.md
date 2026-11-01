# Photo-to-model loop: upload photos, then one command runs the loop

Task `loop-photo-intake` · area **The whole resort** · priority P1 · tooling

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`

## Photos to build from


## Build

Slice 5 of docs/PHOTO_LOOP_PRD.md. scripts/photo_loop.py --area <id> and an agent recipe taking new Drive photos through import, tagging, solving, comparison, discrepancies and queue tasks; a short note for Dave on uploading and asking an agent to run the loop.

## Do not

Walking and collision stay paused. Do not mark looks or placement as matching without the measured or reviewed evidence the PRD requires.

## Done when

- [ ] A fresh north-pool batch runs end to end into discrepancies and tasks
- [ ] Standard handover checks pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `loop-photo-intake` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `loop-discrepancies`, `loop-measured-approval`, `loop-north-pool-fixes`, `loop-camera-solving`
