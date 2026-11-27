# Forecourt by the pool building: the utility sheds and grey containers, and the 90 MILES building

Task `picasso-beach-forecourt-buildings` · area **Pintor Picasso and the car park** · priority P2 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/picasso-car-park/README.md`, `docs/reviews/picasso-bin-store-service-road/README.md`, `docs/reviews/picasso-beach-lane/README.md`, `docs/reviews/picasso-beach-forecourt-buildings/README.md`, `docs/PICASSO_SOUTH_HANDOVER.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`, `data/picasso_car_park.json`, `data/ground_plan_picasso.json`, `data/picasso_entrance_details.json`, `data/picasso_path_steps.json`, `data/picasso_west_lawn.json`, `data/picasso_service_frontage.json`, `data/picasso_beach_lane.json`, `data/picasso_forecourt.json`, `data/terrain.json`
- src: `src/picasso-service-road.ts`, `src/picasso-car-park.ts`, `src/car-park-barrier.ts`, `src/picasso-entrance-details.ts`, `src/ramp-steps.ts`, `src/picasso-west-lawn.ts`, `src/picasso-service-frontage.ts`, `src/picasso-beach-lane.ts`, `src/picasso-forecourt.ts`

## Photos to build from

- `public/photos-ref/IMG_3118.jpg`: Calle Pintor Picasso looking north-west from the lane's north end: tower and white buildings left, hotel and plane trees right (ground — pin ±7.5 m; looks at the road north-west from the lane past the forecourt)
- `public/photos-ref/IMG_3119.jpg`: Calle Pintor Picasso forecourt looking north-west: blue lorry by the tower, grey containers by the hotel's low block on the right, the utility row beyond (ground — pin ±4.2 m; looks at the forecourt between the pool building and the hotel's low block)
- `public/photos-ref/IMG_3105.jpg`: Calle Pintor Picasso service road looking south-east towards the sea (ground — pin ±4.7 m; looks at service road south of the bin store)

## Build

Between the hotel's low block and the pool building (about x -10..8, z 50..68): the small white utility sheds with brown doors and two big grey containers on the forecourt's east side (IMG_3119), and the two-storey white building with the black 90 MILES sign beside the tower on the west side (IMG_3118). Footprints from the aerial and scripts/lidar_grid.py --surface; build as estimates with confidence entries and gaps for what the photos cannot fix. Package 3 in docs/PICASSO_SOUTH_HANDOVER.md.

## Do not

No change to Walk. Do not grade anything photographed or measured without a solved camera. Check every survey spike on the aerial: trees read as spikes.

## Done when

- [ ] Visible in Inspect in Layout
- [ ] Structure signed off by a reviewer subagent
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `picasso-beach-forecourt-buildings` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
