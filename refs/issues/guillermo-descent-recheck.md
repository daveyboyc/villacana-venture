# Calle Guillermo: put the fall to the paseo where the survey has it

Task `guillermo-descent-recheck` · area **Main pool** · priority P1 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/main-pool.md` and the contact sheet `villacana-reference/contact-sheets/main-pool.jpg`
- docs: `docs/MAIN_POOL.md`
- data: `data/main_pool.json`, `data/guillermo_slope.json`, `data/seafront_fence.json`
- src: `src/main-pool.ts`, `src/pool-levels.ts`, `src/lowered-lanes.ts`, `src/seafront-fence.ts`

## Photos to build from

- `public/photos-ref/IMG_2488.jpg`: Calle Guillermo from its seaward end, looking up the lane (ground — pin ±4.7 m; looks at Calle Guillermo from its seaward end)
- `public/photos-ref/IMG_2226.jpg`: From the beach looking back at the resort frontage (ground — pin ±2.0 m; looks at big-pool lawn frontage: white railings, Guillermo gateway at left)

## Build

The model drops Calle Guillermo 3 m over the last 15 m of the mapped street. The laser survey keeps the street at about -0.2 to -0.4 m to that end, with the main-pool lawn 2.5 m lower beside it behind a sharp edge (a retaining wall), and the fall to the paseo starting south of the mapped end (docs/reviews/lidar-levels). Re-check against Apple 3D screenshots 10, 11 and 13 and any ground photos, then move the descent and the wall line to match.

## Do not

Do not remove the east steps or the kiosk without evidence. No raw survey rasters in the repository.

## Done when

- [ ] scripts/lidar_check.py Guillermo profile within 0.3 m of the survey
- [ ] check_lowered_lanes updated; layout browser test passes
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `guillermo-descent-recheck` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
