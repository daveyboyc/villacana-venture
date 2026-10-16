# Issue #49: optional paseo details

`data/paseo_details.json` records bounded wall-relative details observed in
IMG_2349, IMG_2350, IMG_2352 and IMG_2354. `src/paseo-details.ts` adds them
only when Details is selected. Layout, wall geometry/collision, pool/building
footprints, routes and terrain are untouched.

Observed: clipped low hedges behind the mesh, short opaque green windbreak runs
with uncovered mesh above and beside them, slim white shafts with shallow flat
lamp heads, and the square brown-grey service cover set into the pink pavement.
Hedges and cloth are restricted to the photographed western/south-pool frontages;
there is no repeated fill along the remaining wall. Map positions, sizes and
span endpoints are estimates, not subject coordinates inferred from camera GPS.
Cloth sits just behind the existing mesh so both surfaces remain legible.

Every volumetric piece uses the shared decoration-clearance guard with its
entire visible horizontal bounding radius, including the lamp head. Short cloth
pieces avoid falsely treating a long fence panel as a circular obstacle. Lamps
remain at the photographed wall-foot side: those failing route clearance are
omitted, rather than relocated to an unsupported garden position. The square
cover is a horizontal plane, not a solid or raised prop: it deliberately lies in
the walk with no obstructing volume and is tagged `flushRouteSurface`. It adds
no collision. Geometry clipping may leave gaps where the protected route reaches
a proposed detail; final integrated browser/render review must inspect that.

## Lamps rechecked after the paseo retrace (issue #35, PR #64)

The retrace puts the paseo centreline 1.5 m seaward of the wall face with a 3 m
protected width, so the route's landward edge is the wall face itself. The lamps
were re-read from the photos:

- **Where they stand.** On the stamped paving, not on the wall or coping: each
  white shaft rises from a small square base plate set on the pavement against
  the sandstone foot (IMG_2352 and IMG_2350 close up; the next lamp's base shows
  at the top of IMG_2354). The flat head reaches out over the walk.
- **How far out.** A perspective read of IMG_2352 (camera about 1.55 m up,
  vanishing point of the wall foot and timber edge) gives a paved width of about
  2.9-3.0 m at the lamp and the shaft centre about 0.15 m seaward of the wall
  foot; the shaft is about 3.5 m with a head about 0.65 m long. IMG_2350 against
  the sea horizon gives about 3.0 m of paving.
- **Result (issue #49).** The paving stays 3 m wide, but along the wall run the
  protected route is now the clear walk beyond the lamps: `route.clear` in
  `data/paseo_wall.json`, 2.2 m wide, from about 0.8 m off the wall face to the
  timber edge. That clears each shaft and its overhanging head (the guard counts
  the head's furthest corner), so all four lamps stand at their photographed
  spots. Off the wall run the full 3 m paseo stays protected. The skeleton
  carries the three protected pieces as `seafront.paseo.protect`, which
  `src/slice.ts` hands to the shared guard; `check_paseo_details.py` reruns the
  guard in Python over the same routes and fails if a placed lamp blocks.

Renders from IMG_2352 and IMG_2354 (`--pool=south,main --details`) are in
`docs/reviews/issue-49/`.
