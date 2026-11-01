# Photo-to-model loop: semi-automatic camera solving for every north-pool photo

Task `loop-camera-solving` · area **North pool** · priority P1 · tooling

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/north-pool.md` and the contact sheet `villacana-reference/contact-sheets/north-pool.jpg`
- docs: `docs/LEVELS.md`, `docs/NORTH_POOL_REVIEW.md`, `docs/RAISED_TERRACES.md`, `docs/NORTH_WEST_CANOPIES.md`, `docs/reviews/north-pool-alignment-audit/README.md`
- data: `data/objects.json`, `data/levels_survey.json`, `data/raised_terraces.json`, `data/north_pool_gardens.json`, `data/north_west_canopies.json`
- src: `src/world.ts`, `src/water.ts`, `src/raised-terraces.ts`, `src/north-pool-gardens.ts`, `src/north-west-canopies.ts`

## Photos to build from

- `public/photos-ref/IMG_2207.jpg`: Looking down over lichen-mottled barrel roof tiles to the north pool garden (upper-floor — pin ±4.7 m; looks at The north pool garden below the roof)
- `public/photos-ref/IMG_2208.jpg`: Barrel roof tiles, curved hedges and path below, pool edge (upper-floor — pin ±4.7 m; looks at The north pool garden and path below the roof)

## Build

Slice 4 of docs/PHOTO_LOOP_PRD.md. Propose photo-to-model correspondences automatically (pool rings, building corners, wall edges, aerial landmarks) for the agent to confirm; solve IMG_2207, IMG_2208 and every other solvable north-pool photo with held-out residuals; record reasons for the rest; compare through the new cameras.

## Do not

Walking and collision stay paused. Do not mark looks or placement as matching without the measured or reviewed evidence the PRD requires.

## Done when

- [ ] All solvable north-pool photos solved with held-out residuals
- [ ] Their discrepancies recorded
- [ ] Standard handover checks pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `loop-camera-solving` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `loop-discrepancies`
