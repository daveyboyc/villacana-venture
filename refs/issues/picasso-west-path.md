# Calle de Picasso: the footpath on the car park's west side, its levels, steps and ramps

Task `picasso-west-path` · area **Pintor Picasso and the car park** · priority P2 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/picasso-car-park/README.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`, `data/picasso_car_park.json`, `data/ground_plan_picasso.json`, `data/picasso_entrance_details.json`, `data/picasso_path_steps.json`, `data/picasso_west_lawn.json`, `data/terrain.json`
- src: `src/picasso-service-road.ts`, `src/picasso-car-park.ts`, `src/car-park-barrier.ts`, `src/picasso-entrance-details.ts`, `src/ramp-steps.ts`, `src/picasso-west-lawn.ts`

## Photos to build from

- `public/photos-ref/IMG_3131.jpg`: CALLE DE PICASSO plinth, barrier arm and ramp between white walls (ground — pin ±1.5 m; looks at barrier and CALLE DE PICASSO plinth at the north end)
- `public/photos-ref/ref:google-maps/01-street-map-lane-names.png`: Google street map with inner lane names (map)
- `public/photos-ref/ref:google-maps/05-3d-top-down-car-park-north-entrance.jpg`: Google 3D top-down: the car park's north entrance with both barrier booms (aerial)

## Build

Trace the footpath behind the hedge strip at the back of the main car park's west bays, from the CALLE DE PICASSO plinth to Calle Eva (street_layout.json picasso-access), and build its levels from the laser survey (scripts/lidar_check.py, data/levels_survey.json for the method): three level stretches joined by steps beside a ramp (data/picasso_path_steps.json, src/ramp-steps.ts). Pull the car-park outline's west edge back to the bays. When photos arrive (photo request picasso-west-path-drops), replace the inferred form of each drop and build the edge between the hedge strip and the bays.

## Do not

No change to Walk. Do not grade the path or flights above inferred without photos; do not move them without a solved camera or a measured aerial reading.

## Done when

- [ ] Visible in Inspect in Layout and with Show details
- [ ] Flights climb the survey's rise (scripts/check_terrain.py)
- [ ] Structure signed off by a reviewer subagent
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `picasso-west-path` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
