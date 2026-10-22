# Independent source review for the entrance reference-pack pilot

Reviewer: Codex source-review agent `/root/forecourt_source_review`, separate from
pack author. Date: 22 October 2026. Worktree: `villacana-reference-pack`.
This reviews observed source content and grouping; it is not geometry
implementation or placement approval.

## Sources inspected

Actual full-size public web copies IMG_2334, IMG_2189, IMG_2190, IMG_2191,
IMG_2185 and IMG_2187 were inspected, with a magnified lantern/gate detail from
IMG_2185. The AGENTS instructions, reference index/area brief, photo-map workflow
and current passage inventory were read. Photo content establishes component
existence and ordering within each image; it does not supply calibrated world
positions, concealed boundaries, complete passage lengths or surveyed dimensions.

## Keep four source groups separate

| Group | Direct observations | Connection limit |
| --- | --- | --- |
| IMG_2334 entrance scene | Open double gate; curved white head; stone forecourt/drain and courtyard bench/tiled panel; terracotta lane beyond; low left planted margin; higher right frontage beds interrupted by a doorway; fixed right window grille | Existing south-gate model/camera is a provisional association, not a measured photo-to-map registration. |
| IMG_2189 street appearance | Terracotta street with four principal tile courses; planted frontages; brown shuttered openings with fixed metal cages; wall lanterns/climbers; distant sign-bearing pool gateway | Style/appearance reference. Its distant notices and bird-of-paradise resemble IMG_2340/2244. Do not claim a secure reverse shot of IMG_2334. |
| Silvia tunnel, IMG_2190/2191 | Covered white passage and explicit `CALLE SILVIA 1 15` sign | The sign identifies this photographed entrance/range; no exact global entrance footprint or link to the pool gate is established. |
| Jorge tunnel, IMG_2185/2187 | Repeated covered arches and explicit `CALLE JORGE 27 35` sign | This is a separate signed entrance/range. Do not transfer its far fanlight gate or longer arch sequence into Silvia. |

The sign tiles use spaces between the numbers; “1–15” and “27–35” are readable
range labels, not a claim of a photographed hyphen. A plan/elevation must label
itself source-relative/unscaled until map anchors are established. No concatenated
plan should silently place all four groups on one continuous measured lane.

## Tunnel component checklist

### Silvia: IMG_2190 and IMG_2191

- Thick white rendered entrance arch and arched garden-side exit; their visible
  surrounds and horizontal impost/return mouldings.
- A flat plaster ceiling over the covered bay. An arch opening does **not** imply
  a continuous barrel-vaulted tunnel roof.
- White wall piers/projections and horizontal belt/ledge detail; shallow door
  thresholds and window sills where visible. No stair flight inferred here.
- Dark paneled/louvred double service/entrance doors on both sides in IMG_2190;
  distinguish these solid door leaves from fixed barred windows.
- One clearly visible hanging dark lantern in IMG_2190, suspended from the ceiling.
  More lamps may be concealed/cropped; do not copy Jorge's visible count into it.
- Terracotta/octagonal main floor tiles with small blue/white decorative square
  inserts at cut corners, plus a separate central rectangular pebble-pattern inset.
- Terracotta pots and dense broad-leaf plants on both sides, with further plants
  at the exit; keep their visible floor footprints outside the usable passage.
- `CALLE SILVIA 1 15` blue/white wall tiles in IMG_2191, a small high wall vent,
  and the low pale service hatch labelled `AGUA POTABLE`.
- A planted/garden exit visible beyond the far arch in IMG_2190. No far metal
  gate can be confidently identified in that Silvia image.

### Jorge: IMG_2185 and IMG_2187

- Thick white rendered entrance arch and further arch openings in sequence, with
  horizontal impost bands and projecting wall piers/returns.
- Flat ceiling bays between the arches; do not turn the arch profiles into a
  continuous vaulted roof without additional evidence.
- Four hanging lanterns visible along IMG_2185's centre line (the distant pair
  were inspected enlarged). Their count in this view is not a metre spacing rule
  or a transferable count for all passages.
- Large dark paneled double door on the near right, further recessed openings,
  and a fixed projecting grille over a right-side window. These are separate
  inventory types and should not all be represented as hinged gate leaves.
- Terracotta/octagonal floor with small blue/white corner inserts; at least two
  distinct rectangular pebble-pattern floor insets are visible along the run.
- Large terracotta pot/broad-leaf plant near left, palm-like planting farther
  along, pale floor planters with spiky plants on the right and smaller pots
  nearer the far end. Hidden pots/plant counts remain unknown.
- `CALLE JORGE 27 35` blue/white sign in IMG_2187 and a low service hatch, whose
  lettering is not independently legible enough here to label `AGUA POTABLE`.
- Far dark metal pedestrian gate with a radial/fan-shaped upper grille in
  IMG_2185, with bright landscape/sea visible beyond. This belongs to this
  pictured Jorge sequence; it is not the square window-cage construction or the
  foreground double pool gate in IMG_2334.

## Street/forecourt components must remain distinct

The outdoor four-course square terracotta grid in IMG_2189, and compatible but
partly cropped/occluded paving in IMG_2334, must not replace the tunnel's
terracotta/octagonal tiles with small decorative inserts. The foreground
crazy-paving forecourt and its drain are another material/feature group.

The owner corrected the window-cage form to square rectangular projection and
four lane tile courses on 22 October. Earlier catalogue phrases such as “bowed”
and the earlier rounded draft are historical readings, superseded by that
correction. Fixed window cages, balcony rails, open entrance gate leaves and a
fanlight pedestrian gate require distinct component IDs and annotations.

## Inventory and rollout requirements

For each pictured component, record direct source IDs, source-space marker/trace,
what it shows, limitations and occlusion, current model feature ID (if found),
model snapshot and separate existence/comparison/placement states. A citation or
an indexed photo is not proof the pictured component was built. A likely registry
passage or material mask is not proof of an arched entrance, ceiling, side doors,
lanterns, pots or signs.

The inspected main-branch `data/passages.json` only lists Elena and northern
registry walk-throughs, while the seaward area brief cites patterned-floor masks
from IMG_2185/2190 with estimated extents. That supports checking a specific
missing-tunnel backlog; it does not prove any signed Silvia/Jorge entrance has
already been matched or built. Current draft geometry at snapshot `51b75f5`
should be inventoried by its own features/screenshots, separately from main.

Roll out by independently identified area/source group. First inventory actual
visible structures and omissions, then establish map anchors and passage topology,
then bounded geometry/collision, then materials/props and matched-view comparison.
Do not propagate decorative arrays or a single tunnel template across the resort
as a substitute for tracing. Concealed ends and disputed source associations stay
open. No independently measured placement packet is supplied by this review.

## Rendered pack review

Inspected `data/reference_packs/entrance.json`, all six generated source SVGs,
`plan.svg`, `elevation.svg`, and the supplied rendered tunnel/drawing viewer
screenshots. Independently overlaid the exact annotation coordinates onto the
actual source pixels to assess locators and traces. These checks identify source
content and annotation errors; they do not calibrate or approve world geometry.

The initial pack preserves the four source groups, labels A/B/T connections
unresolved and keeps Jorge's fanlight gate separate. The tunnel inventory clearly
separates flat ceiling, arches, walls, floor, exit, side doors, lantern, pots,
plaque and services. Four-course street paving and clipped-corner tunnel paving
remain distinct. `structure-unmapped` is appropriately scoped to missing dedicated
source-registered components, not proof that all generic architecture is absent.
The current-model comparison is labelled as a separate draft snapshot, rather
than live main. The window elevation preserves the owner's corrected rectangular
cage form.

Findings sent to the pack author before changes:

1. **IMG_2191 T10 locators need correction.** The service-hatch box at
   `[926,1354,1065,1540]` points at the solid arch pier, not the actual pale
   `AGUA POTABLE` hatch. The partly visible hatch is approximately within
   `[714,1380,835,1560]`. The high vent is approximately
   `[738,395,790,465]`; the original `[704,350,758,445]` box mostly misses the
   slats. These are visual locator suggestions, not precise perimeter traces.
2. **IMG_2191 T01 is not a reliable source-edge trace.** Its polyline cuts
   through the ceiling to the left of the actual inner arch edge for much of
   the curve, then continues past the visible impost. Convert it to a locator
   or re-pick exposed edge fragments; do not claim the current line is a traced
   architectural outline.
3. **IMG_2190 T04 should not imply a complete exposed boundary.** Its coarse
   chords and right-jamb extension cross or extrapolate partly obscured areas.
   Use a locator or stop the source trace at genuinely visible crown/edge
   fragments. Planting cannot establish the concealed exit jamb/footprint.
4. **Jorge is still only a partial component inventory.** IMG_2185 visibly has
   a fixed projecting right window grille and multiple potted-plant groups,
   but the initial four Jorge rows do not inventory/locate those. J02 bundles
   lamps, door and floor; it does not cover the grille or pots. Add comparison
   rows/locators, or explicitly label that group's inventory as incomplete.
   The claim that every visible opening has its own row also needs narrower
   wording while rows bundle multiple openings or types.
5. **The relationship plan omits A05.** Add the courtyard-side bench/tile panel
   beside the stone forecourt/right of the gate, separate from the lane-side
   right bed. Its source annotation and current-model inventory already exist.
6. **Model-state scope can be clearer.** T05's `material-only` state has a model
   feature ID but no revision; identify the inspected revision. B01/B03's
   positive appearance states refer to style/count exemplars implemented in
   A's draft, not proof that B's photographed left/right instances were built.
   Their existing unknown text helps; keep that distinction explicit in the
   positive-state wording. De-duplicate evidence IDs that repeat one source
   for multiple locators; repeated observations are not independent sources.

These findings do not invalidate the source-group design. They are corrections
needed before accepting this pilot as a reliable annotated component pack. Final
revision review is pending the author's fixes; no source/placement approval is
implied by this initial review.

### Final corrected pilot review

Reinspected the corrected 41-component `entrance.json`, schema, all six rendered
source-sheet PNGs, the plan/elevation PNGs and final viewer/drawing previews.
Compared revised locators and component labels with the actual full-size source
photographs already inspected. No implementation files were edited by this
reviewer.

The six initial findings are addressed:

- T10's vent and service-hatch locators now identify the actual visible slats
  and partly exposed `AGUA POTABLE` panel. They no longer identify the blank
  arch pier as a service hatch.
- T01/T04 use locators rather than asserted arch-edge polylines through ceiling,
  vegetation or hidden jambs. Their uncertainty remains explicit.
- Jorge's fixed window grille, potted plants, paired door and patterned-floor
  details now have separate J05–J08 records and corresponding locators. The
  earlier bundled J02 is scoped to the lantern sequence. The fanlight gate
  remains J03 in the separate Jorge source group.
- Silvia's left and right doors are separately T06 and T11. T12 records the
  plaque-photo door with unresolved duplicate identity, explicitly preventing
  an unsupported additional world doorway. B07/B08 and A13 similarly expose
  recessed openings and the farther bed as separate observations.
- A05 is present beside the courtyard forecourt/right of the gate in the
  unscaled plan, distinct from lane-side planting. The drawing remains a
  relationship schematic, with no connecting A–T route asserted.
- T05's material-only citation is revision-pinned. B01/B03 are comparison-only,
  with explicit style/count-exemplar scope and no claim that B's pictured
  frontage instances were built. Evidence IDs are de-duplicated. The pilot
  wording no longer claims a complete per-instance building survey.

The revised source sheets, component inventory and representative form drawings
are acceptable as this **bounded source-reference pilot**. No remaining major
source-identification error, accidental joining of source groups or unsupported
built/placement claim was found in the inspected corrected artifacts. The locator
boxes are intentionally broad discovery aids, not complete perimeter traces;
labels can be toggled to inspect the underlying small details. Plan/elevation
symbols and repeated bands are schematic conventions rather than calibrated
architectural dimensions or a full 3D reconstruction.

This outcome accepts the corrected inventory/annotation/drawing scope only. It
does not establish the exact passage footprints, concealed endpoints, duplicate
opening identity, A/B reverse-view correspondence or A/T physical connection.
It does not certify live-main geometry or change any prior placement discrepancy.
The measured-placement process and actual geometry review remain necessary before
these references authorize a new world build.
