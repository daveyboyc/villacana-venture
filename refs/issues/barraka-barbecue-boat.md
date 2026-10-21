# Barraka sand-filled barbecue boat: establish placement and add shared geometry

Task `barraka-barbecue-boat` · area **Barraka and the beach** · priority P2 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/barraka-beach.md` and the contact sheet `villacana-reference/contact-sheets/barraka-beach.jpg`
- docs: `docs/SEAFRONT.md`, `docs/LEVELS.md`
- data: `data/levels_survey.json`
- src: `src/seafront.ts`, `src/seaside.ts`

## Photos to build from

- `public/photos-ref/IMG_2223.jpg`: Barraka Beach barbecue boat beside the timber boardwalk (ground — pin ±3.5 m; looks at Sand-filled barbecue boat beside the Barraka boardwalk)
- `public/photos-ref/IMG_2346.jpg`: BARRAKA BEACH sign, barbecue boat and boardwalk (ground — pin ±4.2 m; looks at Sand-filled barbecue boat beside the Barraka boardwalk)
- `public/photos-ref/IMG_2347.jpg`: Barraka barbecue boat, planted sign and boardwalk towards the sea (ground — pin ±4.2 m; looks at Sand-filled barbecue boat beside the Barraka boardwalk)

## Build

Model the confirmed sand-filled cooking boat visible on the left of the green aisle looking seaward, separate from the planted sign and thatched cooking shelter. First establish measured placement against the actual northeast Barraka flank and inspect docs/reviews/barraka-planter-placement; the earlier southwest aisle anchor was wrong, and the draft NE correction is not a precise survey. Then add shared map, 3D and collision geometry from the full originals.

## Do not

Do not place the boat at phone GPS, call it a planter, or use old look-at [37,126]. Current [38,106] is an illustrative subject landmark with approximately 4m uncertainty, not a surveyed footprint. Do not identify the ambiguous elongated aerial object as this boat without corroboration. Keep the aisle clear and cooking shelter distinct; no hidden footprint or seasonal smoke arrangement invented.

## Done when

- [ ] Audit before/after against full IMG_2223/2346/2347, with camera mismatch explicitly recorded
- [ ] One hull outline shared by map, 3D and collision; dimensions, uncertainty and evidence documented
- [ ] Relevant geometry, route, reference, build and browser checks pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `barraka-barbecue-boat` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `unified-reference-map`, `barraka-planter-placement`
