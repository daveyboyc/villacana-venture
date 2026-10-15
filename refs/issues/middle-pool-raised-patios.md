# Middle pool: raised patios behind the north wall and the planted beds

Task `middle-pool-raised-patios` · area **Middle pool** · priority P3 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/middle-pool.md` and the contact sheet `villacana-reference/contact-sheets/middle-pool.jpg`
- docs: `docs/MIDDLE_POOL.md`, `docs/LEVELS.md`
- data: `data/middle_pool.json`, `data/objects.json`, `data/middle_pool_north.json`, `data/levels_survey.json`
- src: `src/middle-pool.ts`, `src/world.ts`, `src/water.ts`, `src/middle-pool-north.ts`

## Photos to build from

- `public/photos-ref/IMG_2193.jpg`: Middle pool, lawn and terraces behind (ground — pin ±4.7 m)
- `public/photos-ref/IMG_2194.jpg`: Middle pool, lawn and terraces behind (second shot) (ground — pin ±4.7 m)
- `public/photos-ref/IMG_2246.jpg`: Oleander bed and pollarded tree by the middle pool (ground — pin ±2.3 m)
- `public/photos-ref/IMG_2247.jpg`: Oleander bed and pollarded tree by the middle pool (second shot) (ground — pin ±2.3 m)
- `public/photos-ref/IMG_2341.jpg`: Curved low white wall with hedge, crazy paving and trees (ground — pin ±47.5 m)

## Levels from the photos

From `data/levels_survey.json` (check with `scripts/check_levels.py`).

- `middle-pool-north-terrace` (raised-patio): 0.3-0.6 m above the pool lawn, low confidence at (-127, 85) ±5 m. Model: **missing**, task `middle-pool-raised-patios`. A white wall of 0.6-1.0 m with a hedge beyond the north end of the deck, a patio with an umbrella and the houses behind it, raised above the lawn. (IMG_2193.jpg, IMG_2194.jpg)
- `middle-pool-patio-beds` (raised-patio): 0.1-0.3 m above the pool lawn, low confidence. Model: **missing**, task `middle-pool-raised-patios`. Kerbed oleander bed of 0.15-0.2 m and a curved hedge wall of 0.35-0.45 m; the patios behind look level with the bed tops. (IMG_2246.jpg, IMG_2247.jpg, IMG_2341.jpg)

## Build

With the raised-terraces module: the patio beyond the north end of the deck behind a white wall of 0.6-1.0 m with a hedge (raised 0.3-0.6 m, low confidence) and the patios behind the kerbed oleander bed (0.15-0.2 m) and the curved hedge wall (0.35-0.45 m), which look level with the bed tops. Heights: data/levels_survey.json items middle-pool-north-terrace, middle-pool-patio-beds.

## Do not

Low-confidence heights: build only the faces the photos show and record the range in trust. Private patios: walls are solid unless a gate is photographed.

## Done when

- [ ] check_raised_terraces.py extended
- [ ] check_levels.py: both items marked built
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `middle-pool-raised-patios` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)

Depends on: `raised-terraces`
