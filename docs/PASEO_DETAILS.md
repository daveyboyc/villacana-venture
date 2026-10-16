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

Immutable pre-change archive: `/workspace/issue-49-baseline` (git archive of
starting HEAD, with dependencies symlinked). Compare Details in baseline and
updated trees from **IMG_2352**, `--pool=main --details`; IMG_2350, IMG_2354 and
IMG_2349 provide supporting viewpoints. Baseline contains no new detail data.

Source verification passed: all twelve standard source checks plus the new
`check_paseo_details.py`, photo assignment and its ten tests, reference check,
TypeScript and production build. Root integration owns before/after camera
renders and both browser regressions; these are pending. Queue remains
`in-progress` until those checks and visual review are complete. No claim of
photo fidelity or surveyed lamp spacing is made from source/build checks.
