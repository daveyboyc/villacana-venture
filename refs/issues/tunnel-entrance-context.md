# Check pool-to-gate spacing and build photo-supported tunnel entrance context

Task `tunnel-entrance-context` · area **Middle pool** · priority P1 · build

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/middle-pool.md` and the contact sheet `villacana-reference/contact-sheets/middle-pool.jpg`
- docs: `docs/MIDDLE_POOL.md`, `docs/LEVELS.md`, `docs/MIDDLE_POOL_SOUTH_GATE.md`, `docs/MIDDLE_POOL_SW_GATEWAY.md`, `docs/MIDDLE_POOL_RAISED_PATIOS.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/middle_pool.json`, `data/objects.json`, `data/levels_survey.json`, `data/middle_pool_south_gate.json`, `data/middle_pool_north.json`, `data/middle_pool_steps.json`, `data/middle_pool_sw_gateway.json`, `data/terrain.json`, `data/raised_terraces.json`, `data/reference_packs/entrance.json`, `data/middle_pool_lane_frontages.json`
- src: `src/middle-pool.ts`, `src/world.ts`, `src/water.ts`, `src/middle-pool-south-gate.ts`, `src/middle-pool-north.ts`, `src/middle-pool-sw-gateway.ts`, `src/ramp-steps.ts`, `src/raised-terraces.ts`, `src/middle-pool-lane-frontages.ts`, `src/middle-south-planting.ts`

## Photos to build from

- `public/photos-ref/IMG_2334.jpg`: Middle pool south: iron gate in a pergola frame onto a lane (ground — pin ±1.5 m; looks at south gate, double iron leaves and the planter to its right)
- `public/photos-ref/IMG_2335.jpg`: Middle pool south: raised white planter with a blue tile panel (ground — pin ±1.5 m; looks at wall bench and blue/yellow tile panel in the west planter, inside the south gate)
- `public/photos-ref/IMG_2189.jpg`: Calle Silvia north: tiled lane looking to the middle pool south gateway (ground — pin ±3.0 m; looks at The middle pool south gateway at the end of Calle Silvia north, about 28 m ahead)
- `public/photos-ref/IMG_2190.jpg`: Covered arched passage with potted plants, patterned tiles (ground — pin ±3.5 m)
- `public/photos-ref/IMG_2191.jpg`: Passage plaque reading CALLE SILVIA 1-15 (ground — pin ±3.5 m)
- `public/photos-ref/IMG_2192.jpg`: Crazy-paving path between hedges into the middle pool lawn (ground — pin ±4.7 m)

## Build

Independently compare full photos and satellite imagery against the current pool/gate/bench/planter and tunnel entrance. Build bounded photo-supported entrance details; correct spacing only when actual source anchors support it, and keep candidate/unseen extents explicit.

## Do not

Do not confuse the separate Silvia covered passage with the pool pergola gate, infer identity from GPS or contact order, move the registry pool/house footprints, or manufacture placement approval.

## Done when

- [ ] Public-safe annotated satellite/model overlay and independently reviewed source comparison
- [ ] Map, 3D and collision use matching outlines for any supported changes
- [ ] Actual before/after views and route checks; unresolved placement remains open
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `tunnel-entrance-context` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
