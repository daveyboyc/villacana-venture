# Calle Cervantes, Dalí to the Picasso end: levels, steps and the walls, beds and planters along the lane

Task `cervantes-lane-edges` · area **Calle Miguel de Cervantes** · priority P2 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/cervantes.md` and the contact sheet `reference/contact-sheets/cervantes.jpg`
- docs: `docs/DALI_CERVANTES.md`, `docs/STREET_LAYOUT.md`, `docs/FRONTAGE_DIVISIONS.md`, `docs/ELENA_NORTH.md`, `docs/CERVANTES_NORTH_PATIOS.md`, `docs/LEVELS.md`, `docs/CERVANTES_DOOR_STEPS_REVIEW.md`, `docs/CERVANTES_EAST_SOUTH_PATIOS.md`, `docs/reviews/path-network-inventory-cervantes/README.md`, `docs/CERVANTES_LANE_EDGES.md`
- data: `data/dali_cervantes.json`, `data/dali_cervantes_threshold.json`, `data/cervantes_patio_walls.json`, `data/passages.json`, `data/frontage_divisions.json`, `data/cervantes_elena_steps.json`, `data/levels_survey.json`, `data/cervantes_garden_door.json`, `data/cervantes_north_patios.json`, `data/junction_lawns.json`, `data/cervantes_east_south_patios.json`, `data/cervantes_lane_edges.json`, `data/cervantes_alberto_steps.json`, `data/lane_walls.json`
- src: `src/cervantes-walls.ts`, `src/dali-threshold.ts`, `src/frontages.ts`, `src/ramp-steps.ts`, `src/cervantes-garden-door.ts`, `src/cervantes-north-patios.ts`, `src/elena-junction-details.ts`, `src/cervantes-east-south-patios.ts`, `src/cervantes-lane-edges.ts`, `src/lane-walls.ts`

## Photos to build from

- `public/photos-ref/IMG_2286.jpg`: Elena junction: side-by-side ramp and steps (ground — pin ±1.5 m; looks at The steps beside the Cervantes ramp)
- `public/photos-ref/IMG_2448.jpg`: Cervantes/Alberto junction: signed wall and paving change, path with three white steps ahead (ground — pin ±4.7 m; looks at Lane beyond the Alberto crossing with three white steps)
- `public/photos-ref/IMG_2449.jpg`: Cervantes lane west of Alberto: 'CALLE DE MIGUEL' wall plaque and receding tiled lane (ground — pin ±4.7 m; looks at Lane west of the Alberto crossing with the Calle de Miguel plaque)
- `public/photos-ref/IMG_2274.jpg`: Cervantes: planting and paving detail (ground — pin ±4.1 m)
- `public/photos-ref/IMG_2468.jpg`: Cervantes west end: arcaded porch on the left, dracaena and shrub bed on the right (ground — pin ±2.3 m; looks at West end of the lane towards Dali)
- `public/photos-ref/IMG_2795.jpg`: Lane between a white wall and flowering shrubs (ground — pin ±2.6 m)
- `public/photos-ref/IMG_2450.jpg`: Cervantes lane: arched covered porch on the north side, bougainvillea wall opposite (ground — pin ±2.0 m; looks at Arched porch opening on the north side of the lane)
- `public/photos-ref/IMG_2794.jpg`: Lane with bougainvillea and grille windows, looking south-west (ground — pin ±2.5 m)
- `public/photos-ref/IMG_2796.jpg`: Lane beside a brown door and flowering beds (ground — pin ±2.6 m)
- `public/photos-ref/IMG_2453.jpg`: Cervantes west of the passage: lane with barred shuttered window and lantana beds (ground — pin ±2.6 m; looks at Steps at the Elena junction at the end of the lane (probable))
- `public/photos-ref/IMG_2443.jpg`: Cervantes east end: same view, a few metres on (ground — pin ±5.7 m; looks at Cervantes lane east end, white seat pillar and brick-edged steps)
- `public/photos-ref/IMG_2442.jpg`: Cervantes east end: lane with candelabra cacti, white seat pillar and brick-edged steps (ground — pin ±13.4 m; looks at Cervantes lane east end, white seat pillar and brick-edged steps)
- `public/photos-ref/IMG_2444.jpg`: Cervantes east end: looking back east along the lane to the car park side (ground — pin ±2.1 m; looks at Lane end opening towards the car park)

## Levels from the photos

From `data/levels_survey.json` (check with `scripts/check_levels.py`).

- `cervantes-alberto-steps` (steps): 0.22-0.32 m above the Calle Alberto crossing, high confidence at (-115.08, 34.81) ±1 m. Model: **built**, task `cervantes-lane-edges`. Two white-faced risers with aggregate nosings on the north half of the lane just west of the Alberto crossing, a smooth tiled ramp on the south half; the lane climbs towards Dalí. The laser survey has +0.54 m west of 91 m along the lane and +0.27 m east of 93.6 m: 0.27 m. Built from data/cervantes_alberto_steps.json and the terrain flight of the same name. (IMG_2448.jpg, IMG_2449.jpg)

## Build

Dave, 2026-11-16: start with the Cervantes/Elena junction and Cervantes from end to end; get the levels right (where the steps and ramps are) and fill the areas around the path with patio walls, small border walls and planters. Levels: check every change against the laser survey and data/levels_survey.json (the Elena steps and ramp, and the two steps just west of the Calle Alberto crossing). Structure: along the lane, build the photographed lane-side garden walls, the kerbed beds at the house fronts and the raised hedge planters where the model leaves open paving, in Layout, with planting only under Show details.

## Do not

Do not move the reviewed junction flight, garden door or lawns on the survey alone; do not invent walls or doors the photos do not show; keep the lane's walking line clear; leave Walk alone.

## Done when

- [ ] Visible in Inspect in Layout and with Show details
- [ ] scripts/check_terrain.py, check_levels.py, check_lane_walls.py and check_cervantes_lane_edges.py pass
- [ ] Second-agent review of the Inspect renders against the full-size photos, the survey profile and the aerial
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `cervantes-lane-edges` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
