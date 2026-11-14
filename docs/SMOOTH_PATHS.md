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

## The ground plan files

One file per area, `data/ground_plan_<area>.json` (the area id with `_` for `-`), imported by name in
`src/ground-plan.ts` so the placement tooling ties each surface to its data and renderer. Feature ids
are `ground_plan_<area>.json:<surface id>`. World metres: x east, z south.

```json
{
  "about": "...", "area": "main-pool", "trust": "how sure the area's tracing is, in a sentence",
  "surfaces": [
    { "id": "lawn-pink-paths", "name": "...", "kind": "path", "finish": "pink-resin",
      "width": 2.4, "lines": [[[x, z], ...], ...], "ends": [["square", "round"], ...], "joins": 1.2,
      "note": "what the photos show and what is estimated", "evidence": ["IMG_2764.jpg", ...], "traced": "map:ground",
      "edges": [ { "kind": "planter-wall", "side": "left", "span": [1.5, 8], "height": 0.35,
                   "planting": "lavender", "openings": [{ "at": 3.0, "width": 1.2 }],
                   "note": "...", "evidence": ["IMG_2600.jpg"] } ] },
    { "id": "lawn-flagstone-apron", "kind": "apron", "finish": "flagstone",
      "outline": [[x, z], ...], "corners": 0.6, "hard": [0, 3], "above": ["lawn-pink-paths"], ... }
  ]
}
```

- **kind**: `path` (centrelines and a width; several lines in one surface are unioned with rounded
  `joins`), or `patio`, `apron`, `green` (an outline; corners rounded by `corners` metres except the
  vertex indices in `hard`). `raise` lifts a raised patio's floor.
- **finish** (`FINISHES` in `src/ground-plan.ts`): `pink-resin`, `terracotta-squares`, `flagstone`,
  `octagon-tiles`, `concrete`, `gravel`, `planted-bed`, and two texture-only finishes drawn by the ground
  texture, not a mesh: `lawn`, and `pool-deck` (the deck's stone, for a pool without a measured deck). Green spaces and planted beds are painted into the ground texture, so the raster's wobbly class
  edge gives way to the traced one; paved surfaces are meshes over it.
- **edges** (`EDGES`): `none`, `kerb`, `brick-border` (flush, not solid), `planter-wall`, `wall`,
  `hedge`, `fence` (solid: collision and map walls). On a path an edge runs along `side` (`left` of the
  direction of travel, `right` or `both`), over `span` metres if given; on an outline over vertices
  `from`..`to`. `openings` leave gaps; edges with planting carry it on top in Show details. Clipped
  hedge leaves show with Show details, a plain hedge mass in Layout.
- **evidence** lists catalogued photos; `traced: "map:ground"` says the shape was traced from the georeferenced
  aerial (a surface seen only on the aerial has no photo evidence and is graded `inferred`).
- **above**: surfaces this one deliberately lies over (an apron over a path's end, a path over the lawn).
  Any other overlap between finishes fails the check. Texture painting follows the same order.
- Edges on an outline stand just outside it (offset by half their width), so a hedge bounds a lawn
  instead of covering its rim.

### Tracing from the aerial

`scripts/trace_ground.py lawn|pale|warm --within "x,z x,z ..." --overlay out.png` classifies the
georeferenced aerial inside a rough polygon, cleans the mask, keeps the largest region and prints its
outline in world metres, simplified (default 0.4 m). Draw the polygon a little outside the area and
close it along an edge you already have (a path's edge, a wall). The aerial is 0.24 m a pixel and
registered to 1-2 m; where it and the photos disagree (a brown band that the photos show as lawn),
the photos win and the note says so. Registry footprints win over the aerial too.

`scripts/check_ground_plan.py` checks every file: kinds and finishes known, evidence that exists, a
confidence entry for every surface, paths without hairpins, simple outlines, nothing in pool water or
inside a standing house, solid edges clear of the mapped lanes, edge heights in range, openings that
fit, and no undeclared overlaps.

### Adding an area

1. Create `data/ground_plan_<area>.json` and add its import to `GROUND_PLANS` in `src/ground-plan.ts`.
2. Trace each path's centreline and each patio and green space's outline from the georeferenced aerial
   (`public/map/ground.jpg`) and the photos; give each a finish, `evidence`, a `note` saying what is
   photographed and what is estimated, and its edges. Where an edge is not seen, leave it out and record
   a gap in `data/confidence.json`, or build it with an `inferred` level if it is plainly there.
3. Move the area's existing path, patio and planter data into the file where it fits, and update the
   features that cite it (photo checks, confidence, build queue).
4. Add each surface to `data/confidence.json`, run `check_ground_plan.py`, render Inspect before and
   after (`scripts/shoot_inspect.cjs`), and photo-check through the photo cameras.

## Status

- **Pilot (done, 13 Nov):** the main-pool lawn. Its pink paths are one smooth network with rounded joins;
  the inner tiled path and the flagstone apron are smooth surfaces (`src/main-pool-lawn.ts`).
- **Framework (done, 14 Nov):** `src/ground-plan.ts`, `data/ground_plan_main_pool.json`,
  `scripts/check_ground_plan.py`. The main-pool lawn's paths, inner path and apron moved onto it, and the
  inner path gained its first edge (the lavender planter IMG_2600/2601 show).
- **Main pool (14 Nov):** the big lawn traced from the aerial, with the hedge along the sea railing as
  its edge; the lawn strip by the Guillermo planter; a texture-only deck band for a clean deck edge; and
  the pale north-east path (inferred).
- **Next:** one task per area,
  `ground-plan-<area>`, traces paths, patios and green spaces with their edges and brings the area's
  existing patio, wall and planter modules under it. Order: main pool, north pool, middle pool, south
  pool, Elena, Cervantes, seaward lanes, Eva, north lanes, Dalí and Picasso (most photographed first).
