# Calle Guillermo slopes down to the paseo; east pool steps come down from the Picasso wall

Task `guillermo-slope-east-steps` · area **Main pool** · priority P1 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/main-pool.md` and the contact sheet `villacana-reference/contact-sheets/main-pool.jpg`
- docs: `docs/MAIN_POOL.md`
- data: `data/main_pool.json`, `data/guillermo_slope.json`, `data/seafront_fence.json`
- src: `src/main-pool.ts`, `src/pool-levels.ts`, `src/lowered-lanes.ts`, `src/seafront-fence.ts`

## Photos to build from

- `public/photos-ref/ref:apple-maps/11-3d-guillermo-slope-to-paseo.png`: Apple Maps 3D: Calle Guillermo sloping down beside the pool lawn to the paseo (aerial)
- `public/photos-ref/ref:apple-maps/10-3d-guillermo-and-main-pool-from-sea-wide.png`: Apple Maps 3D: main pool and Calle Guillermo from the sea, looking west (aerial)
- `public/photos-ref/ref:apple-maps/12-3d-main-pool-east-steps-picasso.png`: Apple Maps 3D: main pool looking north-east, 90 Miles terrace and the east steps (aerial)
- `public/photos-ref/ref:apple-maps/13-3d-main-pool-terrace-both-stairs.png`: Apple Maps 3D: main pool terrace curve with the west and east steps (aerial)
- `public/photos-ref/IMG_2226.jpg`: From the beach looking back at the resort frontage (ground — pin ±2.0 m; looks at big-pool lawn frontage: white railings, Guillermo gateway at left)
- `public/photos-ref/IMG_2227.jpg`: From the beach looking west along the white seafront houses (ground — pin ±2.5 m; looks at east end of the sandstone wall and the corner house by Calle Guillermo)

## Build

Apple 3D screenshots from Dave (2026-10-21) show Calle Guillermo running down continuously beside the pool lawn to the paseo, not ending on top of a 3 m bank, and the single-storey kiosk at its foot standing at lawn level. Lower the seaward end of Guillermo from street level to paseo level, keep a low wall between the lane and the lawn, and stand the kiosk at lawn level. The east steps are a narrow flight from an opening in the Picasso boundary wall, between the 90 Miles terrace and the east lawn; move them there from the restaurant roof.

## Do not

Do not change the big-pool level, the paseo profile or the sandstone wall (issue #40 owns those). Heights read from Apple's 3D mesh are estimates; say so. Do not move registry footprints.

## Done when

- [ ] Guillermo stays walkable both ways, level where Jorge meets it, with no jump at the junction, the gateway or the paseo
- [ ] check_pool_levels.py, check_street_layout.py, check_paseo_wall.py and the layout browser test pass
- [ ] Before/after renders against the Apple screenshots in docs/reviews/guillermo-slope-east-steps/
- [ ] Placement remains unapproved until an independent reviewer completes a packet
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `guillermo-slope-east-steps` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
