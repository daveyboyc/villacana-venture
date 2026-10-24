# Independent source review: Silvia paving

24 October 2026. Reviewer: `/root/forecourt_source_review`, separate from the
implementation author. Material/UV review only; no placement approval or geometry
edits. Baseline is main `e9f30f2` and the current paving-task checkout.

Reopened full IMG_2190/2191 and enlarged the foreground tile joints, wall border,
pebble inset and garden continuation. Compared the baseline main-app entrance/
garden renders and inspected the tunnel tile texture, floor/apron/path UV code.

## Source pattern and angle

The enlargement changes the earlier shorthand interpretation: the predominant
terracotta units have four straight **square sides**, arranged in an offset
square-and-small-insert pattern, often called hopscotch/windmill. The small
cream/blue decorated squares sit at offset junctions; their rows form slanting
or diagonal runs across the floor. The large red edges broadly follow the
pebble-inset/wall directions in the photographed plane. This does **not** support
simply rotating the old uniform octagon grid by 45 degrees.

Earlier records called these clipped-corner/octagonal tiles. Preserve that
history, but the enlarged source joints support square units with offset small
squares rather than a field of regular octagons. The pattern topology is clearer
than its exact angle or metre pitch; neither photograph supplies a calibrated
floor survey. A procedural square-and-dot layout can create the visible diagonal
runs through offset placement without making every large body a diamond.

The baseline texture instead draws clipped octagons on a regular rectangular
lattice with one repeating insert at each common grid corner. That produces
continuous straight rows absent from the source's offset/T-joint arrangement.
The outdoor four-column square street paving is a separate surface and does not
establish the covered floor's count, topology or angle.

## Colour, joints, borders and continuation

- The source is muted red/brown terracotta with ochre/lighter worn tiles and
  uneven, aged pale-grey/beige grout. A lighter, patched-looking central run and
  mottling add variation; avoid a uniformly bright orange checker surface.
- Small cream/white inserts have varied blue motifs: circular/floral, crossed
  strokes and other ceramic patterns. They are individual accents rather than
  thick continuous white grout bars. Exact artwork need not be copied.
- A narrow irregular pebble/aggregate border runs beside the wall/door threshold,
  particularly clear at the right near door. It is a floor-level border, not a
  new step or a raised curb. Its width and concealed continuation are estimated.
- The separate rectangular inset has dense irregular light/dark pebbles with
  curved/banded variation. The baseline's regular repeated oval/mesh-like pattern
  reads too much like woven material. Preserve its current outline and level
  while changing only its surface appearance.
- Terracotta paving continues through the garden arch between the planting
  edges. The far image is partly obscured and does not trace a complete courtyard
  network, but it supports continuing this finite near surface rather than an
  abrupt plain-brown strip. Preserve the existing garden-path polygon.

Use one consistent local material coordinate mapping across the slab, short
street apron and finite garden continuation; texture scale/orientation should
not jump at their seams. Paint any wall-border/inset effects on the current
surfaces without changing passage footprint, elevation, collision, bed edges,
door thresholds, pool/gate location or provisional world registration.

## Visible garden-path diagnostic

The baseline garden view appears to lose the patterned path beyond the main
slab. The current code does create `silvia-exit-path-fragment` at local y=.052
with floor material and manually assigned slab-consistent UVs. Independently instrumented the actual canonical main scene in memory (no source
file edits) and cast downward rays at the current path centre. At local along
8.5, 9.3 and 10.3 m, the first surface is `silvia-exit-path-fragment` at y=.052;
the generic ground is approximately y=0 beneath it. At 8.3 m the first surface
is the main slab at y=.05. Thus the tested continuation is **not buried** beneath
the generic ground. The plain brown farther view is consistent with the existing
finite fragment ending at 10.55 m; inspect final pixel/UV continuity rather than
assuming an elevation fault. Preserve this bounded cutoff and do not move ground
or alter collision to disguise a material difference.

Final code and actual-app material comparison remain pending.

## Material implementation review

Read `silvia-paving.ts`, floor/apron/path integration and paving data, plus the
updated source-inventory observation. The new atlas uses four-sided large squares
and small inserts on lattice vectors `(4,1)` and `(-1,4)`, with an axis-aligned
17-unit repeat. This reproduces offset junctions/diagonal insert runs without
turning every tile into a 45-degree diamond. The current 0.24/0.06 m ratio and
zero whole-field angle are explicitly estimates; they are not source measurements.

The same metric-coordinate function now maps the slab, apron and finite garden
surface. Geometry outlines, ground heights, placement transforms and collision
rings remain as before. The narrow floor-level pebble overlays are finite to the
existing main wall segments and preserve door-threshold approaches. The retained
T05 observation now records the clearer source reading, with earlier wording
preserved as interpretation history and the old model snapshot still pinned.

Inspected the generated atlas and actual entrance before/after comparison.
The offset red/brown field and smaller varied ceramic accents are visibly closer
to the source than the former regular dot grid. The inset now reads as granular
pebble rather than woven rows. Current motifs, grout/weathering and stone pattern
remain schematic: the source has more irregular joints and localized repairs,
and its pebble inset has curved/banded organization not reproduced by random
scatter alone.

Read the author's runtime surface-check artifact: sampled apron/slab/garden
surfaces are visible above generic ground, and reported seam UV differences are
approximately `2.1e-7` and `8.2e-8`. Those findings agree with the source-code
mapping and this reviewer's earlier independent baseline ray diagnostic. The
artifact was inspected, not independently rerun as a complete software suite.
Final inside/garden close-up review is pending.

### Final actual-render comparison and handedness

Inspected final `inside-floor-after.png` (18:44:58 UTC) and
`garden-floor-after.png` (18:46:16 UTC) against their baseline pairs and the
original full/enlarged photos. The large square units, offset small inserts and
stepped grout junctions now read clearly; diagonal insert runs replace the old
continuous straight grid. Warmer red/brown variation, smaller varied cream/blue
accents and granular inset appearance improve similarity. Wall-edge pebble
strips are visible on the existing floor, with door approaches clear.

The garden close-up exposes the patterned finite continuation and its existing
end at the plain courtyard ground. The visible cutoff is still a bounded model
limit, not evidence of a buried surface. No new tile-scale/phase jump was apparent
between the reviewed existing floor pieces. Their outlines, levels, surrounding
planters and route/collision arrangement remain unchanged.

Checked the possible winding/handedness concern. The readable source foreground
square offsets are compatible with the new atlas/after pattern; a clearly opposed
chirality was not established. Positive texture u follows local photo-left x,
while positive v follows forward z (upward in the view): both canvas directions
reverse in this viewing orientation, so this alone is not a reflection. There
is no source-supported reason to flip only u. Retain the current mapping while
leaving exact whole-field angle and calibrated correspondence unresolved.

No remaining blocking source/material or reviewed UV issue was found for this
paving correction. The schematic motifs, regularized grout/weathering, guessed
pitch and random rather than curved/banded pebble inset remain visual limits.
This scoped outcome does not approve measured world placement or claim an exact
reproduction of the complete garden floor.
