# Middle pool south: iron double gate under a pergola frame

Task `middle-pool-south-gate` · area **Middle pool** · priority P2 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/middle-pool.md` and the contact sheet `villacana-reference/contact-sheets/middle-pool.jpg`
- docs: `docs/MIDDLE_POOL.md`, `docs/LEVELS.md`, `docs/MIDDLE_POOL_SOUTH_GATE.md`, `docs/MIDDLE_POOL_SW_GATEWAY.md`
- data: `data/middle_pool.json`, `data/objects.json`, `data/levels_survey.json`, `data/middle_pool_south_gate.json`, `data/middle_pool_north.json`, `data/middle_pool_steps.json`, `data/middle_pool_sw_gateway.json`, `data/terrain.json`
- src: `src/middle-pool.ts`, `src/world.ts`, `src/water.ts`, `src/middle-pool-south-gate.ts`, `src/middle-pool-north.ts`, `src/middle-pool-sw-gateway.ts`, `src/ramp-steps.ts`

## Photos to build from

- `public/photos-ref/IMG_2334.jpg`: Middle pool south: iron gate in a pergola frame onto a lane (ground — pin ±4.7 m)
- `public/photos-ref/IMG_2335.jpg`: Middle pool south: raised white planter with a blue tile panel (ground — pin ±4.7 m)

## Build

Black iron double gate under a curved metal pergola frame, crazy paving with a drain, the raised white planter with a step and the blue tile panel beside it.

## Do not

Gate stays open and walkable unless a photo shows it shut.

## Done when

- [ ] check_middle_pool.py extended
- [ ] layout test walks through
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `middle-pool-south-gate` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)

Depends on: `middle-pool-sw-steps`
