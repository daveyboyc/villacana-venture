# Calle Jorge: cross-paths, lawns to the house fronts, the open kerbed garden, planters with thresholds, beds and wall planting

Task `jorge-lane-surroundings` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P2 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`, `data/silvia_ramp_passages.json`, `data/jorge_lane.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`, `src/silvia-ramp-passage.ts`, `src/silvia-ramp-study.ts`, `src/jorge-lane.ts`, `src/candelabra-cactus.ts`

## Photos to build from

- `public/photos-ref/IMG_2182.jpg`: Tiled lane between lawns, white tiled bench (ground — pin ±5.2 m; looks at Calle Jorge looking west: the cross-path beside the bench, planters with brick thresholds and number niches, the kerbed garden lawn beyond)
- `public/photos-ref/IMG_2229.jpg`: Tiled lane between lawns with a white tiled bench (ground — pin ±3.8 m; looks at Calle Jorge looking west: tiled path, the white azulejo bench on the lawn side, planter wall and hedge on the other)
- `public/photos-ref/IMG_2230.jpg`: Tiled lane beside hedges and a patio wall (ground — pin ±2.0 m; looks at Jorge path, hedge-side yucca and the cactus crown)
- `public/photos-ref/IMG_2233.jpg`: Lawn with candelabra cactus and shrubs (ground — pin ±2.7 m; looks at the candelabra tree on the open garden lawn north of Calle Jorge)
- `public/photos-ref/IMG_2234.jpg`: Tiled lane with a wall plaque, lamp post and lawn (ground — pin ±3.1 m; looks at square tile path, CALLE DE TEODORO plaque and a black lamp)
- `public/photos-ref/IMG_2597.jpg`: Calle de Jorge sign post beside the lawn wall and tiled path, mountain beyond (ground — pin ±2.6 m; looks at Calle de Jorge sign post)

## Build

Add what the Calle Jorge photos show beside the path (data/jorge_lane.json). South side: lawn to the house fronts, the two-tile cross-path beside the bench and the path behind it along the house front, a kerbed bed with round shrubs and a strelitzia, a climber on the wall, the tall hedge, lantana and bougainvillea at the CALLE DE TEODORO wall, a green cover in the grass. North side: open the garden with the candelabra tree to the lane (it was walled off by a hedge the photos do not show) as a lawn with a white-painted kerb, the dragon tree, one lamp post on the kerb corner and a bougainvillea on the back wall; planters 0.7 m high at the path edge with two brick thresholds, number niches and hedges; slot drains at the Teodoro junction; lawn and the old olive by the CALLE DE JORGE plinth. Remove the three lamp posts no photo shows.

## Do not

Do not move the mapped lane or registry houses, repeat fittings beyond the photographed stretch, or model the unreadable niche numbers. Leave Walk alone.

## Done when

- [ ] Visible in Inspect, in Layout and with Show details
- [ ] Before/after renders through the photo cameras recorded in data/photo_checks.json
- [ ] scripts/check_jorge_lane.py passes
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `jorge-lane-surroundings` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `jorge-lane-review`
