# Middle pool west: distinguish the crazy-paved pool path from the tiled Elena approach

Task `middle-pool-west-path-material` · area **Middle pool** · priority P2 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/middle-pool.md` and the contact sheet `villacana-reference/contact-sheets/middle-pool.jpg`
- docs: `docs/MIDDLE_POOL.md`, `docs/LEVELS.md`, `docs/MIDDLE_POOL_SOUTH_GATE.md`, `docs/MIDDLE_POOL_SW_GATEWAY.md`, `docs/MIDDLE_POOL_RAISED_PATIOS.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/middle_pool.json`, `data/objects.json`, `data/levels_survey.json`, `data/middle_pool_south_gate.json`, `data/middle_pool_north.json`, `data/middle_pool_steps.json`, `data/middle_pool_sw_gateway.json`, `data/terrain.json`, `data/raised_terraces.json`, `data/reference_packs/entrance.json`, `data/middle_pool_lane_frontages.json`, `data/entrance_planters.json`
- src: `src/middle-pool.ts`, `src/world.ts`, `src/water.ts`, `src/middle-pool-south-gate.ts`, `src/middle-pool-north.ts`, `src/middle-pool-sw-gateway.ts`, `src/ramp-steps.ts`, `src/raised-terraces.ts`, `src/middle-pool-lane-frontages.ts`, `src/middle-south-planting.ts`, `src/entrance-planters.ts`

## Photos to build from

- `public/photos-ref/IMG_2332.jpg`: Middle pool west side: path between the deck and a raised planter wall (ground — pin ±2.0 m; looks at Middle pool west stone path, round drain, planter and separate deck lid)
- `public/photos-ref/IMG_2713.jpg`: Crazy-paving path round the glass-fenced middle pool (ground — pin ±2.4 m; looks at Middle pool west path, drain and deck lid looking towards northwest entrance)

## Build

A high Inspect render shows a tiled Elena route band over the west pool path where both source photos show irregular stone paving. Trace the bounded transition from at least two source views and the aerial before replacing that local material; do not change the entire Elena lane. New round drain follows the currently drawn surface height so it remains visible while this discrepancy stays open.

## Do not

Do not move pool/deck rings, route axes, planter or terrain, or infer hidden path edges.

## Done when

- [ ] Bounded material transition established from source content
- [ ] Inspect from west path and pool side matches photographed paving ordering
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `middle-pool-west-path-material` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
