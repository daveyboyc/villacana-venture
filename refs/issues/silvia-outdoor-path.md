# Match the outdoor Silvia path toward the pool entrance

Task `silvia-outdoor-path` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P1 · build

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`

## Photos to build from

- `public/photos-ref/IMG_2189.jpg`: Calle Silvia north: tiled lane looking to the middle pool south gateway (ground — pin ±3.0 m; looks at The middle pool south gateway at the end of Calle Silvia north, about 28 m ahead)
- `public/photos-ref/IMG_2334.jpg`: Middle pool south: iron gate in a pergola frame onto a lane (ground — pin ±1.5 m; looks at south gate, double iron leaves and the planter to its right)
- `public/photos-ref/IMG_2192.jpg`: Crazy-paving path between hedges into the middle pool lawn (ground — pin ±4.7 m)

## Build

Correct exterior paving material and coherent outdoor continuation to the provisional tunnel mouth, using four lane-aligned plain square tile columns, broad mortar and worn colouring. Keep indoor hopscotch behind the arch and pool-side stone forecourt distinct.

## Do not

No pool/gate/tunnel/planter/house/street/collision/level changes, no invented continuous bed/wall, no asserted photographic registration for the estimated connector.

## Done when

- [ ] Independent full-source and actual-map review with exact source limits
- [ ] Actual before/after outdoor scene and visible material transition, map/3D surface consistency
- [ ] Source/build/route checks and preserved known placement uncertainty
- [ ] Open after mainPR120 survey integration: garden sample at local8.6 is about0.23m above the level indoor slab. Reconcile the existing host datum/garden ground transition against source levels before claiming seamless photographic/placement fidelity; retain this task in progress.
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `silvia-outdoor-path` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
