# Calle Pintor Picasso south of the car park: levels behind the utility row and along the lane (the road on to the beach is built)

Task `picasso-service-road-levels-and-beach` · area **Pintor Picasso and the car park** · priority P2 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/picasso.md` and the contact sheet `reference/contact-sheets/picasso.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/reviews/picasso-car-park/README.md`, `docs/reviews/picasso-bin-store-service-road/README.md`, `docs/reviews/picasso-beach-lane/README.md`, `docs/PICASSO_SOUTH_HANDOVER.md`
- data: `data/street_layout.json`, `data/picasso_service_road.json`, `data/picasso_car_park.json`, `data/ground_plan_picasso.json`, `data/picasso_entrance_details.json`, `data/picasso_path_steps.json`, `data/picasso_west_lawn.json`, `data/picasso_service_frontage.json`, `data/picasso_beach_lane.json`, `data/terrain.json`
- src: `src/picasso-service-road.ts`, `src/picasso-car-park.ts`, `src/car-park-barrier.ts`, `src/picasso-entrance-details.ts`, `src/ramp-steps.ts`, `src/picasso-west-lawn.ts`, `src/picasso-service-frontage.ts`, `src/picasso-beach-lane.ts`

## Photos to build from

- `public/photos-ref/IMG_3118.jpg`: Calle Pintor Picasso looking north-west from the lane's north end: tower and white buildings left, hotel and plane trees right (ground — pin ±7.5 m; looks at the road north-west from the lane past the forecourt)
- `public/photos-ref/IMG_3119.jpg`: Calle Pintor Picasso forecourt looking north-west: blue lorry by the tower, grey containers and utility sheds on the right (ground — pin ±4.2 m; looks at the forecourt between the pool building and the hotel's low block)
- `public/photos-ref/IMG_2613.jpg`: Service lane between the main-pool lawn walls and the neighbouring building, looking north-west (ground — pin ±4.7 m; looks at the service lane north from the paseo: white walls with doors on the left, the long building's low terrace wall and eaves on the right)
- `public/photos-ref/IMG_3067.jpg`: Paseo lane between a white wall with doors and the sandstone wall and fence (ground — pin ±2.5 m)
- `public/photos-ref/IMG_3105.jpg`: Calle Pintor Picasso service road looking south-east towards the sea (ground — pin ±4.7 m; looks at service road south of the bin store)
- `public/photos-ref/IMG_3106.jpg`: Service road south-east: maroon utility doors and the white tower (ground — pin ±4.7 m; looks at utility doors along the service road)
- `public/photos-ref/IMG_3123.jpg`: Electrical substation doors and white utility building beside the service road (ground — pin ±4.8 m; looks at substation and utility building west of the service road)
- `public/photos-ref/IMG_3124.jpg`: White utility building and the start of the long boundary wall (ground — pin ±4.7 m; looks at utility building at the south end of the long wall)

## Levels from the photos

From `data/levels_survey.json` (check with `scripts/check_levels.py`).

- `picasso-service-pavement-kerb` (raised-threshold): 0.1-0.15 m above the road asphalt of Calle Pintor Picasso south of the car park, medium confidence at (-30, 31.5) ±2 m. Model: **built**, task `picasso-service-road-levels-and-beach`. The kerbed concrete pavement along the west utility row stands flat one stone kerb (about 0.12 m, judged) over the road, with the level change to the raised garden behind the row's walls. The 2020-21 ground model reads the road -0.64 m at the long wall's end falling to -0.88 m by registry part 6364501UF1366S_part1 (1.0-2.0 m out from the kerb, averaged), and the garden behind the row +0.4 to +0.7 m; the 1 m grid cannot resolve the kerb itself. 26 Nov 2026: the terrain grid now holds the pavement at the road's level (data/picasso_service_frontage.json pavementHold, scripts/lidar_check.py grid): over the pavement the terrain is within -0.02..+0.02 m of the road 1.5 m out except a 2 m corner by the bin yard's street door (up to +0.19 m), so the pavement is drawn 0.10-0.14 m over the road. Behind the low white box at the foot of the set-back wall (frame s 3-5, e -1 to -2) the ground model dips to -1.4..-2.0 m, 0.7-1.3 m below the road and about 2 m below the garden, over about 2 by 2 m, where the 2014-15 surface model reads the box's top at +0.55-0.59 m: most likely a light well behind the box's parapet, since IMG_3124 shows a dark low opening at the foot of the wall behind it. Not confirmed and not built; the pavement in front of it is held level. (IMG_3123.jpg, IMG_3124.jpg, IMG_3105.jpg)
- `picasso-bin-yard-floor` (raised-threshold): 0.25-0.5 m above the road at the bin store's green street door, medium confidence at (-39.6, 20.4) ±2 m. Model: **built**, task `picasso-service-road-levels-and-beach`. The open bin yard's terrazzo floor (IMG_3101, IMG_3103) stands a little over the road: IMG_3124 shows a short concrete ramp up to the green street door. Survey only, 26 Nov 2026: the 2020-21 ground model reads the yard's floor at a median -0.24 m (p10-p90 -0.39 to -0.05, 126 samples inside the yard walls) against about -0.65 m on the road outside the door, so about 0.3-0.45 m. The terrain grid has the yard at a median -0.26 m. The rise range here is the survey's, not read from a photo. (IMG_3124.jpg, IMG_3101.jpg, IMG_3103.jpg)
- `picasso-hotel-apron-level` (level): 0-0.1 m above the road asphalt beside it, medium confidence at (-26, 22) ±3 m. Model: **none**, task `picasso-service-road-levels-and-beach`. The asphalt between the road and the hotel's lower wing runs on at road level to the ramps and railings at the wing's foot (IMG_3104, IMG_3105, IMG_3120). 2020-21 ground model over the apron: median -0.64 m (p10 -0.76; the p90 of -0.05 is the wing's interpolated edge); the terrain grid median -0.69 m. No level change to model. (IMG_3104.jpg, IMG_3105.jpg, IMG_3120.jpg)
- `picasso-forecourt-to-lane` (slope): 0.4-0.8 m above the concrete lane to the paseo, medium confidence at (3, 70) ±3 m. Model: **built**, task `picasso-service-road-levels-and-beach`. Survey only, 26 Nov 2026 (the photos show the road falling gently towards the sea but give no height): the 2020-21 ground model reads the forecourt by the hotel's low block at a median -1.09 m (p10-p90 -1.31 to -0.90) and the concrete lane at -1.70 m (-1.90 to -1.46), its west footway at -1.74 m. The terrain grid follows within 0.03-0.08 m (forecourt -1.08, lane -1.77, footway -1.83). The lane's footway kerb (photo-judged 0.12 m, IMG_2613, IMG_3067) is below the 1 m survey's resolution: across it the survey reads a median 0.00 m (range -0.21..+0.12, 19 places); it is drawn by the ground plan's kerb edge. (IMG_3118.jpg, IMG_3119.jpg, IMG_2613.jpg, IMG_3067.jpg)

## Build

The road on to the beach was laid out in #311 (docs/reviews/picasso-beach-lane). Remaining, stage 3: hold the terrain grid at road level up to the utility row's faces so the kerbed pavement is flat about 0.12 m over the road (discrepancy picasso-service-pavement-level; regenerate data/terrain.json with scripts/lidar_check.py grid, as the car park is held to the west lawn's wall; do not hand-edit it). Then check against the survey (record the readings in data/levels_survey.json) the bin-yard floor, the hotel apron, the forecourt, the lane and its footway kerb, and the 2.0 m dip behind the low box at s about 4, e about -1.5. Package 2 in docs/PICASSO_SOUTH_HANDOVER.md.

## Do not

No change to Walk. No detail before the layout is signed off. Do not grade anything photographed or measured without a solved camera.

## Done when

- [ ] Pavement flat about 0.12 m over the road in Inspect from IMG_3123 and IMG_3105
- [ ] picasso-service-pavement-level closed with before/after Inspect pairs
- [ ] Structure signed off by a reviewer subagent
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `picasso-service-road-levels-and-beach` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `picasso-bin-store-service-road`
