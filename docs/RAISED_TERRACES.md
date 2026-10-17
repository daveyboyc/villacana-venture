# Raised terraces

Much of the ground in front of the houses is raised: patios and terraces 0.25-1.1 m
above the lane or lawn path, held up by white rendered or sandstone retaining faces
and reached by one to six steps (`docs/LEVELS.md`). The houses keep their own level.
These terraces are built by one data file and one module:

- `data/raised_terraces.json`: one entry per terrace, with `evidence` and `trust`.
- `src/raised-terraces.ts`: meshes, collision, player ground height and map drawing.
- `scripts/check_raised_terraces.py`: data, survey, clearance and wiring checks.
- `scripts/test_layout_browser.cjs`: climbs every stair one riser at a time, walks
  each terrace's `walks` and back, and checks the faces and stair cheeks are solid.

First use (issue #54): the north pool's north-west terrace, 1.0 m above the lawn
path, with its six-riser red-and-blue tiled stair and iron handrail cut back between
the curved white retaining wall and the straight wall north of it.

## Data shape

```jsonc
{
  "id": "north-pool-west-terrace", "name": "...", "area": "north-pool",
  "survey": "north-pool-west-stair",   // data/levels_survey.json item it builds
  "walkable": true,                    // false: drawn and solid, but never stood on
  "base": [x, z],                      // ground point the rise is measured from (the stair foot)
  "rise": 1.0,                         // floor height above siteY at base
  "floor": "crazy-paving",
  "face": { "finish": "render" | "sandstone", "thickness": 0.25,
            "coping": { "height": 0.06, "overhang": 0.03 } },
  "outline": [[x, z], ...],            // outer face of the walls, skeleton metres (+x east, +z south)
  "edges": [{ "kind": "face" | "house" | "end", "finish"?: "...", "building"?: "<registry id>", "note"?: "..." }, ...],
  "openings": [{ "id": "...", "edge": 3, "at": 0, "width": 1.32,
                 "stair": { "risers": 6, "tread": 0.3, "direction": "in" | "out",
                            "riserFinish": "red-blue-tile", "treadFinish": "terracotta",
                            "handrail": "right" | "left" | "both" | "none", "cheeks"?: true } }],
  "walks": [[[x, z], ...]],            // floor waypoints the browser test walks from the first stair's top
  "planting": { "edges": [0, 1], "inset": 0.7, "kind": "hedge" },   // Details-only sprites
  "evidence": ["IMG_xxxx.jpg"], "trust": "Photo-supported: ... Estimated: ..."
}
```

`edges[i]` describes `outline[i] -> outline[i+1]` (the last one closes the ring):

- `face`: a retaining wall with coping. Drawn, solid, white line on the map.
- `house`: runs along a registry house front. Not drawn and not given a ring (the
  house is the solid). The check requires both ends to lie on that building's ring.
- `end`: an untraced end of the terrace. Drawn as a plain face without coping and
  solid, so the floor does not float. Shown dashed on the map. Say it is estimated.

An opening cuts its edge from `at` to `at + width`. Its stair has `risers` equal
steps of `rise / risers`, `tread` deep. The last riser always lands on the floor.
With `direction: "in"` the flight is cut back into the terrace behind the opening:
the floor gets a notch and low cheek walls line both sides. With `"out"` it stands
in front of the face. The stair climbs along the edge's inward normal.

## Module API (`src/raised-terraces.ts`)

- `raisedTerraces`: the parsed terraces (type `RaisedTerrace`).
- `raisedTerraceGroundOffset(x, z)`: extra ground over `siteY` (the floor inside a
  walkable outline, the tread underfoot on a stair, else 0). Added to
  `groundHeight` in `src/slice.ts` and in the browser test's world.
- `raisedTerraceRings()`: collision strips for faces and ends (less openings) and
  stair cheeks. Pushed into the solids in `src/slice.ts` and the browser test.
- `addRaisedTerraces(scene)`: floor, faces, coping, stairs, handrails, planting.
  Every mesh is `noDrape`: heights already include `siteY`.
- `raisedTerraceBlueprint()`: paths the map draws (`data-terrace-id`).
- `suppressInRaisedTerraces(skeleton)`: removes generated garden walls, gates and
  props on or within 1.5 m of a terrace (called in slice and blueprint).
- `inRaisedTerrace(x, z, margin?)`, `terraceFloorY(t)`, `terraceEdge(t, i)`,
  `terraceStairs(t)` / `stairFrame(t, opening)` (foot, up, right, run, riser),
  `stairRing(frame)`, `floorRing(t)`.

## Adding a terrace (for #36, #55 and later patios)

1. Find its item in `data/levels_survey.json`, or add one from the photos first.
   Build to the middle of the range; do not reuse another terrace's height.
2. Trace the outline against `public/map/ground.jpg` and the registry fronts
   (`public/map/skeleton.json`). Use `house` edges along fronts with exact
   registry vertices; mark what no photo shows as `end` and say so in `trust`.
3. Add each opening with its stair. Keep openings at least 1.14 m wide, risers
   0.12-0.2 m and treads 0.25-0.45 m.
4. Add a `walks` route on the floor, at least 0.62 m from every edge.
5. Mark the survey item `built`, run `scripts/check_raised_terraces.py`,
   `scripts/check_levels.py` and the layout browser test.

Nothing new is needed in `slice.ts`, `blueprint.ts` or the browser test: they read
every terrace in the file. The check currently requires each terrace's survey item
to belong to the `raised-terraces` task; relax that line when another task owns one.

## The north pool west terrace

- Position: a camera for IMG_2204 solved from seven points on the registry pool
  ring (about (-173.5, 36.6), 7.8 m up, heading 342 against EXIF 329). It puts the
  stair at bearing 320 from the camera; IMG_2206 gives 324. The withdrawn
  issue-36 flight at (-181.9, 12) would be at 341. That spot is the pier at the east
  end of the wall, where a path climbs to the north row alley. The stair foot is
  2.3 m from the survey's ±6 m centre.
- Photo-supported: tiled risers, iron handrail on the north side, the curved wall
  south of the stair, the straight wall with coping north of it as far as the pier,
  the planted bank, and the crazy paving and patio in front of the house fronts.
- Estimated: the 1.32 m width, the curve between photo points, the return beside
  the alley path, and the west and south ends.
- Open: the houses behind (6165501UF1366N_part5, part1) keep their terrain datum,
  about 0.5 m and 0.04 m, so the 1.0 m floor stands above them. Whether their
  floors are higher or there are steps down is not visible.

Issue #55 also uses nonwalkable private fragments and a soil bed. Optional
`face.height` sets a visible wall's top above the base independently of `rise`,
which remains the patio floor level. Omit it when the retaining face meets the
floor as before. `floor: "soil"` uses the soil material and blueprint fill.
Untraced cut ends remain plain faces to floor height, dashed on the blueprint;
they do not acquire the taller boundary-wall height. See
`docs/MIDDLE_POOL_RAISED_PATIOS.md` for the photo limits and estimated extents.
