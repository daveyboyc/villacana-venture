# Independent source review: tunnel entrance context and pool-gate spacing

23 October 2026. Reviewer: `/root/forecourt_source_review`, separate from the
implementation author. This assessment does not grant placement approval or
close any existing gate/tunnel discrepancy. No geometry was edited.

## Sources inspected

Reopened full 1200 × 1600 public copies of IMG_2190, IMG_2191, IMG_2334,
IMG_2335 and IMG_2189, plus IMG_2192 as a useful view back toward the pool.
Inspected private middle-pool and seaward-lanes contact sheets, actual
`public/map/ground.jpg` (1792 × 1792) and `ground.json` bounds, current registry
building/pool rings and road axes, and the existing private Google satellite
lane-name screenshot and Apple top-down south-half screenshot. Read the area
briefs, AGENTS, prior gate/tunnel reviews and current gate/placement data.

Private map/screenshot pixels are not included in this report or committed.
Temporary aerial-only and aerial/model overlays remain in `/workspace/scratch`.
The independent Esri ground image was assessed using its existing bounds, not a
locally warped alignment. No new calibrated controls or placement packet were
established in this review.

## Two distinct entrances

**IMG_2190/2191:** the signed Silvia 1–15 roofed passage has a flat ceiling,
thick arched portals and impost mouldings, side entrance recesses, a hanging
lantern, patterned terracotta paving with small cream/blue inserts, a separate
pebble rectangle and potted shrubs. IMG_2191 shows the sign, high vent and low
AGUA POTABLE hatch on its right side. The latest owner instruction supplies the
single brown door/round gold knob interpretation for the model. The far arch
opens toward dense garden planting and a narrow continuing paved path; there is
no visible middle-pool gate, pool water, tiled wall bench or blue/yellow panel
that would join the scenes unambiguously.

**IMG_2334/2335:** a different, unroofed gate/forecourt assembly has two open
iron leaves under a shallow curved rendered head and sparse metal pergola ribs.
A raised planted wall, recessed seat with low plinth, tall tiled panel wall and
cypress-like planting sit on its courtyard side. The forecourt is irregular
stone, with a flush slatted grate. The lane beyond the gate has square terracotta
courses, planted facade borders and barred windows. The bench is embedded in
this planted wall; it is not an independent bench to move separately from the
wall/panel and gate.

IMG_2189's distant notice-bearing gateway remains an uncertain counterpart to
IMG_2334's curved double gate. Its previous lane/address association and similar
plants/grilles do not prove a reverse-view identity. Neither should be used to
force a new connection to the Silvia covered passage.

## Does satellite evidence show the gate/bench too close to the pool?

The concern is worth retaining, but **these inspected sources do not establish
a measured translation away from the pool**.

IMG_2334 points away from the pool, and IMG_2335 is a close view of the seat;
neither includes both gate/bench and pool water as ground anchors. IMG_2192 is
helpful: the forecourt's recognizable grate, curved planted wall/plinth and
opposite hedge open into a lawn area before the pool deck. Thus the photographed
assembly does have a paved approach and lawn/deck buffer. It is not placed
against the water's edge. Perspective, planting occlusion and unmeasured grate/
opening sizes prevent extracting a reliable new metre spacing from that photo.

All inspected aerials show the southern pool lawn and approach corridor between
the surrounding building blocks. They corroborate the overall buffer/order.
They do **not** expose a uniquely traceable gate head, bench recess, panel wall
base or planter ends at ground level: canopy foliage, cypresses, deep building
shadow and roof projection obscure those small features. The private Apple view
helps distinguish the roof/lawn arrangement, but it is also not a trace of the
hidden gate/bench. A visible roof edge is not the ground-level portal line.

The current Esri georeferenced scale is about 0.24 m per pixel. Blur and
roof/foliage displacement are substantially larger than one pixel; a roughly
1–2 m local working uncertainty remains reasonable for broad context, not an
approved gate tolerance or confidence interval. Gate identity/endpoints remain
an additional unresolved issue, so sharper-looking roof corners cannot remove
that uncertainty.

## Quantitative diagnostics of the current model

These numbers are **model-to-model distances**, not source measurements or a
relocation recommendation. They use the current gate frame and nearest segment
of the registry pool-water ring; they do not measure the outer pool deck/fence:

| Model point | Map east/south position, metres | Nearest pool-water ring distance |
| --- | --- | --- |
| Gate centre | `[-126.480,103.850]` | 7.58 m |
| Bench front centre | `[-128.822,102.703]` | 6.49 m |
| Bench back centre | `[-129.206,102.938]` | 6.79 m |
| Planter courtyard-side end centre | `[-129.377,101.988]` | 5.90 m |

The model already includes a 5 m bounded crazy-paved forecourt inside the gate,
with the bench about 1.7–2.7 m back along that forecourt. Those are existing
estimated dimensions; the aerial does not verify their exact ends. The nearby
roof-corner pair `[-126.84,108.03]` and `[-124.08,106.29]` lies roughly 3.4 m
farther along the lane than the gate when their midpoint is projected on the
current axis. This is useful for checking the suspicion that the gate lies too
far toward the pool, but these are separate roof corners, not identified gate
piers or a confirmed common ground-level opening. **Do not adopt that 3.4 m as
a measured correction.**

The approximate integrated Silvia tunnel entry `[-121.79,118.12]` is about
15.02 m from the gate centre in the current plan. It opens sideways/southwest
into a separate host courtyard, rather than sharing the gate's south-going lane
axis. That separation describes the current candidate only. Its west-host
assignment and compass-direction disagreement remain open, so it cannot be
used as an independent anchor to reposition the pool gate.

## Supported entrance-context work and limits

The photos support refining the covered entrance's local plaster/arch reveals,
impost and belt mouldings, right-side plaque/vent/hatch, terracotta pots and
irregular broad-leaf shrubs, patterned paving and pebble inset, plus bounded
planting/path-edge fragments at the far garden opening. Keep the passing route
open. The study's exterior street apron is an estimated model connection, not a
fully photographed external courtyard footprint.

Do not transplant the gate's irregular stone forecourt, bench, blue/yellow panel
or metal gate into the covered Silvia entrance. Conversely, do not replace the
gate's shallow pergola head with the tunnel's solid flat-ceiling volume. Keep
lane-side planted beds/window bars separate from the courtyard bench planter.

A gate/bench relocation should move the coherent assembly only after its actual
portal line or planter base is identified relative to a reliable ground anchor.
A top-down source where those bases are visible, or an exterior ground photo
showing both this gate/bench and a recognizable pool/deck corner, would provide
the missing evidence. For this pass, improve supported bounded details and
retain the existing placement discrepancy rather than inventing an exact shift.
Actual final renders still need review after the author makes the detail changes.

## Focused Esri zoom-20 cross-check and frontage transplant

Inspected the newly fetched zoom-20 mosaic and its enlarged close-up under
`/workspace/scratch/tunnel-satellite`, with `zoom20-frame.json`. The raw mosaic
is 768 × 768; its bounds imply approximately 0.12 m per pixel. The 1000 × 1300
close-up is a crop/enlargement, so the mosaic bounds must not be applied directly
to its resized pixel coordinates. The finer view clarifies the south lawn,
branching stone paths and planted mass at the lane mouth. Foliage and roof shadow
still hide the gate/bench bases, so it does not supply a reliable new portal line
or a defensible measured displacement. The 23 October value is the fetch date;
image acquisition date is unknown. This is another Esri zoom, not a separately
identified independent imagery provider or survey.

Independently read the prior PR108 draft data and complete frontage module from
`/workspace/villacana-venture`. It retains the three unequal planted fragments,
the open doorway approach at local along 7.55–8.6 m, rectangular projecting bars
and lane-aligned four-column paving. All use the current gate's provisional
frame, while grille attachments use existing registry facade segments. This
preserves the explicitly unresolved source/world registration rather than
establishing where every photographed frontage instance belongs. IMG_2189
remains appearance/count evidence, not a securely registered reverse view.

Checked the proposed bed and grille rings against the currently integrated
Silvia tunnel transform using polygon intersection and segment distances. In the
gate frame, the tunnel entry is approximately `[along 14.621, across 3.442]`.
The far lane bed ends at along 11.4. None of the three bed rings intersects the
current tunnel approach, main floor or ordinary wall envelope. The far bed is
about 1.67 m from the mapped clear approach/floor rectangle and 0.58 m from the
source study's wider 5.3 m floor slab; the far grille ring is about 0.94 m from
that slab. Thus the transplant has no direct geometric overlap with the current
tunnel candidate. These clearances are model diagnostics, not new photographic
lengths. Final visible plant extents and procedural-opening suppression still
need checking in the actual transplanted scene.

Tall narrow cypress-like foliage and smaller round-leaf/geranium-like plants
inside the existing bench planter are directly supported by IMG_2334/2335.
IMG_2192 also shows a small pale service cabinet beside the curved planted wall
near its courtyard end. A bounded generic cabinet can follow that observation;
its exact dimensions, text, utility identity and world anchor are not resolved.
Do not infer pipes, a new doorway or a longer wall from this cabinet fragment.
Keeping the gate/bench frame fixed while adding these observed bounded details
is consistent with the present lack of measured relocation evidence.

## Actual detail implementation review

Inspected the transplanted current frontage data/module, `middle-south-planting.ts`,
gate/collision/map integration, and four actual-app before/after pairs refreshed
approximately 11:31–11:32 UTC: gate from pool, bench, lane toward pool and tunnel
approach. Rechecked IMG_2334's gate ironwork at enlarged source resolution.

The new beds, white kerbs, rectangular projecting grille planes and lane-aligned
four-column surface read clearly in the actual lane/gate views. The separate
right bed fragments preserve the doorway break. The tunnel-approach view retains
the existing arch, single brown leaf with round knob, pots and patterned floor;
the lane draft does not overlap it. Current diffs leave the gate/bench, pool and
tunnel transforms unchanged, so these details do not purport to settle the
spacing concern. Procedural frontage suppression is locally bounded.

The bench view now has columnar evergreens and smaller round-leaf plants on both
sides of the tiled wall. These plant types and the seat/planter relationship are
source-supported. The implementation uses a finite per-plant horizontal radius
with the shared route-clearance guard. Geranium leaf and flower extents fit their
stated guard radius; cypress radial bounds are likewise explicit. The render
report lists all two cypresses and three geranium-like plants present, none
omitted. No visible route obstruction was identified. Independently ran
`python3 scripts/check_lane_frontages.py`: PASS. Full browser/layout regression
was not independently rerun in this review.

The cabinet is a thin pale vented face on the existing planter end; its dimensions
and attachment remain estimated, with no added structural opening, utility
identity or concealed pipework. The reviewed forward/bench cameras do not expose
its face well enough to claim an independent close visual comparison. Planting
is stylized: smooth stacked cypress lobes and schematic geranium foliage differ
from the photographed dense irregular leaves. Tile-panel artwork and surrounding
procedural facades also remain schematic rather than exact source replicas.

One new source discrepancy was reported to the author: the first gate curls were
placed at approximately 0.41–0.75 m above the base, below the existing middle
crossrail. IMG_2334's decoration occupies the central ornamental band between
crossrails, rather than the near-bottom portion of the leaf. Raise/rework this
bounded schematic motif before treating the added scroll detail as source-aligned;
exact curled/diamond metalwork geometry is still not reproduced by simple loops.
No other critical clipping or new bounded-detail discrepancy was found in the
reviewed captures. The previous location/direction and gate-spacing limitations
remain open, and no placement approval is granted.

### Final detail snapshot

Rechecked the refreshed gate capture (11:36:17 UTC) and bench capture
(11:37:49 UTC), plus the revised modules. The author moved the gate decoration
to a bounded mirrored S-scroll motif at approximately 0.8–1.35 m, correcting the
reported low placement. It remains schematic metalwork rather than an exact
copy of the source ornament. Cypresses now use one rough tapered faceted capsule
canopy each; the prior stacked-lobe seams are removed in the actual images.
Their taper/roughness stays within the existing guarded horizontal radius.

No further critical fidelity, clipping or route-clearance issue was identified
for the reviewed bounded detail changes. This outcome concerns the source
component types and reviewed implementation, not the hidden cabinet face, exact
plant species/artwork, global gate/bench spacing or the unresolved tunnel host
and direction. Existing placement reports remain open; no measured relocation
or placement approval is supplied.

Also rechecked the final lane-to-pool capture refreshed at 11:39:07 UTC. The
straight projecting bars, separated raised bed, open central route and four-column
paving remain legible; the corrected cypress silhouette appears beyond the gate.
No new clipping issue appeared. This forward lane view is illustrative and does
not resolve its correspondence with IMG_2189 or the pool-spacing concern.
