# Elena: resolve path/threshold levels and usable clearance uncertainty

Task `elena-level-clearance-survey` · area **Calle Elena** · priority P1 · audit

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `villacana-reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/ELENA_EAST_PATIOS.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`, `docs/LEVELS.md`, `docs/reviews/path-network-inventory-elena/README.md`, `docs/reviews/elena-patio-wall-correction/README.md`
- data: `data/elena_north.json`, `data/elena_east_patios.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`, `data/levels_survey.json`, `data/door_sills.json`
- src: `src/elena-north.ts`, `src/elena-east-patios.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`, `src/door-sills.ts`

## Photos to build from

- `public/photos-ref/IMG_2518.jpg`: Elena covered walkway east portal: CALLE ELENA 18 36 plaque, two steps and ramp (ground — pin ±2.5 m; looks at East portal steps and ramp of the Calle Elena covered walkway)
- `public/photos-ref/IMG_2519.jpg`: Elena covered walkway looking west to the arch and the 36/34 gates (ground — pin ±2.6 m; looks at Calle Elena covered walkway towards its west arch)

## Levels from the photos

From `data/levels_survey.json` (check with `scripts/check_levels.py`).

- `elena-walkway-east-steps` (steps): 0.25-0.36 m above the Calle Elena lane outside the covered walkway's east portal, medium confidence at (-154.5, 38.5) ±2.5 m. Model: **missing**, task `elena-level-clearance-survey`. Two risers with white nosings up from the lane into the walkway (6265201UF1366N_part5), a red ribbed rubber ramp beside them on the north side. Floor inside is terracotta with blue-and-white inset tiles. Rise judged from two 0.15-0.18 m risers; under a roof, so the laser survey cannot check it. (IMG_2518.jpg, IMG_2519.jpg, IMG_2254.jpg)

## Build

Measure kerb, doorway thresholds, ramp and three steps against current level/survey framework and calibrated views. Keep existing estimated dimensions separate from new measurements. Record unknown clearance where uncertainty consumes usable width. Includes the two steps and ramp at the covered walkway's east portal (data/levels_survey.json elena-walkway-east-steps, IMG_2518/2519).

## Do not

Do not raise floors/doors to hide incompatible terrain, infer metres from tile counts, or count successful movement as real-world clearance.

## Done when

- [ ] Declared source/model scope and limitations retained
- [ ] Bounded comparison artifact and follow-up for every unresolved item
- [ ] Applicable audit software checks completed; geometry releases remain behind the browser regression prerequisite.
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `elena-level-clearance-survey` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `path-network-inventory-elena`
