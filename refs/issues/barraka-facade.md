# Barraka building: two-level height, north-east window rows with timber band, glazed north-west and south-west frontage, thatched edge

Task `barraka-facade` · area **Barraka and the beach** · priority P2 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/barraka-beach.md` and the contact sheet `villacana-reference/contact-sheets/barraka-beach.jpg`
- docs: `docs/SEAFRONT.md`, `docs/LEVELS.md`
- data: `data/levels_survey.json`, `data/barraka_frontage.json`
- src: `src/seafront.ts`, `src/seaside.ts`, `src/barraka-frontage.ts`

## Photos to build from

- `public/photos-ref/IMG_2615.jpg`: Barraka north-east elevation with brown-framed windows, timber band and black door (ground — pin ±4.7 m; looks at Barraka north-east wall)
- `public/photos-ref/IMG_2618.jpg`: Barraka's north-east facade seen from the beach side of the paseo (ground — pin ±2.4 m; looks at Barraka restaurant, north-east and north-west faces)
- `public/photos-ref/IMG_2619.jpg`: Barraka thatched cooking shelter, net-covered mound and kayaks on the sand (ground — pin ±2.3 m; looks at Thatched cooking shelter and net-covered mound)
- `public/photos-ref/IMG_2630.jpg`: Barraka's glazed north-west frontage with sandbags along the slot drain (ground — pin ±6.8 m; looks at Barraka north-west glazed frontage)
- `public/photos-ref/IMG_2604.jpg`: Paseo past the Barraka restaurant with lamp post and lounge seating (ground — pin ±2.1 m; looks at Barraka beach restaurant)
- `public/photos-ref/IMG_2611.jpg`: Paseo lane beside Barraka's north-west wall looking north-east (ground — pin ±3.2 m)

## Build

The photos show Barraka as a white two-level building: on the north-east wall a black door, two small vents and a brown timber band under three groups of brown-framed windows (3+3+3 in IMG_2618), a rooftop water tank and a thatched roof edge; on the south-west and north-west faces glazing under red awnings with frosted BARRAKA BEACH lettering above timber cladding. The registry gives one floor (3 m) and the 2014-15 laser survey a roof of about 2.9-3.7 m, while the wall in IMG_2618/2619 reads about 4.5-5 m (door about 2.1 m). Settle the height against the photos and the survey first, then add the openings and awnings with their positions on the registry ring edges.

## Do not

Do not paint windows above the current 3 m wall. Do not move the registry ring. Keep the generic facade-kit openings off Barraka's walls only where the photos show something different, and say what is estimated.

## Done when

- [ ] Wall height reconciled with IMG_2604/2615/2618/2619 and the survey, recorded in data/levels_survey.json or the area notes
- [ ] Openings placed on the registry edges by measured position from solved cameras; independent review of overlays
- [ ] Standard handover checks pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `barraka-facade` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
