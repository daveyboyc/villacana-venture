# South-block arcade to the south pool lawn (Calle de Jorge plaque) and the Eva-side covered passages: establish identity and position

Task `jorge-south-arcade-identity` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P3 · build

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`

## Photos to build from

- `public/photos-ref/IMG_2639.jpg`: Vaulted arcade with patterned tile floor, pebble mosaic and garden gate beyond (ground — pin ±17.8 m)
- `public/photos-ref/IMG_2640.jpg`: Bougainvillea over a white arch, second arch and gate beyond, pebble mosaic floor panel (ground — pin ±28.6 m)
- `public/photos-ref/IMG_2641.jpg`: Passage to the south pool lawn: arched iron gate and Calle de Jorge plaque (ground — pin ±15.9 m)
- `public/photos-ref/IMG_2548.jpg`: Covered tiled passage off Calle Eva with brown double door and potted trees (ground — pin ±4.5 m)
- `public/photos-ref/IMG_2557.jpg`: Arched covered passage with blue-and-white tiled floor and a 'CALLE MART...' sign (ground — pin ±2.5 m)

## Build

IMG_2639-2641 show a two-arch arcade with a pebble mat and an arched iron gate onto the south pool lawn, tied to Calle de Jorge only by the plaque in 2641, with GPS errors of 16-29 m. IMG_2548 (Eva) and IMG_2557 (sign cut at 'CALLE MART...') show passages of the same family whose street is unread. Solve a camera per passage and place it against the registry blocks before any build; the existing floor and pebble components in silvia-tunnel.ts apply.

## Do not

Do not use the Jorge radial fanlight gate or the 1-15 tunnel as a stand-in. Do not guess a position from the pin.

## Done when

- [ ] Each passage has a stated identity and position with uncertainty, or an open question
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `jorge-south-arcade-identity` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
