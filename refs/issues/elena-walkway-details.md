# Elena covered walkway: portal steps and ramp, patterned floor, tile signs, doors

Task `elena-walkway-details` · area **Calle Elena** · priority P2 · build

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `villacana-reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/ELENA_EAST_PATIOS.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`, `docs/LEVELS.md`, `docs/reviews/path-network-inventory-elena/README.md`, `docs/reviews/elena-patio-wall-correction/README.md`, `docs/ELENA_WALKWAY.md`
- data: `data/elena_north.json`, `data/elena_east_patios.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`, `data/levels_survey.json`, `data/door_sills.json`, `data/elena_walkway.json`
- src: `src/elena-north.ts`, `src/elena-east-patios.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`, `src/door-sills.ts`, `src/elena-walkway.ts`

## Photos to build from

- `public/photos-ref/IMG_2459.jpg`: Elena covered walkway: three white steps beside a red studded ramp, azulejo floor, far arch (ground — pin ±6.2 m; looks at Steps and ramp at the east mouth of the covered Elena walkway)
- `public/photos-ref/IMG_2518.jpg`: Elena covered walkway east portal: CALLE ELENA 18 36 plaque, two steps and ramp (ground — pin ±2.5 m; looks at East portal steps and ramp of the Calle Elena covered walkway)
- `public/photos-ref/IMG_2519.jpg`: Elena covered walkway looking west to the arch and the 36/34 gates (ground — pin ±2.6 m; looks at Calle Elena covered walkway towards its west arch)
- `public/photos-ref/IMG_2520.jpg`: Elena covered walkway: patterned tile floor with pebble mosaic panel (ground — pin ±2.6 m; looks at Covered walkway towards its west arch)
- `public/photos-ref/IMG_2689.jpg`: Calle Elena covered passage: steps and studded ramp under the sign Calle Elena 18-36 (ground — pin ±2.4 m; looks at Three steps, red studded ramp and the CALLE ELENA 18 36 tile sign at the east mouth of the covered Elena walkway)
- `public/photos-ref/IMG_2690.jpg`: Elena covered walkway looking WSW to the paired iron gates (ground — pin ±2.4 m; looks at The covered Elena walkway looking west: floor pattern, pebble mat, doors, lantern and the west arch)
- `public/photos-ref/IMG_2456.jpg`: Calle Elena covered walkway: looking out through an arch to a courtyard with magnolia (ground — pin ±19.8 m; looks at The east arch of the covered Elena walkway looking out to the lane, the hedged bed and the magnolia)

## Levels from the photos

From `data/levels_survey.json` (check with `scripts/check_levels.py`).

- `elena-walkway-east-steps` (steps): 0.3-0.4 m above the Calle Elena lane outside the covered walkway's east portal, medium confidence at (-154.5, 38.5) ±2.5 m. Model: **built**, task `elena-walkway-details`. Three white-nosed risers (about 0.13 m each, treads about 0.5 m deep) up from the lane into the walkway (6265201UF1366N_part5), a red studded rubber ramp about 1.65 m long beside them on the north side; the floor then runs level to the west arch. Floor inside is terracotta with blue-and-white inset tiles. The first reading (two risers, 0.25-0.36 m) is replaced: IMG_2459, IMG_2518 and IMG_2689 show three risers. Built in data/elena_walkway.json at 0.40 m; under a roof, so the laser survey cannot check it. (IMG_2254.jpg, IMG_2459.jpg, IMG_2518.jpg, IMG_2519.jpg, IMG_2689.jpg)

## Build

Make the covered walkway under registry part 6265201UF1366N_part5 look like its photographs in Inspect: three white-nosed steps beside a red studded rubber ramp at the east portal (data/levels_survey.json item elena-walkway-east-steps), the offset terracotta floor with blue-and-white insert tiles and the pebble mat, the CALLE ELENA 18 36 and CASA WILKES tile signs, the AGUA POTABLE hatch, brown panelled double doors, round end arches and a lantern. See docs/ELENA_WALKWAY.md.

## Do not

No change to the registry footprint, side walls or roof. Do not place the arched single door of IMG_2692/IMG_2813, windows or door recesses without a photo that locates them. No other passage (Silvia, Patricia, Miguel/Cervantes inner walk-through).

## Done when

- [ ] before/after renders from the portal photo cameras, each recorded in data/photo_checks.json
- [ ] steps and ramp walkable; walkway still open end to end
- [ ] honest trust and confidence records; positions along the walls marked estimated
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `elena-walkway-details` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
