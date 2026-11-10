# Calle Jorge: keep only what the photos show, and make it look like them

Task `jorge-lane-review` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P2 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`, `data/silvia_ramp_passages.json`, `data/jorge_lane.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`, `src/silvia-ramp-passage.ts`, `src/silvia-ramp-study.ts`, `src/jorge-lane.ts`, `src/candelabra-cactus.ts`

## Photos to build from

- `public/photos-ref/IMG_2229.jpg`: Tiled lane between lawns with a white tiled bench (ground — pin ±3.8 m; looks at Calle Jorge looking west: tiled path, the white azulejo bench on the lawn side, planter wall and hedge on the other)
- `public/photos-ref/IMG_2230.jpg`: Tiled lane beside hedges and a patio wall (ground — pin ±2.0 m; looks at Jorge path, hedge-side yucca and the cactus crown)
- `public/photos-ref/IMG_2231.jpg`: White tiled bench beside the lane (ground — pin ±2.1 m; looks at white bench, house number 20 and the Teodoro plaque)
- `public/photos-ref/IMG_2233.jpg`: Lawn with candelabra cactus and shrubs (ground — pin ±2.7 m; looks at the candelabra tree in the garden behind the Calle Jorge wall)
- `public/photos-ref/IMG_2234.jpg`: Tiled lane with a wall plaque, lamp post and lawn (ground — pin ±3.1 m; looks at square tile path, CALLE DE TEODORO plaque and a black lamp)
- `public/photos-ref/IMG_2597.jpg`: Calle de Jorge sign post beside the lawn wall and tiled path, mountain beyond (ground — pin ±2.6 m; looks at Calle de Jorge sign post)

## Build

Review of the 9-10 November Calle Jorge work (jorge_lane.json). Remove the six benches repeated every 16 m and the grass, hedge wall and shrubs continued along 120 m without photos; dress only the photographed east stretch. Make the planter wall continuous with a leafy clipped hedge, the covers flush, the grass unstretched, the shrubs leafy, the yucca the resort's 3D model behind the wall, the cactus the candelabra of IMG_2233, the plinth facing the path; planting in Details behind the route guard.

## Do not

Do not repeat fittings beyond the photographs; do not move the mapped lane or registry houses.

## Done when

- [ ] Before/after renders through the photo cameras recorded in data/photo_checks.json
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `jorge-lane-review` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
