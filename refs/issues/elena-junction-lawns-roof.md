# Elena south from the Elena 24 roof: lawns, west wall and the patio below the camera

Task `elena-junction-lawns-roof` · area **Calle Elena** · priority P1 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/ELENA_EAST_PATIOS.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`, `docs/LEVELS.md`, `docs/reviews/path-network-inventory-elena/README.md`, `docs/reviews/elena-patio-wall-correction/README.md`, `docs/ELENA_WALKWAY.md`, `docs/LANE_WALLS.md`
- data: `data/elena_north.json`, `data/elena_east_patios.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`, `data/levels_survey.json`, `data/door_sills.json`, `data/elena_walkway.json`, `data/lane_walls.json`, `data/elena_south_beds.json`, `data/elena_junction_details.json`
- src: `src/elena-north.ts`, `src/elena-east-patios.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`, `src/door-sills.ts`, `src/elena-walkway.ts`, `src/lane-walls.ts`, `src/elena-junction-details.ts`

## Photos to build from

- `public/photos-ref/ELENA-ROOF-2026-11-17.jpg`: Roof by Elena: morning view down Elena south and the junction lawns to the middle pool (roof — pin ±4.0 m; looks at The two junction lawns, the Elena south lane and the west patio walls, down to the middle pool gate)
- `public/photos-ref/IMG_2358.jpg`: Roof by Elena: looking down on Elena south and the junction lawns (roof — pin ±2.0 m; looks at The junction lawns south of Cervantes)
- `public/photos-ref/IMG_2367.jpg`: Roof by Elena: looking south over the Cervantes/Elena junction (roof — pin ±3.9 m; looks at The Cervantes/Elena junction)

## Build

Dave, 17 November 2026, sending ELENA-ROOF-2026-11-17.jpg: this angle on Elena leading to the middle pool still needs work. Solve the photo's camera, compare the model through it in Inspect (Layout and Show details) and correct the structure it measures: the two junction lawns, the white wall with two doors on their west side, the cross path, and any generated filler in the way. Record what the view shows but does not settle.

## Do not

No change to Walk. No detail on structure that has not passed review. Far-end depths (22-40 m) are not measured by this camera alone.

## Done when

- [ ] Visible in Inspect in Layout and with Show details through the solved camera
- [ ] Measured residuals reported (scripts/measure_elena_junction_lawns.py) and a second-agent measured approval in data/placement_reviews.json
- [ ] check_lane_walls, check_door_sills, check_junction_lawns, check_ground_plan pass; production build and layout browser test
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `elena-junction-lawns-roof` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
