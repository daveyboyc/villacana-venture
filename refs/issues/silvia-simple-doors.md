# Simplify the recessed entrance doors and add round gold knobs

Task `silvia-simple-doors` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P1 · build

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`

## Photos to build from

- `public/photos-ref/IMG_2190.jpg`: Covered arched passage with potted plants, patterned tiles (ground — pin ±3.5 m)
- `public/photos-ref/IMG_2191.jpg`: Passage plaque reading CALLE SILVIA 1-15 (ground — pin ±3.5 m)

## Build

Apply the owner correction to the two inner recessed entrances: plain single brown wooden leaves with round gold knobs. Preserve the photographed near paired doors and existing recess footprints.

## Do not

No change to map placement or estimated recess dimensions. Do not describe owner-confirmed concealed door styling as directly measured from the photo.

## Done when

- [ ] Both inner doors have simple single leaves and round gold knobs
- [ ] Existing paired door sets and passage collision remain intact
- [ ] Actual render and production build checked
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `silvia-simple-doors` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `entrance-photo-reference-pack`
