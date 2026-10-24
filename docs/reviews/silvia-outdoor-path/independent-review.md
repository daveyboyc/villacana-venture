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
