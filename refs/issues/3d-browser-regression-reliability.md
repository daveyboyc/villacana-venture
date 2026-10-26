# Diagnose and stabilise 3D browser regressions before geometry releases

Task `3d-browser-regression-reliability` · area **The whole resort** · priority P1 · tooling

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`

## Photos to build from


## Build

Reproduce cold-start, rotation and compositor waits serially on the software renderer; separate dependency-reload navigation from frame/compositor costs. Retain every route, surface, photo-map and mobile assertion. Source capture default 30 s fails while observed overview screenshots take 32–52 s; record timings and provide useful failure diagnostics.

## Do not

Do not silently disable shadows/geometry or skip assertions to obtain a pass; do not equate a larger timeout with performance resolution.

## Done when

- [ ] Declared source/model scope and limitations retained
- [ ] Bounded comparison artifact and follow-up for every unresolved item
- [ ] Applicable HANDOVER checks and full 3D/mobile regression completed; no geometry release on unresolved browser regressions
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `3d-browser-regression-reliability` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
