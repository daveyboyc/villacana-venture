# North pool: register maps and audit courtyard buildings and connecting lanes

Task `north-pool-alignment-audit` · area **North pool** · priority P1 · audit

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/north-pool.md` and the contact sheet `villacana-reference/contact-sheets/north-pool.jpg`
- docs: `docs/LEVELS.md`, `docs/NORTH_POOL_REVIEW.md`, `docs/RAISED_TERRACES.md`, `docs/NORTH_WEST_CANOPIES.md`
- data: `data/objects.json`, `data/levels_survey.json`, `data/raised_terraces.json`, `data/north_pool_gardens.json`, `data/north_west_canopies.json`
- src: `src/world.ts`, `src/water.ts`, `src/raised-terraces.ts`, `src/north-pool-gardens.ts`, `src/north-west-canopies.ts`

## Photos to build from


## Build

Produce source inventory, distributed control and held-out landmark measurements, labelled footprint/pool/path overlays, per-feature discrepancies and photo limitations before any geometry correction. Sources include IMG_2202/2204-2208/2363, private photos01/03-07, Apple02/07/08/09 and available Google satellite/standard screenshots. Apply only independently reviewed confirmed plan errors within the north-pool scope.

## Do not

No local image warps, private imagery in public assets, inferred hidden boundaries or claimed calibrated photographic matches. Preserve registry baseline unless specific evidence supports correction.

## Done when

- [ ] Reviewable measured alignment and discrepancy report committed before geometry edits
- [ ] Private comparisons in villacana-reference; public report links only
- [ ] Independent source-image review; required checks for any geometry changes
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `north-pool-alignment-audit` set to done
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
