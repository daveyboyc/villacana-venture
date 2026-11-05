# Pintor Dalí: curb, fence plinth, outer hedge and house-side lanterns

Task `dali-street-scene` · area **Calle Pintor Dalí** · priority P1 · details

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/dali.md` and the contact sheet `villacana-reference/contact-sheets/dali.jpg`
- docs: `docs/DALI_CERVANTES.md`, `docs/LAYOUT_ACCURACY.md`, `docs/LEVELS.md`
- data: `data/dali_cervantes.json`, `data/dali_photo_reference.json`, `data/coastal_gate.json`, `data/levels_survey.json`, `data/door_sills.json`, `data/dali_street.json`
- src: `src/coastal-gate.ts`, `src/dali-threshold.ts`, `src/door-sills.ts`, `src/dali-street.ts`

## Photos to build from

- `public/photos-ref/IMG_2269.jpg`: Pintor Dalí: parking and chain-link fence looking south (ground — pin ±4.7 m; looks at The white curb, rusty chain-link and house-side black lanterns, looking south along Pintor Dalí)
- `public/photos-ref/IMG_2270.jpg`: Pintor Dalí: parking and fence looking north (ground — pin ±4.7 m; looks at The same curb, hedge and a house-side lantern, looking north along Pintor Dalí)
- `public/photos-ref/IMG_2276.jpg`: Pintor Dalí: parking junction toward the sea (ground — pin ±3.1 m; looks at Parking bays, black lanterns and the outer fence toward the sea)
- `public/photos-ref/IMG_2277.jpg`: Pintor Dalí: aisle, outer fence and white curb (ground — pin ±2.0 m; looks at The aisle, white curb and chain-link fence toward the sea)
- `public/photos-ref/IMG_2278.jpg`: Pintor Dalí: seaward parking row and chain-link fence (ground — pin ±5.2 m; looks at Brown chain-link on a concrete plinth, the white curb, and the hedge behind)
- `public/photos-ref/IMG_2279.jpg`: Pintor Dalí: houses, lamps and parking bays (ground — pin ±3.4 m; looks at A black lantern and the white house frontage beside the parking bays)
- `public/photos-ref/IMG_2280.jpg`: Pintor Dalí: flagstone pedestrian entrance (ground — pin ±2.0 m; looks at The flagstone pedestrian entrance, with a black lantern and white curbs)

## Build

Dress the mapped outer fence with the photographed white curb, concrete plinth and rusty chain-link, a Details hedge outside it, and black house-side lanterns along the aisle. Stop the new plinth before the coastal gate.

## Do not

Do not move the fence line, close the coastal gate, or invent arches, palms and bougainvillea at guessed house fronts. Lanterns and the hedge stay off protected routes.

## Done when

- [ ] scripts/check_dali_street.py passes
- [ ] Before/after renders from IMG_2269 and IMG_2278
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `dali-street-scene` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
