# Independent source review: middle pool south forecourt

Reviewer: Codex source-review agent `/root/forecourt_source_review`, separate from
implementation author. Date: 21 October 2026. This is a source assessment, **not a
placement approval**. No completed measured packet or final render was available
for this initial inspection.

## Sources actually inspected

- Full-size `public/photos-ref/IMG_2334.jpg` and `IMG_2335.jpg`.
- Private `villacana-reference/contact-sheets/middle-pool.jpg` for contextual
  orientation only; the public photos above were inspected separately.
- Actual `public/map/ground.jpg` (1792 × 1792), its `ground.json` bounds and a
  magnified south-courtyard crop, both with and without current route overlays.
- `public/map/skeleton.json`, existing south-gate data, area brief and placement
  policy. Registry and route coordinates are comparison inputs, not surveyed
  confirmation of the photographed path edges.

## What the photographs establish

IMG_2334 looks out through the south gateway into the terracotta lane. Irregular
buff/grey stone paving runs continuously from the gate under the camera; there is
no lawn strip or terracotta crossing visible in that photographed foreground. The
threshold is level to visible precision. The photograph's left side has a tall
clipped hedge, while the right side has a white planter and recessed tiled bench.
The drain is within the stone paving, inward from the gate. IMG_2335 corroborates
stone paving beside the bench, with the seat and low plinth projecting from the
planter. These support a bounded material correction and optional clipped hedge.
They do not establish the hidden forecourt end, complete hedge footprint, all
planter ends, exact pavement width, or a five-metre surveyed length.

The photographs are perspective views without supplied camera calibration. Gate
opening and tile sizes in the current model are estimated scales. A distance read
from them inherits those assumptions; it cannot serve as independent calibrated
metre registration.

## Common map frame and route discrepancy

The existing aerial's global georeference is used without local warping:
`x = -332.27 + u * 430.36 / 1792`,
`z = -98.38 + v * 430.37 / 1792` (+x east, +z south).
The current gate centre `[-126.48, 103.85]` projects to aerial pixel
`[856.90, 842.06]`. Approximately 0.240 m per pixel describes raster sampling,
not source accuracy.

The aerial shows a narrow curving path from this southern entrance northwest into
the pool courtyard, between planting. Shade, roof projection and foliage obscure
its exact borders. It is adequate context for the entrance arrangement, not a
complete ground-corner trace. The existing Calle Eva/Silvia meeting point
`[-128.04, 101.3]` is local `along=-2.99 m, across=0.00 m` relative to the gate.
A straight hedge spanning this junction would obstruct an existing protected
route. Preserve route clearance; do not infer a physical hedge across it or move
routes simply to accommodate a guessed hedge. The named route lines are
approximate navigation axes and their terracotta rendering is not evidence of
actual forecourt paving.

## Bounded recommendation and open limits

A roughly 5 m surface inside the gate can be represented as an explicitly
estimated fragment tied to the unchanged gate frame; it should cover the current
crossing's material where photographed, without moving gate, bench, planter,
registry buildings/pool, ground levels or route axes. The current 2.12 m paving
width is also an estimate. Do not extend walls or planting beyond what is visible.
Hedge placement must remain Details-only and respect full visible-footprint route
clearance. Any interruption to preserve the approximate Eva route should be
reported as an unresolved conflict, not claimed as photographed.

Horizontal placement remains unapproved: the sources do not expose all proposed
polygon vertices/hedge ends, nor three non-collinear ground controls and two
held-out landmarks spanning features for a complete measured packet. Preserve the
existing south-gate photo discrepancy and keep the geometry task unfinished until
those limits are resolved. An improved photo diagnostic alone does not resolve
that placement history.

## Final render review

Inspected both committed `IMG_2334-before.png`/`IMG_2334-after.png` and
`IMG_2335-before.png`/`IMG_2335-after.png`, then rechecked them against the actual
full-size source photos above. Also inspected `overlay.svg`, `alignment.json`, the
current forecourt/hedge data, `src/middle-pool-south-gate.ts`, the road-surface
clipping in `src/boundaries.ts`, and the map drawing in `src/blueprint.ts`.

The after renders show a concrete improvement: the stone patch now continues
inside the gate across the previously drawn terracotta junction, the drain is
visible within it, and an east hedge fragment appears next to the open gate.
Bench, panel, planter and gateway retain their prior arrangement. Clipping removes
visual route paving only within the shared forecourt rectangle; the route axes
and collision remain unchanged. The map uses the same forecourt frame. I found no
new implementation error in the inspected clipping or bounded data changes.

These are third-person estimated-camera diagnostics with a player, high oblique
view and broad field of view, rather than the source camera's framing. They cannot
support a calibrated photographic match. Remaining visible differences include:

- IMG_2334's foreground has a continuous tall hedge on the left. The after scene
  adds only a short gate-side fragment and retains the large open Eva junction,
  nearby lawn, generic walls and beds. The intentionally unbuilt continuation is
  an unresolved arrangement, not a confirmed hedge gap.
- The straight rectangular stone patch terminates abruptly in the foreground.
  Neither its endpoint nor all four corners are exposed by the source photos or
  aerial; the 5.15 × 2.12 m model extent remains an estimate. The aerial shows a
  curve toward the courtyard that this fragment does not claim to reconstruct.
- The procedural stone texture is visibly schematic, with more regular/angular
  joints than the varied natural stones in IMG_2334. Colour and wetness differ.
  The tile panel is likewise schematic and planting behind the bench is absent.
- IMG_2335 confirms stone beside the bench, and the new scene now displays it,
  but its wide view does not independently verify the bench, gate and panel
  dimensions or positions.

The author's alignment report correctly supplies the one aerial transform and
model dimensions while leaving source residuals, controls and held-out landmarks
unavailable. The overlay correctly distinguishes current registry ground outlines
from a roof trace and labels the patch as estimated. No independent full-vertex
measurement can be inferred from those drawings.

Recommendation: retain this as a reviewable **draft improvement**, leave the
existing photo discrepancy and geometry task open, and withhold placement
approval. No `placement-verified-by` attestation or approval packet is supplied by
this review. A follow-up needs independent visible boundary/route evidence and a
complete measured packet, rather than a new positive diagnostic alone.
