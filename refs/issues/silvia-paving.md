# Correct Silvia diagonal terracotta paving and continuous ground appearance

Task `silvia-paving` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P1 · build

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

Reinspect full source floors and actual main scene, correct diagonal tile orientation, weathered terracotta/grout/inserts and visible continuous paving using one metric UV frame. Inspect wall-side pebble bands and preserve the central pebble rectangle.

## Do not

No footprint, tunnel/gate/bed transform, street layout, collision, level, door or mobile-input changes. Do not transfer four-column exterior lane grid or diagonalize unrelated streets.

## Done when

- [ ] Full-source independent review of tile angle/material and corrected actual-app views
- [ ] Coherent surface scale/orientation/phase across tunnel and its bounded extensions
- [ ] Source/build/browser checks; hidden extents and placement still provisional
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `silvia-paving` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
