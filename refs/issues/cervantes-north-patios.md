# Walled patios along Cervantes from the roof views

Task `cervantes-north-patios` · area **Calle Miguel de Cervantes** · priority P3 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/cervantes.md` and the contact sheet `villacana-reference/contact-sheets/cervantes.jpg`
- docs: `docs/DALI_CERVANTES.md`, `docs/STREET_LAYOUT.md`, `docs/FRONTAGE_DIVISIONS.md`, `docs/ELENA_NORTH.md`, `docs/CERVANTES_NORTH_PATIOS.md`
- data: `data/dali_cervantes.json`, `data/dali_cervantes_threshold.json`, `data/cervantes_patio_walls.json`, `data/passages.json`, `data/frontage_divisions.json`, `data/cervantes_elena_steps.json`, `data/cervantes_north_patios.json`
- src: `src/cervantes-walls.ts`, `src/dali-threshold.ts`, `src/frontages.ts`, `src/ramp-steps.ts`, `src/cervantes-north-patios.ts`

## Photos to build from

- `public/photos-ref/IMG_2368.jpg`: Roof by Elena: patios and terraces south-west, along Cervantes (roof — pin ±4.1 m; looks at The walled patios north of Cervantes)
- `public/photos-ref/IMG_2369.jpg`: Roof by Elena: patios and terraces south-west (second shot) (roof — pin ±4.1 m; looks at The walled patios north of Cervantes)
- `public/photos-ref/IMG_2359.jpg`: Roof by Elena: over barrel tiles to the Cervantes patios (roof — pin ±2.4 m; looks at The walled patios along Cervantes)

## Build

Patio walls and planting of the gardens north of Cervantes, traced from the three roof shots against the aerial and registry.

## Do not

Roof shots: trace only what is clearly visible; mark extents estimated.

## Done when

- [ ] new check script
- [ ] render from IMG_2368 with --high
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `cervantes-north-patios` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
