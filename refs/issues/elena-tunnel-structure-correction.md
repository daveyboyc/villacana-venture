# Elena: correct covered passage structural omissions after registration

Task `elena-tunnel-structure-correction` · area **Calle Elena** · priority P1 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `villacana-reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/ELENA_EAST_PATIOS.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`, `docs/LEVELS.md`, `docs/reviews/path-network-inventory-elena/README.md`
- data: `data/elena_north.json`, `data/elena_east_patios.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`, `data/levels_survey.json`, `data/door_sills.json`
- src: `src/elena-north.ts`, `src/elena-east-patios.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`, `src/door-sills.ts`

## Photos to build from

- `public/photos-ref/IMG_2202.jpg`: Elena covered passage looking toward the private iron gates numbered 36/34 (ground — pin ±5.3 m; looks at Private paired gates 36/34 west of the covered walkway)
- `public/photos-ref/IMG_2203.jpg`: Covered passage looking out onto Calle Elena and its planted bed (ground — pin ±5.3 m; looks at Opposite exit of the covered passage onto Calle Elena)
- `public/photos-ref/IMG_2255.jpg`: Covered arched passage on Elena north, patterned tiles (ground — pin ±3.0 m)

## Build

Compare T01–T09 drawings and pinned model-context captures. After bounded placement workflow, implement supported arched soffits, near door recesses, small farther shuttered openings (type unresolved), and distinct private gateway. Preserve flat ceiling, upper floors, roof and shared collision. Floor inset/surface follows supported structure; unknown dimensions remain open.

## Do not

Do not turn smaller farther openings into extra doors, open a private gate as public access, change a host footprint or transfer details from Silvia/Jorge. No decorative pass before inventory/registration.

## Done when

- [ ] Declared source/model scope and limitations retained
- [ ] Bounded comparison artifact and follow-up for every unresolved item
- [ ] Applicable HANDOVER checks and full 3D/mobile regression completed; no geometry release on unresolved browser regressions
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `elena-tunnel-structure-correction` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `path-network-inventory-elena`, `elena-register-tunnel-portals`, `3d-browser-regression-reliability`
