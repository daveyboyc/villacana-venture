# Independent source review: outdoor Silvia path

24 October 2026. Reviewer: `/root/forecourt_source_review`, separate from the
implementation author. Baseline: main `e92abf4`. This assessment concerns bounded
outdoor surface corrections, not world-placement approval. No code was edited.

Reopened full IMG_2189, IMG_2334 and IMG_2192, both private area contact sheets,
actual Esri ground image/bounds and the retained zoom-20 mosaic/frame. Read
AGENTS, current area briefs, lane-frontage paving data/module, tunnel placement
and slab/apron integration. Satellite supports general lane/lawn/roof context;
it cannot resolve tile joints or prove the precise tunnel-to-gate connection.
Zoom-20 acquisition date remains unknown; its 23 October date is the fetch date.

## Three different surface arrangements

IMG_2189 shows plain square terracotta pavers aligned along/across the outdoor
lane, with four columns and three internal longitudinal joints, as the owner
previously identified. Grout is conspicuous dull grey/beige mortar, with uneven
weathering, worn/pitted tile surfaces and varied salmon/red-brown tones. The
pale aggregate/mortar edge beside beds and wall bases is separate from the tile
field. This is not the small blue/cream square-insert pattern inside the roofed
Silvia passage, nor a diagonal/hopscotch arrangement.

IMG_2334 corroborates plain square outdoor tiles beyond its curved iron gateway,
including edge cuts, irregular mortar and wet/worn patches. On the courtyard
side, the surface changes to irregular grey/buff stone slabs with the flush
slatted grate. IMG_2192 confirms that stone forecourt between planted edges,
opening to lawn before the pool deck. Keep this material transition rather than
continuing street tiles through the entire pool forecourt.

IMG_2189's distant flat/notice-bearing gateway is not securely established as a
reverse view of IMG_2334's curved double gate. Use it for outdoor material and
column-count appearance, not a calibrated cross-view instance or length. The
provisional west-host tunnel placement and pool-spacing disputes remain open.

## Current model gaps and bounded recommendations

The authored four-column lane surface currently runs from gate-local along
0.15 to 11.4 m. The tunnel entry lies around along 14.62 m, opening sideways to
the lane in the current provisional plan. That roughly 3.2 m station difference
is a model diagnostic, not a measured photographic gap. The uncovered approach
and intervening visible lane should read as one bounded plain-paver surface,
within the existing open corridor and unchanged house/bed/doorway constraints.
Do not infer a longer resort-wide paving network from this correction.

The street apron currently reuses the indoor decorated material. Replace its
outdoor appearance with plain square street pavers and consistent mortar/phase.
The main tunnel slab also extends to local along **-1.25 m**, outside the entry
plane at zero. Swapping only the added apron from -3.65 to -1.25 m would leave
an exterior strip of the indoor pattern. Apply an explicit, estimated threshold
material transition across the current surfaces, while retaining their geometry
and the indoor paving beyond that transition. The photos do not calibrate the
exact transition line in the provisional world frame.

Preserve the existing four-column count where the authored lane supports it.
Row pitch, width taper and grout width remain visual estimates; do not rescale
the houses, move planted beds, close the doorway gap or change collision to
force a preferred tile size. Keep the pool's stone forecourt and tunnel's garden
continuation distinct from this external lane/entry apron.

## Surface visibility check needed

The generic road renderer draws terracotta ribbons at y=.27 and pale edging at
.25. Existing authored lane paving is y=.086 and the separate tunnel apron .051.
The generic ribbon is clipped only within the current bounded paving outline.
A new low surface extending past 11.4 m can therefore be hidden if the visual
mask/material coverage is not extended with it. Check actual first-visible
surfaces across the extension, lane/apron meeting and threshold; a correct
texture atlas alone does not establish a corrected route appearance.

Resolve only the bounded visual material/overlap, preserving existing terrain,
player levels, geometry positions and structural collision. Do not conceal a
missing comparison by moving the gate or tunnel. Final before/after views should
show travel from tunnel to pool, the reverse lane view and the external arch
threshold, plus the plain-tile/stone transition. Implementation/render review
is pending; no measured placement approval is supplied.

## Implementation and actual-app review, 24 October 2026

Reviewed `src/silvia-outdoor-paving.ts`, the lane mesh/ribbon clipping,
`src/slice.ts` apron overlay, the shared paving data, blueprint and reference-pack
change against the full-size sources above. The additional lane sections end at
along 16.2 m; they extend the visual surface and its existing generic-road mask,
without moving registry buildings, beds, the gate, tunnel or collision. The apron
now reaches tunnel-local zero, covering the previous decorated exterior strip
within the existing clear passage. Its extent and the material threshold remain
estimates in the provisional frame. Decorative slab wings beyond the 3.1 m clear
apron lie within the original host footprint at sampled x=±2, z=-1/-0.3; these are
not evidence for widening the outdoor connection or carving more of the house.

Inspected the actual canonical-app `toward-pool` and `outdoor-floor` before/after
pairs (after captures 23:22 and 23:24 UTC), the outdoor atlas and the IMG_2334
source-camera diagnostic pair (after 23:26). The new surface visibly retains four
columns and three internal joints aligned along the lane. Broader grey mortar,
salmon/brown variation, patches and pitting are closer to IMG_2189/2334 than the
previous uniform material. The pattern remains procedural: its four-row wear
repeat, regular joints and smooth colour washes do not reproduce every crack,
edge cut, wet patch or irregular mortar repair in the photos. These are remaining
appearance limits, not a reason to move the surrounding buildings or planters.
The pool-side stone forecourt remains a separate surface in both lane and gate
views. The gate-camera diagnostic is illustrative, not a solved camera match;
its pre-existing facade/planting differences and disputed spacing remain open.

Inspected the implementation author's current `surface-check.json`: first hits
at lane along 11.8/13/14.6/16 are the plain lane surface; tunnel-local -3 hits the
lane, -1/-0.2 the plain apron, +0.2/+2 the indoor patterned slab. The finite garden
path remains visible at 8.6/9.5/10.3. This resolves the earlier risk of a generic
road ribbon hiding the extension at those samples. Reported apron UV interpolation
differences are at most 0.00216 atlas units (about 1.11 pixels in its 512 px atlas),
consistent with the tapered lane approximation. The retained garden/slab seam
delta is below 1e-7. These are renderer diagnostics, not source-measured positions.

The reference-pack change retains the historical model revision and explicitly
records unresolved gateway identity, unmeasured widths and estimated connector
extents. The map adds the same bounded apron with its uncertainty in the title.
The saved source-check artifact reports no source-check failures; the measured
placement gate remains failed, including the new apron and lane surface. No
placement approval is supplied by this material review.

The initial threshold pair was byte-identical before/after and showed only the
interior, so it did **not** verify the exterior/indoor transition visually. A closer
and downward-looking replacement capture is pending; the two lane pairs and gate
diagnostic have no blocking material issue within this declared scope.
