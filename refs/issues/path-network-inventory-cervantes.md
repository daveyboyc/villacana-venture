# Calle Miguel de Cervantes: full-source path, tunnel and boundary inventory

Task `path-network-inventory-cervantes` · area **Calle Miguel de Cervantes** · priority P1 · audit

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/cervantes.md` and the contact sheet `villacana-reference/contact-sheets/cervantes.jpg`
- docs: `docs/DALI_CERVANTES.md`, `docs/STREET_LAYOUT.md`, `docs/FRONTAGE_DIVISIONS.md`, `docs/ELENA_NORTH.md`, `docs/CERVANTES_NORTH_PATIOS.md`, `docs/LEVELS.md`, `docs/CERVANTES_DOOR_STEPS_REVIEW.md`, `docs/CERVANTES_EAST_SOUTH_PATIOS.md`
- data: `data/dali_cervantes.json`, `data/dali_cervantes_threshold.json`, `data/cervantes_patio_walls.json`, `data/passages.json`, `data/frontage_divisions.json`, `data/cervantes_elena_steps.json`, `data/levels_survey.json`, `data/cervantes_garden_door.json`, `data/cervantes_north_patios.json`, `data/junction_lawns.json`, `data/cervantes_east_south_patios.json`
- src: `src/cervantes-walls.ts`, `src/dali-threshold.ts`, `src/frontages.ts`, `src/ramp-steps.ts`, `src/cervantes-garden-door.ts`, `src/cervantes-north-patios.ts`, `src/junction-lawns.ts`, `src/cervantes-east-south-patios.ts`

## Photos to build from


## Build

Inspect every relevant full source and aerial; account for observed features, duplicates and unusable sources. Census covered connections, both path edges and wall/roof/enclosure interpretations; preserve unknowns and evidence requests.

## Do not

No guessed geometry, inferred public access, placement approval or completion from catalogue tags.

## Done when

- [ ] All available relevant full sources inspected with revision, reviewer, observations and limitations
- [ ] Every visible path, boundary and opening linked or named as a gap
- [ ] Both tunnel portals known or explicitly unresolved; aliases and identity evidence retained
- [ ] Labelled plan, annotations and tunnel sections linked; unresolved sources and tasks quantified
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `path-network-inventory-cervantes` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `path-network-baseline`
