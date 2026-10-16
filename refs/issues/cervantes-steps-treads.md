# Cervantes/Elena steps: tighten the treads to the photographed spacing

Task `cervantes-steps-treads` · area **Calle Miguel de Cervantes** · priority P3 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/cervantes.md` and the contact sheet `villacana-reference/contact-sheets/cervantes.jpg`
- docs: `docs/DALI_CERVANTES.md`, `docs/STREET_LAYOUT.md`, `docs/FRONTAGE_DIVISIONS.md`, `docs/ELENA_NORTH.md`, `docs/CERVANTES_NORTH_PATIOS.md`, `docs/LEVELS.md`, `docs/CERVANTES_DOOR_STEPS_REVIEW.md`
- data: `data/dali_cervantes.json`, `data/dali_cervantes_threshold.json`, `data/cervantes_patio_walls.json`, `data/passages.json`, `data/frontage_divisions.json`, `data/cervantes_elena_steps.json`, `data/levels_survey.json`, `data/cervantes_garden_door.json`, `data/cervantes_north_patios.json`, `data/junction_lawns.json`
- src: `src/cervantes-walls.ts`, `src/dali-threshold.ts`, `src/frontages.ts`, `src/ramp-steps.ts`, `src/cervantes-garden-door.ts`, `src/cervantes-north-patios.ts`, `src/junction-lawns.ts`

## Photos to build from

- `public/photos-ref/IMG_2286.jpg`: Elena junction: side-by-side ramp and steps (ground — pin ±1.5 m; looks at The steps beside the Cervantes ramp)
- `public/photos-ref/IMG_2355.jpg`: Cervantes/Elena steps from the junction (ground — pin ±4.4 m; looks at The steps beside the Cervantes ramp)
- `public/photos-ref/IMG_2328.jpg`: Cervantes at Elena: ramp and steps side by side, drain at the foot (ground — pin ±4.0 m; looks at The ramp and steps side by side)

## Levels from the photos

From `data/levels_survey.json` (check with `scripts/check_levels.py`).

- `cervantes-elena-steps` (steps): 0.4-0.5 m above the drain at the junction, high confidence at (-153.7, 57.4) ±1.5 m. Model: **differs**, task `cervantes-steps-treads`. North half of the lane. Bottom riser one tile row up from the drain; each tread one tile plus a grey stone nosing, 0.45-0.55 m. Risers at about 0.4, 0.92 and 1.45 m from the drain; the model has 0.4, 1.0 and 1.6 (data/cervantes_elena_steps.json). (IMG_2286.jpg, IMG_2355.jpg, IMG_2328.jpg, IMG_2262.jpg)

## Build

The photos give risers at about 0.4, 0.92 and 1.45 m from the drain (one tile plus a grey stone nosing per tread, 0.45-0.55 m); data/cervantes_elena_steps.json has 0.4, 1.0 and 1.6. Move them, keeping every tread above the ramp beside it (shorten the local run in data/terrain.json if needed). Heights: data/levels_survey.json item cervantes-elena-steps.

## Do not

The ramp ends stay on the Cervantes road vertices (check_boundary_reference.py).

## Done when

- [ ] check_terrain.py and check_elena_north.py pass
- [ ] layout test still climbs the steps one riser at a time
- [ ] check_levels.py: cervantes-elena-steps marked built
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `cervantes-steps-treads` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
