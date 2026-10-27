# Elena: register both portals and reconcile second tunnel candidate

Task `elena-register-tunnel-portals` · area **Calle Elena** · priority P1 · audit

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `villacana-reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/ELENA_EAST_PATIOS.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`, `docs/LEVELS.md`, `docs/reviews/path-network-inventory-elena/README.md`, `docs/reviews/elena-patio-wall-correction/README.md`
- data: `data/elena_north.json`, `data/elena_east_patios.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`, `data/levels_survey.json`, `data/door_sills.json`
- src: `src/elena-north.ts`, `src/elena-east-patios.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`, `src/door-sills.ts`

## Photos to build from

- `public/photos-ref/IMG_2518.jpg`: Elena covered walkway east portal: CALLE ELENA 18 36 plaque, two steps and ramp (ground — pin ±2.5 m; looks at East portal steps and ramp of the Calle Elena covered walkway)
- `public/photos-ref/IMG_2519.jpg`: Elena covered walkway looking west to the arch and the 36/34 gates (ground — pin ±2.6 m; looks at Calle Elena covered walkway towards its west arch)
- `public/photos-ref/IMG_2203.jpg`: Covered passage looking out onto Calle Elena and its planted bed (ground — pin ±5.3 m; looks at Opposite exit of the covered passage onto Calle Elena)
- `public/photos-ref/IMG_2202.jpg`: Elena covered passage looking toward the private iron gates numbered 36/34 (ground — pin ±5.3 m; looks at Private paired gates 36/34 west of the covered walkway)

## Build

Resolve tun-001 portal observations T01/T02, private 36/34 spur and connected Elena lane. Obtain both-end views for legacy tun-002 host 6265201UF1366N_part2; keep far roof-view arch identity separate until supported.

## Do not

No inferred public through route or duplicate merge from a similar-looking arch; both world portals stay null until evidence registration.

## Done when

- [ ] Declared source/model scope and limitations retained
- [ ] Bounded comparison artifact and follow-up for every unresolved item
- [ ] Applicable audit software checks completed; geometry releases remain behind the browser regression prerequisite.
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `elena-register-tunnel-portals` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `path-network-inventory-elena`
