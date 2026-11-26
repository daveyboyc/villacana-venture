# Main car park north entrance: asphalt apron, lanes, separator and the CALLE DE PICASSO plinth

Task `picasso-car-park-north-entrance` · area **Pintor Picasso and the car park** · priority P2 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/picasso-car-park/README.md`, `docs/reviews/picasso-bin-store-service-road/README.md`, `docs/reviews/picasso-beach-lane/README.md`, `docs/PICASSO_SOUTH_HANDOVER.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`, `data/picasso_car_park.json`, `data/ground_plan_picasso.json`, `data/picasso_entrance_details.json`, `data/picasso_path_steps.json`, `data/picasso_west_lawn.json`, `data/picasso_service_frontage.json`, `data/picasso_beach_lane.json`, `data/terrain.json`
- src: `src/picasso-service-road.ts`, `src/picasso-car-park.ts`, `src/car-park-barrier.ts`, `src/picasso-entrance-details.ts`, `src/ramp-steps.ts`, `src/picasso-west-lawn.ts`, `src/picasso-service-frontage.ts`, `src/picasso-beach-lane.ts`

## Photos to build from

- `public/photos-ref/IMG_3131.jpg`: CALLE DE PICASSO plinth, barrier arm and ramp between white walls (ground — pin ±1.5 m; looks at barrier and CALLE DE PICASSO plinth at the north end)
- `public/photos-ref/IMG_3130.jpg`: Low white wall with sign post at the north end of the car park (ground — pin ±21.1 m; looks at low white wall and sign post at the north entrance)
- `public/photos-ref/ref:google-maps/03-street-view-loira-entry-barrier-2024-10.jpg`: Street View from Calle Loira into the car park: the entry barrier closed (ground)
- `public/photos-ref/ref:google-maps/04-street-view-bolivia-exit-barrier-2024-10.jpg`: Street View from Calle Bolivia: the exit barrier between the gatehouse island and the long wall (ground)
- `public/photos-ref/ref:google-maps/05-3d-top-down-car-park-north-entrance.jpg`: Google 3D top-down: the car park's north entrance with both barrier booms (aerial)
- `public/photos-ref/ref:google-maps/06-street-view-bolivia-gatehouse-north-2024-10.jpg`: Street View from Calle Bolivia: the gatehouse island's north side (ground)
- `public/photos-ref/ref:google-maps/07-street-view-bolivia-gatehouse-window-2024-10.jpg`: Street View from Calle Bolivia: the gatehouse's arched grilled window (ground)
- `public/photos-ref/ref:google-maps/08-street-view-bolivia-exit-lane-2024-10.jpg`: Street View from Calle Bolivia down the exit lane (ground)

## Build

Lay out the car park's north entrance between Calle Loira, Calle Bolivia and the planted island: the asphalt apron and its lanes, the white kerb nose and bougainvillea bed beside the barrier's rest post, the brick-edged terracotta path, lawn strip and CALLE DE PICASSO plinth, and the ramp between white walls. Then check both barriers (data/picasso_car_park.json barriers) against the traced lanes.

## Do not

No change to Walk. Do not grade positions measured without a solved camera.

## Done when

- [ ] Visible in Inspect in Layout and with Show details
- [ ] Photo checks recorded for IMG_3131 and IMG_3130
- [ ] Structure signed off by a reviewer subagent
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `picasso-car-park-north-entrance` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
