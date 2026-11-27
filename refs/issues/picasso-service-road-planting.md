# Calle Pintor Picasso south of the car park: plane trees, cypress hedge, palms, and generated filler off

Task `picasso-service-road-planting` · area **Pintor Picasso and the car park** · priority P3 · planting

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/picasso-car-park/README.md`, `docs/reviews/picasso-bin-store-service-road/README.md`, `docs/reviews/picasso-beach-lane/README.md`, `docs/reviews/picasso-beach-forecourt-buildings/README.md`, `docs/PICASSO_SOUTH_HANDOVER.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`, `data/picasso_car_park.json`, `data/ground_plan_picasso.json`, `data/picasso_entrance_details.json`, `data/picasso_path_steps.json`, `data/picasso_west_lawn.json`, `data/picasso_service_frontage.json`, `data/picasso_beach_lane.json`, `data/picasso_forecourt.json`, `data/terrain.json`
- src: `src/picasso-service-road.ts`, `src/picasso-car-park.ts`, `src/car-park-barrier.ts`, `src/picasso-entrance-details.ts`, `src/ramp-steps.ts`, `src/picasso-west-lawn.ts`, `src/picasso-service-frontage.ts`, `src/picasso-beach-lane.ts`, `src/picasso-forecourt.ts`

## Photos to build from

- `public/photos-ref/IMG_3120.jpg`: Service road looking back north-west to the car park, hotel on the right (ground — pin ±14.0 m; looks at service road between hotel and utility buildings)
- `public/photos-ref/IMG_3121.jpg`: Hotel ground floor along the service road: ramps, sliding gate, vent panels (ground — pin ±4.5 m; looks at hotel ground-floor frontage on the service road)
- `public/photos-ref/IMG_3122.jpg`: Service road looking north-north-west, hotel ramps right, utility doors left (ground — pin ±4.2 m; looks at service road towards the car park)
- `public/photos-ref/IMG_2345.jpg`: Pintor Picasso: service road, utility sheds and bins (ground — pin ±5.5 m; looks at the service road north-west from the hotel's low block: slatted gate, meter box, substation and green-door building on the left, the hotel wing's plinth and ramp on the right)
- `public/photos-ref/IMG_3105.jpg`: Calle Pintor Picasso service road looking south-east towards the sea (ground — pin ±4.7 m; looks at service road south of the bin store)
- `public/photos-ref/IMG_3118.jpg`: Calle Pintor Picasso looking north-west from the lane's north end: tower and white buildings left, hotel and plane trees right (ground — pin ±7.5 m; looks at the road north-west from the lane past the forecourt)
- `public/photos-ref/IMG_3125.jpg`: Long white wall between the car park and Calle Pintor Picasso, cypress hedge opposite (ground — pin ±4.7 m; looks at long boundary wall along the service road)
- `public/photos-ref/IMG_3126.jpg`: Opening in the cypress and ivy hedges east of the service road (ground — pin ±4.7 m; looks at hedge gap east of the road)
- `public/photos-ref/IMG_3129.jpg`: Service road looking north: long white wall left, cypress hedge right (ground — pin ±2.3 m; looks at service road along the long wall)

## Build

The big plane trees on the hotel side of the road, the cypress hedge on the road's east side along the long car-park wall, and the palms. Stage 4 first: list the generated filler on this stretch (the generic lawn patches and trees on the raised garden west of the utility row) and switch off what the photos contradict, with a photo-backed record. Trees whose canopy overhangs the road are marked canopyOverhangs in data/objects.json. Package 8 in docs/PICASSO_SOUTH_HANDOVER.md.

## Do not

Planting keeps the shared route-clearance guard (trunk 0.3 m for canopyOverhangs trees). No change to Walk.

## Done when

- [ ] Visible in Inspect with Show details
- [ ] Photo checks recorded for the listed photos
- [ ] Reviewed by a reviewer subagent against the full-size photos
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `picasso-service-road-planting` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
