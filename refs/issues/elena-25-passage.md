# Elena south: register the CALLE ELENA 25 covered passage and where it leads

Task `elena-25-passage` · area **Calle Elena** · priority P2 · audit

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `villacana-reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/ELENA_EAST_PATIOS.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`, `docs/LEVELS.md`, `docs/reviews/path-network-inventory-elena/README.md`, `docs/reviews/elena-patio-wall-correction/README.md`
- data: `data/elena_north.json`, `data/elena_east_patios.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`, `data/levels_survey.json`, `data/door_sills.json`
- src: `src/elena-north.ts`, `src/elena-east-patios.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`, `src/door-sills.ts`

## Photos to build from

- `public/photos-ref/IMG_2507.jpg`: Elena 25 passage: street arch with potted schefflera (ground — pin ±2.5 m; looks at Street arch of the CALLE ELENA 25 passage)
- `public/photos-ref/IMG_2508.jpg`: Covered passage signed CALLE ELENA 25, looking through to a garden gate (ground — pin ±2.6 m; looks at CALLE ELENA 25 covered passage into block 6265601UF1366N_part1)

## Build

IMG_2507/2508 (27 Oct batch) show a second covered walk-through on Calle Elena, signed CALLE ELENA 25: a street arch off Elena south, a covered passage with doors both sides, and a far arch to a red-tiled path and an iron garden gate. It enters registry block 6265601UF1366N_part1, which the registry and the game draw as one solid two-storey part; the aerial shows a planted courtyard inside the block. Register the portal on the lane (pin +/-2.5 m, heading unreliable under cover), estimate the passage line against the aerial courtyard, and decide whether it belongs in data/passages.json (which today only opens whole registry parts).

## Do not

Do not cut the block or open a public route through it without a both-end view; the garden gate at the far end may be private. Do not merge it with the 18-36 walkway or the legacy Dali-end candidate.

## Done when

- [ ] Portal registered on the Elena south lane with stated uncertainty
- [ ] Passage line and far-end identity recorded as evidence or open question
- [ ] build_references --check passes
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `elena-25-passage` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
