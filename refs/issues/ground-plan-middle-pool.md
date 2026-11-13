# Middle pool: smooth paths, patios and green spaces with their edges and boundaries

Task `ground-plan-middle-pool` · area **Middle pool** · priority P2 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/middle-pool.md` and the contact sheet `villacana-reference/contact-sheets/middle-pool.jpg`
- docs: `docs/MIDDLE_POOL.md`, `docs/LEVELS.md`, `docs/MIDDLE_POOL_SOUTH_GATE.md`, `docs/MIDDLE_POOL_SW_GATEWAY.md`, `docs/MIDDLE_POOL_RAISED_PATIOS.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/middle_pool.json`, `data/objects.json`, `data/levels_survey.json`, `data/middle_pool_south_gate.json`, `data/middle_pool_north.json`, `data/middle_pool_steps.json`, `data/middle_pool_sw_gateway.json`, `data/terrain.json`, `data/raised_terraces.json`, `data/reference_packs/entrance.json`, `data/middle_pool_lane_frontages.json`, `data/entrance_planters.json`
- src: `src/middle-pool.ts`, `src/world.ts`, `src/water.ts`, `src/middle-pool-south-gate.ts`, `src/middle-pool-north.ts`, `src/middle-pool-sw-gateway.ts`, `src/ramp-steps.ts`, `src/raised-terraces.ts`, `src/middle-pool-lane-frontages.ts`, `src/middle-south-planting.ts`, `src/entrance-planters.ts`

## Photos to build from


## Build

Trace the area's paths, patios and green spaces as smooth vector shapes from the georeferenced aerial and the photos, with what bounds each (kerb, brick border, planter wall, hedge, patio wall with openings, fence), and bring the existing features under the ground plan (middle_pool.json, middle_pool_lane_frontages.json, middle_pool_south_gate.json, middle_pool_sw_gateway.json, junction_lawns.json). The raster ground classes give way to the traced shapes. Photo-check from the area's best cameras.

## Do not

Do not move registry footprints or pool rings without a measured correction. Keep lanes and openings clear. Untraced edges become gaps or inferred, never repeated invented walls. Leave Walk alone.

## Done when

- [ ] check_ground_plan.py passes for the area
- [ ] Photo checks recorded
- [ ] Visible in Inspect Layout and with Show details
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `ground-plan-middle-pool` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `ground-plan-framework`
