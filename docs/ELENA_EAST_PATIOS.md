# Elena east patios: enclosure behind the garden wall (issue #38)

Task `elena-east-patios`. Data `data/elena_east_patios.json`, built by
`src/elena-east-patios.ts` in the pool scene, drawn by the `elena-east-patios`
block in `src/blueprint.ts`, checked by `scripts/check_elena_east_patios.py`.
Map, mesh and collision all read the same wall records.

The [26 October patio-wall correction](reviews/elena-patio-wall-correction/README.md)
keeps these enclosure outlines/heights and uses shared vertex ground for joined
wall bodies/copings. The separately visible first patio near the lawn gateway has
one bounded divider and plain-tile floor; it does not fill these concealed interiors.

## What the photos show

The task listed three roof shots. All of them were checked at full size, and a
projection of the existing model (lanes, beds, garden wall, registry footprints)
was overlaid on them from fitted cameras
(`docs/reviews/issue-38/overlay-IMG_2360.png`).

- **IMG_2360 and IMG_2366 look along Cervantes east of the Elena junction**,
  not into the patios behind the Elena garden wall. They were taken from the
  same roof terrace as IMG_2368 (a potted cycad and the ENE-running parapet),
  at the east end of the Cervantes north row. In the overlay the paved strip
  running away from the camera lines up with the Cervantes axis. On its north side is the
  second hedged bed (soil, drip line, a magnolia-like tree inside a clipped
  hedge). On its south side is a white wall with a trained bougainvillea trunk
  (the same wall shows in IMG_2197, looking along Cervantes), then a closed brown
  door under a curved coping, a cane-roofed timber pergola against a house with
  a wooden balcony, and round clipped shrubs. Those sit in front of registry
  6265601UF1366N_part1. They belong to Cervantes, not to this task, so they are
  queued as new task `cervantes-east-south-patios`.
- **IMG_2362 and IMG_2364** look east-south-east over the magnolia bed to the
  house fronts of 6265401UF1366N_part3. The patio floor and any partitions
  between the garden wall and those fronts are under the magnolia canopy.

So no roof photo shows the inside of the patios. Their partitions, floors and
any raised levels are **not modelled**. Nothing is guessed there.

## What is built (from ground photos)

| Feature | Photos | Notes |
| --- | --- | --- |
| Garden wall behind the second hedged bed | IMG_2199, IMG_2197 | Continues `elena-north-garden-wall` from its door surround on the same line, 2.2 m to the bed's Cervantes end. 1.85 m, like the existing wall. IMG_2199 shows it carrying on south of the closed door with a bougainvillea trunk on it. |
| White wall behind the plumbago bed | IMG_2356, IMG_2197 | Solid, 1.9 m. Shares the corner and runs 6.1 m, 2.0 m north of the Cervantes axis (behind the existing kerb and hedge), to the registry face of 6265401UF1366N_part3, where the house front takes over. No gate is photographed, so there is no opening. |
| Timber pergola behind the garden door | IMG_2199, IMG_2200 | A dark beam shows over the wall just north of the door. The 2.7 × 2.5 m extent, four posts, rafters and 2.35 m height are estimates. It is unreachable inside the walled patio. |
| Bougainvillea over the walls | IMG_2199, IMG_2197, IMG_2356 | Details-only sprites, placed through the shared route-clearance guard. |

Before this change the game had a 1.9 m gap between the second hedged bed and
the plumbago kerb. Through it the player could walk off Cervantes into the
private patios behind the garden wall. The two walls close that gap. A review
band (garden wall, Cervantes wall and registry face) suppresses generated
garden walls, gates and props inside the patios. There were none there at the
time; the band stops any from being generated later. Terrain, registry
footprints and the existing Elena and Cervantes features are unchanged.

## Checks

- `python3 scripts/check_elena_east_patios.py` checks the following:
  - every feature cites indexed photos and says what is estimated;
  - the west wall continues the garden wall line and stands behind the bed;
  - the Cervantes wall shares that corner, runs behind the kerb and ends on the house front;
  - every lane keeps its width plus a player's radius;
  - the walls stay off houses and pools;
  - the pergola and planting are inside the band, and the band touches no lane;
  - slice, blueprint, the photo map and the browser test all consume the data.
- `scripts/test_layout_browser.cjs` checks that both walls are on the map and solid.
  It walks from Cervantes beside the hedged bed towards the patios, checks the player
  ends outside them, and walks every route both ways with the new rings included.

## Renders and limits

The renders are in `docs/reviews/issue-38/`. `shoot_views.cjs --high` stands the player at the roof
pin. The IMG_2366 pair shows the new pergola and bougainvillea beyond the garden
door. The IMG_2360 pin frames the Cervantes steps, so its before and after
match. A diagnostic pair (`*-cervantes-corner.png`) is taken from Cervantes at (-139.5, 51.2),
looking at (-145, 44). It shows the new wall behind the plumbago bed, closing the corner.
That diagnostic is not a photo camera.

Plan positions are anchored to existing features (garden wall, bed, Cervantes
axis, registry face) to about 0.5–1 m. Heights and the pergola extent are
estimated. The camera reading of IMG_2360/2366 is an interpretation, supported
by the overlay and IMG_2197; the follow-up task asks for it to be confirmed.
