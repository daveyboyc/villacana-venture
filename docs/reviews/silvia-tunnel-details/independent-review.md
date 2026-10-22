# Independent source review: Silvia passage details

Reviewer: Codex source-review agent `/root/forecourt_source_review`, separate from
implementation author. Date: 22 October 2026. This review concerns a photo-relative
build preview requested by the owner. It grants **no global placement approval**.

## Source inspection and opening count

Reopened actual full-size `public/photos-ref/IMG_2190.jpg` and `IMG_2191.jpg`,
then enlarged the farther left/right side openings in IMG_2190. Read AGENTS,
the reference-pack workflow and the existing T01–T12 component records.

IMG_2190 directly shows two clearly readable dark paneled/louvred paired door
sets: one on the near left and one on the near right. They are two openings/four
leaves, not four separate entrances. Their frames and thresholds are visible;
the leaves sit relatively close to their surrounding wall faces.

Farther toward the garden arch, one narrow shadowed side opening/recess fragment
is visible on each side behind projecting white piers. The fragments have dark
vertical strips and brown ledge/threshold-like edges, but the photograph does not
expose their full height, leaf construction, back walls or depth. Pixels alone
cannot confidently determine whether these partially hidden spaces are windows,
recessed doorways or another opening arrangement.

The owner's new clarification identifies the side spaces as recessed entrances
with brown doors and authorizes guessed recess depth and generic wooden door
construction. Record that interpretation as **owner-confirmed**, distinct from
the parts directly resolved in the photograph. A bounded draft can therefore
represent the two clear paired sets plus the two side entrance recesses with
generic closed door panels at their backs. Do not call all four door bays
photographically measured or expose invented private rooms behind them.

IMG_2191's door beside `CALLE SILVIA 1 15` remains a potential duplicate of one
of the near paired sets; its source-local record is not a reason to add a fifth
world opening. Keep that identity uncertainty explicit.

## Estimated recess depth and form

A nominal **0.6 m setback** is a reasonable owner-authorized illustrative choice
for the two side entrance recesses, with roughly 0.4–0.9 m serving only as a
plausible modelling range. Neither the nominal value nor that range is a
calibrated source measurement or uncertainty interval.

Do not apply the same deep setback to every visible door. The near paired doors
have shallower visible frames. The farther recesses should have white wall
returns/piers, an open side approach, a brown wooden door at the back, and a
shallow threshold where represented. Preserve the main passage's clear route;
no source supports a flight of steps or private interior layout here.

“Door at each end” in this build must refer to the back of each side recess,
not closing the axial entrance arch and garden exit. Both axial openings remain
through-open in the depicted scene. The Jorge fanlight gate and its longer arch
sequence remain separate source-group evidence and must not be transplanted.

## Other source details to preserve

- Thick white arched openings, white piers and impost/belt moulding.
- Flat plaster ceiling behind the arch; no invented continuous barrel vault.
- Terracotta clipped-corner floor with small blue/white inserts, distinct from
  the four-course square outdoor street grid; separate rectangular pebble inset.
- One clearly visible hanging lantern in IMG_2190, brown/dark doors and shallow
  thresholds, terracotta pots and broad-leaf planting alongside a usable centre.
- The Silvia 1 15 sign, high vent and low `AGUA POTABLE` hatch in IMG_2191.

The new recessed-entrance components should receive their own numbered source
locators/owner-clarification records. Source-visible fragments, owner-confirmed
identity and estimated model dimensions must remain separate fields/claims.

## World location and preview limits

Silvia sign evidence identifies the photographed entrance range. It does not
calibrate a registered passage footprint or resolve the connection to the pool
gate/street scene. A canonical-app photo-relative preview can make the proposed
construction reviewable without assigning it an invented resort-map position.
It must label itself accordingly and leave global identity/placement reports
open. Passed scene/collision tests cannot grant horizontal placement approval.

## Actual build review

Reviewed `data/silvia_tunnel.json`, `src/silvia-tunnel.ts` and the refreshed
actual-app captures `entrance-after.png`, `interior-after.png`,
`source-study-after.png`, `right-recess-after.png`, `plan-after.png` and
`photo-comparison.png` (22 October, approximately 11:29–11:31 UTC). This is a
source/code/visual review; software checks were not independently rerun here.

The draft now represents two near paired door sets and two farther single-door
recesses. The latter are the owner-confirmed interpretation of the shadowed
fragments, not additional doors established from complete photographic outlines.
The data records this distinction and labels all dimensions estimated. The near
setbacks are 0.32 m and inner setbacks 0.65 m. Those are modelling choices, not
measurements. The actual geometry includes white side returns, soffits,
thresholds and a closed brown back leaf. Both axial arched openings remain open.
The plan cutaway makes the four bays and clear centre visible.

An initial source-side mirroring error was reported to the implementation author:
the plaque/services appeared screen-left while the source has them on the right
when looking into this view. The refreshed renders correct that. The local frame
now explicitly uses positive x toward photo-left and positive z into the passage;
there is no world-map transform. The plaque, hatch and vent occupy the source-right
wall. Earlier horizontal stacks of leaves have also been replaced by varied
leaf angles, clustered rosettes and woody branches; the refreshed captures show
the correction.

The flat ceiling, white piers/arched portals and mouldings, one hanging lantern,
brown doors, terracotta patterned floor with blue/white inserts and a distinct
pebble rectangle follow the visible component types. No Jorge fanlight gate has
been introduced. The comparison overlay explicitly states that the photo and
model cameras differ and concealed doors/depths are estimates.

No further blocking discrepancy was identified for this **photo-relative draft**.
It is not a calibrated reconstruction: passage proportions, opening positions,
heights, camera and recess depths remain estimated. Generic panel/vent/handle
forms on concealed leaves are owner-authorized inventions. Plant forms, plaster,
wood and paving are stylized; the pebble inset remains more regularly patterned
than the photograph. The two exterior plant fragments provide context but do
not reproduce the dense garden or establish its layout. Neither this review nor
the cutaway grants placement approval or resolves connection to the pool gate.

## Additional inner-recess source locators

For IMG_2190's 1200 × 1600 source copy, the following broad pixel boxes identify
visible fragments rather than complete door traces:

- **T13, source-left inner recess:** approximately `[382, 545, 447, 797]`;
  label target near `[410, 623]`.
- **T14, source-right inner recess:** approximately `[789, 551, 850, 803]`;
  label target near `[819, 638]`.

Keep the three claims distinct in the reference records: observed partly
occluded side opening; owner-confirmed recessed entrance with brown door;
estimated depth and concealed back-leaf construction. Do not extrapolate these
boxes into source-visible full-height outlines.

## Final snapshot recheck

Rechecked the refreshed `interior-after.png` (11:35:55 UTC) and
`right-recess-after.png` (11:36:19 UTC), current component data and T13/T14
reference records. The wider interior preset and square-on recess preset make
the wall returns, soffit and generic back leaf easier to review. Reduced plaster
bump, paired-door centre seams and the updated scene-local planting route guard
do not introduce a new source discrepancy. The source-right plaque remains on
the right and the axial garden arch remains open.

T13/T14 now correctly separate observed occluded fragments from the owner's
entrance identification and permission to estimate. Their `structure-unmapped`
status and study-only representation do not claim a resort-map placement. The
0.65 m depth is still explicitly a guess. No further blocking issue was found in
this final snapshot; the source/camera/material/garden and placement limits above
remain applicable.
