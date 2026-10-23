# Middle pool south: crazy-paved forecourt and hedge inside the south gate

Task `middle-pool-south-forecourt` · area **Middle pool** · priority P2 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/middle-pool.md` and the contact sheet `villacana-reference/contact-sheets/middle-pool.jpg`
- docs: `docs/MIDDLE_POOL.md`, `docs/LEVELS.md`, `docs/MIDDLE_POOL_SOUTH_GATE.md`, `docs/MIDDLE_POOL_SW_GATEWAY.md`, `docs/MIDDLE_POOL_RAISED_PATIOS.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/middle_pool.json`, `data/objects.json`, `data/levels_survey.json`, `data/middle_pool_south_gate.json`, `data/middle_pool_north.json`, `data/middle_pool_steps.json`, `data/middle_pool_sw_gateway.json`, `data/terrain.json`, `data/raised_terraces.json`, `data/reference_packs/entrance.json`, `data/middle_pool_lane_frontages.json`
- src: `src/middle-pool.ts`, `src/world.ts`, `src/water.ts`, `src/middle-pool-south-gate.ts`, `src/middle-pool-north.ts`, `src/middle-pool-sw-gateway.ts`, `src/ramp-steps.ts`, `src/raised-terraces.ts`, `src/middle-pool-lane-frontages.ts`, `src/middle-south-planting.ts`

## Photos to build from

- `public/photos-ref/IMG_2334.jpg`: Middle pool south: iron gate in a pergola frame onto a lane (ground — pin ±1.5 m; looks at south gate, double iron leaves and the planter to its right)
- `public/photos-ref/IMG_2335.jpg`: Middle pool south: raised white planter with a blue tile panel (ground — pin ±1.5 m; looks at wall bench and blue/yellow tile panel in the west planter, inside the south gate)

## Build

Found by the photo check of the south gate (data/photo_checks.json, docs/reviews/middle-pool-south-gate/): from the IMG_2334 camera the model shows lawn either side of a crossing tiled path, where the photo shows a narrow forecourt of irregular crazy paving running about 5 m back from the gate between a tall clipped hedge on the left (east) and the white planter on the right (west). Trace the forecourt surface and the hedge line from the photos and the aerial, and check how the mapped Calle Eva/Silvia routes really meet here.

## Do not

Do not move the gate, planter or wall bench (data/middle_pool_south_gate.json) unless the trace proves them wrong; keep the forecourt level (levels_survey) and walkable; hedge is Details-only planting unless it is a structural wall.

## Done when

- [ ] check_middle_pool.py extended for the forecourt outline
- [ ] photo check of IMG_2334 recorded as matches in data/photo_checks.json
- [ ] layout browser test still walks every route both ways
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `middle-pool-south-forecourt` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `middle-pool-south-gate`
