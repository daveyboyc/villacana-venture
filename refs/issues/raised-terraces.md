# Raised terraces: a reusable module, first used for the north pool west terrace and its tiled stair

Task `raised-terraces` · area **North pool** · priority P1 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/north-pool.md` and the contact sheet `villacana-reference/contact-sheets/north-pool.jpg`
- docs: `docs/LEVELS.md`, `docs/NORTH_POOL_REVIEW.md`
- data: `data/objects.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/water.ts`

## Photos to build from

- `public/photos-ref/IMG_2204.jpg`: North pool from above: whole courtyard, terraces, mountains behind (upper-floor — pin ±3.4 m; looks at The north pool)
- `public/photos-ref/IMG_2206.jpg`: North pool from above, west side terraces (upper-floor — pin ±4.7 m; looks at The north pool, west side)
- `public/photos-ref/IMG_2208.jpg`: Barrel roof tiles, curved hedges and path below, pool edge (upper-floor — pin ±4.7 m; looks at The north pool garden and path below the roof)

## Levels from the photos

From `data/levels_survey.json` (check with `scripts/check_levels.py`).

- `north-pool-west-stair` (steps): 0.9-1.1 m above the crazy-paving path round the lawn, medium confidence at (-187, 17.5) ±6 m. Model: **missing**, task `raised-terraces`. A flight with red-and-blue patterned tile risers and an iron handrail climbs from the north-west corner of the lawn path to a raised terrace with crazy paving, a terracotta patio with tables and the house fronts. A curved white retaining wall of the same height runs beside it holding a planted bank. Position from two roof bearings (about 312 degrees, 18-25 m), low confidence. About where the terrain foot line runs, but about 1 m rather than 0.5 m; whether it is shared ground or a private terrace is not visible. (IMG_2204.jpg, IMG_2206.jpg, IMG_2208.jpg)

## Build

Most houses sit at lane level; what is raised is the ground in front of some of them (patios and terraces 0.25-1.1 m up, reached by one to six steps). Add one data file and module for raised terraces: an outline, a floor height above the ground (siteY), faces (white render or sandstone, with coping), openings with a stair (riser count) and a walkable flag; the player's groundHeight follows the floor inside a walkable terrace; faces collide except at openings; draw it on the blueprint. First use: the north pool west terrace, about 1 m (6 risers) above the path round the lawn, with its red-and-blue tiled stair and iron handrail at the north-west corner of the lawn and the curved white retaining wall beside it holding a planted bank. Position is low confidence (about (-187, 17.5) +-6 m from two roof bearings): trace it against the aerial and the registry houses before building. Heights: data/levels_survey.json item north-pool-west-stair.

## Do not

Do not raise the lawn, deck or pool (pools stay level). Do not lift houses: the terrace is the ground in front of them. Do not generalise the terrace height to other patios without their own photos.

## Done when

- [ ] new scripts/check_raised_terraces.py
- [ ] layout browser test climbs the stair one riser at a time and walks the terrace
- [ ] render with --high from IMG_2204 and IMG_2206
- [ ] check_levels.py: north-pool-west-stair marked built
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `raised-terraces` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
