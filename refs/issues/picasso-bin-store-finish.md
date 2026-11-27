# Bin store: inside signs, terrazzo floor, lantern, motorbike bays, shrub and continuous bougainvillea

Task `picasso-bin-store-finish` · area **Pintor Picasso and the car park** · priority P3 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/picasso-car-park/README.md`, `docs/reviews/picasso-bin-store-service-road/README.md`, `docs/reviews/picasso-beach-lane/README.md`, `docs/reviews/picasso-beach-forecourt-buildings/README.md`, `docs/PICASSO_SOUTH_HANDOVER.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`, `data/picasso_car_park.json`, `data/ground_plan_picasso.json`, `data/picasso_entrance_details.json`, `data/picasso_path_steps.json`, `data/picasso_west_lawn.json`, `data/picasso_service_frontage.json`, `data/picasso_beach_lane.json`, `data/picasso_forecourt.json`, `data/terrain.json`
- src: `src/picasso-service-road.ts`, `src/picasso-car-park.ts`, `src/car-park-barrier.ts`, `src/picasso-entrance-details.ts`, `src/ramp-steps.ts`, `src/picasso-west-lawn.ts`, `src/picasso-service-frontage.ts`, `src/picasso-beach-lane.ts`, `src/picasso-forecourt.ts`

## Photos to build from

- `public/photos-ref/IMG_3099.jpg`: Bin store front: RUBBISH COLLECTION / DEPOSITO BASURA, hotel block behind (ground — pin ±3.1 m; looks at bin store front wall on the car park's south-east corner)
- `public/photos-ref/IMG_3100.jpg`: From the bin store looking north-west across the car park to the round palm island (ground — pin ±4.7 m; looks at round hedged palm island in the car park)
- `public/photos-ref/IMG_3101.jpg`: BASURA / RUBBISH BINS sign and green door of the bin store (ground — pin ±4.7 m; looks at bin store side wall and green door)
- `public/photos-ref/IMG_3103.jpg`: Inside the walled bin yard: yellow wheeled containers (ground — pin ±4.7 m; looks at walled bin yard)

## Build

Finish the bin store (data/picasso_service_frontage.json binStoreDetails, src/picasso-bin-store-details.ts): inside, the BASURA / RUBBISH BINS sign with its arrow and the recycling sign on the street-face wall (IMG_3101), the terrazzo floor and the wall lantern (IMG_3103); outside, the motorbike-bay markings (IMG_3099) and the shrub at the front's south end; the bougainvillea as one continuous green mass with few flowers. Discrepancy picasso-bin-yard-far-wall needs photo request picasso-bin-store-front before the yard's structure changes. Package 6 in docs/PICASSO_SOUTH_HANDOVER.md.

## Do not

Keep the four containers where Dave placed them (against the front wall, north half). No structural change without the requested photos.

## Done when

- [ ] Visible in Inspect with Show details
- [ ] Photo checks recorded for the listed photos
- [ ] Reviewed by a reviewer subagent against the full-size photos
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `picasso-bin-store-finish` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
