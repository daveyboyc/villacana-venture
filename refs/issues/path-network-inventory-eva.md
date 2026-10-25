# Calle Eva: full-source path, tunnel and boundary inventory

Task `path-network-inventory-eva` · area **Calle Eva** · priority P1 · audit

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/eva.md` and the contact sheet `villacana-reference/contact-sheets/eva.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/MIDDLE_POOL.md`, `docs/EVA_WALLED_LAWN.md`
- data: `data/street_layout.json`, `data/middle_pool.json`, `data/eva_walled_lawn.json`
- src: `src/middle-pool.ts`, `src/eva-walled-lawn.ts`

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
- [ ] `data/build_queue.json`: `path-network-inventory-eva` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `path-network-baseline`
