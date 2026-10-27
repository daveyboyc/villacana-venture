# Cervantes/Elena garden door (Elena 24 patio): three-riser flight, framing beds and door frame

Task `cervantes-door-steps-detail` · area **Calle Miguel de Cervantes** · priority P2 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/cervantes.md` and the contact sheet `villacana-reference/contact-sheets/cervantes.jpg`
- docs: `docs/DALI_CERVANTES.md`, `docs/STREET_LAYOUT.md`, `docs/FRONTAGE_DIVISIONS.md`, `docs/ELENA_NORTH.md`, `docs/CERVANTES_NORTH_PATIOS.md`, `docs/LEVELS.md`, `docs/CERVANTES_DOOR_STEPS_REVIEW.md`, `docs/CERVANTES_EAST_SOUTH_PATIOS.md`, `docs/reviews/path-network-inventory-cervantes/README.md`
- data: `data/dali_cervantes.json`, `data/dali_cervantes_threshold.json`, `data/cervantes_patio_walls.json`, `data/passages.json`, `data/frontage_divisions.json`, `data/cervantes_elena_steps.json`, `data/levels_survey.json`, `data/cervantes_garden_door.json`, `data/cervantes_north_patios.json`, `data/junction_lawns.json`, `data/cervantes_east_south_patios.json`
- src: `src/cervantes-walls.ts`, `src/dali-threshold.ts`, `src/frontages.ts`, `src/ramp-steps.ts`, `src/cervantes-garden-door.ts`, `src/cervantes-north-patios.ts`, `src/junction-lawns.ts`, `src/cervantes-east-south-patios.ts`

## Photos to build from

- `public/photos-ref/IMG_2196.jpg`: Elena junction: private brown door up tiled steps, bougainvillea (ground — pin ±3.0 m; looks at The brown garden door, its pilaster frame and curved coping, and the three-riser flight up to it)
- `public/photos-ref/IMG_2287.jpg`: Elena junction: private doorway and planting (ground — pin ±3.0 m; looks at The brown garden door and its three-riser flight between the west hedge bed and the east planter)
- `public/photos-ref/IMG_2327.jpg`: Cervantes at Elena: steps up to a door beside the lane (ground — pin ±4.2 m; looks at The garden-door steps: two red treads and the threshold, the west bed's rounded end and the east planter)
- `public/photos-ref/IMG_2328.jpg`: Cervantes at Elena: ramp and steps side by side, drain at the foot (ground — pin ±4.0 m; looks at The ramp and steps side by side)

## Build

Full-size recheck of IMG_2196/2287/2327/2328: the brown garden door on Cervantes north at the Elena junction (the patio photographed from the Elena 24 roof) is reached by three white risers, not two: a bottom step about 1.2 m wide with rounded ends, flush with the west hedge bed's front; a second step about 1.0 m wide between the bed's rounded end and a low east planter; a threshold tread in front of the door. Each tread is two rows of small red quarry tiles. Door about 0.72 m by 1.8 m in a white pilaster frame about 1.0 m wide under a curved coping about 1.1 m wide.

## Do not

Keep the garden wall origin and line, the 0.45 m door/patio rise and the private patio extent; do not move the separate low lane-edge wall east of the planter or narrow Cervantes.

## Done when

- [ ] check_cervantes_garden_door.py and check_terrain.py pass
- [ ] layout test climbs three equal risers to the patio datum and finds the door solid
- [ ] before/after renders from IMG_2196, IMG_2287, IMG_2327 and IMG_2328 recorded
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `cervantes-door-steps-detail` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `cervantes-door-steps`
