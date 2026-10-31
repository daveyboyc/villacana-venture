# North pool: trace the deck outline and squared deck tongue from the solved cameras

Task `pool-deck-outline` · area **North pool** · priority P1 · build

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

## Build

Through the solved IMG_2204-2206 cameras the pool deck in the photos is a fairly even band about 1.5-2 m wide with a straight-edged tongue reaching into the pool east of the steps, where the plant-room box stands. The model's deck comes from the 0.25 m cover classes, wider in places and stair-stepped. Trace the deck edge against the photos and the aerial, keep the registry water ring, and record measured residuals.

## Do not

Do not move the water ring without measured evidence. No glass fence.

## Done when

- [ ] Deck edge residuals measured through the solved cameras
- [ ] Placement packet per docs/PLACEMENT_VERIFICATION.md
- [ ] Standard handover checks pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `pool-deck-outline` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `pool-detail`
