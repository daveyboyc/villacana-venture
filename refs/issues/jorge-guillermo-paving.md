# Calle Guillermo at the Jorge junction: wall-to-wall octagonal paving and covers

Task `jorge-guillermo-paving` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P2 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`, `data/silvia_ramp_passages.json`, `data/jorge_lane.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`, `src/silvia-ramp-passage.ts`, `src/silvia-ramp-study.ts`, `src/jorge-lane.ts`, `src/candelabra-cactus.ts`

## Photos to build from

- `public/photos-ref/IMG_2773.jpg`: Lane beside the main pool with a lantana planter wall (ground — pin ±2.5 m; looks at Calle Guillermo north of the Jorge junction: octagon and square tiles, the lantana planter wall on the east side)

## Build

IMG_2773 and IMG_2774 show Calle Guillermo paved wall to wall beside the lantana planter: large terracotta squares at the Jorge junction, then octagons with small square insets, a round cover and two grates. Lay that paving 2.3 m wide against the planter's lane face (the model had a grass strip and a narrow generic ribbon that broke into tilted pieces over the bank), level across at the lane's surveyed height, and keep the planter's top one metre above it.

## Do not

Do not change the mapped Guillermo line, the terrain or the pool. Leave Walk alone.

## Done when

- [ ] Visible in Inspect, in Layout and with Show details
- [ ] Render through the IMG_2773 camera recorded in data/photo_checks.json
- [ ] scripts/check_jorge_lane.py passes
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `jorge-guillermo-paving` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `jorge-planter-palms`
