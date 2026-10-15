# Cervantes: two steps up to a front door west of the Elena junction

Task `cervantes-door-steps` · area **Calle Miguel de Cervantes** · priority P2 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/cervantes.md` and the contact sheet `villacana-reference/contact-sheets/cervantes.jpg`
- docs: `docs/DALI_CERVANTES.md`, `docs/STREET_LAYOUT.md`, `docs/FRONTAGE_DIVISIONS.md`, `docs/ELENA_NORTH.md`
- data: `data/dali_cervantes.json`, `data/dali_cervantes_threshold.json`, `data/cervantes_patio_walls.json`, `data/passages.json`, `data/frontage_divisions.json`, `data/cervantes_elena_steps.json`, `data/junction_lawns.json`
- src: `src/cervantes-walls.ts`, `src/dali-threshold.ts`, `src/frontages.ts`, `src/ramp-steps.ts`, `src/junction-lawns.ts`

## Photos to build from

- `public/photos-ref/IMG_2327.jpg`: Cervantes at Elena: steps up to a door beside the lane (ground — pin ±4.2 m)
- `public/photos-ref/IMG_2328.jpg`: Cervantes at Elena: ramp and steps side by side, drain at the foot (ground — pin ±4.0 m; looks at The ramp and steps side by side)

## Build

Two red-tread steps with white sides climbing to a brown timber door on the north side of Cervantes, just west of the ramp drain, between a plumbago hedge and bougainvillea.

## Do not

The door belongs to a house: steps stop at the facade; do not narrow the lane or the steps beside the ramp.

## Done when

- [ ] check_cervantes_patio_walls.py and check_terrain.py pass
- [ ] layout test still climbs the ramp steps
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `cervantes-door-steps` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
