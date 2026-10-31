# Detail pilot: make the north pool courtyard look like its photos

Task `north-pool-detail-pilot` · area **North pool** · priority P1 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/north-pool.md` and the contact sheet `villacana-reference/contact-sheets/north-pool.jpg`
- docs: `docs/LEVELS.md`, `docs/NORTH_POOL_REVIEW.md`, `docs/RAISED_TERRACES.md`, `docs/NORTH_WEST_CANOPIES.md`, `docs/reviews/north-pool-alignment-audit/README.md`
- data: `data/objects.json`, `data/levels_survey.json`, `data/raised_terraces.json`, `data/north_pool_gardens.json`, `data/north_west_canopies.json`
- src: `src/world.ts`, `src/water.ts`, `src/raised-terraces.ts`, `src/north-pool-gardens.ts`, `src/north-west-canopies.ts`

## Photos to build from

- `public/photos-ref/IMG_2204.jpg`: North pool from above: whole courtyard, terraces, mountains behind (upper-floor — pin ±3.4 m; looks at The north pool)
- `public/photos-ref/IMG_2205.jpg`: North pool from above, looking north to the mountains (upper-floor — pin ±4.7 m; looks at The north pool)
- `public/photos-ref/IMG_2206.jpg`: North pool from above, west side terraces (upper-floor — pin ±4.7 m; looks at The north pool, west side)
- `public/photos-ref/IMG_2207.jpg`: Looking down over lichen-mottled barrel roof tiles to the north pool garden (upper-floor — pin ±4.7 m; looks at The north pool garden below the roof)
- `public/photos-ref/IMG_2208.jpg`: Barrel roof tiles, curved hedges and path below, pool edge (upper-floor — pin ±4.7 m; looks at The north pool garden and path below the roof)

## Build

Owner request 31 October: one well-photographed pilot area taken as far as it will go before the rest of the resort. The north pool has the most references, three solved cameras (IMG_2204-2206) and two more photos with starting poses (IMG_2207-2208, to be solved), laser-survey levels and the Blender facade-kit pilot. Work in increments, each rendered through these five cameras beside the photos (docs/reviews/north-pool-detail-pilot): (1) photo-matched surfaces in the courtyard: plaster, crazy-paving path, terracotta, barrel roof tiles, deck stone; (2) 3D planting to replace cards where the photos show it: Strelitzia, palms, clipped hedges, bougainvillea; (3) pool details built in Blender: rounded coping, ladders, life-ring stands, with the deck outline from pool-deck-outline; (4) Google satellite and photorealistic 3D tiles as extra comparison views, credited, now that Google imagery may be published. Optional later: a photo or video capture on a site visit for a scanned version of the courtyard.

## Do not

No change to registry footprints, pool rings or levels without measured evidence. Walk and collision stay as they are. Each increment keeps the resort-wide build within the existing mobile limits.

## Done when

- [ ] Before and after renders through IMG_2204-2208 for each increment
- [ ] Production build, layout and overview browser tests pass
- [ ] Standard handover checks pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `north-pool-detail-pilot` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
