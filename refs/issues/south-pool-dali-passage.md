# Open the Calle de Jorge 39–67 passage from the south-pool lawn into Pintor Dalí

Task `south-pool-dali-passage` · area **South pool** · priority P2 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/south-pool.md` and the contact sheet `villacana-reference/contact-sheets/south-pool.jpg`
- docs: `docs/SOUTH_POOL.md`, `docs/HANDOVER_SOUTH_POOL.md`, `docs/LEVELS.md`, `docs/reviews/south-pool-dali-passage/README.md`
- data: `data/south_pool.json`, `proposals/south-pool.json`, `data/levels_survey.json`
- src: `src/south-pool.ts`

## Photos to build from

- `public/photos-ref/IMG_2283.jpg`: Pintor Dalí: raised stone approach and archway (ground — pin ±2.1 m)
- `public/photos-ref/IMG_2294.jpg`: Dalí seaward end: flagstone approach to arch (ground — pin ±3.9 m)
- `public/photos-ref/IMG_2295.jpg`: Dalí seaward end: covered access and shutters (ground — pin ±3.9 m)
- `public/photos-ref/IMG_2639.jpg`: Vaulted arcade with patterned tile floor, pebble mosaic and garden gate beyond (ground — pin ±17.8 m)
- `public/photos-ref/IMG_2640.jpg`: Bougainvillea over a white arch, second arch and gate beyond, pebble mosaic floor panel (ground — pin ±28.6 m)
- `public/photos-ref/IMG_2641.jpg`: Passage to the south pool lawn: arched iron gate and Calle de Jorge plaque (ground — pin ±15.9 m)
- `public/photos-ref/IMG_2642.jpg`: Open iron gate onto crazy-paving path and south pool lawn (ground — pin ±22.0 m)
- `public/photos-ref/IMG_2645.jpg`: South pool lawn and houses (ground — pin ±2.0 m)

## Build

Cut the passage specified in docs/reviews/south-pool-dali-passage/ through 6263501UF1366S_part1, from the placed Dalí arch at (-114.15, 212.45) to the east face at (-96.9, 201.6). Flat ceilings, one open middle court, the photographed double doors, the iron gate and the 67 39 CALLE DE JORGE plaque. Carry the built 2.1 m approach width. Grade it estimated, about 2 m.

## Do not

Add the glass pool fence, move the mapped Calle Jorge centreline, or join IMG_2650, IMG_2576 or IMG_2586 to this passage. Copy the Silvia tunnel, its single-door rule or the Jorge radial fanlight, or draw a barrel vault. Place the mouth from the IMG_2639-2641 pins.

## Done when

- [ ] The void follows the stated axis and the feature trust records the 2 m limit
- [ ] gap:south-block-arcade closes once the void is in the model
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `south-pool-dali-passage` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
