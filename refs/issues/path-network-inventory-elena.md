# Calle Elena: full-source path, tunnel and boundary inventory

Task `path-network-inventory-elena` · area **Calle Elena** · priority P1 · audit

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `villacana-reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/ELENA_EAST_PATIOS.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`, `docs/LEVELS.md`
- data: `data/elena_north.json`, `data/elena_east_patios.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`, `data/levels_survey.json`, `data/door_sills.json`
- src: `src/elena-north.ts`, `src/elena-east-patios.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`, `src/door-sills.ts`

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
- [ ] `data/build_queue.json`: `path-network-inventory-elena` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `path-network-baseline`
