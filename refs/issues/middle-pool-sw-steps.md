# Middle pool south-west: stone steps and the gateway at their top

Task `middle-pool-sw-steps` · area **Middle pool** · priority P1 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/middle-pool.md` and the contact sheet `villacana-reference/contact-sheets/middle-pool.jpg`
- docs: `docs/MIDDLE_POOL.md`
- data: `data/middle_pool.json`, `data/objects.json`
- src: `src/middle-pool.ts`, `src/world.ts`, `src/water.ts`

## Photos to build from

- `public/photos-ref/IMG_2333.jpg`: Middle pool south-west: stone steps up a tiled path to a gate (ground — pin ±3.0 m)
- `public/photos-ref/IMG_2332.jpg`: Middle pool west side: path between the deck and a raised planter wall (ground — pin ±14.0 m)

## Build

Three rough stone steps climbing the tiled path between the hedge and the raised planter to a white gateway with bougainvillea; the level change they imply (check against data/terrain.json).

## Do not

Do not move the planter built in data/middle_pool.json; a level change needs check_terrain.py updated, like the Cervantes steps (docs/ELENA_NORTH.md).

## Done when

- [ ] player climbs the steps one riser at a time (copy the Cervantes steps test)
- [ ] check_middle_pool.py extended
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `middle-pool-sw-steps` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
