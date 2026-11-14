# Main pool lawn's sea corner: inner path, gate surround and kiosk ground from new photos

Task `main-pool-gate-corner` · area **Main pool** · priority P1 · detail

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/main-pool.md` and the contact sheet `villacana-reference/contact-sheets/main-pool.jpg`
- docs: `docs/MAIN_POOL.md`, `docs/SMOOTH_PATHS.md`
- data: `data/main_pool.json`, `data/guillermo_slope.json`, `data/seafront_fence.json`, `data/main_pool_lawn.json`, `data/ground_plan_main_pool.json`
- src: `src/main-pool.ts`, `src/pool-levels.ts`, `src/lowered-lanes.ts`, `src/seafront-fence.ts`, `src/main-pool-lawn.ts`, `src/ground-plan.ts`

## Photos to build from

- `public/photos-ref/IMG_2600.jpg`: From the foot of Calle Guillermo: tiled path down past the white wall towards the beach (ground — pin ±2.3 m; looks at The lawn corner and fence at the foot of the path)
- `public/photos-ref/IMG_2601.jpg`: Tiled landing at the foot of the lane with hedge and green fence to the beach (ground — pin ±2.3 m; looks at the inner tiled path ending at a lawn strip, the hedge and the mesh fence)
- `public/photos-ref/IMG_2602.jpg`: Arched white gate pillar with iron gate, signs and bollard light at the lawn corner (ground — pin ±2.3 m; looks at coastal lawn gate pier and iron gate)
- `public/photos-ref/IMG_2763.jpg`: Pink path curving round a white wall to the sea fence (ground — pin ±2.9 m; looks at flagstone path between the hedge and the round white wall, mesh sea fence beyond)
- `public/photos-ref/IMG_2766.jpg`: Painted crossing and blue plumbago at a gated wall (ground — pin ±2.8 m; looks at the beach gateway with plumbago either side and the painted crossing in front of it)
- `public/photos-ref/IMG_2767.jpg`: Painted crossing at the gated wall, looking south-west (ground — pin ±2.5 m; looks at the painted crossing right outside the beach gateway, the paseo running on south-west)
- `public/photos-ref/IMG_2485.jpg`: Comunidad Villacana gate sign at the end of Calle Guillermo (ground — pin ±2.6 m; looks at Comunidad Villacana sign on the Guillermo gate wall)
- `public/photos-ref/IMG_2762.jpg`: Strelitzia in a white walled corner on the lawn (ground — pin ±2.6 m; looks at strelitzia and silver bush in a white walled corner on the lawn)

## Build

Dave (13 Nov): the slope down has no opening; the only way out is the gate, with the crossing right outside it. Built: the boundary closed, Calle Guillermo ending inside it, the inner tiled path from the lane's foot along the inside of the wall to the gate, the gate rebuilt as photographed and the crossing centred in front of it. Still to do when the requested photos (guillermo-foot-closure, kiosk-faces, beach-gateway) arrive: where exactly the inner path meets the gate (IMG_2600/2601 show hedge and mesh fence ahead, not the gate); the paving the ground texture draws round the kiosk where IMG_2762/2763 show lawn up to its walls; the plumbago either side of the gate and the sandstone-and-mesh face of the fence south-west of it (IMG_2766, IMG_2767, IMG_2484); the kiosk's louvred doors. Also: the surveyed lawn just inside the gate is about 0.9 m below the paseo ramp outside it (lawn about -2.1, paseo about -1.2 at the gate on the seafront profile), so the model has a step at the threshold where IMG_2602 and IMG_2766 show it level; check the levels with scripts/lidar_check.py and grade the apron or the paseo through data/terrain.json, with beach-gate-verge. Also (14 Nov): at the kiosk's north corner the lowered area's edge (data/main_pool.json lowerArea, from about (-19.6,125.6) to (-12.5,130.4)) leaves street-level ground about 1 m above the lawn where IMG_2762 shows level lawn up to the kiosk; check against the laser survey before moving it.

## Do not

Do not reopen the slope onto the paseo. Do not move the registry kiosk footprint or the gateway without a measured correction. Leave Walk alone.

## Done when

- [ ] Photo checks from IMG_2600, IMG_2601, IMG_2763 and IMG_2766 match
- [ ] Visible in Inspect with Show details
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `main-pool-gate-corner` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
