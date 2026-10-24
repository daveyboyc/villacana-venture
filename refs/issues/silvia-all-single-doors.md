# Make every tunnel entrance a single door with a round gold knob

Task `silvia-all-single-doors` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P1 · build

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

Apply the owner clarification to all four entrance bays, including the near doors. Use normal-width single wooden leaves with one round gold knob each, no double-door seams, panels or louvres. Infill the sides of wider existing bays with white wall.

## Do not

Do not limit the correction to inner recesses again. No changes to bay locations, recess depth or world-map placement. Preserve earlier photo readings as history and record the owner override.

## Done when

- [ ] Every entrance has exactly one normal-width wooden leaf and one spherical gold knob
- [ ] Entrance/interior view visibly shows single doors at the near bays
- [ ] Side doors remain closed/solid and both axial openings stay walkable
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `silvia-all-single-doors` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `entrance-photo-reference-pack`
