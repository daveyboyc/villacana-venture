# Independent source review: planters at the Silvia entrances

24 October 2026. Reviewer: `/root/forecourt_source_review`, separate from the
implementation author. Baseline assessed: main `9735d00` and the task checkout.
This is source assessment for bounded additions, not placement approval. No code
or source geometry was edited.

## Actual sources inspected

Reopened full 1200 × 1600 images IMG_2190, IMG_2191, IMG_2192, IMG_2334 and
IMG_2335. Enlarged IMG_2190's garden opening and the opposite forecourt hedge
bases in IMG_2192/2334 to distinguish pots, kerbs and hidden wall edges. Also
inspected adjacent IMG_2242 and IMG_2184 and private middle-pool/seaward contact
sheets. These adjacent photographs supply construction context, not proven
identity with the Silvia portal.

Reopened actual `public/map/ground.jpg` with its bounds, the retained Esri
zoom-20 768 × 768 mosaic/frame, and private Apple top-down south-half and Google
satellite lane-name screenshots. Read AGENTS and both area briefs, current gate/
tunnel/frontage data and modules, plus baseline main courtyard/gate renders.
Private source pixels and enlarged inspection crops stay outside the public repo.

## Covered Silvia portal: pots versus structural beds

IMG_2191 clearly shows a terracotta pot and saucer below the Silvia plaque.
IMG_2190 shows the other foreground pot and a pair of smaller terracotta pots
near the garden arch. These are movable containers on patterned paving, not
raised masonry planters. Keep those four observed containers; do not replace
them with continuous built-in beds or infer a tall wall wrapping the entry.
The visible entrance pier/skirt in IMG_2191 is part of the plaster architecture,
not proof of a planted enclosure outside the frame.

The important missing structural content is **beyond IMG_2190's far arch**.
Photo-right contains low pale kerb/edging, planted ground pockets and strappy-leaf
plants. The edge changes direction in short angled pieces and curves around a
tree-base island farther along the path. A broad source locator is approximately
`[550,740,715,860]` in the 1200 × 1600 image; it is not a complete bed trace.
The visible edge is much lower than the pool bench planter. Soil/ground planting
behind this edge must remain distinct from the near terracotta pot.

Photo-left at the garden exit is more heavily hidden by the potted shrub,
hedges and arch. It supports at most a short bounded edge/ground-planting fragment
where visible. It does not support mirroring the longer right-hand bed or
tracing a full left courtyard boundary. Keep the centre path open and continue
only the short visible paving context. Do not turn an apparent hedge crossing
in perspective into a wall across the passage.

Baseline `silvia-tunnel.ts` has the four near/exit pots plus two illustrative
`garden-left-fragment`/`garden-right-fragment` tall clay containers; the latter
are not established as pots by IMG_2190. Baseline courtyard renders show a bare
high-walled void and simple ground, without the source's low garden kerbs/soil
pockets. Replace the unsupported tall background containers with bounded garden
planting rather than adding yet more pots. A low right edge and short occluded
left fragment are defensible local studies; their model lengths, widths and
roughly low-kerb height remain estimates rather than photo measurements.

## Pool entrance: raised bench bed and opposite low kerb

IMG_2334/2335 establish the existing raised white bench planter: tall evergreen
and smaller round-leaf plants, rounded wall returns, a recessed seat and low
plinth below the tiled panel wall. IMG_2192 shows its curved courtyard end and
small pale cabinet. The baseline already has this bed, bench/panel, plants,
cabinet and three street-side frontage fragments. Those existing items should
not be presented as newly discovered or duplicated around the tunnel.

The bench bed is still simplified into rectangular boxes. Source-supported
refinement is to round the exposed returns, distinguish a white rim from soil
and retain planting within that bed. Keep the original outer box extents,
bench recess, cabinet end and gate frame when making this bounded refinement;
the photographs do not calibrate a new outward footprint or longer planter.
The opposite hedge is a different lower planting edge, not a matching raised
white bench bed.

Enlargement resolves a previously less obvious feature: **the opposite pool
hedge does have a low weathered grey/beige kerb with a vertical face** beside the
stone paving. It is clear along the image-right edge of IMG_2192 (broad locator
`[880,1090,1195,1570]`) and image-left base in IMG_2334. Leaves overhang it. This
supports a bounded low edging strip under the existing hedge fragment, with
soil/ground planting behind it. An illustrative height on the order of 0.1–0.2 m
would be a modelling choice, not a measured dimension. Do not extrude a tall
white mirrored planter or infer the concealed back/outer bed boundary.

The existing mapped Eva crossing interrupts the drafted hedge band. If route
clearance requires an edging gap, record that as a model constraint, not evidence
that the real hedge/kerb stops there. Do not route a new solid kerb across the
protected passage or relocate Eva to hide the conflict. The bench planter,
opposite low kerb and lane-side facade beds are three distinct arrangements.

## Satellite contribution and remaining limits

The aerials corroborate the pool lawn, branching approaches, planted masses and
roof/courtyard layout. They do not expose the small portal kerbs, bench returns
or hidden ground-level planter bases well enough for a measured perimeter. Esri
zoom 19 is about 0.24 m/pixel and the zoom-20 mosaic about 0.12 m/pixel from their
frames, but foliage, shadow and roof projection dominate identification error.
The zoom-20 fetch date is 23 October; acquisition date is unknown. A second zoom
from the same provider is not an independently identified survey.

Retain the provisional tunnel west-host transform and all pool/gate positions.
The earlier tunnel heading/opposite-host ambiguity and the owner's pool-spacing
concern remain open. No visible source joins the covered Silvia garden exit and
the curved pool gate into one calibrated perimeter. Do not close the main
courtyard hole or surround it with a speculative repeated planter wall.

## Recommended bounded build and review scope

1. Preserve the four clearly observed tunnel pots and open side approaches.
2. Add the asymmetric low garden edges/soil/strappy planting beyond the garden
   arch: longer angled right fragment, much shorter occluded left fragment.
3. Refine the pool bench planter's exposed rim/returns within current extents.
4. Add only the observed low grey-beige hedge-base edging at the pool forecourt,
   retaining required route gaps and the existing bench/doorway openings.
5. Keep structure, map and collision consistent. Sample each added outline and
   visible planting footprint against the host courtyard hole and shared routes.
   The low-height appearance alone does not justify a route-blocking footprint.

Final actual-app before/after renders should show the tunnel garden exit, the
signed portal mouth, pool forecourt from both directions, and the bench returns.
Those comparisons can review the bounded new source forms without claiming
measured world placement. Implementation/render review is pending.

## Implementation review and left-edge uncertainty correction

Inspected the new planter helper, entrance-bed data/module, map/collision
integration and actual tunnel-entry/garden and pool-entry/return captures, plus
the first IMG_2334 after render. The first draft kept four observed pots,
introduced asymmetric low garden beds, added the low pool hedge kerb and rounded
the bench-bed corners inside the old boxes. The right garden rim/soil and pool
rim/return refinements are legible in the actual images, without a visible
through-route obstruction. Independently ran
`python3 scripts/check_entrance_planters.py`: PASS for that draft. The helper's
leaf ribbons remain within their declared plant radii; the actual main-scene
callback transforms those radii to the shared protected routes. Structure, map
and collision use the same bed rings.

A closer source-locator review found an important uncertainty. The original new
T16 target `[574,785]` pointed to the **right-hand tree-island edge**, while its
box also included the left pot and central path. It did not establish a separate
left built-in bed. The small pale glimpse around `[450,831]` behind the left pot
may be an arch-base/plinth or a garden edging return; the pixels do not confidently
settle that identity. T15's original target fell in the potted shrub; a better
clear right-kerb target is around `[655,837]`. A14's target also needed moving
from paving toward the clear hedge-base kerb around `[28,900]` in IMG_2334.
These are source locators, not measured traces.

The author accepted the correction: remove the proposed left closed kerb/soil
and its collision, retain only a finite Details planting fragment for visible
left-side greenery, and keep T16 identity uncertain/unassessed. This addresses
the source concern while preserving the directly supported right bed and pool
kerb. It is more cautious than inferring a separate masonry bed from the earlier
partly occluded glimpse. The four actual pots and provisional transforms remain.
Final affected-view/code recheck is pending the refreshed captures.

The new T15/T16/A14 rows must remain separate additions with unassessed status;
they do not revise the historical PR108 model snapshot or grant placement
approval. The original host/direction and pool-spacing disputes remain open.

### Final scoped outcome

Rechecked final `tunnel-entry-after.png` (17:58:08 UTC) and
`tunnel-garden-after.png` (17:58:53 UTC), current data/modules, and corrected
T15/T16/A14 source-locator records. The garden view now shows one clear right
low kerbed bed with exposed soil, and only greenery on the left: the unsupported
left closed kerb/soil is gone. Left planting has zero height/wall, is absent from
solid rings and receives a faint dashed map region rather than a structural
bed outline. T16 explicitly leaves the pale-return identity unresolved.
The four observed terracotta pots remain; the two unsupported tall background
clay containers are removed.

The pool-entry, bench and source-camera IMG_2334/2335 after renders were also
inspected. Low grey-beige edging sits beneath the opposite hedge; the bench bed
has bounded rounded returns and exposed white rim/soil inside its former outer
boxes. Bench, cabinet end, pool, gateway and tunnel transform are retained.
No new critical clipping or route obstruction was identified in those images.
The pool-return view is mostly unchanged context and offers limited evidence of
the added beds.

Independently reran the revised `check_entrance_planters.py`: PASS. This reviewer
did not rerun the complete build/layout suite. No remaining blocking issue was
found for the reviewed **bounded, approximate planter additions**. Plants,
artwork and material finish remain stylized; the dense full garden/tree layout
and hidden bed edges are not reconstructed. The original tunnel host/direction
and pool-spacing concerns remain unresolved. These observations neither grant
measured placement approval nor establish a complete garden perimeter.
