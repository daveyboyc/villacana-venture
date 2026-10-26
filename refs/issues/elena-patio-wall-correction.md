# Elena: correct front-patio wall heights, joins and paving consistency

Task `elena-patio-wall-correction` · area **Calle Elena** · priority P1 · geometry

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `villacana-reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/ELENA_EAST_PATIOS.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`, `docs/LEVELS.md`, `docs/reviews/path-network-inventory-elena/README.md`, `docs/reviews/elena-patio-wall-correction/README.md`
- data: `data/elena_north.json`, `data/elena_east_patios.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`, `data/levels_survey.json`, `data/door_sills.json`
- src: `src/elena-north.ts`, `src/elena-east-patios.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`, `src/door-sills.ts`

## Photos to build from

- `public/photos-ref/IMG_2363.jpg`: Roof by Elena: looking down the lane to the north pool lawn gate (roof — pin ±4.7 m; looks at The arched gateway at the north end of Elena)
- `public/photos-ref/IMG_2199.jpg`: Calle Elena north: planting bed with pollarded tree and a garden door (ground — pin ±3.4 m; looks at The first hedged bed)
- `public/photos-ref/IMG_2200.jpg`: Calle Elena north: lane beside hedged beds and pollarded trees (ground — pin ±3.5 m; looks at The first hedged bed)
- `public/photos-ref/IMG_2201.jpg`: Calle Elena north: lane with window grilles and beds (ground — pin ±3.5 m; looks at The first hedged bed and the lane north)
- `public/photos-ref/IMG_2197.jpg`: Calle Elena north: tiled lane between planted beds (ground — pin ±3.5 m; looks at The second hedged bed and the lane)
- `public/photos-ref/IMG_2356.jpg`: Cervantes east of Elena: lane beside a plumbago hedge (ground — pin ±4.5 m; looks at Plumbago bed edge and screened patio boundary on Cervantes east of Elena)

## Build

Recheck full sources, correct door-relative wall heights and photographed front-patio returns, join wall meshes on a consistent surveyed-ground datum; audit patio/path material alignment without inventing concealed floors.

## Do not

No repeated guessed partitions, terrain changes, roof-to-ground projection or surveyed placement claims.

## Done when

- [ ] Annotated source comparison and independently inspected full photos
- [ ] Joined wall/coping meshes and shared collision/map inputs
- [ ] Same-camera before/after render evidence, paving consistency and route checks
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `elena-patio-wall-correction` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `path-network-inventory-elena`
