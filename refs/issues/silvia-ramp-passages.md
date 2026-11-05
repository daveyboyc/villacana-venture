# Silvia 2-20 and 22-44 covered passages: ramp, three steps, double doors (photo-relative study)

Task `silvia-ramp-passages` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P2 · build

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`, `data/silvia_ramp_passages.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`, `src/silvia-ramp-passage.ts`, `src/silvia-ramp-study.ts`

## Photos to build from

- `public/photos-ref/IMG_2656.jpg`: Silvia 22-44 covered passage: red studded ramp and three tiled steps (ground — pin ±2.7 m; looks at Arch and garden at the far end of the Silvia 22-44 passage, past the ramp and three steps)
- `public/photos-ref/IMG_2657.jpg`: Silvia 22-44 passage: steps with dark edge bands beside studded ramp (ground — pin ±2.9 m; looks at Arch and garden at the far end of the Silvia 22-44 passage, past the ramp and three steps)
- `public/photos-ref/IMG_2669.jpg`: Silvia 2-20 passage: red studded ramp, three steps and garden gate arch (ground — pin ±2.7 m; looks at Garden-gate arch at the far end of the Silvia 2-20 passage, past the ramp and three steps)
- `public/photos-ref/IMG_2670.jpg`: Silvia 2-20 passage: plaque, ramp, steps and arched gate (ground — pin ±2.7 m; looks at Garden-gate arch at the far end of the Silvia 2-20 passage, past the ramp and three steps)
- `public/photos-ref/IMG_2574.jpg`: Tiled steps and red studded ramp at the passage exit, planter wall to the right (ground — pin ±3.2 m; looks at Three-step tiled flight with red ramp)

## Build

A reusable photo-relative component (data/silvia_ramp_passages.json, src/silvia-ramp-passage.ts, standalone study page silvia-ramp.html) for the Calle de Silvia passages whose plaques read 2-20 and 22-44: studded red rubber ramp beside two plain terracotta treads and a third riser carrying the landing, white-nosed with dark edge bands, brown panelled double doors with barred windows on both walls, pebble-mosaic mat, lanterns, plaques, arch and (2-20) garden gate, with Details-only planting.

## Do not

Do not place it in the main map, do not replace the west-side 1-15 tunnel and do not move any registry footprint until the identity question (silvia-west-passage-swap) is decided and measured. No invented walls or gates beyond the arch.

## Done when

- [ ] Study renders from cameras near IMG_2669/2670/2656/2657/2574 show ramp, steps, doors, mat, arch and gate in the photographed order and sides
- [ ] Every dimension is flagged as an estimate in the data file
- [ ] Identity and unplaced status are recorded in data/areas.json
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `silvia-ramp-passages` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
