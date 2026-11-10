# Calle Jorge: a smooth, realistic candelabra tree

Task `jorge-cactus-smooth` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P3 · planting

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`, `data/silvia_ramp_passages.json`, `data/jorge_lane.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`, `src/silvia-ramp-passage.ts`, `src/silvia-ramp-study.ts`, `src/jorge-lane.ts`, `src/candelabra-cactus.ts`

## Photos to build from

- `public/photos-ref/IMG_2183.jpg`: Lawn with a tall candelabra cactus and clipped shrubs (ground — pin ±3.8 m; looks at the candelabra tree in the garden behind the Calle Jorge wall)
- `public/photos-ref/IMG_2233.jpg`: Lawn with candelabra cactus and shrubs (ground — pin ±2.7 m; looks at the candelabra tree in the garden behind the Calle Jorge wall)

## Build

Replace the stick-and-cylinder cactus with a candelabra tree (Euphorbia) as IMG_2183 and IMG_2233 show it: four pale trunks, arms that sweep out and curve up into a broad domed crown, each stem a smooth four-winged tube with scalloped edges, growth constrictions and a rounded tip (src/candelabra-cactus.ts). Stand it 5 m behind the lane in the open garden, over a lantana bed.

## Do not

Keep its whole crown clear of the route guard; do not move the lane or registry houses.

## Done when

- [ ] Before/after renders from both photos recorded in data/photo_checks.json
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `jorge-cactus-smooth` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `jorge-lane-review`
