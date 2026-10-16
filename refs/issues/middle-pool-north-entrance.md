# Middle pool north-west: curved planter end, white steps, brown-door wall

Task `middle-pool-north-entrance` · area **Middle pool** · priority P3 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/middle-pool.md` and the contact sheet `villacana-reference/contact-sheets/middle-pool.jpg`
- docs: `docs/MIDDLE_POOL.md`, `docs/LEVELS.md`, `docs/MIDDLE_POOL_SOUTH_GATE.md`
- data: `data/middle_pool.json`, `data/objects.json`, `data/levels_survey.json`, `data/middle_pool_south_gate.json`, `data/middle_pool_north.json`
- src: `src/middle-pool.ts`, `src/world.ts`, `src/water.ts`, `src/middle-pool-south-gate.ts`, `src/middle-pool-north.ts`

## Photos to build from

- `public/photos-ref/IMG_2331.jpg`: Middle pool north: crazy-paving path opening onto the lawn and pool (ground — pin ±2.0 m)
- `public/photos-ref/IMG_2332.jpg`: Middle pool west side: path between the deck and a raised planter wall (ground — pin ±2.0 m)
- `public/photos-ref/IMG_2195.jpg`: Middle pool close up: cream deck, ladders, life rings (ground — pin ±2.1 m)
- `public/photos-ref/IMG_2192.jpg`: Crazy-paving path between hedges into the middle pool lawn (ground — pin ±4.7 m)

## Levels from the photos

From `data/levels_survey.json` (check with `scripts/check_levels.py`).

- `middle-pool-nw-rise` (steps): 0.3-0.55 m above the path between the planter and the pool fence, medium confidence at (-138.5, 88.5) ±3 m. Model: **built**, task `middle-pool-north-entrance`. Read by Claude on 15 October after Dave pointed out the missing slopes. IMG_2332: looking north-north-west along the path between the raised planter and the pool fence, the paving rises at the planter's north end to a pergola gate and a white garden wall with a brown door; a white riser face shows under the upper paving. IMG_2331 (pin +-17 m), looking south-east down the north-west path, shows two or three white-nosed steps climbing to the right at the same corner. So the ground behind the planter is the upper (Dalí-side) level. The terrain now rises behind the planter (data/terrain.json), but the steps and the pergola gate are not built. Issue 48 source pass adds three white steps using the shared ramp-steps mechanism, following the existing 0-to-0.5 m terrain rise with tread-minus-siteY offsets only; no extra plateau. Pergola and short brown-door wall added as bounded fragments. Flight alignment and tread spacing remain estimates; final browser and image review pending. (IMG_2332.jpg, IMG_2331.jpg)

## Build

The curved north end of the raised planter, the white steps by the north-west entrance, and the white garden wall with a brown door and pergola entrance north of the west path. The steps climb about 0.3-0.55 m from the courtyard path to the upper level behind the planter, which the terrain already gives; build them like data/middle_pool_steps.json. Heights: data/levels_survey.json item middle-pool-nw-rise.

## Do not

IMG_2331 (±17 m) and IMG_2332 (±14 m) have poor pins: place from the pool ring, path and aerial, not the pins. Correct their pins in data/photo_positions.json first.

## Done when

- [ ] pins corrected with locationBasis
- [ ] check_middle_pool.py extended
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `middle-pool-north-entrance` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
