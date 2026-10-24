# Silvia paving correction

Owner reports that the Silvia path/ground does not look like the photos, with
its diagonal pattern missing. Baseline is main
`e9f30f2dc57d0113d3680ba662b6f063d2c009ce` (PR116).

Reopened full IMG_2190/2191, area references and the actual deployed/main-app
floor. Close inspection changes the earlier interpretation: the large red tiles
have four square sides. They are offset around smaller blue/cream decorated
squares, whose successive positions form diagonal runs. A regular octagon grid
or rotating the whole field 45 degrees would misread the visible joints. Earlier
clipped-corner wording remains as history; the source inventory/tag now records
the corrected square-and-dot/hopscotch observation.

The new original procedural material uses a 4:1 large/small square lattice with
translations (4,1), (-1,4), repeated seamlessly every 17 insert units. Large edges
stay broadly aligned with the walls/inset, while inserts step diagonally. The
.24/.06 m pitches and exact angle remain estimates, not a calibrated survey.
Blue/cream floral/geometric motifs are varied schematic drawings, not copies of
individual ceramic artworks. Worn/mottled terracotta, pale grout and irregular
pebbles replace the previous uniform bright grid and woven-looking inset.

One metric UV function supplies the existing slab, street apron and bounded
garden path, preserving scale and phase at their joins. Narrow pebble bands sit
beside existing wall fragments and leave doorway thresholds open. Their .11 m
width is estimated. Central inset dimensions, floor extents, garden beds, tunnel
transform, route/registry outlines, levels and collision are retained. The
four-column exterior street paving is separate and unchanged.

## Source and render evidence

`independent-review.md` records independent full-source inspection and final
scoped visual review. `paving-atlas.png` is the generated texture in plan;
`entrance`, `inside-floor` and `garden-floor` before/after PNG pairs use identical
actual canonical-main-app bookmarks and pointer look-down motions. They are
illustrative first-person comparisons, not calibrated photo matches. Before uses
the unchanged PR116 worktree. The source's precise camera/host registration and
complete garden layout remain unresolved.

`surface-check.json` samples actual main-scene downward rays and texture UVs.
The garden path is already above generic ground through local z10.3, so no ground
height change was needed. The plain brown area beyond it is outside the finite
z10.55 path cutoff; it does not establish a photographed remote garden floor.
Seam samples at z-1.25 and8.425 agree within floating-point tolerance. The test
also finds all six finite wall-pebble bands and no browser runtime errors.

The task stays in progress because exact placement has no fresh measured packet.
This material/source correction does not approve the provisional tunnel host,
hidden path boundaries or pool spacing. Final software outcomes are recorded in
`validation.json`; the placement gate output is retained separately.

## Concurrent main update

Main PR117 (`e0e9278`) added an optional solved-photo-camera mode while this
material pass was in review. Its code, queue tasks and north-pool findings are
preserved; generated graph/reference files were regenerated after merging it.
TypeScript/production build,60 Python tests and the actual-scene paving check
were checked on the combined code. This task does not create or claim a solved
Silvia camera: the normal first-person comparisons remain illustrative.
