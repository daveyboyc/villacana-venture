# North pool: gated patio walls, near block and yucca round the station camera

Task `north-pool-station-details` · area **North pool** · priority P3 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/north-pool.md` and the contact sheet `villacana-reference/contact-sheets/north-pool.jpg`
- docs: `docs/LEVELS.md`, `docs/NORTH_POOL_REVIEW.md`, `docs/RAISED_TERRACES.md`, `docs/NORTH_WEST_CANOPIES.md`, `docs/reviews/north-pool-alignment-audit/README.md`, `docs/SMOOTH_PATHS.md`
- data: `data/objects.json`, `data/levels_survey.json`, `data/raised_terraces.json`, `data/ground_plan_north_pool.json`, `data/north_west_canopies.json`
- src: `src/world.ts`, `src/water.ts`, `src/raised-terraces.ts`, `src/north-pool-gardens.ts`, `src/north-west-canopies.ts`, `src/ground-plan.ts`

## Photos to build from

- `public/photos-ref/IMG_2206.jpg`: North pool from above, west side terraces (upper-floor — pin ±4.7 m; looks at The north pool, west side)
- `public/photos-ref/IMG_2208.jpg`: Barrel roof tiles, curved hedges and path below, pool edge (upper-floor — pin ±4.7 m; looks at The north pool garden and path below the roof)
- `public/photos-ref/IMG_2205.jpg`: North pool from above, looking north to the mountains (upper-floor — pin ±4.7 m; looks at The north pool)

## Build

Through the solved station camera, IMG_2206 and IMG_2208 show two white patio walls about 1.8 m high with curved cappings and brown plank doors south of the west path, with bougainvillea and plumbago over them and a terracotta patio with a parasol behind (floor casts to about -184, 31.8). The model has generated 1 m garden walls in the right place (skeleton gardenWalls) but not their height, cappings or doors. Build them as photographed where the casts allow; door positions need a ground-level photo (evidence request north-pool-gated-patio-gates). Also: registry part3's notch corner (-179.4, 33.7) projects about 0.4-0.5 m east of the photo's edge and the near block reads about 1 m taller in IMG_2206 (one camera; needs a second camera or lidar before a measured correction); the yucca o13 is dropped by the route-clearance guard (gap:north-pool-station-yucca). Also check the generated tiled porch roof at the top left of IMG_2206 (registry part2, west of the plain-fronts boxes), where the photo shows a plain white wall with a climber.

## Do not

Do not move registry footprints without a measured correction (two solved cameras, or one plus the aerial, within 0.3 m rms, and a second-agent review). Do not bypass the route-clearance guard. Leave Walk alone.

## Done when

- [ ] IMG_2206 and IMG_2208 rendered through the solved camera show the gated patio walls
- [ ] Photo checks re-recorded
- [ ] Visible in Inspect with Show details
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `north-pool-station-details` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `north-pool-station-foreground`
