# North pool: the buildings round the IMG_2204-2206 station that block the solved camera's view

Task `north-pool-station-foreground` · area **North pool** · priority P2 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/north-pool.md` and the contact sheet `reference/contact-sheets/north-pool.jpg`
- docs: `docs/LEVELS.md`, `docs/NORTH_POOL_REVIEW.md`, `docs/RAISED_TERRACES.md`, `docs/NORTH_WEST_CANOPIES.md`, `docs/reviews/north-pool-alignment-audit/README.md`, `docs/SMOOTH_PATHS.md`
- data: `data/objects.json`, `data/levels_survey.json`, `data/raised_terraces.json`, `data/ground_plan_north_pool.json`, `data/north_west_canopies.json`
- src: `src/world.ts`, `src/water.ts`, `src/raised-terraces.ts`, `src/north-pool-gardens.ts`, `src/north-west-canopies.ts`, `src/ground-plan.ts`

## Photos to build from

- `public/photos-ref/IMG_2206.jpg`: North pool from above, west side terraces (upper-floor — pin ±4.7 m; looks at The north pool, west side)
- `public/photos-ref/IMG_2205.jpg`: North pool from above, looking north to the mountains (upper-floor — pin ±4.7 m; looks at The north pool)
- `public/photos-ref/IMG_2204.jpg`: North pool from above: whole courtyard, terraces, mountains behind (upper-floor — pin ±3.4 m; looks at The north pool)

## Build

Through the solved station camera (data/photo_poses.json) the model's buildings next to the camera, a white block and a tiled pergola south-west of it, fill the left half of IMG_2206 where the photo looks over the west gardens: white garden walls with bougainvillea, a gateway, the curved white wall and the stair. In IMG_2205 the model's pergola roof covers the yucca where the photo's foreground is only a few roof tiles. Check which registry parts and generated porches stand there, against the photo and the aerial, and correct what is generated rather than registry.

## Do not

Do not move registry footprints without a measured correction. Leave Walk alone.

## Done when

- [ ] IMG_2206 rendered through the solved camera shows the west gardens
- [ ] Photo checks re-recorded
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `north-pool-station-foreground` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
