# Main pool lawn and Enrique's steps: solve the photo cameras and close what still differs

Task `main-pool-lawn-cameras` · area **Main pool** · priority P2 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/main-pool.md` and the contact sheet `villacana-reference/contact-sheets/main-pool.jpg`
- docs: `docs/MAIN_POOL.md`
- data: `data/main_pool.json`, `data/guillermo_slope.json`, `data/seafront_fence.json`, `data/main_pool_lawn.json`
- src: `src/main-pool.ts`, `src/pool-levels.ts`, `src/lowered-lanes.ts`, `src/seafront-fence.ts`, `src/main-pool-lawn.ts`

## Photos to build from

- `public/photos-ref/IMG_2765.jpg`: Main pool lawn and wave-roofed building, second view (ground — pin ±3.9 m; looks at pink path to the main pool, the tall palm at the pool corner and the wave-roofed building)
- `public/photos-ref/IMG_2759.jpg`: Lawn path to a white gateway towards the sea (ground — pin ±18.5 m; looks at arched beach gateway at the end of the pink path, bin and bollard beside it)
- `public/photos-ref/IMG_2761.jpg`: Lawn and pink path towards the seafront railing (ground — pin ±2.9 m; looks at lawn beside the pink path: square service lid, bin and bollard, the hedge along the sea railing)
- `public/photos-ref/IMG_2762.jpg`: Strelitzia in a white walled corner on the lawn (ground — pin ±2.6 m; looks at strelitzia and silver bush in a white walled corner on the lawn)
- `public/photos-ref/IMG_2776.jpg`: Steps and ramp at the foot of the lane by the pool building (ground — pin ±4.7 m; looks at marble-nosed blue-tiled steps up to Enrique's shop beside the lantana planter)
- `public/photos-ref/IMG_2777.jpg`: Marble-edged steps down to the main pool deck (ground — pin ±2.0 m; looks at marble nosing and blue risers at the top of Enrique's steps, terracotta paving and the pool below)

## Build

The lawn and steps photos were rendered through hand-set starting cameras (data/photo_poses.json, 2026-11-13) and still differ: IMG_2765 faces about 15 degrees left of the photo; IMG_2759 is vague (pin +-18.5 m) and its camera is set from content, so the nearer bin shows where the photo has a service lid; IMG_2761 frames the hedge and fence but the gateway and its bin fall just out of frame; IMG_2762 shows the plain kiosk but the photo's louvred service doors and lawn up to the walls are not modelled; IMG_2776 and IMG_2777 stand in the long flight from their pins, while the photos stand on Calle Guillermo with the short marble-nosed flight on the right. Mark control points (path edges, pool edge, gate pier, building corners) and solve each camera with scripts/photo_pose.py, then move the paths, fittings and step finish by measurement.

## Do not

Do not move registry footprints, the pool rings or the gateway without a measured correction. Leave Walk alone.

## Done when

- [ ] Each photo has a solved camera with held-out checks
- [ ] Photo checks re-recorded through the solved cameras
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `main-pool-lawn-cameras` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
