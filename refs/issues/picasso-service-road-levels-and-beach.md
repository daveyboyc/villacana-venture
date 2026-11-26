# Calle Pintor Picasso south of the car park: levels behind the utility row, and the road on to the beach

Task `picasso-service-road-levels-and-beach` · area **Pintor Picasso and the car park** · priority P2 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/picasso-car-park/README.md`, `docs/reviews/picasso-bin-store-service-road/README.md`, `docs/reviews/picasso-beach-lane/README.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`, `data/picasso_car_park.json`, `data/ground_plan_picasso.json`, `data/picasso_entrance_details.json`, `data/picasso_path_steps.json`, `data/picasso_west_lawn.json`, `data/picasso_service_frontage.json`, `data/picasso_beach_lane.json`, `data/terrain.json`
- src: `src/picasso-service-road.ts`, `src/picasso-car-park.ts`, `src/car-park-barrier.ts`, `src/picasso-entrance-details.ts`, `src/ramp-steps.ts`, `src/picasso-west-lawn.ts`, `src/picasso-service-frontage.ts`, `src/picasso-beach-lane.ts`

## Photos to build from

- `public/photos-ref/IMG_3118.jpg`: Calle Pintor Picasso looking north-west from the lane's north end: tower and white buildings left, hotel and plane trees right (ground — pin ±7.5 m; looks at the road north-west from the lane past the forecourt)
- `public/photos-ref/IMG_3119.jpg`: Calle Pintor Picasso forecourt looking north-west: blue lorry by the tower, grey containers and utility sheds on the right (ground — pin ±4.2 m; looks at the forecourt between the pool building and the hotel's low block)
- `public/photos-ref/IMG_2613.jpg`: Service lane between the main-pool lawn walls and the neighbouring building, looking north-west (ground — pin ±4.7 m)
- `public/photos-ref/IMG_3067.jpg`: Paseo lane between a white wall with doors and the sandstone wall and fence (ground — pin ±2.5 m)
- `public/photos-ref/IMG_3105.jpg`: Calle Pintor Picasso service road looking south-east towards the sea (ground — pin ±4.7 m; looks at service road south of the bin store)
- `public/photos-ref/IMG_3106.jpg`: Service road south-east: maroon utility doors and the white tower (ground — pin ±4.7 m; looks at utility doors along the service road)
- `public/photos-ref/IMG_3123.jpg`: Electrical substation doors and white utility building beside the service road (ground — pin ±4.8 m; looks at substation and utility building west of the service road)
- `public/photos-ref/IMG_3124.jpg`: White utility building and the start of the long boundary wall (ground — pin ±4.7 m; looks at utility building at the south end of the long wall)

## Build

Stage 3 for the stretch built in picasso-bin-store-service-road: hold the terrain grid at road level up to the utility row's faces so the kerbed pavement is flat (discrepancy picasso-service-pavement-level; regenerate data/terrain.json with scripts/lidar_check.py grid, do not hand-edit it), and check the bin yard floor and the hotel apron against the survey. Then lay out the road from the hotel's low block (registry 6465301UF1366N_part2) to the paseo: its line and width from the aerial, the buildings either side, the white tower, once the requested photos (picasso-service-road-to-beach) arrive.

## Do not

No change to Walk. No detail before the layout is signed off. Do not grade anything photographed or measured without a solved camera.

## Done when

- [ ] Visible in Inspect in Layout and with Show details
- [ ] Pavement flat about 0.12 m over the road in the IMG_3123 and IMG_3105 views
- [ ] Structure signed off by a reviewer subagent
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `picasso-service-road-levels-and-beach` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `picasso-bin-store-service-road`
