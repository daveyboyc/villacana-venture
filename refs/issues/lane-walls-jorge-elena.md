# Calle Elena and Calle Jorge: the missing garden and patio walls

Task `lane-walls-jorge-elena` · area **Calle Elena** · priority P2 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/ELENA_EAST_PATIOS.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`, `docs/LEVELS.md`, `docs/reviews/path-network-inventory-elena/README.md`, `docs/reviews/elena-patio-wall-correction/README.md`, `docs/ELENA_WALKWAY.md`, `docs/LANE_WALLS.md`
- data: `data/elena_north.json`, `data/elena_east_patios.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`, `data/levels_survey.json`, `data/door_sills.json`, `data/elena_walkway.json`, `data/lane_walls.json`, `data/elena_south_beds.json`, `data/elena_junction_details.json`
- src: `src/elena-north.ts`, `src/elena-east-patios.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`, `src/door-sills.ts`, `src/elena-walkway.ts`, `src/lane-walls.ts`, `src/elena-junction-details.ts`

## Photos to build from

- `public/photos-ref/IMG_2261.jpg`: Cervantes junction: another view of the same terraces (ground — pin ±3.0 m; looks at Two brown garden doors in the white wall and the tiled approach between Elena south lawns)
- `public/photos-ref/IMG_2358.jpg`: Roof by Elena: looking down on Elena south and the junction lawns (roof — pin ±2.0 m; looks at The junction lawns south of Cervantes)
- `public/photos-ref/IMG_2260.jpg`: Cervantes junction: white terraces and small lawns (ground — pin ±3.0 m)
- `public/photos-ref/IMG_2330.jpg`: Calle Elena south from the junction, towards the middle pool (ground — pin ±3.4 m; looks at Calle Elena south outdoor path: three straight square-tile columns, beside lawns and planted frontage)
- `public/photos-ref/IMG_2230.jpg`: Tiled lane beside hedges and a patio wall (ground — pin ±2.0 m; looks at Jorge path, hedge-side yucca and the cactus crown)

## Build

Dave, 2026-11-16: the walls need adding around Calle Jorge and Elena. Survey both lanes in Inspect (Layout) against the photos and the aerial and build the walls that close gardens and patios off from the lanes where the model leaves them open: the photographed white wall with two brown doors west of the Elena south lawns (on the built sills), the low patio wall at the Elena south mouth, the tall patio wall with lantern at the east side of the Jorge cactus garden (so the garden ends there), and the patio walls from the north-side house corners to the planters (inferred from the aerial). Record what the aerial suggests but does not settle as gaps.

## Do not

Do not invent walls the photos or aerial do not show; keep the lanes' walking lines clear; leave Walk alone.

## Done when

- [ ] Visible in Inspect in Layout and with Show details
- [ ] scripts/check_lane_walls.py, check_jorge_lane.py, check_door_sills.py and check_junction_lawns.py pass
- [ ] Second-agent review of the Inspect renders against the full-size photos and the aerial
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `lane-walls-jorge-elena` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
