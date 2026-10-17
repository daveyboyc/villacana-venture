# Cervantes east of Elena: walled patios on the south side, with the cane-roofed pergola

Task `cervantes-east-south-patios` · area **Calle Miguel de Cervantes** · priority P3 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/cervantes.md` and the contact sheet `villacana-reference/contact-sheets/cervantes.jpg`
- docs: `docs/DALI_CERVANTES.md`, `docs/STREET_LAYOUT.md`, `docs/FRONTAGE_DIVISIONS.md`, `docs/ELENA_NORTH.md`, `docs/CERVANTES_NORTH_PATIOS.md`, `docs/LEVELS.md`, `docs/CERVANTES_DOOR_STEPS_REVIEW.md`
- data: `data/dali_cervantes.json`, `data/dali_cervantes_threshold.json`, `data/cervantes_patio_walls.json`, `data/passages.json`, `data/frontage_divisions.json`, `data/cervantes_elena_steps.json`, `data/levels_survey.json`, `data/cervantes_garden_door.json`, `data/cervantes_north_patios.json`, `data/junction_lawns.json`
- src: `src/cervantes-walls.ts`, `src/dali-threshold.ts`, `src/frontages.ts`, `src/ramp-steps.ts`, `src/cervantes-garden-door.ts`, `src/cervantes-north-patios.ts`, `src/junction-lawns.ts`

## Photos to build from

- `public/photos-ref/IMG_2366.jpg`: Roof by Elena: patios east of the Elena beds (roof — pin ±3.9 m; looks at The private patios east of the Elena beds)
- `public/photos-ref/IMG_2360.jpg`: Roof by Elena: looking east-north-east along Cervantes (roof — pin ±2.8 m; looks at Cervantes east of Elena, seen along its line)
- `public/photos-ref/IMG_2197.jpg`: Calle Elena north: tiled lane between planted beds (ground — pin ±3.5 m; looks at The second hedged bed and the lane)

## Build

Found while doing elena-east-patios (issue #38): the roof shots IMG_2366/IMG_2360 look along Cervantes east of the Elena junction. Its south side has white patio walls with a trained bougainvillea trunk (also IMG_2197), a closed brown door under a curved coping, a timber pergola with a cane roof against a house with a wooden balcony, and round clipped shrubs. They lie between the Cervantes axis and the registry front of 6265601UF1366N_part1. Trace the lane-side wall and door; patios are private, so walls are solid.

## Do not

Confirm the reading first with an overlay or render from the roof camera; roof pins stand on the Cervantes north row. Do not trace the patios' internal partitions unless a photo shows them.

## Done when

- [ ] new check script
- [ ] render from IMG_2360 compared
- [ ] layout browser test still walks Cervantes both ways
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `cervantes-east-south-patios` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)

Depends on: `elena-east-patios`
