# Cervantes east of Elena: white kerb wall and plumbago hedge

Task `cervantes-east-hedge` · area **Calle Miguel de Cervantes** · priority P3 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/cervantes.md` and the contact sheet `villacana-reference/contact-sheets/cervantes.jpg`
- docs: `docs/DALI_CERVANTES.md`, `docs/STREET_LAYOUT.md`, `docs/FRONTAGE_DIVISIONS.md`, `docs/ELENA_NORTH.md`, `docs/LEVELS.md`, `docs/CERVANTES_DOOR_STEPS_REVIEW.md`
- data: `data/dali_cervantes.json`, `data/dali_cervantes_threshold.json`, `data/cervantes_patio_walls.json`, `data/passages.json`, `data/frontage_divisions.json`, `data/cervantes_elena_steps.json`, `data/levels_survey.json`
- src: `src/cervantes-walls.ts`, `src/dali-threshold.ts`, `src/frontages.ts`, `src/ramp-steps.ts`

## Photos to build from

- `public/photos-ref/IMG_2356.jpg`: Cervantes east of Elena: lane beside a plumbago hedge (ground — pin ±4.5 m)
- `public/photos-ref/IMG_2360.jpg`: Roof by Elena: looking east-north-east along Cervantes (roof — pin ±2.8 m; looks at Cervantes east of Elena, seen along its line)

## Levels from the photos

From `data/levels_survey.json` (check with `scripts/check_levels.py`).

- `cervantes-east-north-bed` (raised-bed): 0.3-0.45 m above Cervantes east of Elena, medium confidence. Model: **missing**, task `cervantes-east-hedge`. White retaining wall with a plumbago hedge on top, north side east of Elena, at least 8 m, ending in a small rounded post. Water standing at its foot suggests a very flat lane. (IMG_2356.jpg, IMG_2265.jpg)

## Build

The white retaining wall (0.3-0.45 m) with a tall plumbago hedge on top on the north side of Cervantes east of the junction, at least 8 m long and ending in a small rounded post, as far as IMG_2356 shows. Heights: data/levels_survey.json item cervantes-east-north-bed.

## Do not

Unphotographed eastern frontage stays unasserted (see docs/FRONTAGE_DIVISIONS.md).

## Done when

- [ ] check_cervantes_patio_walls.py or a new check passes
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `cervantes-east-hedge` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
