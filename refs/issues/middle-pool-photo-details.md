# Middle pool: photo-backed shower, flush covers and east-gate scrollwork

Task `middle-pool-photo-details` · area **Middle pool** · priority P1 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/middle-pool.md` and the contact sheet `villacana-reference/contact-sheets/middle-pool.jpg`
- docs: `docs/MIDDLE_POOL.md`, `docs/LEVELS.md`, `docs/MIDDLE_POOL_SOUTH_GATE.md`, `docs/MIDDLE_POOL_SW_GATEWAY.md`, `docs/MIDDLE_POOL_RAISED_PATIOS.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/middle_pool.json`, `data/objects.json`, `data/levels_survey.json`, `data/middle_pool_south_gate.json`, `data/middle_pool_north.json`, `data/middle_pool_steps.json`, `data/middle_pool_sw_gateway.json`, `data/terrain.json`, `data/raised_terraces.json`, `data/reference_packs/entrance.json`, `data/middle_pool_lane_frontages.json`, `data/entrance_planters.json`
- src: `src/middle-pool.ts`, `src/world.ts`, `src/water.ts`, `src/middle-pool-south-gate.ts`, `src/middle-pool-north.ts`, `src/middle-pool-sw-gateway.ts`, `src/ramp-steps.ts`, `src/raised-terraces.ts`, `src/middle-pool-lane-frontages.ts`, `src/middle-south-planting.ts`, `src/entrance-planters.ts`

## Photos to build from

- `public/photos-ref/IMG_2193.jpg`: Middle pool, lawn and terraces behind (ground — pin ±4.7 m)
- `public/photos-ref/IMG_2194.jpg`: Middle pool, lawn and terraces behind (second shot) (ground — pin ±4.7 m)
- `public/photos-ref/IMG_2679.jpg`: Middle pool lawn with crazy-paving path and glass-fenced pool, looking west (ground — pin ±2.9 m)
- `public/photos-ref/IMG_2332.jpg`: Middle pool west side: path between the deck and a raised planter wall (ground — pin ±2.0 m)
- `public/photos-ref/IMG_2713.jpg`: Crazy-paving path round the glass-fenced middle pool (ground — pin ±2.4 m)
- `public/photos-ref/IMG_2340.jpg`: Calle Eva: east gateway into the middle pool courtyard (ground — pin ±4.7 m)

## Build

Add the observed curved stainless shower beside the east life ring, dark concentric slotted west-path cover, distinct pale deck access cap and curled iron motifs within the existing east gateway leaf. Compare Inspect Layout and Details with the full photos.

## Do not

Retain pool/house/deck footprints, terrain and all existing gate transforms. No safety fence. Estimated fitting anchors are not calibrated placement approval.

## Done when

- [ ] Photo observations and before/after Inspect renders recorded
- [ ] Pool level, deck outline, route clearance and gate opening retained
- [ ] Source and form independently reviewed; uncertain placement explicitly retained
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `middle-pool-photo-details` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
