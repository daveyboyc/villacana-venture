# South pool: lawn level above the paseo and its seaward wall

Task `south-pool-seaward-level` · area **South pool** · priority P2 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/south-pool.md` and the contact sheet `villacana-reference/contact-sheets/south-pool.jpg`
- docs: `docs/SOUTH_POOL.md`, `docs/HANDOVER_SOUTH_POOL.md`
- data: `data/south_pool.json`, `proposals/south-pool.json`
- src: `src/south-pool.ts`

## Photos to build from

- `public/photos-ref/IMG_2349.jpg`: From the paseo: sandstone retaining wall and fence below the south pool (ground — pin ±3.3 m)
- `public/photos-ref/IMG_2188.jpg`: South pool from a patio: lawn, tall palm, sea beyond (ground — pin ±3.1 m)

## Build

Make the south pool lawn stand above the paseo by the height of the retaining wall (IMG_2349 shows the pool area right above it) and reconcile skeleton.seaWall with the sandstone wall.

## Do not

Pools stay level (check_terrain.py).

## Done when

- [ ] check_terrain.py and check_seafront.py pass
- [ ] render from IMG_2349
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `south-pool-seaward-level` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)

Depends on: `paseo-retaining-wall`
