# Elena north: path and garden door between the two hedged beds

Task `elena-garden-door` · area **Calle Elena** · priority P2 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `villacana-reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`
- data: `data/elena_north.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`
- src: `src/elena-north.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`

## Photos to build from

- `public/photos-ref/IMG_2199.jpg`: Calle Elena north: planting bed with pollarded tree and a garden door (ground — pin ±3.4 m; looks at The first hedged bed)
- `public/photos-ref/IMG_2201.jpg`: Calle Elena north: lane with window grilles and beds (ground — pin ±3.5 m; looks at The first hedged bed and the lane north)
- `public/photos-ref/IMG_2200.jpg`: Calle Elena north: lane beside hedged beds and pollarded trees (ground — pin ±3.5 m; looks at The first hedged bed)

## Build

The short paved path running east between elena-north-tree-bed-1 and tree-bed-2 to a white garden wall with a brown timber door (and a small barred window in that wall). Add the wall segment only as far as the photos show it.

## Do not

Do not continue the wall past what IMG_2199/2201 show; do not close the path.

## Done when

- [ ] check_elena_north.py extended for the new wall
- [ ] layout browser test walks into the path and stops at the door
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `elena-garden-door` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
