# South entrance lane: planted frontage borders and projecting window grilles

Task `middle-pool-south-lane-planters` · area **Middle pool** · priority P2 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/middle-pool.md` and the contact sheet `villacana-reference/contact-sheets/middle-pool.jpg`
- docs: `docs/MIDDLE_POOL.md`, `docs/LEVELS.md`, `docs/MIDDLE_POOL_SOUTH_GATE.md`, `docs/MIDDLE_POOL_SW_GATEWAY.md`, `docs/MIDDLE_POOL_RAISED_PATIOS.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/middle_pool.json`, `data/objects.json`, `data/levels_survey.json`, `data/middle_pool_south_gate.json`, `data/middle_pool_north.json`, `data/middle_pool_steps.json`, `data/middle_pool_sw_gateway.json`, `data/terrain.json`, `data/raised_terraces.json`, `data/reference_packs/entrance.json`
- src: `src/middle-pool.ts`, `src/world.ts`, `src/water.ts`, `src/middle-pool-south-gate.ts`, `src/middle-pool-north.ts`, `src/middle-pool-sw-gateway.ts`, `src/ramp-steps.ts`, `src/raised-terraces.ts`

## Photos to build from

- `public/photos-ref/IMG_2334.jpg`: Middle pool south: iron gate in a pergola frame onto a lane (ground — pin ±1.5 m; looks at south gate, double iron leaves and the planter to its right)
- `public/photos-ref/IMG_2189.jpg`: Calle Silvia north: tiled lane looking to the middle pool south gateway (ground — pin ±3.0 m; looks at The middle pool south gateway at the end of Calle Silvia north, about 28 m ahead)

## Build

User identified two planted house-frontage runs beyond the gate, mapped in docs/reviews/middle-pool-south-forecourt/lane-planters/. Establish gateway/world correspondence and trace each visible bed segment separately. Left is a low kerb/planted strip partly hidden by leaf/ladder/cart; right is a raised white rendered bed beneath barred openings, with a recessed doorway break and a separate far section. Keep courtyard bench/hedge distinct. Implement shared map, 3D and collision only after source-based placement is supported. Include the observed projecting black window grille over the brown shutter above the right bed; use IMG_2189 for grille appearance only until gate correspondence is resolved. Model grilles separately from entrance leaves and upper balcony rails; project above the bed, without obstructing the route.

## Do not

Do not mirror a uniform hedge/planter on both sides, fill hidden endpoints, block doorways/routes, or assume IMG_2189 is the reverse of IMG_2334 from its existing label. Source-pixel annotations and a schematic do not establish metre geometry.

## Done when

- [ ] Both frontage runs have independently supported world anchors, declared affected IDs and fresh measured placement review
- [ ] Doorway and street clearances retained; map/3D/collision share the same supported outlines
- [ ] Photo comparisons include visible frontage faces, not only the courtyard bench
- [ ] Visible window grille placement/projection has its own evidence; brown shutters remain visible behind the bars
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `middle-pool-south-lane-planters` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `middle-pool-south-forecourt`
