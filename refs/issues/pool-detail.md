# Pools: photo-matched water, waterline tiles, jointed coping, straight steps and slab decks

Task `pool-detail` · area **The whole resort** · priority P1 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`

## Photos to build from

- `public/photos-ref/IMG_2204.jpg`: North pool from above: whole courtyard, terraces, mountains behind (upper-floor — pin ±3.4 m; looks at The north pool)

## Build

Owner request 31 October: focus on a detailed 3D model, and the pools are less detailed than the photos. Water is pale over the margins and deeper blue in the middle (colours sampled from IMG_2204), rippled with sky reflection and sun glints; a darker waterline tile band tops each wall; the coping is 0.38 m stone slabs with joints in three tones; pool_steps are three straight treads square to the nearest wall with dark blue nosings; plant-room boxes have louvred sides; pool decks get 0.6 by 0.4 m pale slabs at full resolution; ground class edges are smoothed per class so no pale halo remains between deck and lawn.

## Do not

No change to registry pool rings, deck outlines, pool levels or prop positions. The glass safety fence stays out (Dave, 2026-10-11).

## Done when

- [ ] IMG_2204 rendered through its solved camera before and after
- [ ] Production build, layout browser test, overview browser test and check_pool_levels.py pass
- [ ] Standard handover checks pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `pool-detail` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
