# Calle Jorge: bougainvillea in bract, small trees, shrub border and lawn colour

Task `jorge-planting` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P2 · planting

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`, `data/silvia_ramp_passages.json`, `data/jorge_lane.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`, `src/silvia-ramp-passage.ts`, `src/silvia-ramp-study.ts`, `src/jorge-lane.ts`, `src/candelabra-cactus.ts`

## Photos to build from

- `public/photos-ref/IMG_2697.jpg`: Crazy-paving path from the Dali parking, wider view (ground — pin ±5.3 m; looks at the flagged west entrance of Calle Jorge from the Dalí car park: white kerbs, lamp post, lawns, round trees and the house with the bougainvillea)
- `public/photos-ref/IMG_2773.jpg`: Lane beside the main pool with a lantana planter wall (ground — pin ±2.5 m; looks at Calle Guillermo north of the Jorge junction: octagon and square tiles, the lantana planter wall on the east side)

## Build

Dave, 2026-11-13: keep adding details, grass and plants. From IMG_2229, IMG_2230, IMG_2697 and IMG_2773: make the bougainvilleas masses of purple bract instead of green climbers (clusters of bracts in src/clipped-plants.ts); add the tall bougainvillea at the house-23 corner and the small grey-green tree beside the bed; cover the south house at the west entrance in bougainvillea to first-floor height and add the row of low clipped shrubs along the flagged path; replace the dark generic tree on the plinth lawn with a light-green broad-leaved one; spill bougainvillea over the lawn wall; tone the Calle Jorge lawns to the darker green of the photos.

## Do not

Planting stays in Details behind the route guard. Do not move walls, paths or houses. Leave Walk alone.

## Done when

- [ ] Visible in Inspect with Show details
- [ ] Renders through the photo cameras recorded in data/photo_checks.json
- [ ] scripts/check_jorge_lane.py passes
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `jorge-planting` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `guillermo-west-walls`
