# Correct reported Barraka planter placement against registered source evidence

Task `barraka-planter-placement` · area **Barraka and the beach** · priority P1 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/barraka-beach.md` and the contact sheet `villacana-reference/contact-sheets/barraka-beach.jpg`
- docs: `docs/SEAFRONT.md`, `docs/LEVELS.md`
- data: `data/levels_survey.json`
- src: `src/seafront.ts`, `src/seaside.ts`

## Photos to build from

- `public/photos-ref/IMG_2346.jpg`: BARRAKA BEACH sign, barbecue boat and boardwalk (ground — pin ±4.2 m; looks at Sand-filled barbecue boat beside the Barraka boardwalk)
- `public/photos-ref/IMG_2347.jpg`: Barraka barbecue boat, planted sign and boardwalk towards the sea (ground — pin ±4.2 m; looks at Sand-filled barbecue boat beside the Barraka boardwalk)

## Build

Resolve discrepancy barraka-planter-position. Audit the sign, hut and boardwalk registration; measure and independently review a correction with current overlay/comparison artifacts before changing coordinates. Recheck any other boardwalk features affected by a correction.

## Do not

Do not substitute camera GPS or arbitrary offsets for measured subject position. Existing citation, software PASS or legacy task completion does not establish correct placement.

## Done when

- [ ] Resolve the graph discrepancy with a fresh approved same-feature placement packet
- [ ] Inspect full IMG_2346/2347 against the actual Details renderer and registered aerial
- [ ] Keep shared geometry and protected paths consistent; run source/build/browser checks
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `barraka-planter-placement` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `placement-verification-gate`
