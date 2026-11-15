# North pool: the north row's front gardens, patios and facade details

Task `north-pool-north-frontage` · area **North pool** · priority P2 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/north-pool.md` and the contact sheet `villacana-reference/contact-sheets/north-pool.jpg`
- docs: `docs/LEVELS.md`, `docs/NORTH_POOL_REVIEW.md`, `docs/RAISED_TERRACES.md`, `docs/NORTH_WEST_CANOPIES.md`, `docs/reviews/north-pool-alignment-audit/README.md`, `docs/SMOOTH_PATHS.md`
- data: `data/objects.json`, `data/levels_survey.json`, `data/raised_terraces.json`, `data/ground_plan_north_pool.json`, `data/north_west_canopies.json`
- src: `src/world.ts`, `src/water.ts`, `src/raised-terraces.ts`, `src/north-pool-gardens.ts`, `src/north-west-canopies.ts`, `src/ground-plan.ts`

## Photos to build from

- `public/photos-ref/IMG_2204.jpg`: North pool from above: whole courtyard, terraces, mountains behind (upper-floor — pin ±3.4 m; looks at The north pool)
- `public/photos-ref/IMG_2205.jpg`: North pool from above, looking north to the mountains (upper-floor — pin ±4.7 m; looks at The north pool)

## Build

Re-trace the north patios (plinth wall, white-step openings, clipped hedges) and the path and lawn edge in front of them through the solved station cameras, run the patio floors back to the house walls, and add the photographed patio furniture, parasols, awnings, bougainvillea, trees and the arch over the alley mouth.

## Do not

Do not move registry house footprints: the roof station cannot fix depth near the house fronts. Respect the route-clearance guard. Leave Walk alone.

## Done when

- [ ] IMG_2204 and IMG_2205 rendered through their solved cameras show the patios, hedges, furniture and awnings in the photographed places
- [ ] Visible in Inspect with Show details; the arch and patios in Layout
- [ ] check_raised_terraces, check_north_pool_gardens, check_north_pool_frontages and check_ground_plan pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `north-pool-north-frontage` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `pool-deck-outline`
