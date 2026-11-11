# Calle Jorge: the flagged west entrance from the Dalí car park, and the lantana planter at the east end

Task `jorge-west-entrance` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P2 · materials

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

IMG_2280 and IMG_2696-2698 look along the mapped Calle Jorge line from the Pintor Dalí car park, so the lane's west end is photographed after all. Build it (data/jorge_lane.json, west): sandstone flags about 2 m wide between two white-painted kerbs the length of the parking bays, a lamp post at the end of the north kerb, lawn both sides to about 31 m, two round clipped trees on the north lawn, a shrub border and a bougainvillea along the house on the south side. At the east end add the waist-high lantana planter wall along Calle Guillermo behind the plinth lawn (IMG_2597, IMG_2773). Move the dragon tree next to the lamp post on the kerb corner (IMG_2594).

## Do not

Do not build the white gateway at about 28 m (too small in the photos), continue flags or lawn east of it, or change the Dalí parking bays. Leave Walk alone.

## Done when

- [ ] Visible in Inspect, in Layout and with Show details (jump target Calle Jorge · west entrance)
- [ ] Before/after renders through the photo cameras recorded in data/photo_checks.json
- [ ] scripts/check_jorge_lane.py passes
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `jorge-west-entrance` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `jorge-lane-surroundings`
