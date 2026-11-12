# Enrique's: the shop storey above the street-level terrace at the head of the steps

Task `enrique-shop-storey` · area **Main pool** · priority P2 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/main-pool.md` and the contact sheet `villacana-reference/contact-sheets/main-pool.jpg`
- docs: `docs/MAIN_POOL.md`
- data: `data/main_pool.json`, `data/guillermo_slope.json`, `data/seafront_fence.json`, `data/main_pool_lawn.json`
- src: `src/main-pool.ts`, `src/pool-levels.ts`, `src/lowered-lanes.ts`, `src/seafront-fence.ts`, `src/main-pool-lawn.ts`

## Photos to build from

- `public/photos-ref/IMG_2775.jpg`: Lane down to the pool building with slot drains (ground — pin ±4.7 m)
- `public/photos-ref/IMG_2776.jpg`: Steps and ramp at the foot of the lane by the pool building (ground — pin ±4.7 m)

## Build

IMG_2775 and IMG_2776 show a white storey with a curved fin wall standing on the street-level terrace at the head of Enrique's steps: glazed shop fronts under three blue box awnings, a wall lantern, menu boards, and three blue-tiled risers up to it. The model has only the walkable terrace roof there, so the awnings hang in the air. Trace the storey's front from the photos and the aerial, build it on the terrace and hang the awnings on it.

## Do not

Do not move the registry footprints of the terrace building or the roof fins without a measured correction.

## Done when

- [ ] The awnings stand on a wall in Inspect with Show details
- [ ] Photo check from IMG_2775
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `enrique-shop-storey` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
