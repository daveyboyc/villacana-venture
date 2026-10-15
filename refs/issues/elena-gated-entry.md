# Elena: gated tiled entry west of the covered walkway

Task `elena-gated-entry` · area **Calle Elena** · priority P3 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `villacana-reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`
- data: `data/elena_north.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`
- src: `src/elena-north.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`

## Photos to build from

- `public/photos-ref/IMG_2361.jpg`: Roof by Elena: looking down into a gated tiled entry (roof — pin ±4.6 m; looks at The gated tiled entry west of the covered walkway)
- `public/photos-ref/IMG_2202.jpg`: Covered arched passage at the north end of Elena, gate beyond (ground — pin ±5.3 m)
- `public/photos-ref/IMG_2203.jpg`: Covered passage with a doorway, arched opening to a garden (ground — pin ±5.3 m)

## Build

The narrow gated entry seen looking down in IMG_2361: patterned tiles, a pair of black iron gates in a white gateway topped with bougainvillea, at the west end of the covered walkway (registry part 6265201UF1366N_part5).

## Do not

Keep the walkway open underneath; do not invent further gates.

## Done when

- [ ] walkway still walkable end to end
- [ ] render from IMG_2203
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `elena-gated-entry` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
