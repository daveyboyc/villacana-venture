# Cervantes: two steps up to a front door west of the Elena junction

Task `cervantes-door-steps` · area **Calle Miguel de Cervantes** · priority P2 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/cervantes.md` and the contact sheet `villacana-reference/contact-sheets/cervantes.jpg`
- docs: `docs/DALI_CERVANTES.md`, `docs/STREET_LAYOUT.md`, `docs/FRONTAGE_DIVISIONS.md`, `docs/ELENA_NORTH.md`, `docs/CERVANTES_NORTH_PATIOS.md`, `docs/LEVELS.md`, `docs/CERVANTES_DOOR_STEPS_REVIEW.md`
- data: `data/dali_cervantes.json`, `data/dali_cervantes_threshold.json`, `data/cervantes_patio_walls.json`, `data/passages.json`, `data/frontage_divisions.json`, `data/cervantes_elena_steps.json`, `data/levels_survey.json`, `data/cervantes_garden_door.json`, `data/cervantes_north_patios.json`, `data/junction_lawns.json`
- src: `src/cervantes-walls.ts`, `src/dali-threshold.ts`, `src/frontages.ts`, `src/ramp-steps.ts`, `src/cervantes-garden-door.ts`, `src/cervantes-north-patios.ts`, `src/junction-lawns.ts`

## Photos to build from

- `public/photos-ref/IMG_2327.jpg`: Cervantes at Elena: steps up to a door beside the lane (ground — pin ±4.2 m)
- `public/photos-ref/IMG_2328.jpg`: Cervantes at Elena: ramp and steps side by side, drain at the foot (ground — pin ±4.0 m; looks at The ramp and steps side by side)
- `public/photos-ref/IMG_2287.jpg`: Elena junction: private doorway and planting (ground — pin ±3.0 m)
- `public/photos-ref/IMG_2196.jpg`: Elena junction: private brown door up tiled steps, bougainvillea (ground — pin ±3.0 m)
- `public/photos-ref/IMG_2358.jpg`: Roof by Elena: looking down on Elena south and the junction lawns (roof — pin ±2.0 m; looks at The junction lawns south of Cervantes)
- `public/photos-ref/IMG_2367.jpg`: Roof by Elena: looking south over the Cervantes/Elena junction (roof — pin ±3.9 m; looks at The Cervantes/Elena junction)

## Levels from the photos

From `data/levels_survey.json` (check with `scripts/check_levels.py`).

- `cervantes-junction-door-steps` (raised-threshold): 0.3-0.55 m above the lower junction paving, medium confidence at (-152.5, 55.5) ±1.5 m. Model: **built**, task `cervantes-door-steps`. Brown garden door in a wall with a curved coping on the north edge of the lane, just east of the drain line, facing south. Two red-tread steps with white risers. It sits at the foot of the 0.5 m drop, so it climbs back to the upper Cervantes level. (IMG_2287.jpg, IMG_2196.jpg, IMG_2327.jpg, IMG_2328.jpg)
- `cervantes-junction-north-patio` (raised-patio): 0.4-0.5 m above the lower junction paving, low confidence at (-153.5, 53.5) ±3 m. Model: **built**, task `cervantes-door-steps`. Inferred: the roof shots show a decorative-tiled patio behind the same curved-coping door, its floor level with the door sill. Its face to the lane is the wall and steps of the door. (IMG_2358.jpg, IMG_2367.jpg, IMG_2359.jpg, IMG_2369.jpg)
- `cervantes-junction-north-bed` (raised-bed): 0.3-0.5 m above the lower junction paving, medium confidence at (-154, 56.2) ±2 m. Model: **built**, task `cervantes-door-steps`. White-walled hedge bed on the north side running 2-3 m west from the door corner along the steps; top about level with the second door step. (IMG_2286.jpg, IMG_2328.jpg, IMG_2355.jpg, IMG_2327.jpg, IMG_2196.jpg)

## Build

Two red-tread steps with white risers climbing about 0.45 m (range 0.3-0.55) to a brown garden door in a white wall with a curved coping, on the north edge of the lane just east of the ramp drain, at about (-152.5, 55.5). The door sits at the foot of the 0.5 m drop and climbs back to the upper Cervantes level; behind it (roof shots) is a tiled patio level with the sill, and a white-walled hedge bed 0.3-0.5 m high runs 2-3 m west along the steps. Heights: data/levels_survey.json items cervantes-junction-door-steps, cervantes-junction-north-patio, cervantes-junction-north-bed.

## Do not

The door is in a garden wall at the lane edge, not in the registry house front: do not move or extend the house, and do not narrow the lane or the steps beside the ramp. The steps stop at the garden wall.

## Done when

- [ ] check_cervantes_patio_walls.py and check_terrain.py pass
- [ ] layout test still climbs the ramp steps
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `cervantes-door-steps` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
