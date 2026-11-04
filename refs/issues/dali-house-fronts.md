# Pintor Dalí: trace the house arches, palms and the seaward lamp

Task `dali-house-fronts` · area **Calle Pintor Dalí** · priority P2 · facades

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/dali.md` and the contact sheet `villacana-reference/contact-sheets/dali.jpg`
- docs: `docs/DALI_CERVANTES.md`, `docs/LAYOUT_ACCURACY.md`, `docs/LEVELS.md`
- data: `data/dali_cervantes.json`, `data/dali_photo_reference.json`, `data/coastal_gate.json`, `data/levels_survey.json`, `data/door_sills.json`, `data/dali_street.json`
- src: `src/coastal-gate.ts`, `src/dali-threshold.ts`, `src/door-sills.ts`, `src/dali-street.ts`

## Photos to build from

- `public/photos-ref/IMG_2279.jpg`: Pintor Dalí: houses, lamps and parking bays (ground — pin ±3.4 m; looks at A black lantern and the white house frontage beside the parking bays)
- `public/photos-ref/IMG_2280.jpg`: Pintor Dalí: flagstone pedestrian entrance (ground — pin ±2.0 m; looks at The flagstone pedestrian entrance, with a black lantern and white curbs)
- `public/photos-ref/IMG_2281.jpg`: Pintor Dalí seaward end: turning area and fence (ground — pin ±2.0 m)
- `public/photos-ref/IMG_2291.jpg`: Pintor Dalí: arched entrance and white facade (ground — pin ±5.6 m)

## Build

The aisle curb, plinth, hedge and black lanterns are in. Trace the arches, shuttered windows, balcony grilles, palms and bougainvillea that the house-side photos actually show, and the modern flat lamp at the turning area. Leave a house plain where no photo shows its front.

## Do not

Do not repeat one porch along every house. Do not move registry footprints. Do not close the coastal pedestrian gate.

## Done when

- [ ] Each new front cites the photo that shows it
- [ ] Untraced fronts stay listed under confidence gaps
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `dali-house-fronts` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `dali-street-scene`
