# Elena north: private patios east of the beds

Task `elena-east-patios` · area **Calle Elena** · priority P2 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `villacana-reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`, `docs/LEVELS.md`
- data: `data/elena_north.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`, `data/levels_survey.json`
- src: `src/elena-north.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`

## Photos to build from

- `public/photos-ref/IMG_2366.jpg`: Roof by Elena: patios east of the Elena beds (roof — pin ±3.9 m; looks at The private patios east of the Elena beds)
- `public/photos-ref/IMG_2362.jpg`: Roof by Elena: looking east-south-east over the terraces to the sea (roof — pin ±4.7 m; looks at The terraces east of Elena north)
- `public/photos-ref/IMG_2360.jpg`: Roof by Elena: looking east-north-east along Cervantes (roof — pin ±2.8 m; looks at Cervantes east of Elena, seen along its line)

## Build

The walled private patios between the Elena beds and the east terrace: white patio walls with bougainvillea, a timber pergola, paving. Trace walls from the roof shots against the aerial and registry; patios are private, so walls are solid.

## Do not

Roof shots: the pin is the roof, not the subject. Trace only walls visible in at least one photo.

## Done when

- [ ] new or extended check script
- [ ] render from IMG_2366 compared
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `elena-east-patios` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)

Depends on: `elena-garden-door`
