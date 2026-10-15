# Middle pool south-west: stone steps and the gateway at their top

Task `middle-pool-sw-steps` · area **Middle pool** · priority P1 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/middle-pool.md` and the contact sheet `villacana-reference/contact-sheets/middle-pool.jpg`
- docs: `docs/MIDDLE_POOL.md`, `docs/LEVELS.md`
- data: `data/middle_pool.json`, `data/objects.json`, `data/levels_survey.json`
- src: `src/middle-pool.ts`, `src/world.ts`, `src/water.ts`

## Photos to build from

- `public/photos-ref/IMG_2333.jpg`: Middle pool south-west: stone steps up a tiled path to a gate (ground — pin ±3.0 m)
- `public/photos-ref/IMG_2332.jpg`: Middle pool west side: path between the deck and a raised planter wall (ground — pin ±14.0 m)
- `public/photos-ref/IMG_2331.jpg`: Middle pool north: crazy-paving path opening onto the lawn and pool (ground — pin ±17.3 m)
- `public/photos-ref/IMG_2245.jpg`: Middle pool lobe, deck and glass fence close up (ground — pin ±2.3 m)

## Levels from the photos

From `data/levels_survey.json` (check with `scripts/check_levels.py`).

- `middle-pool-sw-rise` (steps): 0.45-0.55 m above the middle pool courtyard, high confidence at (-135, 101) ±3 m. Model: **missing**, task `middle-pool-sw-steps`. Three rough stone steps with a steep terracotta ramp of 1.5-2 m beside them, from the courtyard's crazy paving up to the south-west lane; the lane climbs a little more to the gateway 8-10 m on, then is level. This is the same 0.5 m western rise as Cervantes: the terrain foot line (data/terrain.json) passes about 6 m further west, so the model keeps this lane flat. (IMG_2333.jpg, IMG_2331.jpg, IMG_2245.jpg)

## Build

Three rough stone steps (rise 0.45-0.55 m) with a steep terracotta ramp of 1.5-2 m beside them, climbing from the courtyard's crazy paving between the hedge and the raised planter to the south-west lane, and the white gateway with bougainvillea 8-10 m on. This is the same 0.5 m western rise as Cervantes: move the terrain foot line (data/terrain.json) east to the steps here with a short local run, as was done for Cervantes. Heights: data/levels_survey.json item middle-pool-sw-rise.

## Do not

Do not move the planter built in data/middle_pool.json. The middle pool ring, deck and lawn must stay at 0 (check_terrain.py 'pools level'); the east gateway and the south pergola gate are photographed level, so the rise stays west of them.

## Done when

- [ ] player climbs the steps one riser at a time (copy the Cervantes steps test)
- [ ] check_middle_pool.py extended
- [ ] check_terrain.py updated; check_levels.py shows middle-pool-sw-rise ok and the item marked built
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `middle-pool-sw-steps` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
