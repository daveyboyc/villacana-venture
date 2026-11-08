# Calle Eva east: octagonal paving, azulejo benches, hedged planters and lanterns

Task `eva-east-lane` · area **Calle Eva** · priority P2 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/eva.md` and the contact sheet `villacana-reference/contact-sheets/eva.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/MIDDLE_POOL.md`, `docs/EVA_WALLED_LAWN.md`, `docs/EVA_LANE.md`, `docs/ALBERTO_PASSAGE.md`
- data: `data/street_layout.json`, `data/middle_pool.json`, `data/eva_walled_lawn.json`, `data/eva_lane.json`, `data/alberto_passage.json`
- src: `src/middle-pool.ts`, `src/eva-walled-lawn.ts`, `src/eva-lane.ts`, `src/clipped-plants.ts`, `src/alberto-passage.ts`

## Photos to build from

- `public/photos-ref/IMG_2727.jpg`: Calle Eva east: octagonal paving, lantern and tiled bench (ground — pin ±2.2 m)
- `public/photos-ref/IMG_2732.jpg`: Calle Eva east: bench, lantern and octagonal paving (ground — pin ±2.1 m)
- `public/photos-ref/IMG_2730.jpg`: White rendered bench with an azulejo panel on Calle Eva east (ground — pin ±2.2 m)
- `public/photos-ref/IMG_2785.jpg`: Calle Eva east: octagonal paving between hedged planters (ground — pin ±2.0 m)
- `public/photos-ref/IMG_2786.jpg`: Eva east: strelitzia, azulejo bench and lantern (ground — pin ±2.9 m)
- `public/photos-ref/IMG_2787.jpg`: Eva east: strelitzia and azulejo bench, closer (ground — pin ±3.0 m)
- `public/photos-ref/IMG_2788.jpg`: Eva east looking west: square tiles between hedged planters (ground — pin ±2.2 m)
- `public/photos-ref/IMG_2728.jpg`: Side garden with brick-edged steps off Calle Eva east (ground — pin ±2.2 m)
- `public/photos-ref/IMG_2729.jpg`: Side garden with brick-edged steps, wider view (ground — pin ±2.1 m)

## Build

Extend the photographed Eva lane east of the Teodoro Rojo junction: octagonal terracotta paving with square inserts, cast covers and drains, hedged white planters, white rendered benches with azulejo panels, lanterns and strelitzias on the lawns, and the walled side garden with brick-nosed steps; find where the octagonal paving changes to the square tiles (IMG_2788-2790).

## Do not

Do not move the mapped Eva line or registry footprints; keep plant footprints out of the routes.

## Done when

- [ ] Before/after renders through each photo's camera recorded in data/photo_checks.json
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `eva-east-lane` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `eva-lane-details`
