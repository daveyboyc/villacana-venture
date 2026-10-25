# Facade kit on every house

The Blender facade kit (`scripts/build_kit.py`, `public/models/`) used to dress only the walls
facing the north pool. It now dresses every house wall long enough for an opening (2.6 m), in
the Details view only. The Layout view is unchanged.

Each `*-before-after.jpg` shows `main` on the left and this change on the right, in Details with
the north, middle, south and main pools loaded:
- `overview`: the whole-resort overview.
- `middle-pool`: first person at the middle pool's south gate, looking north across the pool.
- `cervantes`: first person on Calle Miguel de Cervantes, looking down the lane.
- `cervantes-phone`: the Cervantes view on a 390 × 844 screen.

`scripts/kit_views.cjs <outdir>` renders them and measures draw calls and frame time.

## What comes from photos, and what is generated

| Source | Walls | Parts |
| --- | --- | --- |
| Traced from IMG_2204–2206 (`data/facade_kit.json`, task `facade-kit-traced`) | 12 | 30 |
| Generated | every other house wall of 2.6 m or more | 2,480 |

No other photo station has a solved camera yet (`data/photo_poses.json`), so nothing outside
the north pool is traced. The generated parts are generic:

| Part | Count, desktop |
| --- | --- |
| Arched shutter doors | 998 |
| Rectangular shuttered windows | 728 |
| Narrow arched windows | 517 |
| Iron balconies | 218 |
| Wooden balconies | 49 |

These counts include the 30 traced parts.

The generator puts one opening every 3.1 m, as the flat shutters did. It skips the same openings
the shutters skipped:
- shared walls
- the Silvia passage
- the traced middle-pool lane frontages

Ground floors get doors, shuttered windows or arched windows. Upper floors get balcony doors with
iron balconies, or windows. On some walls without a porch there is one wooden balcony.

Where the porches (`addPorches` in `src/slice.ts`) already hang a balcony, the kit adds only the
door onto it. An earlier run put a second balcony over the porch's balcony, which showed on
Cervantes.

## Cost

Draw calls are counted per frame by wrapping WebGL's draw functions. Frame time comes from the
headless software renderer (SwiftShader), so it only compares one run with another. The same view
varied by up to 15% between runs of the same build.

| View | Draw calls, before → after | Software frame time, before → after |
| --- | --- | --- |
| Whole-resort overview | 5,605 → 5,594 | 1,888 → 1,692 ms |
| Middle pool | 2,239 → 2,285 | 1,454 → 1,502 ms |
| Cervantes | 2,068 → 2,112 | 1,441 → 1,651 ms |
| Cervantes, phone | 1,543 → 1,532 | 940 → 818 ms |

What keeps the cost down:
- **Cells.** The parts go up in 80 m cells, one `THREE.LOD` each, so frustum culling skips the
  houses out of view. This adds about 50 draw calls in a walking view.
- **Distance.** Beyond 120 m from a cell's middle, its doors and windows become one flat quad
  each in their own colour, and the balconies drop out. That is one draw call per cell. The
  overview is therefore a little cheaper than the textured flat shutters it replaces.
- **Shadows.** Only balconies cast shadows. Doors and windows stand 3–7 cm proud of the wall.

Before these three changes, the first resort-wide run measured +30–75% frame time against
`main` (2,705 ms on the overview).

At full detail the kit is about 1.5 million triangles if every cell were near at once. A walking
view only draws the near cells, and frustum culling drops more.

- **Download size:** no new assets. The five parts are 242 kB together, and only parts that are
  used are fetched.
- **Phones:** on small screens (`max-width: 700px` or `max-height: 500px`) only the 12 traced
  walls get the kit, as in the pilot. Everything else keeps the flat shutters, so phones fetch
  and draw almost nothing extra.

## Still wrong

- **Almost all of it is generated.** The pattern (openings every 3.1 m, hashed choice of part)
  is a plausible Andalusian village, not these houses. Tracing other areas needs solved photo
  cameras there first.
- **Generated balconies and wooden balconies may be on walls that have none.** The north-pool
  check (`docs/reviews/facade-kit-traced`) found invented balconies on generated walls in
  IMG_2205 and IMG_2206.
- **Porch overlap is approximate.** The porch rule is copied (length, spacing, open ground at
  1, 2.5 and 4.5 m), not shared. Where a porch is skipped for another reason, such as route
  clearance or a canopy, the kit still puts a balcony door there with no balcony.
- **Storey heights are the model's,** 3 m a floor. The laser survey has single storeys about
  0.7 m higher (`docs/reviews/lidar-levels`).
- **Far quads are plain.** They have no arch or surround; at 120 m and beyond they are a few
  pixels high.
- **Surfaces are untouched.** Retexturing the walls, roofs and paving is open as task
  `retexture-surfaces`.
- **No placement claim.** This is a materials task. It changes no footprint, collision or ground.
