# North pool: curved garden walls and raised patios

Task `north-pool-garden-walls` · area **North pool** · priority P2 · structure

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/north-pool.md` and the contact sheet `villacana-reference/contact-sheets/north-pool.jpg`
- docs: `docs/LEVELS.md`
- data: `data/objects.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/water.ts`

## Photos to build from

- `public/photos-ref/IMG_2207.jpg`: Looking down over lichen-mottled barrel roof tiles to the north pool garden (upper-floor — pin ±4.7 m; looks at The north pool garden below the roof)
- `public/photos-ref/IMG_2208.jpg`: Barrel roof tiles, curved hedges and path below, pool edge (upper-floor — pin ±4.7 m; looks at The north pool garden and path below the roof)
- `public/photos-ref/IMG_2204.jpg`: North pool from above: whole courtyard, terraces, mountains behind (upper-floor — pin ±3.4 m; looks at The north pool)
- `public/photos-ref/IMG_2205.jpg`: North pool from above, looking north to the mountains (upper-floor — pin ±4.7 m; looks at The north pool)

## Levels from the photos

From `data/levels_survey.json` (check with `scripts/check_levels.py`).

- `north-pool-north-patios` (raised-patio): 0.25-0.4 m above the path round the lawn, medium confidence at (-166, 8) ±8 m. Model: **missing**, task `north-pool-garden-walls`. Ground-floor patios across the lawn behind white plinth walls of 0.3-0.4 m with hedges on top; one or two white-nosed steps in the openings. (IMG_2204.jpg, IMG_2205.jpg, IMG_2207.jpg)

## Build

Trace the curved white garden walls (about 1 m), raised patios with tiled steps and the crazy-paving path round the lawn from the upper-floor photos (and private reference photos 03-07 if available), replacing generated wall blocks in that band. The ground-floor patios on the north side stand 0.25-0.4 m above the path behind white plinth walls of 0.3-0.4 m with hedges, with one or two white-nosed steps in each opening; build them as raised terraces with the module from raised-terraces. Heights: data/levels_survey.json item north-pool-north-patios.

## Do not

Upper-floor shots: pins are inside buildings. Follow the AGENTS.md rule against repeated invented walls.

## Done when

- [ ] new check script
- [ ] render with --high from IMG_2204
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `north-pool-garden-walls` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)

Depends on: `raised-terraces`
