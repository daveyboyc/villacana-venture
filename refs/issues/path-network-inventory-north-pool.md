# North pool: full-source path, tunnel and boundary inventory

Task `path-network-inventory-north-pool` · area **North pool** · priority P1 · audit

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/north-pool.md` and the contact sheet `villacana-reference/contact-sheets/north-pool.jpg`
- docs: `docs/LEVELS.md`, `docs/NORTH_POOL_REVIEW.md`, `docs/RAISED_TERRACES.md`, `docs/NORTH_WEST_CANOPIES.md`, `docs/reviews/north-pool-alignment-audit/README.md`
- data: `data/objects.json`, `data/levels_survey.json`, `data/raised_terraces.json`, `data/north_pool_gardens.json`, `data/north_west_canopies.json`
- src: `src/world.ts`, `src/water.ts`, `src/raised-terraces.ts`, `src/north-pool-gardens.ts`, `src/north-west-canopies.ts`

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
- [ ] `data/build_queue.json`: `path-network-inventory-north-pool` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `path-network-baseline`
