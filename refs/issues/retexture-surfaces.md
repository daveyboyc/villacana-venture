# Retexture plaster, terracotta and crazy paving from the photos

Task `retexture-surfaces` · area **The whole resort** · priority P2 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`

## Photos to build from

- `public/photos-ref/IMG_2204.jpg`: North pool from above: whole courtyard, terraces, mountains behind (upper-floor — pin ±3.4 m; looks at The north pool)
- `public/photos-ref/IMG_2263.jpg`: Cervantes: lane and clipped planting toward the junction (ground — pin ±4.1 m)
- `public/photos-ref/IMG_2237.jpg`: Octagonal-tiled lane with lantern and hedges (ground — pin ±4.7 m)

## Build

The graphics pilot left the generated plaster, terracotta tile and crazy-paving textures as they were. Replace them with photo-matched textures (CC0 sources or textures made from the photos' colours and scale: 0.2 m tiles, grey-brown crazy paving), compared through the solved north-pool cameras.

## Do not

No heavy downloads: keep textures small and tiled. No geometry changes.

## Done when

- [ ] Before/after through the solved north-pool cameras
- [ ] Download size added stated
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `retexture-surfaces` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
