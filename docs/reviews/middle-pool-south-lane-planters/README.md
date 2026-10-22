# Entrance lane frontage build

The owner asks to build the mapped planted borders and projecting window grilles.
Full-size IMG_2334 and IMG_2189 and the middle-pool contact sheet were inspected.
Before renders use the existing corrected cameras/subjects in Details mode.
IMG_2334 shows low planting on the left, white raised beds under right-hand
window bars, and a recessed doorway interrupting the right bed. Existing renders
lack these frontage beds and infer generic ground doors where grilles are needed.
IMG_2189 supplies grille style only: a reverse-view identity is not established.

## Pre-build bounds and discrepancy record

[proposal.json](proposal.json) declares the five planned feature fragments.
[proposal-overlay.svg](proposal-overlay.svg) compares those provisional bounds
with actual registry ground outlines and retained navigation axes on one unchanged
Esri frame. [alignment.json](alignment.json) retains its global transform/hash,
model bounds and limitations. No local warp or fabricated controls/residuals are
used. The aerial cannot independently identify all hidden ground corners.

The east/left registry facade begins at local along 3.33 m, across -0.775 m;
the retained route occupies ±0.6 m and Details adds 0.15 m margin. There is no
space for a believable planted strip beside that house without entering it or
blocking the route. The left build is therefore a bounded 0.35–2.9 m near fragment,
0.42 m deep with a 0.18 m kerb. Its obscured continuation stays unresolved.

On the right, the actual west frontage spans across about 2.49–2.61 m, then
2.21–2.32 m past its offset. Provisional raised beds fit outside those unchanged
solids: near run 0.35–7.55 m, then a 1.05 m open gap, then a separate 8.6–11.4 m
fragment. Bed heights, widths, offsets and endpoints are estimates from the
opening/tile scale and registry constraints, not independent surveyed tracing.

Two shutter/grille fragments mount on the two retained facade segments. Their
midpoints coincide with procedural ground-door locations; those inferred ground
openings are locally suppressed. They are replaced explicitly by brown-shuttered
windows with projecting black grilles, without cutting/moving building geometry.
Window position/size, bar count and bow depth are estimated. The far source
opening is partly obscured. Do not mirror new grilles onto the uncertain left side.

Planter outlines will be shared by map, 3D and collision. The doorway approach
stays empty; no door leaf or invented enclosure is added. Planting remains
Details-only and uses the existing full-footprint route guard. House/pool rings,
street axes and terrain remain unchanged. The task remains in progress until
required measured placement review is available; source comparison alone is
not approval under [PLACEMENT_VERIFICATION.md](../../PLACEMENT_VERIFICATION.md).

## Built result and source comparisons

- [IMG_2334 before](IMG_2334-before.png) / [after](IMG_2334-after.png): both
  lane-side bed types now appear beyond the gate, with planted right frontage and
  two bowed grilles over brown shutters. The left run is intentionally short;
  the source shows more frontage than the current house/route frame can support.
- [IMG_2189 before](IMG_2189-before.png) / [after](IMG_2189-after.png): captures
  from the retained camera are diagnostics only. This photo supplies grille
  construction, not proven reverse-view placement of this gate.
- [Close before](lane-close-before.png) / [after](lane-close-after.png): the
  actual app and existing camera controls, looking through the entrance at the
  right bed and projecting cages. This is a readable construction preview, not
  a source-camera calibration. The doorway gap separates the near and far beds.

Reproduce the close pair with `scripts/review_lane_frontages.cjs --as=after`;
`REVIEW_ROOT` selects the baseline checkout for `--as=before`. It uses
`laneAt(2,0)` looking to `laneAt(8.5,1.5)`, a 1200×900 viewport, wheel -1200 and
a vertical pointer drag of -90 px. No hidden scene replacement or pose claims.
The original matched-camera pairs use `scripts/shoot_views.cjs` with Details.

The new grilles attach to actual registry face segments and use their true
outward normals. They have a brown louvre texture, separate white surrounds/sill,
bowed uprights, four horizontal rails/returns and small schematic paired curls.
No new opening is cut into a house; only the two overlapping, procedurally inferred
ground doors are suppressed. Plants are crossed cards from existing original
atlases and fallbacks. Their y-only stretch leaves the guarded x/z extent intact.
No private source picture becomes a product texture.

Planter fronts/soil are separate meshes; solid collision uses the exact outer
bed rings used by the map. The right bed offsets and separate far fragment are
not a repeated enclosure template. The doorway has no new blocking door/gate.
Grille projection stays over the bed, outside the protected through route.

## Validation and limits

The production build, all fifteen applicable source checks, fifty assignment/
index/placement-policy tests and full layout regression passed. Layout traversed
20 routes both ways over 432 segments without runtime errors. Added checks cover
bed map nodes/collision, doorway traversal, along-lane traversal, plant footprints,
explicit procedural-opening replacement, and grilles visible from the lane.
Overview and photo-map regressions also passed, including mobile views and all
176 indexed sources. These checks were rerun after merging current main
`65ba8a7`, preserving the separately built Guillermo ramp, pool stairs and
seafront frontage. Before captures retain baseline `c472f7a`; after captures were
refreshed on the combined build. Full outcomes are in [validation.txt](validation.txt).

The placement change gate withholds approval for the five new features and
conservatively fingerprinted shared renderer dependencies. No policy is weakened,
discrepancy deleted or reviewer identity invented. Existing original building,
pool, street and terrain inputs are unchanged. See
[independent-review.md](independent-review.md) for actual source/render assessment.
This is a built draft, with the geometry task **in progress** pending defensible
global source registration, hidden-edge resolution and measured placement review.
