# Main pool: the rest of the ground plan (lawn outline, planted strip, terraces and deck edges)

Task `ground-plan-main-pool` · area **Main pool** · priority P2 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/main-pool.md` and the contact sheet `villacana-reference/contact-sheets/main-pool.jpg`
- docs: `docs/MAIN_POOL.md`, `docs/SMOOTH_PATHS.md`
- data: `data/main_pool.json`, `data/guillermo_slope.json`, `data/seafront_fence.json`, `data/main_pool_lawn.json`, `data/ground_plan_main_pool.json`
- src: `src/main-pool.ts`, `src/pool-levels.ts`, `src/lowered-lanes.ts`, `src/seafront-fence.ts`, `src/main-pool-lawn.ts`, `src/ground-plan.ts`

## Photos to build from

- `public/photos-ref/IMG_2598.jpg`: Lawn and flowering lantana border looking east to the Barraka restaurant (ground — pin ±2.4 m; looks at Barraka beach restaurant)
- `public/photos-ref/IMG_2603.jpg`: Pink lawn path with bollard lights and a pool-side white curved-roof building (ground — pin ±2.2 m; looks at pink lawn path to the main pool with bollards and a slatted bin beside it)
- `public/photos-ref/IMG_2760.jpg`: Large lawn towards the Barraka building (ground — pin ±10.8 m; looks at the big lawn towards Barraka, the hedge along the sea railing and the service lid)
- `public/photos-ref/IMG_2764.jpg`: Main pool lawn and the wave-roofed building (ground — pin ±3.8 m; looks at tall slender palm on the main-pool lawn, the pool and the wave-roofed building beyond)
- `public/photos-ref/IMG_2765.jpg`: Main pool lawn and wave-roofed building, second view (ground — pin ±3.9 m; looks at pink path to the main pool, the tall palm at the pool corner and the wave-roofed building)
- `public/photos-ref/IMG_2773.jpg`: Lane beside the main pool with a lantana planter wall (ground — pin ±2.5 m; looks at Calle Guillermo north of the Jorge junction: octagon and square tiles, the lantana planter wall on the east side)
- `public/photos-ref/IMG_2774.jpg`: Octagonal-paved lane beside the lantana planter (ground — pin ±4.7 m; looks at the lantana planter wall along Calle Guillermo, about a metre high, with the yucca clump behind it)
- `public/photos-ref/IMG_2777.jpg`: Marble-edged steps down to the main pool deck (ground — pin ±2.0 m; looks at marble nosing and blue risers at the top of Enrique's steps, terracotta paving and the pool below)

## Build

The lawn's paths, inner path and apron are in data/ground_plan_main_pool.json. Trace the rest of the area the same way from the aerial and the photos: the big lawn's outline, the planted strip with palms and loungers by the Guillermo wall (IMG_2765) and its edge, the east path from the toddler pool (the pale line on the aerial), the paving round the kiosk where IMG_2762/2763 show lawn, and the pool deck's outer edge; move the lawn walls, hedge and white rooms (main_pool_lawn.json rooms, hedge) into the plan as edges where they bound a surface.

## Do not

Do not move the registry pool rings or the kiosk footprint without a measured correction. Leave Walk alone.

## Done when

- [ ] check_ground_plan.py passes
- [ ] Photo checks recorded
- [ ] Visible in Inspect Layout and with Show details
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `ground-plan-main-pool` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `ground-plan-framework`
