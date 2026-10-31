# Middle pool: full-source path, tunnel and boundary inventory

Task `path-network-inventory-middle-pool` · area **Middle pool** · priority P2 · audit

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/middle-pool.md` and the contact sheet `villacana-reference/contact-sheets/middle-pool.jpg`
- docs: `docs/MIDDLE_POOL.md`, `docs/LEVELS.md`, `docs/MIDDLE_POOL_SOUTH_GATE.md`, `docs/MIDDLE_POOL_SW_GATEWAY.md`, `docs/MIDDLE_POOL_RAISED_PATIOS.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/middle_pool.json`, `data/objects.json`, `data/levels_survey.json`, `data/middle_pool_south_gate.json`, `data/middle_pool_north.json`, `data/middle_pool_steps.json`, `data/middle_pool_sw_gateway.json`, `data/terrain.json`, `data/raised_terraces.json`, `data/reference_packs/entrance.json`, `data/middle_pool_lane_frontages.json`, `data/entrance_planters.json`
- src: `src/middle-pool.ts`, `src/world.ts`, `src/water.ts`, `src/middle-pool-south-gate.ts`, `src/middle-pool-north.ts`, `src/middle-pool-sw-gateway.ts`, `src/ramp-steps.ts`, `src/raised-terraces.ts`, `src/middle-pool-lane-frontages.ts`, `src/middle-south-planting.ts`, `src/entrance-planters.ts`

## Photos to build from


## Build

Inspect every relevant full source and aerial; account for observed features, duplicates and unusable sources. Census covered connections, both path edges and wall/roof/enclosure interpretations; preserve unknowns and evidence requests.

## Do not

No guessed geometry, inferred public access, placement approval or completion from catalogue tags.

## Done when

- [ ] All available relevant full sources inspected with revision, reviewer, observations and limitations
- [ ] Every visible path, boundary and opening linked or named as a gap
- [ ] Both tunnel portals known or explicitly unresolved; aliases and identity evidence retained
- [ ] Labelled plan, annotations and tunnel sections linked; unresolved sources and tasks quantified
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `path-network-inventory-middle-pool` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `path-network-baseline`
