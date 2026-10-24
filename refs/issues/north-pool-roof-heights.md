# Storey heights: match roof heights to the laser survey

Task `north-pool-roof-heights` · area **The whole resort** · priority P3 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`

## Photos to build from

- `public/photos-ref/IMG_2204.jpg`: North pool from above: whole courtyard, terraces, mountains behind (upper-floor — pin ±3.4 m; looks at The north pool)
- `public/photos-ref/IMG_2205.jpg`: North pool from above, looking north to the mountains (upper-floor — pin ±4.7 m; looks at The north pool)

## Build

The north-pool parapets that the photo camera solve measured 1.0-1.2 m above the model's roofs (IMG_2204/2205) turned out to be ground, not storey height: the laser survey puts those houses' ground about 1.2 m higher than the model and their roofs at 5.5-6.3 m above it (docs/reviews/lidar-levels). Resort-wide the survey gives 3.7 m for one storey (model 3.0), 5.9 m for two (6.0) and 8.3 m for three (9.0). Replace the flat 3 m per storey with a rule that matches, or per-building surveyed heights, once terrain-from-lidar sets the ground.

## Do not

No change to registry footprints. Do not raise roofs to fix what is a ground-level error.

## Done when

- [ ] scripts/lidar_check.py roof medians within 0.3 m of the model for each storey count
- [ ] Re-solved photo checks for the north-pool parapet corners within about 0.3 m
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `north-pool-roof-heights` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `photo-camera-alignment`, `terrain-from-lidar`
