# Smooth paths, patios and green spaces, with their edges and boundaries

Dave (2026-11-13): the paths are clunky; they should be smooth throughout the whole model, along with
the correct walls and boundaries for patios and green spaces.

## Why the ground looks clunky now

Three different things draw the ground, and each leaves its own kind of roughness:

1. **Classified aerial raster** (`public/map/cover.png`, 25 cm cells, painted into the ground texture in
   `src/slice.ts`). Paving, lawn and deck come from colour classes, softened per class. Their edges wobble
   and blob where the aerial is ambiguous (shadows, planting, roofs), and nothing marks where a patio
   ends, where a lawn has a kerb, or which wall holds a terrace.
2. **Polyline ribbons** for traced paths (the main-pool lawn paths until now, the Jorge path, Eva and
   Elena paving strips, `roadStrip` for lanes in `src/world.ts`). A ribbon of straight segments kinks
   at every traced point, pinches at bends, and branches sit on top of each other as rectangles with
   square ends.
3. **Per-feature modules** for walls, patios and planters (`raised-terraces`, `cervantes-*-patios`,
   `elena-east-patios`, `eva-walled-lawn`, `north-pool-gardens`, `junction-lawns`,
   `frontage-divisions`, `entrance-planters`, ...). Each traces its own outline and edge, so a patio's
   floor, its wall and the lawn beside it are not one shape and can disagree.

## The approach

**One vector ground plan per area, drawn smooth, with explicit edges.**

- **Surfaces.** Every path, patio, apron and green space is a vector shape traced from the aerial and the
  photos. A path is a centreline and a width; a patio or lawn is an outline. `src/smooth-path.ts` draws
  them: a centripetal Catmull-Rom curve through the traced points, a constant-width outline, all the
  paths of one network unioned into a single shape with rounded fillets where branches meet, and one
  mesh laid on the surveyed ground. The traced points stay the data; only the drawing is smoothed.
  Corners that are really square (a patio against a house, a lane between two walls) keep a hard corner:
  each shape says which.
- **Edges.** Each surface outline carries what bounds it, from the photos: nothing (lawn meets path),
  a kerb or brick border, a low planter wall, a hedge, a patio wall with its height and openings, a
  fence. Edges are drawn along the same smooth outline, so the floor, its edge and the lawn beside it
  always agree. Openings stay open unless a photo shows them shut; a wall or gate that is not seen is
  left out and recorded as a gap, or built as `inferred` where it is plainly there.
- **Ground texture.** Where an area's ground plan is traced, the raster classes give way to it: the same
  polygons paint the texture mask, so the clean vector edge replaces the wobbly class edge.
- **Checks.** A `check_ground_plan.py` per area: valid shapes, no surface overlapping another of a
  different finish, protected routes kept clear, walls clear of lanes and houses, every edge with
  evidence and a confidence level; Inspect renders before and after; photo checks through the solved or
  starting cameras.

## Status

- **Pilot (done, 13 Nov):** the main-pool lawn. Its pink paths are one smooth network with rounded joins;
  the inner tiled path and the flagstone apron are smooth surfaces (`src/main-pool-lawn.ts`).
- **Next:** task `ground-plan-framework` turns the pilot into the shared ground plan (data file per
  area, renderer, texture mask, check) and moves the main-pool lawn onto it. Then one task per area,
  `ground-plan-<area>`, traces paths, patios and green spaces with their edges and brings the area's
  existing patio, wall and planter modules under it. Order: main pool, north pool, middle pool, south
  pool, Elena, Cervantes, seaward lanes, Eva, north lanes, Dalí and Picasso (most photographed first).
