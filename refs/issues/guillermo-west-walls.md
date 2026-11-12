# Calle Guillermo west side: garden walls, not house fronts (Dave: the houses on the left don't match the photo)

Task `guillermo-west-walls` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P1 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`, `data/silvia_ramp_passages.json`, `data/jorge_lane.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`, `src/silvia-ramp-passage.ts`, `src/silvia-ramp-study.ts`, `src/jorge-lane.ts`, `src/candelabra-cactus.ts`

## Photos to build from

- `public/photos-ref/IMG_2773.jpg`: Lane beside the main pool with a lantana planter wall (ground — pin ±2.5 m; looks at Calle Guillermo north of the Jorge junction: octagon and square tiles, the lantana planter wall on the east side)
- `public/photos-ref/IMG_2774.jpg`: Octagonal-paved lane beside the lantana planter (ground — pin ±4.7 m; looks at the lantana planter wall along Calle Guillermo, about a metre high, with the yucca clump behind it)

## Build

Dave, 2026-11-12: from the IMG_2773 viewpoint the houses on the left do not match the photo. The photo shows, left of the lane: the plinth lawn with a small tree; a plain white garden wall about 2 m high, stepping up towards the lane, with bougainvillea trained along it and a no-dogs sign; then low white planter walls with clipped hedges and a lamp post along the lane; the houses themselves stand back behind these, with chimneys showing above. The model shows registry blocks extruded as one- and two-storey houses with arched doors, shutters and tiled porches right at the lawn and lane. Inventory the walls, openings and heights from IMG_2773, IMG_2774 and IMG_2597 first (docs/REFERENCE_PACK_WORKFLOW.md); decide which registry parts are patios enclosed by garden walls and not roofed rooms; then build those as walls of the photographed height with no generic doors, shutters or porches, and the planters and hedges along the lane.

## Do not

Do not change registry footprints without evidence; record what cannot be seen. Leave Walk alone.

## Done when

- [ ] Dave says the IMG_2773 view is fine
- [ ] Render through the photo camera recorded in data/photo_checks.json with every remaining difference listed
- [ ] Visible in Inspect, in Layout and with Show details
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `guillermo-west-walls` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `jorge-guillermo-paving`
