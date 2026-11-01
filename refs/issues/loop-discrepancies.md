# Photo-to-model loop: discrepancy records, pixel-to-map projection and the first north-pool comparison

Task `loop-discrepancies` · area **North pool** · priority P1 · tooling

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/north-pool.md` and the contact sheet `villacana-reference/contact-sheets/north-pool.jpg`
- docs: `docs/LEVELS.md`, `docs/NORTH_POOL_REVIEW.md`, `docs/RAISED_TERRACES.md`, `docs/NORTH_WEST_CANOPIES.md`, `docs/reviews/north-pool-alignment-audit/README.md`
- data: `data/objects.json`, `data/levels_survey.json`, `data/raised_terraces.json`, `data/north_pool_gardens.json`, `data/north_west_canopies.json`
- src: `src/world.ts`, `src/water.ts`, `src/raised-terraces.ts`, `src/north-pool-gardens.ts`, `src/north-west-canopies.ts`

## Photos to build from

- `public/photos-ref/IMG_2204.jpg`: North pool from above: whole courtyard, terraces, mountains behind (upper-floor — pin ±3.4 m; looks at The north pool)
- `public/photos-ref/IMG_2205.jpg`: North pool from above, looking north to the mountains (upper-floor — pin ±4.7 m; looks at The north pool)
- `public/photos-ref/IMG_2206.jpg`: North pool from above, west side terraces (upper-floor — pin ±4.7 m; looks at The north pool, west side)

## Build

Slice 1 of docs/PHOTO_LOOP_PRD.md. data/discrepancies.json (schema and checks) shown in refs/graph.json, area briefs, scorecard and map; a pixel-to-map script (solved camera ray to model ground or a stated height, with uncertainty); comparison artifacts per solved camera; a full comparison of IMG_2204-2206 recording every visible difference at the north pool, including the pool shape and squared deck tongue, the pump box position, and missing parasols, plants and trees.

## Do not

Walking and collision stay paused. Do not mark looks or placement as matching without the measured or reviewed evidence the PRD requires.

## Done when

- [ ] Every visible north-pool difference in IMG_2204-2206 recorded with photo region, map position and artifacts
- [ ] Discrepancies shown in brief, scorecard and map
- [ ] Standard handover checks pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `loop-discrepancies` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
