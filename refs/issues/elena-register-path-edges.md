# Elena: register both physical path edges and finite ground boundaries

Task `elena-register-path-edges` · area **Calle Elena** · priority P1 · audit

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `villacana-reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/ELENA_EAST_PATIOS.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`, `docs/LEVELS.md`, `docs/reviews/path-network-inventory-elena/README.md`
- data: `data/elena_north.json`, `data/elena_east_patios.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`, `data/levels_survey.json`, `data/door_sills.json`
- src: `src/elena-north.ts`, `src/elena-east-patios.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`, `src/door-sills.ts`

## Photos to build from


## Build

Register source-pixel traces N01/N02/N03/S01/S02/J04 to independent ground anchors, reserve held-out controls and distinguish paved margin, tile field, clearance and roof outlines. Resolve hidden returns with named evidence requests before surfaces.

## Do not

No widths from tile counts, GPS camera pins, roof overhangs or nominal clearance buffers; no paving pass before structure.

## Done when

- [ ] Declared source/model scope and limitations retained
- [ ] Bounded comparison artifact and follow-up for every unresolved item
- [ ] Applicable audit software checks completed; geometry releases remain behind the browser regression prerequisite.
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `elena-register-path-edges` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `path-network-inventory-elena`
