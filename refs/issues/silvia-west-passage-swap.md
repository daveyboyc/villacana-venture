# Decide the west Silvia passage: 2-20 ramp type here, 1-15 type on the east block

Task `silvia-west-passage-swap` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P2 · build

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`, `data/silvia_ramp_passages.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`, `src/silvia-ramp-passage.ts`, `src/silvia-ramp-study.ts`

## Photos to build from

- `public/photos-ref/IMG_2669.jpg`: Silvia 2-20 passage: red studded ramp, three steps and garden gate arch (ground — pin ±2.7 m; looks at Garden-gate arch at the far end of the Silvia 2-20 passage, past the ramp and three steps)
- `public/photos-ref/IMG_2670.jpg`: Silvia 2-20 passage: plaque, ramp, steps and arched gate (ground — pin ±2.7 m; looks at Garden-gate arch at the far end of the Silvia 2-20 passage, past the ramp and three steps)
- `public/photos-ref/IMG_2668.jpg`: Silvia passage interior looking ENE to the arch (ground — pin ±2.8 m)
- `public/photos-ref/IMG_2190.jpg`: Covered arched passage with potted plants, patterned tiles (ground — pin ±3.5 m)
- `public/photos-ref/IMG_2672.jpg`: Covered arched passage under the east block, looking east into a garden (ground — pin ±3.0 m)
- `public/photos-ref/IMG_2673.jpg`: Courtyard path inside the east block with raised planters and a manhole (ground — pin ±3.9 m)

## Build

The camera pin of IMG_2669/2670 (2-20, heading 242) coincides with the main map's west Silvia tunnel entry (data/silvia_map.json) while IMG_2190/2191/2668 (1-15, heading 55-56) look from that pin into the opposite, east block, where IMG_2672-2674 show a similar louvre-door passage. Solve the cameras (docs/PHOTO_ALIGNMENT.md), measure both mouths against the aerial, then either switch the west tunnel to the silvia-ramp-passage component and place 1-15 on the east block, or record why not. Needs a second agent's review as geometry.

## Do not

Do not decide from GPS alone, move registry footprints without the measured-approval packet, or discard the owner-approved 1-15 door and paving details.

## Done when

- [ ] Two solved cameras per passage with metre residuals
- [ ] Placement packet independently reviewed, or the discrepancy stays open
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `silvia-west-passage-swap` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `silvia-ramp-passages`
