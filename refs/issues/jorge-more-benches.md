# Calle Jorge: the other benches, placed from the aerial

Task `jorge-more-benches` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P2 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`, `data/silvia_ramp_passages.json`, `data/jorge_lane.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`, `src/silvia-ramp-passage.ts`, `src/silvia-ramp-study.ts`, `src/jorge-lane.ts`, `src/candelabra-cactus.ts`

## Photos to build from


## Build

Dave, 2026-11-11: there is more than one bench on Calle Jorge; reuse the asset. No photo shows the others, so place the photographed bench (src/jorge-lane.ts) at the bench-sized white marks the aerial shows on the grass beside the path, at about 64.3 and 79.2 m (north side) and 122.3 m (south side), each facing the path, graded inferred. Move the small kerbed shrub bed to the 106.5 m mark, which IMG_2229 and IMG_2230 show is a bed and not a bench.

## Do not

Do not repeat benches at a regular spacing or anywhere the aerial shows no mark. Do not move the photographed bench without a solved camera.

## Done when

- [ ] Benches visible in Inspect, in Layout and with Show details
- [ ] scripts/check_jorge_lane.py passes
- [ ] Marked aerial crops saved in docs/reviews/jorge-benches-aerial/
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `jorge-more-benches` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `jorge-lane-surroundings`
