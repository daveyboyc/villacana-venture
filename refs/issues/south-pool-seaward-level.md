# South pool: lawn level above the paseo and its seaward wall

Task `south-pool-seaward-level` · area **South pool** · priority P2 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/south-pool.md` and the contact sheet `villacana-reference/contact-sheets/south-pool.jpg`
- docs: `docs/SOUTH_POOL.md`, `docs/HANDOVER_SOUTH_POOL.md`, `docs/LEVELS.md`
- data: `data/south_pool.json`, `proposals/south-pool.json`, `data/levels_survey.json`
- src: `src/south-pool.ts`

## Photos to build from

- `public/photos-ref/IMG_2349.jpg`: From the paseo: sandstone retaining wall and fence below the south pool (ground — pin ±3.3 m)
- `public/photos-ref/IMG_2188.jpg`: South pool from a patio: lawn, tall palm, sea beyond (ground — pin ±3.1 m)

## Levels from the photos

From `data/levels_survey.json` (check with `scripts/check_levels.py`).

- `south-lawn-over-paseo` (retaining-wall): 0.9-1.1 m above the paseo, medium confidence at (-74, 198) ±3 m. Model: **built**, task `south-pool-seaward-level`. About three sandstone courses; the hedge grows from coping level and the deck and water are seen from just above at eye height. IMG_2350 against a lamp post gives 1.0-1.2 m. Lower to the west: 0.6-0.9 m in IMG_2352, 0.5-0.8 m in IMG_2354. The model has the paseo 1 m below street level beside the south lawn, rising to leave the wall about 0.5 m at its west end (data/main_pool.json paseo profile), which matches. (IMG_2349.jpg, IMG_2350.jpg, IMG_2188.jpg)

## Build

The level itself is now in the model: the paseo is 1 m below street level beside the south lawn and rises to leave the wall about 0.5 m at its west end (data/main_pool.json paseo profile), which matches the photos (data/levels_survey.json item south-lawn-over-paseo). Remaining: reconcile skeleton.seaWall with the sandstone wall in data/paseo_wall.json so there is one wall line, and check from IMG_2188 that the lawn runs level to the seaward hedge.

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
