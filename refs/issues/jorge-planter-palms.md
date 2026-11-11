# Calle Jorge east end: a neat one-metre planter wall, and palms and spiky trees that match the photos

Task `jorge-planter-palms` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P2 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`, `data/silvia_ramp_passages.json`, `data/jorge_lane.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`, `src/silvia-ramp-passage.ts`, `src/silvia-ramp-study.ts`, `src/jorge-lane.ts`, `src/candelabra-cactus.ts`

## Photos to build from

- `public/photos-ref/IMG_2773.jpg`: Lane beside the main pool with a lantana planter wall (ground — pin ±2.5 m; looks at Calle Guillermo north of the Jorge junction: octagon and square tiles, the lantana planter wall on the east side)
- `public/photos-ref/IMG_2230.jpg`: Tiled lane beside hedges and a patio wall (ground — pin ±2.0 m; looks at Jorge path, hedge-side yucca and the cactus crown)
- `public/photos-ref/IMG_2764.jpg`: Main pool lawn and the wave-roofed building (ground — pin ±3.8 m; looks at tall slender palm on the main-pool lawn, the pool and the wave-roofed building beyond)

## Build

Dave, 2026-11-12: the Guillermo planter is too high and should be neater, about one metre; the palm is inaccurate, check the photos. Rebuild the planter as one straight wall whose top is a metre above the lane (IMG_2773, IMG_2774), 0.45 m thick, with a low dense lantana carpet and the yucca clump behind it. Remove the short thick generic palm that stood against it (the photos show none) and the one in front of the IMG_2764 camera; build one tall slender palm on the main-pool lawn where IMG_2764/2765 show it. Replace the yucca stand-in on the Jorge kerb corner with a dragon tree as in IMG_2230 and IMG_2594 (src/spiky-trees.ts).

## Do not

Do not change the lane line, ground levels or the pool. Leave Walk alone.

## Done when

- [ ] Visible in Inspect with Show details; the wall also in Layout
- [ ] Renders through the photo cameras recorded in data/photo_checks.json
- [ ] scripts/check_jorge_lane.py passes
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `jorge-planter-palms` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `jorge-west-entrance`
