# North pool: smooth paths, patios and green spaces with their edges and boundaries

Task `ground-plan-north-pool` · area **North pool** · priority P2 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/north-pool.md` and the contact sheet `villacana-reference/contact-sheets/north-pool.jpg`
- docs: `docs/LEVELS.md`, `docs/NORTH_POOL_REVIEW.md`, `docs/RAISED_TERRACES.md`, `docs/NORTH_WEST_CANOPIES.md`, `docs/reviews/north-pool-alignment-audit/README.md`
- data: `data/objects.json`, `data/levels_survey.json`, `data/raised_terraces.json`, `data/north_pool_gardens.json`, `data/north_west_canopies.json`
- src: `src/world.ts`, `src/water.ts`, `src/raised-terraces.ts`, `src/north-pool-gardens.ts`, `src/north-west-canopies.ts`

## Photos to build from


## Build

Trace the area's paths, patios and green spaces as smooth vector shapes from the georeferenced aerial and the photos, with what bounds each (kerb, brick border, planter wall, hedge, patio wall with openings, fence), and bring the existing features under the ground plan (north_pool_gardens.json, raised_terraces.json, north_west_canopies.json). The raster ground classes give way to the traced shapes. Photo-check from the area's best cameras.

## Do not

Do not move registry footprints or pool rings without a measured correction. Keep lanes and openings clear. Untraced edges become gaps or inferred, never repeated invented walls. Leave Walk alone.

## Done when

- [ ] check_ground_plan.py passes for the area
- [ ] Photo checks recorded
- [ ] Visible in Inspect Layout and with Show details
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `ground-plan-north-pool` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `ground-plan-framework`
