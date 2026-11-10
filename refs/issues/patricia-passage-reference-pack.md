# Patricia covered passage: trace the arch chain from the CALLE DE PATRICIA arch to the Silvia 22-44 mouth

Task `patricia-passage-reference-pack` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P2 · build

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`, `data/silvia_ramp_passages.json`, `data/jorge_lane.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`, `src/silvia-ramp-passage.ts`, `src/silvia-ramp-study.ts`, `src/jorge-lane.ts`, `src/candelabra-cactus.ts`

## Photos to build from

- `public/photos-ref/IMG_2561.jpg`: Arched entrance of the Patricia covered passage with lanterns (ground — pin ±2.5 m)
- `public/photos-ref/IMG_2562.jpg`: Arch marked 'CALLE DE PATRICIA' at the start of the covered passage (ground — pin ±2.4 m)
- `public/photos-ref/IMG_2563.jpg`: Patricia covered passage with brown doors and a pebble mosaic mat (ground — pin ±2.4 m)
- `public/photos-ref/IMG_2564.jpg`: Pebble mosaic with floral motif in the Patricia passage floor (ground — pin ±4.0 m)
- `public/photos-ref/IMG_2565.jpg`: Patricia lane with planted beds, arched doors and a tiled-roof arch ahead (ground — pin ±5.1 m)
- `public/photos-ref/IMG_2566.jpg`: Patricia lane columns, arch and bougainvillea (ground — pin ±3.6 m)
- `public/photos-ref/IMG_2567.jpg`: Patricia lane arch with tiled eave, shutters and bougainvillea (looking up) (ground — pin ±3.7 m)
- `public/photos-ref/IMG_2568.jpg`: Patricia passage: arch, doors, grilles and a green-netted garden beyond (ground — pin ±3.7 m)
- `public/photos-ref/IMG_2569.jpg`: Last arch of the Patricia passage with pebble mat and ramp to a lawn (ground — pin ±3.5 m)
- `public/photos-ref/IMG_2570.jpg`: Passage exit with tiled steps, red ramp mat and white planter walls (ground — pin ±3.5 m; looks at Tiled steps and red ramp mat at passage exit)
- `public/photos-ref/IMG_2574.jpg`: Tiled steps and red studded ramp at the passage exit, planter wall to the right (ground — pin ±3.2 m; looks at Three-step tiled flight with red ramp)
- `public/photos-ref/IMG_2656.jpg`: Silvia 22-44 covered passage: red studded ramp and three tiled steps (ground — pin ±2.7 m; looks at Arch and garden at the far end of the Silvia 22-44 passage, past the ramp and three steps)

## Build

Make a numbered reference pack (docs/REFERENCE_PACK_WORKFLOW.md) for the passage: the arch marked CALLE DE PATRICIA (IMG_2562), paired brown doors and pebble-mosaic mats (2563/2564), planter-lined arches and tiled-eave loggia (2565-2567), the last arch with ramp to a lawn (2569) and the Silvia 22-44 porch (2570/2574/2656). Decide whether it is one passage or several, how it bends (cameras head SE at the west arch, then ENE), and where it lies against the registry blocks. Pins are 2.4-5 m and mostly indoors.

## Do not

Do not assume it follows the mapped Calle Patricia line, which runs about 20 m to the north-west. Do not repeat arches to fill the length.

## Done when

- [ ] Each arch and door set numbered with its source photo
- [ ] Order, bends and levels recorded, or marked unresolved
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `patricia-passage-reference-pack` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
