# Middle pool north-west: curved planter end, white steps, brown-door wall

Task `middle-pool-north-entrance` · area **Middle pool** · priority P3 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/middle-pool.md` and the contact sheet `villacana-reference/contact-sheets/middle-pool.jpg`
- docs: `docs/MIDDLE_POOL.md`
- data: `data/middle_pool.json`, `data/objects.json`
- src: `src/middle-pool.ts`, `src/world.ts`, `src/water.ts`

## Photos to build from

- `public/photos-ref/IMG_2331.jpg`: Middle pool north: crazy-paving path opening onto the lawn and pool (ground — pin ±17.3 m)
- `public/photos-ref/IMG_2332.jpg`: Middle pool west side: path between the deck and a raised planter wall (ground — pin ±14.0 m)
- `public/photos-ref/IMG_2195.jpg`: Middle pool close up: cream deck, ladders, life rings (ground — pin ±2.1 m)
- `public/photos-ref/IMG_2192.jpg`: Crazy-paving path between hedges into the middle pool lawn (ground — pin ±4.7 m)

## Build

The curved north end of the raised planter, the white steps by the north-west entrance, and the white garden wall with a brown door and pergola entrance north of the west path.

## Do not

IMG_2331 (±17 m) and IMG_2332 (±14 m) have poor pins: place from the pool ring, path and aerial, not the pins. Correct their pins in data/photo_positions.json first.

## Done when

- [ ] pins corrected with locationBasis
- [ ] check_middle_pool.py extended
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `middle-pool-north-entrance` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
