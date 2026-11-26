# Bin store and Calle Pintor Picasso south of the car park: bin yard, utility row, hotel lower wing (layout)

Task `picasso-bin-store-service-road` · area **Pintor Picasso and the car park** · priority P2 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/picasso-car-park/README.md`, `docs/reviews/picasso-bin-store-service-road/README.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`, `data/picasso_car_park.json`, `data/ground_plan_picasso.json`, `data/picasso_entrance_details.json`, `data/picasso_path_steps.json`, `data/picasso_west_lawn.json`, `data/picasso_service_frontage.json`, `data/terrain.json`
- src: `src/picasso-service-road.ts`, `src/picasso-car-park.ts`, `src/car-park-barrier.ts`, `src/picasso-entrance-details.ts`, `src/ramp-steps.ts`, `src/picasso-west-lawn.ts`, `src/picasso-service-frontage.ts`

## Photos to build from

- `public/photos-ref/IMG_3099.jpg`: Bin store front: RUBBISH COLLECTION / DEPOSITO BASURA, hotel block behind (ground — pin ±3.1 m; looks at bin store front wall on the car park's south-east corner)
- `public/photos-ref/IMG_3100.jpg`: From the bin store looking north-west across the car park to the round palm island (ground — pin ±4.7 m; looks at round hedged palm island in the car park)
- `public/photos-ref/IMG_3101.jpg`: BASURA / RUBBISH BINS sign and green door of the bin store (ground — pin ±4.7 m; looks at bin store side wall and green door)
- `public/photos-ref/IMG_3103.jpg`: Inside the walled bin yard: yellow wheeled containers (ground — pin ±4.7 m; looks at walled bin yard)
- `public/photos-ref/IMG_3104.jpg`: Recycling igloos against the hotel's lower wall (ground — pin ±4.7 m; looks at recycling bins at the foot of the hotel wall)
- `public/photos-ref/IMG_3105.jpg`: Calle Pintor Picasso service road looking south-east towards the sea (ground — pin ±4.7 m; looks at service road south of the bin store)
- `public/photos-ref/IMG_3106.jpg`: Service road south-east: maroon utility doors and the white tower (ground — pin ±4.7 m; looks at utility doors along the service road)
- `public/photos-ref/IMG_3120.jpg`: Service road looking back north-west to the car park, hotel on the right (ground — pin ±14.0 m; looks at service road between hotel and utility buildings)
- `public/photos-ref/IMG_3121.jpg`: Hotel ground floor along the service road: ramps, sliding gate, vent panels (ground — pin ±4.5 m; looks at hotel ground-floor frontage on the service road)
- `public/photos-ref/IMG_3122.jpg`: Service road looking north-north-west, hotel ramps right, utility doors left (ground — pin ±4.2 m; looks at service road towards the car park)
- `public/photos-ref/IMG_3123.jpg`: Electrical substation doors and white utility building beside the service road (ground — pin ±4.8 m; looks at substation and utility building west of the service road)
- `public/photos-ref/IMG_3124.jpg`: White utility building and the start of the long boundary wall (ground — pin ±4.7 m; looks at utility building at the south end of the long wall)
- `public/photos-ref/IMG_2345.jpg`: Pintor Picasso: service road, utility sheds and bins (ground — pin ±5.5 m; looks at the service road north-west from the hotel's low block: slatted gate, meter box, substation and green-door building on the left, the hotel wing's plinth and ramp on the right)

## Build

Dave (26 Nov 2026) circled the bin store (DEPOSITO BASURA) at the car park's south-east corner and the service road that leads from it to the beach. Stage 1 and 2 of the structure-first order: list the photo coverage, then lay out the bin yard against the long wall, the utility row on the road's west side (green-door building, set-back wall, substation, meter box, slatted gate) with its kerbed pavement, and the hotel's lower wing on the east side with the asphalt to its foot. Heights from the laser survey.

## Do not

No change to Walk. Do not grade anything photographed or measured: no camera here is solved. No detail (signs, doors, igloos, planting) before the layout is signed off.

## Done when

- [ ] Visible in Inspect in Layout and with Show details
- [ ] Photo checks recorded for the cameras built from
- [ ] Structure signed off by a reviewer subagent
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `picasso-bin-store-service-road` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
