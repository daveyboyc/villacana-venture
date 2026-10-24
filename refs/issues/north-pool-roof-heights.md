# North pool: raise the two-storey courtyard roofs to the measured parapet height

Task `north-pool-roof-heights` · area **North pool** · priority P2 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/north-pool.md` and the contact sheet `villacana-reference/contact-sheets/north-pool.jpg`
- docs: `docs/LEVELS.md`, `docs/NORTH_POOL_REVIEW.md`, `docs/RAISED_TERRACES.md`, `docs/NORTH_WEST_CANOPIES.md`, `docs/reviews/north-pool-alignment-audit/README.md`
- data: `data/objects.json`, `data/levels_survey.json`, `data/raised_terraces.json`, `data/north_pool_gardens.json`, `data/north_west_canopies.json`
- src: `src/world.ts`, `src/water.ts`, `src/raised-terraces.ts`, `src/north-pool-gardens.ts`, `src/north-west-canopies.ts`

## Photos to build from

- `public/photos-ref/IMG_2204.jpg`: North pool from above: whole courtyard, terraces, mountains behind (upper-floor — pin ±3.4 m; looks at The north pool)
- `public/photos-ref/IMG_2205.jpg`: North pool from above, looking north to the mountains (upper-floor — pin ±4.7 m; looks at The north pool)

## Build

Four held-out roof corners measured through the solved north-pool station camera (data/photo_poses.json, docs/reviews/photo-camera-alignment) sit 0.9-1.2 m above the model's tops on both the tall house (registry 6165501UF1366N_part5) and the east block (6266601UF1366N_part4): the model gives a two-storey house 2 x 3 m with no parapet, the photos show parapet tops about 7.0-7.2 m above their ground. Decide from more corners and other areas whether this is a parapet, a taller storey or both, and change the height rule rather than single buildings if it holds everywhere.

## Do not

No change to registry footprints. Do not raise every building from four corners at one courtyard: measure more stations first.

## Done when

- [ ] Re-solved photo checks for the parapet corners within about 0.3 m
- [ ] Roof corners measured at a second station or area before a resort-wide rule changes
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `north-pool-roof-heights` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `photo-camera-alignment`
