# Cervantes: correct supported boundary and passage omissions after registration

Task `cervantes-bounded-structure` · area **Calle Miguel de Cervantes** · priority P1 · build

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/cervantes.md` and the contact sheet `villacana-reference/contact-sheets/cervantes.jpg`
- docs: `docs/DALI_CERVANTES.md`, `docs/STREET_LAYOUT.md`, `docs/FRONTAGE_DIVISIONS.md`, `docs/ELENA_NORTH.md`, `docs/CERVANTES_NORTH_PATIOS.md`, `docs/LEVELS.md`, `docs/CERVANTES_DOOR_STEPS_REVIEW.md`, `docs/CERVANTES_EAST_SOUTH_PATIOS.md`, `docs/reviews/path-network-inventory-cervantes/README.md`
- data: `data/dali_cervantes.json`, `data/dali_cervantes_threshold.json`, `data/cervantes_patio_walls.json`, `data/passages.json`, `data/frontage_divisions.json`, `data/cervantes_elena_steps.json`, `data/levels_survey.json`, `data/cervantes_garden_door.json`, `data/cervantes_north_patios.json`, `data/junction_lawns.json`, `data/cervantes_east_south_patios.json`
- src: `src/cervantes-walls.ts`, `src/dali-threshold.ts`, `src/frontages.ts`, `src/ramp-steps.ts`, `src/cervantes-garden-door.ts`, `src/cervantes-north-patios.ts`, `src/junction-lawns.ts`, `src/cervantes-east-south-patios.ts`

## Photos to build from


## Build

Compare source inventory with the registered current model and implement only declared supported finite structural corrections, before surface/detail refinement. Keep the Miguel group separate until its identity/portals are solved.

## Do not

No whole-lane facade replacement, hidden enclosure completion or unregistered tunnel construction.

## Done when

- [ ] Affected raw feature IDs and before/after source comparisons declared
- [ ] Ground/roof, route/door steps and drain distinctions retained
- [ ] Build, actual-surface visibility and routes both directions pass; unresolved placement/levels remain visible
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `cervantes-bounded-structure` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `path-network-inventory-cervantes`, `cervantes-register-edges`, `3d-browser-regression-reliability`
