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

## User clarification: planted frontages beyond the gate

Reinspected full-size IMG_2334 after the owner pointed out the planting along
**both sides of the terracotta street beyond the gateway**. This is an additional
observed arrangement, distinct from the courtyard-side bench/planter and the
short hedge fragment added in this draft. Both frontage strips are visible.

- Photo-right: white rendered raised bed faces run against the houses beneath
  barred openings, with planting above. Their front edges step in/out with the
  frontage. A recessed doorway/threshold interrupts the bed; another planted
  white bed continues farther along the lane. These are not one uninterrupted
  invented enclosure wall.
- Photo-left: a narrower planted strip follows the lane edge, including clipped
  shrubs and long strap-like leaves. The low pale edging is visible in fragments.
  The open leaf masks the nearest part; foliage, the ladder and the cart obscure
  farther parts. Do not substitute a continuous surveyed wall for that partly
  visible planting margin.

Approximate source-space traces below use IMG_2334's actual 1200 × 1600 pixels,
origin top left, +u right and +v down, ordered nearest-to-farthest. They describe
visible image edges, **not map-metre geometry**. Endpoint picks are uncertain by
roughly 5–15 pixels, and obscured connections carry larger unbounded uncertainty.

| Trace | Pixel polyline | Interpretation and limit |
| --- | --- | --- |
| Right nearest bed face, foot at lane | `[[578,744],[552,713],[525,681],[502,654],[477,615],[449,568],[425,541]]` | Main visible raised frontage bed beyond gate. Nearest end disappears behind open right leaf. Stop at doorway interruption. |
| Right farther bed face, foot at lane | `[[404,526],[392,515],[379,507],[372,500]]` | Separate fragment beyond recessed door; far end concealed/narrowed by perspective. Do not connect across doorway. |
| Left planting / tile margin | `[[215,710],[229,662],[240,620],[251,584],[267,549]]` | A rough visible margin, not a fully exposed kerb face. Near continuation behind leaf is hidden; far continuation is occluded by ladder/cart and foliage. |

The source stone-to-terracotta transition is approximately
`[[211,792],[303,794],[398,782],[484,781],[574,775]]`. Its apparent waviness and
occlusion should not be promoted to a precise surveyed gate line. The newly
identified frontage runs lie on the **far/terracotta side** of that transition;
the courtyard bench and foreground hedge lie on the near/crazy-paving side.

In the model's present gate frame, looking out through this gate is positive
`along`; photo-right is positive `across` and photo-left negative `across`. Thus
these new observations would be positive-along frontage fragments, not an
extension of the negative-along courtyard bench/hedge. Calling the sides west/east
is conditional on the current estimated gate orientation and identification.

### IMG_2189 correspondence check

Inspected actual full-size IMG_2189, IMG_2340 and IMG_2244, plus a magnified view
of IMG_2189's distant gateway. IMG_2189 has white beds/planting on both sides of
its lane, but its distant gateway has the **community notice and two blue dog-rule
signs on photo-right**, with a large bird-of-paradise and pool view beyond. Those
specific landmarks strongly associate it with the east-gateway photographs
IMG_2340/IMG_2244. IMG_2340 also shows the matching curved coping profile and the
notice/sign grouping; IMG_2244 corroborates the bird-of-paradise, pool and front
hedge beyond that opening.

The description "flat-headed" is not exact: IMG_2189's distant gateway has a
shallow raised curved coping over a level opening. Nevertheless, the sign group
and pool-side landmarks do not establish correspondence to IMG_2334's curved
double-leaf gateway, courtyard bench and tiled wall. No common bench/tile-panel
landmark can be identified in IMG_2189, and the existing catalogue's Silvia label
is not independent visual proof of a reverse shot. A same-gateway claim is
therefore **unestablished**. The working catalogue may conflate entrances;
conversely, the present east/south distinction must not be taken as proof that
the images are different gateways. The available opposite-side views do not
resolve that identity reliably. Do not mirror IMG_2189's beds onto IMG_2334's map position or
change camera tags/streets without resolving that identity conflict.

For the owner's requested mapping, IMG_2334 alone is sufficient to annotate the
two visible lane-side frontage strips and their interruptions in source space.
It does not supply their concealed ends or exact global lengths.

## User clarification: fixed metal window grilles

Reinspected full IMG_2334 and IMG_2189 after the owner called attention to metal
bars over the windows. IMG_2334 clearly shows a tall fixed dark iron grille over
a shuttered opening on the photo-right frontage beyond the gate, directly above
the raised white planted bed. Its narrow vertical bars and horizontal bands are
separate from the larger foreground gate leaf, which stands open at the threshold.
Vegetation partly masks the grille, so all its ends and bar counts are not traced.

IMG_2189 provides clearer style evidence on both lane frontages: projecting,
partly bowed/cage-like black iron grilles sit outside brown wooden shutters, with
vertical bars, horizontal bands and some ornamental curved metalwork. Their side
returns stand proud of the wall/opening. They are fixed security/window grilles;
there is no supported balcony floor/platform or hinged street gate at these
window positions. Do not substitute a flat balcony rail or repeated open gate
leaf for that architectural feature.

IMG_2189 can support this grille **style**, and the fact that such grilles occur
on both of its photographed frontages. The unresolved gateway correspondence
prevents using it to assign two exact grille positions or symmetric spacing to
IMG_2334's world location. IMG_2334 directly supports its visible photo-right
grille; obscured opposite-side windows remain untraced.

### Final source-relative diagram review

Inspected the updated `lane-planters/lane-planters-map.png` and its
`observations.json` `windowGrilles` records. The purple annotation at source pixel
`[507,393]` points to the actual photo-right window grille behind the foreground
gate leaf. Its schematic marker is above the right frontage bed and attached to
the frontage, rather than drawn as a new gate across the walkable lane. The two
bed treatments, observed doorway interruption and distinction between lane and
stone forecourt remain legible. No mirrored left-hand grille or exact world
position is asserted. IMG_2189 is explicitly a construction/appearance reference.

The schematic remains a source-relative, unscaled account of the observed
arrangement. Its parallel walls, grille projection, repeated planting symbols and
bed lengths are diagram conventions, not traced property geometry or measured
architectural dimensions. The JSON correctly leaves world placement unavailable
and distinguishes direct grille evidence from the style-only reference. This
annotation is suitable for the owner's review and a future bounded build brief;
it supplies no placement approval and makes no change to the current 3D scene.
