# Main pool lawn: stand the paths and fittings on the surveyed ground, close the lowered edge, lawn kit models

Task `main-pool-lawn-ground` · area **Main pool** · priority P1 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/main-pool.md` and the contact sheet `villacana-reference/contact-sheets/main-pool.jpg`
- docs: `docs/MAIN_POOL.md`
- data: `data/main_pool.json`, `data/guillermo_slope.json`, `data/seafront_fence.json`, `data/main_pool_lawn.json`
- src: `src/main-pool.ts`, `src/pool-levels.ts`, `src/lowered-lanes.ts`, `src/seafront-fence.ts`, `src/main-pool-lawn.ts`

## Photos to build from

- `public/photos-ref/IMG_2764.jpg`: Main pool lawn and the wave-roofed building (ground — pin ±3.8 m; looks at tall slender palm on the main-pool lawn, the pool and the wave-roofed building beyond)
- `public/photos-ref/IMG_2765.jpg`: Main pool lawn and wave-roofed building, second view (ground — pin ±3.9 m)
- `public/photos-ref/IMG_2759.jpg`: Lawn path to a white gateway towards the sea (ground — pin ±18.5 m)
- `public/photos-ref/IMG_2760.jpg`: Large lawn towards the Barraka building (ground — pin ±10.8 m)
- `public/photos-ref/IMG_2761.jpg`: Lawn and pink path towards the seafront railing (ground — pin ±2.9 m)
- `public/photos-ref/IMG_2603.jpg`: Pink lawn path with bollard lights and a pool-side white curved-roof building (ground — pin ±2.2 m)
- `public/photos-ref/IMG_2775.jpg`: Lane down to the pool building with slot drains (ground — pin ±4.7 m)
- `public/photos-ref/IMG_2776.jpg`: Steps and ramp at the foot of the lane by the pool building (ground — pin ±4.7 m)

## Build

Inspect showed the lawn work from main-pool-lawn-details buried: paths, apron, white walls, hedge, shower and bollards were built at the old flat -3 m deck while the lawn follows the laser survey at about -2.2 to -2.8 m, so only the bin tops showed. Build every lawn piece on the live ground. East of the lawn the lowered area's retaining face stood as a jagged 3 m sliver (beige triangles in Inspect) because the survey grid mixes the lowered and street datums across the edge where the survey has no drop; read each side's nodes on its own datum, drape the lawn and street sheets each on their own side and build the retaining faces between them. End the first pink path and the apron on the lawn side of the beach gateway (they ran 3 m out onto the paseo; one bollard stood there). Replace the cylinder bollards and bins with Blender-built models from the photos and add the square service lid IMG_2761 shows (scripts/build_lawn_kit.py). Letter the three shop awnings IMG_2775 shows, one-sided, in place of one two-sided panel.

## Do not

Do not move the registry pool rings or the gateway. Do not change the survey grid file. Leave Walk alone.

## Done when

- [ ] scripts/check_main_pool_lawn.py passes
- [ ] check_terrain.py and check_pool_levels.py pass
- [ ] Visible in Inspect Layout and with Show details
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `main-pool-lawn-ground` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
