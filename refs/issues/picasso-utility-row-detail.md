# West utility row on Calle Pintor Picasso: substation doors and trellis, gates, meter box, conduit and grates

Task `picasso-utility-row-detail` · area **Pintor Picasso and the car park** · priority P2 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/picasso-car-park/README.md`, `docs/reviews/picasso-bin-store-service-road/README.md`, `docs/reviews/picasso-beach-lane/README.md`, `docs/PICASSO_SOUTH_HANDOVER.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`, `data/picasso_car_park.json`, `data/ground_plan_picasso.json`, `data/picasso_entrance_details.json`, `data/picasso_path_steps.json`, `data/picasso_west_lawn.json`, `data/picasso_service_frontage.json`, `data/picasso_beach_lane.json`, `data/terrain.json`
- src: `src/picasso-service-road.ts`, `src/picasso-car-park.ts`, `src/car-park-barrier.ts`, `src/picasso-entrance-details.ts`, `src/ramp-steps.ts`, `src/picasso-west-lawn.ts`, `src/picasso-service-frontage.ts`, `src/picasso-beach-lane.ts`

## Photos to build from

- `public/photos-ref/IMG_3123.jpg`: Electrical substation doors and white utility building beside the service road (ground — pin ±4.8 m; looks at substation and utility building west of the service road)
- `public/photos-ref/IMG_3106.jpg`: Service road south-east: maroon utility doors and the white tower (ground — pin ±4.7 m; looks at utility doors along the service road)
- `public/photos-ref/IMG_3105.jpg`: Calle Pintor Picasso service road looking south-east towards the sea (ground — pin ±4.7 m; looks at service road south of the bin store)
- `public/photos-ref/IMG_3124.jpg`: White utility building and the start of the long boundary wall (ground — pin ±4.7 m; looks at utility building at the south end of the long wall)
- `public/photos-ref/IMG_2345.jpg`: Pintor Picasso: service road, utility sheds and bins (ground — pin ±5.5 m; looks at the service road north-west from the hotel's low block: slatted gate, meter box, substation and green-door building on the left, the hotel wing's plinth and ramp on the right)

## Build

Detail on the utility row (data/picasso_service_frontage.json): the substation's maroon doors with louvres, high-voltage signs, ORMAZABAL plate and the arched mesh trellis over its roof; the recessed gate's grey panels; the meter box's cabinet door; the slatted gate's boards; the white conduit and the low white box at the set-back wall's foot; the steel grates in the pavement. Package 5 in docs/PICASSO_SOUTH_HANDOVER.md.

## Do not

No change to Walk. Do not move the row's faces without a solved camera or the requested square-on photos (picasso-service-road-west-row).

## Done when

- [ ] Visible in Inspect with Show details
- [ ] Photo checks recorded for the listed photos
- [ ] Reviewed by a reviewer subagent against the full-size photos
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `picasso-utility-row-detail` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `picasso-service-road-levels-and-beach`
