# Lane to the beach: concrete roadway, full-width grate and darker strip, eaves beams, terrace tiles, doors

Task `picasso-beach-lane-finish` · area **Pintor Picasso and the car park** · priority P3 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/picasso-car-park/README.md`, `docs/reviews/picasso-bin-store-service-road/README.md`, `docs/reviews/picasso-beach-lane/README.md`, `docs/reviews/picasso-beach-forecourt-buildings/README.md`, `docs/PICASSO_SOUTH_HANDOVER.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`, `data/picasso_car_park.json`, `data/ground_plan_picasso.json`, `data/picasso_entrance_details.json`, `data/picasso_path_steps.json`, `data/picasso_west_lawn.json`, `data/picasso_service_frontage.json`, `data/picasso_beach_lane.json`, `data/picasso_forecourt.json`, `data/terrain.json`
- src: `src/picasso-service-road.ts`, `src/picasso-car-park.ts`, `src/car-park-barrier.ts`, `src/picasso-entrance-details.ts`, `src/ramp-steps.ts`, `src/picasso-west-lawn.ts`, `src/picasso-service-frontage.ts`, `src/picasso-beach-lane.ts`, `src/picasso-forecourt.ts`

## Photos to build from

- `public/photos-ref/IMG_2613.jpg`: Service lane between the main-pool lawn walls and the neighbouring building, looking north-west (ground — pin ±4.7 m; looks at the service lane north from the paseo: white walls with doors on the left, the long building's low terrace wall and eaves on the right)
- `public/photos-ref/IMG_3065.jpg`: Beach building end and a rubble sandstone wall topped by chain-link, with a lamp pole and a restaurant sign (ground — pin ±2.5 m)
- `public/photos-ref/IMG_3066.jpg`: Sandstone wall topped with green bars and a white wall with double doors, paseo corner (ground — pin ±2.5 m)
- `public/photos-ref/IMG_3067.jpg`: Paseo lane between a white wall with doors and the sandstone wall and fence (ground — pin ±2.5 m)
- `public/photos-ref/IMG_3068.jpg`: Green bar fence on a sandstone base at the white pillar, palms and bananas behind (ground — pin ±2.5 m)

## Build

Finish the lane (street picasso-beach-lane, data/picasso_beach_lane.json, ground plan picasso-beach-lane-*): the roadway as photographed concrete rather than asphalt, the darker strip and the drain grate across the full width at the mouth, the eaves' cantilevered beams and the terrace's red-tiled top, and the doors in the west walls. Check whether the white pillar on the west corner and the chain-link on sandstone on the east corner are already in data/seafront_fence.json or data/paseo_wall.json before adding them. Package 7 in docs/PICASSO_SOUTH_HANDOVER.md.

## Do not

Street surfaces are asphalt or terracotta only; do it through the ground plan, keeping fills clear of the street ribbon's height so they do not break through it.

## Done when

- [ ] Visible in Inspect in Layout and with Show details
- [ ] Photo checks recorded for the listed photos
- [ ] Reviewed by a reviewer subagent against the full-size photos
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `picasso-beach-lane-finish` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
