# Calle Eva west: climbers on the house walls and the raised planter's plants

Task `eva-west-planting` · area **Calle Eva** · priority P3 · planting

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/eva.md` and the contact sheet `villacana-reference/contact-sheets/eva.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/MIDDLE_POOL.md`, `docs/EVA_WALLED_LAWN.md`, `docs/EVA_LANE.md`
- data: `data/street_layout.json`, `data/middle_pool.json`, `data/eva_walled_lawn.json`, `data/eva_lane.json`
- src: `src/middle-pool.ts`, `src/eva-walled-lawn.ts`, `src/eva-lane.ts`, `src/clipped-plants.ts`

## Photos to build from

- `public/photos-ref/IMG_2549.jpg`: Calle Eva: lane between a white wall and planted beds, towards the middle pool (ground — pin ±3.8 m; looks at Eva west stretch looking south-west between a white wall and a raised planted bed)
- `public/photos-ref/IMG_2553.jpg`: Calle Eva west footpath looking east between white houses and a planted bed (ground — pin ±2.6 m; looks at Eva west stretch looking north-east from the Dali end: kerbed lawn left, kerbed planted bed right)
- `public/photos-ref/IMG_2551.jpg`: Calle Eva west footpath at the Dali end, terracotta path beside a lawn island (ground — pin ±3.5 m; looks at Eva west stretch looking south-west to the Dali car park: kerbed bed left, kerbed lawn island and lantern right)

## Build

Grow the bougainvillea and jasmine up the house walls behind the west beds (IMG_2553, IMG_2551) and the shrubs, lilies and pink periwinkle in the raised planter (IMG_2549). The planter's plants sit inside the protected walking route because the mapped Eva line runs along the planter face; they need the route moved onto the photographed path (0.9 m south-east) first, which is walking work.

## Do not

Do not let plant footprints into a protected route; do not move the lane or planter.

## Done when

- [ ] IMG_2549 render shows the planter planted
- [ ] West wall climbers cite the photos that show them
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `eva-west-planting` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `eva-planting-shapes`
