# Ground levels: follow the laser survey instead of one 0.5 m rise

Task `terrain-from-lidar` · area **The whole resort** · priority P1 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`

## Photos to build from


## Build

The block falls about 3 m from its north-west corner to the main pool and paseo (docs/reviews/lidar-levels): Dalí +1.75 to +0.07, Cervantes +1.40 to +0.23, Picasso +1.52 to -0.90, the north pool deck +0.80 and the houses around it about +1.2 above the model. Over half the open ground within 15 m of a house is more than 0.5 m off. Build the ground from the survey's 1 m ground model (smoothed, sampled into data/terrain.json or a committed derived height grid) with the photo-read steps, ramps and raised patios in data/levels_survey.json kept as local detail, and houses keeping one level datum each.

## Do not

No raw survey rasters in the repository; commit only derived, attributed heights. Do not let interpolated ground under buildings or over pools set those levels. Keep every lane walkable.

## Done when

- [ ] scripts/lidar_check.py: open ground within 15 m of a house mostly within 0.25 m of the survey; every street profile within 0.3 m
- [ ] Pool decks within 0.15 m of the survey
- [ ] check_terrain/check_levels updated; layout browser test walks every route
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `terrain-from-lidar` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
