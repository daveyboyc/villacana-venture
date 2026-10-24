# Build the Silvia tunnel with recessed brown entrance doors and photo details

Task `silvia-tunnel-details` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P1 · build

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`

## Photos to build from

- `public/photos-ref/IMG_2190.jpg`: Covered arched passage with potted plants, patterned tiles (ground — pin ±3.5 m)
- `public/photos-ref/IMG_2191.jpg`: Passage plaque reading CALLE SILVIA 1-15 (ground — pin ±3.5 m)

## Build

Build a reusable photo-relative tunnel component and an explicit study view in the canonical app. Include owner-confirmed recessed side entrances with estimated depth and generic brown wooden doors; flat ceiling, two arch openings, mouldings, patterned floor/pebble inset, lantern, pots, sign and services. Keep global map connection unresolved.

## Do not

No invented global registration, no Jorge fanlight gate, no barrel vault, no four-column street-floor transfer. Study dimensions and hidden doors are estimates authorized by the owner.

## Done when

- [ ] Recesses have real wall returns, floor/soffit and brown doors at the back
- [ ] Study has a clear walk-through and solid side walls/doors
- [ ] All visible source components have a build or explicit limitation
- [ ] Actual 3D renders compared to sources; world placement unapproved
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `silvia-tunnel-details` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `entrance-photo-reference-pack`
