# Elena roof station: make the camera solvable, then trace its facades

Task `facade-kit-elena` · area **Calle Elena** · priority P2 · tooling

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `villacana-reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/ELENA_EAST_PATIOS.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`, `docs/LEVELS.md`, `docs/reviews/path-network-inventory-elena/README.md`
- data: `data/elena_north.json`, `data/elena_east_patios.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`, `data/levels_survey.json`, `data/door_sills.json`
- src: `src/elena-north.ts`, `src/elena-east-patios.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`, `src/door-sills.ts`

## Photos to build from


## Build

The roof station at about (-155.7, 50.1) (IMG_2358/2359/2360, and IMG_2220 nearby) shows the Elena lanes and the facades of buildings 44 and 39 well, but its camera could not be solved (docs/reviews/facade-kit-elena): the model has a flat 7.2 m block (building 21) where the photos show an upper terrace over a tiled roof, and the solver's model export holds only registry buildings and pools, not the traced lane edges and garden walls these photos show best. Add traced walls and lane edges to the model export as polylines photo_pose.py can match, check the roof form at the pin, then solve the station and trace the facades into data/facade_kit.json.

## Do not

Do not trace from an unstable solve. No change to footprints without evidence.

## Done when

- [ ] Station solve with held-out checks within about 0.3 m and each photo alone within 2 m of the station
- [ ] Traced parts cross-checked in two photos where possible
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `facade-kit-elena` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
