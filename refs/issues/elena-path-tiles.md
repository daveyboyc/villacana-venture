# Elena: three straight tile columns and separate grey path margins

Task `elena-path-tiles` · area **Calle Elena** · priority P1 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `villacana-reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/ELENA_EAST_PATIOS.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`, `docs/LEVELS.md`, `docs/reviews/path-network-inventory-elena/README.md`
- data: `data/elena_north.json`, `data/elena_east_patios.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`, `data/levels_survey.json`, `data/door_sills.json`
- src: `src/elena-north.ts`, `src/elena-east-patios.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`, `src/door-sills.ts`

## Photos to build from

- `public/photos-ref/IMG_2201.jpg`: Calle Elena north: lane with window grilles and beds (ground — pin ±3.5 m; looks at The first hedged bed and the lane north)
- `public/photos-ref/IMG_2253.jpg`: Calle Elena south: tiled lane beside a lawn (ground — pin ±2.1 m; looks at Calle Elena south outdoor path: three straight square-tile columns, beside lawns and planted frontage)
- `public/photos-ref/IMG_2330.jpg`: Calle Elena south from the junction, towards the middle pool (ground — pin ±3.4 m; looks at Calle Elena south outdoor path: three straight square-tile columns, beside lawns and planted frontage)

## Build

Apply the owner-confirmed three-column straight square-tile grid along the existing north/south path axes. Retain existing path extents and levels, make grey margins distinct, and continue the shared square-grid phase through the garden spur. Compare actual visible surfaces before/after; no new measured path boundaries inferred.

## Do not

Do not apply this grid to patterned covered passages, Silvia four-column surfaces, pools or other streets. Do not derive surveyed widths from the tile count or change registry/terrain/collision.

## Done when

- [ ] Three straight tile columns on existing Elena north/south paths; grey margins separate
- [ ] Actual-surface ray checks and before/after source-context renders
- [ ] Map/3D share lane alignment; unchanged original registry/pool/road inputs
- [ ] Independent source/render review and applicable source/build/route regressions
- [ ] Scoped material correction independently reviewed; original road/spur geometry and known height/registration gaps retained. Full layout passed 20 routes in both directions / 438 traversal segments.
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `elena-path-tiles` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `path-network-inventory-elena`
