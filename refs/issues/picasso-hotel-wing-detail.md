# Hotel lower wing along Calle Pintor Picasso: vent grilles, doors, sliding gate, ramps and railings, igloos

Task `picasso-hotel-wing-detail` · area **Pintor Picasso and the car park** · priority P2 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/picasso-car-park/README.md`, `docs/reviews/picasso-bin-store-service-road/README.md`, `docs/reviews/picasso-beach-lane/README.md`, `docs/reviews/picasso-beach-forecourt-buildings/README.md`, `docs/PICASSO_SOUTH_HANDOVER.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`, `data/picasso_car_park.json`, `data/ground_plan_picasso.json`, `data/picasso_entrance_details.json`, `data/picasso_path_steps.json`, `data/picasso_west_lawn.json`, `data/picasso_service_frontage.json`, `data/picasso_beach_lane.json`, `data/picasso_forecourt.json`, `data/terrain.json`
- src: `src/picasso-service-road.ts`, `src/picasso-car-park.ts`, `src/car-park-barrier.ts`, `src/picasso-entrance-details.ts`, `src/ramp-steps.ts`, `src/picasso-west-lawn.ts`, `src/picasso-service-frontage.ts`, `src/picasso-beach-lane.ts`, `src/picasso-forecourt.ts`

## Photos to build from

- `public/photos-ref/IMG_3104.jpg`: Recycling igloos against the hotel's lower wall (ground — pin ±4.7 m; looks at recycling bins at the foot of the hotel wall)
- `public/photos-ref/IMG_3120.jpg`: Service road looking back north-west to the car park, hotel on the right (ground — pin ±14.0 m; looks at service road between hotel and utility buildings)
- `public/photos-ref/IMG_3121.jpg`: Hotel ground floor along the service road: ramps, sliding gate, vent panels (ground — pin ±4.5 m; looks at hotel ground-floor frontage on the service road)
- `public/photos-ref/IMG_3122.jpg`: Service road looking north-north-west, hotel ramps right, utility doors left (ground — pin ±4.2 m; looks at service road towards the car park)
- `public/photos-ref/IMG_2345.jpg`: Pintor Picasso: service road, utility sheds and bins (ground — pin ±5.5 m; looks at the service road north-west from the hotel's low block: slatted gate, meter box, substation and green-door building on the left, the hotel wing's plinth and ramp on the right)
- `public/photos-ref/IMG_3105.jpg`: Calle Pintor Picasso service road looking south-east towards the sea (ground — pin ±4.7 m; looks at service road south of the bin store)

## Build

Detail on the hotel's lower wing (data/picasso_service_frontage.json hotelWing): square vent grilles, doors and the sliding gate, the ramps, steps and railings on a stone plinth at its foot, and the recycling igloos and grey containers against it. The existing picasso-stone-plinth and picasso-ramp (data/picasso_service_road.json) stand inside registry part 6465301UF1366N_part2: re-place them on the wing's face from the photos and mark the old records superseded rather than deleting them. Package 4 in docs/PICASSO_SOUTH_HANDOVER.md.

## Do not

No change to Walk. Keep the wing's registry footprint and surveyed top. Detail goes in Show details; ramps and plinths that are structure go in Layout.

## Done when

- [ ] Visible in Inspect in Layout and with Show details
- [ ] Photo checks recorded for the listed photos
- [ ] Reviewed by a reviewer subagent against the full-size photos
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `picasso-hotel-wing-detail` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
