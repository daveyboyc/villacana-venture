# Elena north mouth: the walled corner patio, raised fan-palm bed, lantern, CALLE DE ELENA tiles and bougainvillea on Cervantes

Task `elena-north-corner` · area **Calle Elena** · priority P1 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/elena.md` and the contact sheet `reference/contact-sheets/elena.jpg`
- docs: `docs/ELENA_NORTH.md`, `docs/ELENA_EAST_PATIOS.md`, `docs/STREET_LAYOUT.md`, `docs/TERRAIN.md`, `docs/LEVELS.md`, `docs/reviews/path-network-inventory-elena/README.md`, `docs/reviews/elena-patio-wall-correction/README.md`, `docs/ELENA_WALKWAY.md`, `docs/LANE_WALLS.md`
- data: `data/elena_north.json`, `data/elena_east_patios.json`, `data/cervantes_elena_steps.json`, `data/street_layout.json`, `proposals/calle-elena.json`, `data/terrain.json`, `data/levels_survey.json`, `data/door_sills.json`, `data/elena_walkway.json`, `data/lane_walls.json`, `data/elena_south_beds.json`, `data/elena_junction_details.json`
- src: `src/elena-north.ts`, `src/elena-east-patios.ts`, `src/ramp-steps.ts`, `src/terrain.ts`, `src/layout-routes.ts`, `src/door-sills.ts`, `src/elena-walkway.ts`, `src/lane-walls.ts`, `src/elena-junction-details.ts`

## Photos to build from

- `public/photos-ref/IMG_2455.jpg`: Cervantes at Elena: raised white bed with palms, 'CALLE DE ELENA' sign and brown door (ground — pin ±2.7 m; looks at North-side white bed, garden door and Calle de Elena plaque at the junction)
- `public/photos-ref/IMG_2800.jpg`: Fan palm bed and street plaque at a lane corner (ground — pin ±2.5 m; looks at Fan-palm raised bed, CALLE DE ELENA plaque, wall lamp and bougainvillea on the corner wall west of the Elena north mouth)
- `public/photos-ref/IMG_2966.jpg`: CALLE DE ELENA corner plaque, fan-palm planter and garden doorway on Cervantes (ground — pin ±4.1 m; looks at CALLE DE ELENA plaque, fan-palm corner planter and opposite garden doorway at the Cervantes/Elena junction)
- `public/photos-ref/IMG_2967.jpg`: Fan-palm corner planter under the CALLE DE ELENA plaque, terracotta path running west (ground — pin ±3.8 m; looks at Same corner planter as IMG_2966, seen from its east end)

## Build

Dave, 18 November 2026 (Inspect screenshot): this corner of Elena needs a patio and walls, lamppost, bougainvillea and plants. Build the pocket west of the Elena north mouth on Cervantes from the ground photos, structure first (wall, raised bed) with an independent review, then the photographed detail.

## Do not

No change to Walk. No detail on structure that has not passed review. No solved camera sees the corner: positions are estimates; do not grade them photographed or measured.

## Done when

- [ ] Visible in Inspect in Layout and with Show details
- [ ] Structure signed off by a reviewer subagent (docs/reviews/elena-north-corner/STRUCTURE-REVIEW.md)
- [ ] check_elena_north_corner, check_cervantes_lane_edges, check_lane_walls, check_map pass; production build
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `elena-north-corner` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
