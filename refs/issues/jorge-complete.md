# Calle Jorge end to end: the gateway, the middle of the lane from the aerial, and the list of photos still needed

Task `jorge-complete` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P1 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`, `data/silvia_ramp_passages.json`, `data/jorge_lane.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`, `src/silvia-ramp-passage.ts`, `src/silvia-ramp-study.ts`, `src/jorge-lane.ts`, `src/candelabra-cactus.ts`

## Photos to build from

- `public/photos-ref/IMG_2697.jpg`: Crazy-paving path from the Dali parking, wider view (ground — pin ±5.3 m; looks at the flagged west entrance of Calle Jorge from the Dalí car park: white kerbs, lamp post, lawns, round trees and the house with the bougainvillea)

## Build

Dave, 2026-11-14: complete Jorge all the way to the car park and note which photos are missing. Build the white gateway at the end of the flagged path (IMG_2280, IMG_2697 enlarged) with its walls, open iron leaves, bougainvillea and the flagged cross-path in front. Between the gateway and the photographed east stretch (28 to 86 m), where no photo exists, carry the square-tile path through, lay the lawns and the small tree the aerial shows, and stand the second portal seen through the gateway where the house rows begin; grade all of that inferred. List every photo the lane still needs in data/photo_requests.json and docs/JORGE_LANE.md.

## Do not

Do not invent walls, planters, lamps, doors or house numbers along 56 to 86 m, or place the CALLE JORGE 27 35 passage. Leave Walk alone.

## Done when

- [ ] The lane has a built path from the car park to Calle Guillermo, visible in Inspect in Layout and with Show details
- [ ] Inferred parts are graded inferred and listed
- [ ] Photo requests recorded
- [ ] scripts/check_jorge_lane.py passes
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `jorge-complete` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `jorge-planting`
