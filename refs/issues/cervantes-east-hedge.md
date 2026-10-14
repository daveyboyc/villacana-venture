# Cervantes east of Elena: white kerb wall and plumbago hedge

Task `cervantes-east-hedge` · area **Calle Miguel de Cervantes** · priority P3 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/cervantes.md` and the contact sheet `villacana-reference/contact-sheets/cervantes.jpg`
- docs: `docs/DALI_CERVANTES.md`, `docs/STREET_LAYOUT.md`, `docs/FRONTAGE_DIVISIONS.md`, `docs/ELENA_NORTH.md`
- data: `data/dali_cervantes.json`, `data/dali_cervantes_threshold.json`, `data/cervantes_patio_walls.json`, `data/passages.json`, `data/frontage_divisions.json`, `data/cervantes_elena_steps.json`
- src: `src/cervantes-walls.ts`, `src/dali-threshold.ts`, `src/frontages.ts`, `src/ramp-steps.ts`

## Photos to build from

- `public/photos-ref/IMG_2356.jpg`: Cervantes east of Elena: lane beside a plumbago hedge (ground — pin ±4.5 m)
- `public/photos-ref/IMG_2360.jpg`: Roof by Elena: looking east-north-east along Cervantes (roof — pin ±2.8 m; looks at Cervantes east of Elena, seen along its line)

## Build

The low white kerb wall and tall plumbago hedge on the north side of Cervantes east of the junction, as far as IMG_2356 shows.

## Do not

Unphotographed eastern frontage stays unasserted (see docs/FRONTAGE_DIVISIONS.md).

## Done when

- [ ] check_cervantes_patio_walls.py or a new check passes
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `cervantes-east-hedge` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
