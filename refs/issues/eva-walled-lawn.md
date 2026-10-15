# Calle Eva: walled lawn corner with espaliered bougainvillea

Task `eva-walled-lawn` · area **Calle Eva** · priority P3 · planting

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/eva.md` and the contact sheet `villacana-reference/contact-sheets/eva.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/MIDDLE_POOL.md`
- data: `data/street_layout.json`, `data/middle_pool.json`
- src: `src/middle-pool.ts`

## Photos to build from

- `public/photos-ref/IMG_2339.jpg`: Calle Eva: walled lawn corner with espaliered bougainvillea (ground — pin ±3.9 m)
- `public/photos-ref/IMG_2336.jpg`: Calle Eva east of the middle pool: tiled path between lawns (ground — pin ±3.3 m)
- `public/photos-ref/IMG_2337.jpg`: Calle Eva east of the middle pool: lawn, round trees, lamp (ground — pin ±3.2 m)
- `public/photos-ref/IMG_2338.jpg`: Calle Eva: brown door, yellow-flowered shrub, lawn (ground — pin ±3.6 m)

## Build

The two white walls of the lawn corner beside the middle pool east gateway, espaliered bougainvillea (a wall-texture or flat sprite, not crossed cards), green bollard lights; the lawns and lamp posts along Eva.

## Do not

Do not change the east gateway built in data/middle_pool.json.

## Done when

- [ ] render from IMG_2339
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `eva-walled-lawn` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
