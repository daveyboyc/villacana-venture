# Connect the Silvia tunnel study to the main map and Walk scene

Task `silvia-main-map` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P3 · build

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

Reuse the corrected tunnel model in the main map, normal Walk and collision. Use the bounded west registry-topology candidate with a shallow entrance canopy and courtyard connection; retain upper storey and original registry outlines.

## Do not

Do not represent the candidate as surveyed or photo-registered. Keep the EXIF direction conflict and alternative host open. Preserve all four single wooden doors and round gold knobs.

## Done when

- [ ] Main map and normal Walk share the same transform and host opening
- [ ] Walk from street through passage to courtyard both ways, with solid side doors
- [ ] Production build and layout regressions pass; placement limitations remain explicit
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `silvia-main-map` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `silvia-all-single-doors`
