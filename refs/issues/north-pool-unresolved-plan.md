# North pool: resolve concealed ground edges, lane widths and remaining roof projections

Task `north-pool-unresolved-plan` · area **North pool** · priority P1 · audit

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
- `public/photos-ref/IMG_2363.jpg`: Roof by Elena: looking down the lane to the north pool lawn gate (roof — pin ±4.7 m; looks at The arched gateway at the north end of Elena)

## Build

Follow up NP-04/06/08/09/11 in docs/reviews/north-pool-alignment-audit: obtain clear ground-wall corners, complete water/deck transition, individual visible roof projections and unobscured Dalí/Picasso/Isabel access/width views. Use fixed global registration and independent held-out ground landmarks before proposing bounded plan corrections. Existing photos establish presence/order, not concealed extents.

## Do not

No hidden property polygons, repeated substitute walls/roofs, camera-pin snapping or local image warps. No assumption that unchanged registry coordinates prove accuracy.

## Done when

- [ ] Plan corrections supported by independently identifiable ground corners or stated unresolved limits
- [ ] Separate water/construction/deck edges and roof/ground footprints
- [ ] New comparisons and honest photo-check records for any built correction
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `north-pool-unresolved-plan` set to done
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `north-pool-alignment-audit`
