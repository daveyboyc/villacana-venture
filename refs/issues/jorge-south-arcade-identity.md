# Eva-side covered passages: establish identity and position

Task `jorge-south-arcade-identity` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P3 · build

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`, `data/silvia_ramp_passages.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`, `src/silvia-ramp-passage.ts`, `src/silvia-ramp-study.ts`

## Photos to build from

- `public/photos-ref/IMG_2548.jpg`: Covered tiled passage off Calle Eva with brown double door and potted trees (ground — pin ±4.5 m)
- `public/photos-ref/IMG_2557.jpg`: Arched covered passage with blue-and-white tiled floor and a 'CALLE MART...' sign (ground — pin ±2.5 m)

## Build

The south-pool arcade (IMG_2639-2641) is specified separately as the Calle de Jorge passage into Pintor Dalí (docs/reviews/south-pool-dali-passage/, task south-pool-dali-passage). IMG_2548 (Eva) and IMG_2557 (sign cut at 'CALLE MART...') are still unread passages of the same family. Solve a camera for each and place it against the registry blocks before any build.

## Do not

Do not use the Jorge radial fanlight gate, the 1-15 tunnel, or the south-pool Dalí passage as a stand-in. Do not guess a position from the pin.

## Done when

- [ ] Each passage has a stated identity and position with uncertainty, or an open question
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `jorge-south-arcade-identity` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
