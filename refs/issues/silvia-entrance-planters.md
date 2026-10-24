# Build bounded planters at the Silvia tunnel and pool entrance

Task `silvia-entrance-planters` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P1 · build

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`, `data/entrance_planters.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`, `src/entrance-planters.ts`, `src/silvia-paving.ts`

## Photos to build from

- `public/photos-ref/IMG_2190.jpg`: Covered arched passage with potted plants, patterned tiles (ground — pin ±3.5 m)
- `public/photos-ref/IMG_2191.jpg`: Passage plaque reading CALLE SILVIA 1-15 (ground — pin ±3.5 m)
- `public/photos-ref/IMG_2192.jpg`: Crazy-paving path between hedges into the middle pool lawn (ground — pin ±4.7 m)
- `public/photos-ref/IMG_2334.jpg`: Middle pool south: iron gate in a pergola frame onto a lane (ground — pin ±1.5 m; looks at south gate, double iron leaves and the planter to its right)
- `public/photos-ref/IMG_2335.jpg`: Middle pool south: raised white planter with a blue tile panel (ground — pin ±1.5 m; looks at wall bench and blue/yellow tile panel in the west planter, inside the south gate)

## Build

Inspect satellite and full photos, inventory raised bed/kerb fragments immediately beside the covered Silvia entrance and pool entrance, and build the source-visible bounded outlines in map/3D/collision. Keep hidden extents and provisional world registration explicit.

## Do not

Do not mistake potted shrubs for continuous structural beds, transfer unrelated gate structures or invent a pool ring wall. Preserve registry houses/pool, street axes, doors and mobile controls.

## Done when

- [ ] Independent actual-source review and labelled satellite/model overlay
- [ ] Bounded observed bed fragments share map, collision and mesh outlines; visible planting footprint clears routes
- [ ] Actual scene before/after evidence and source/route/build checks; unresolved placement remains in progress
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `silvia-entrance-planters` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them
