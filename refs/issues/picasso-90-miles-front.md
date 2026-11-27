# The 90 MILES building's lower front and stepped wall on the forecourt (pool building part 4 drawn sunk)

Task `picasso-90-miles-front` · area **Pintor Picasso and the car park** · priority P2 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/picasso-car-park/README.md`, `docs/reviews/picasso-bin-store-service-road/README.md`, `docs/reviews/picasso-beach-lane/README.md`, `docs/reviews/picasso-beach-forecourt-buildings/README.md`, `docs/PICASSO_SOUTH_HANDOVER.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`, `data/picasso_car_park.json`, `data/ground_plan_picasso.json`, `data/picasso_entrance_details.json`, `data/picasso_path_steps.json`, `data/picasso_west_lawn.json`, `data/picasso_service_frontage.json`, `data/picasso_beach_lane.json`, `data/picasso_forecourt.json`, `data/terrain.json`
- src: `src/picasso-service-road.ts`, `src/picasso-car-park.ts`, `src/car-park-barrier.ts`, `src/picasso-entrance-details.ts`, `src/ramp-steps.ts`, `src/picasso-west-lawn.ts`, `src/picasso-service-frontage.ts`, `src/picasso-beach-lane.ts`, `src/picasso-forecourt.ts`

## Photos to build from

- `public/photos-ref/IMG_3118.jpg`: Calle Pintor Picasso looking north-west from the lane's north end: tower and white buildings left, hotel and plane trees right (ground — pin ±7.5 m; looks at the road north-west from the lane past the forecourt)

## Build

IMG_3118 shows, in front of the 90 MILES upper block (data/picasso_forecourt.json), a one-storey white front with a black awning and a menu board and, nearer the road, a white wall with a stepped parapet and a door. Both stand on registry part 6364501UF1366S_part4, which the model draws from its centroid's ground about 2.8 m below the road (roof about 0.2 m over the datum), while the 2014-15 surface model reads 3.2-3.3 m over the datum at x -16..-12, z 70 and 0.7-1.4 m along the stepped wall (x -12..-4, z 66-70). Measure the levels against the survey, decide with the registry rules how to draw the front, and add a photo request for a square-on view (gap:picasso-90-miles-front).

## Do not

No change to Walk. Keep part 4's registry footprint. Do not grade anything photographed or measured without a solved camera.

## Done when

- [ ] Visible in Inspect in Layout
- [ ] Structure signed off by a reviewer subagent
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `picasso-90-miles-front` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `picasso-beach-forecourt-buildings`
