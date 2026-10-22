# Independent source review: lane-side beds and window grilles

**Historical assessment:** the bowed-profile interpretation below is corrected by [corrective-review.md](corrective-review.md), following the owner's 22 October source correction. This earlier report remains as history and grants no approval.

Reviewer: Codex source-review agent `/root/forecourt_source_review`, separate from
implementation author. Initial source inspection: 21 October 2026; final render
review: 22 October 2026 (recorded below). **No placement approval**.

## Actual sources inspected

- Full-size `public/photos-ref/IMG_2334.jpg` (1200 × 1600) and `IMG_2189.jpg`.
- Actual `public/map/ground.jpg` (1792 × 1792), its bounds and a magnified crop
  showing the southern courtyard entrance and lane between adjoining roofs.
- Unchanged registry building rings and Eva/Silvia route axes in
  `public/map/skeleton.json`; current gate frame in
  `data/middle_pool_south_gate.json`; shared route-clearance implementation and
  procedural shutter generation in `src/slice.ts`.
- The earlier source-relative frontage diagram and its pixel observations, plus
  area brief, AGENTS instructions and placement policy.

The aerial's single georeference is
`x=-332.27+u*430.36/1792`, `z=-98.38+v*430.37/1792` (+x east, +z south).
Roof projection, shade and foliage conceal narrow bed boundaries and wall feet.
This source does not expose a complete measured bed trace or grille locations.

## What the photographs establish

Looking out through the gate in IMG_2334, both sides of the terracotta lane are
planted. Photo-left has a narrow low pale border with mixed grasses and shrubs,
partly hidden by the open leaf, ladder, cart and foliage. Photo-right has a higher
white rendered frontage bed beneath barred openings, with coping/face projections
that follow the house frontage. A recessed door interrupts that run; a farther
bed fragment is separately visible. Do not mirror the two sides or fill the
observed door break with a wall or hedge. Neither source fixes concealed ends,
exact bed depth/height, or the doorway's map-metre station.

The right frontage in IMG_2334 includes a fixed black projecting window grille
above the bed with brown shutters behind it. Vertical bars and horizontal ties
are visible. The foreground open gate leaf is a separate object. IMG_2189 shows
bowed/cage-like fixed grilles, with side returns and some ornamental curves,
above planting on both of its frontages. It is useful construction/style evidence;
it does not prove a second grille position on IMG_2334's obscured left frontage.
There is no balcony floor or hinged street gate at these window positions.

IMG_2189's distant sign-bearing gateway and bird-of-paradise view strongly match
IMG_2340/IMG_2244. Its relationship to IMG_2334's opposite-side gateway remains
unresolved. Camera labels and existing gate placement do not settle that identity.
Use IMG_2189 for grille style only; do not transfer its frontages to world
coordinates as a calibrated reverse view.

## Existing frame and clearance constraints

Local `along` is positive out through the current gate along the lane; `across`
is positive toward photo-right. The gate's world centre is the existing estimated
`[-126.48,103.85]`, with forward `[0.5216197630,0.8531780722]`. It is retained as a
working model frame, **not a confirmed photographed ground anchor**.

Current street centre is approximately `across=0`, with width 1.2 m. The shared
Details guard requires at least `0.6+0.15+visibleRadius` metres from that axis.

The east/negative-across registry frontage starts at local
`[along=3.334,across=-0.775]` and trends to `[26.123,-0.532]`. Thus near the first
corner there is only about 0.025 m between that wall and the guarded corridor,
even before any plant radius. Farther along there is still less room. An east
bed at `across<=-0.8` beyond `along=3.334` would be **inside the original house**;
it must not be added there and then described as a real frontage strip. Do not
move a route, shorten the protected width or overlap the registry building to
make a source-looking bed fit.

The west/positive-across frontage has room outside the route:

- First long face spans local `[3.379,2.488]` to `[8.018,2.605]`.
- Next face spans `[8.039,2.207]` to `[13.070,2.318]`.

These identify model attachment constraints and setbacks. They do not establish
photographed window/door locations or bed extents.

## Conditional bounded draft recommendations

A limited draft can preserve both the original footprints and routes:

- East/left: restrict any near-gate low fragment to roughly `along=0.35..2.9`,
  `across=-1.22..-0.80`, **before** the registry house begins. Check every actual
  outline vertex and the full plant footprint. Its absence of a confirmed
  supporting facade/continuation must remain explicit; do not call it an exact
  traced frontage. Farther east-side beds cannot be accommodated against the
  existing facade without resolving the route/building/source disagreement.
- West/right: a bed fragment around `along=3.6..7.6`,
  `across=1.65..2.38`, remains outside the current registry face. A separate farther
  fragment around `along=8.6..11.0`, `across=1.50..2.10` respects the next frontage
  projection. Leaving an opening around `along=7.6..8.6` is a **draft doorway
  station**, not a measured photo-to-map trace. Stop where evidence/space ends;
  no repeated beds down the whole lane.
- Right grille: attach a bounded projecting cage to the actual west-facing model
  facade above the raised bed, with explicit brown shutter backing and side
  returns. Use the facade normal rather than an arbitrary floating cage position.
  Width, height, bow/projection and station remain estimates. Ensure the visible
  projection stays over the bed/outside the route.

These are suggestions for a physically compatible model fragment, not independent
source measurements or placement approval. The source arrangement and the current
world frame still disagree in ways this restricted build cannot resolve.

## Procedural opening caution

`addShutters` currently generates the first west frontage's ground opening at
local approximately `[5.699,2.506]`, world `[-125.645,110.020]`. Its hash is about
0.2727, so it is rendered as a generic **door**, not a window. The next long face's
opening at local `[10.555,2.223]` is also classified as a door (hash about 0.2105).
Those are procedural choices, not photographed entrances. Do not quietly cage a
rendered door and then claim the photo's window was reproduced. A localized
photo-backed replacement/suppression of the inferred opening is appropriate if
building the observed window there, with the real observed doorway break retained
as an explicit separate gap. Generic facade features under a new bounded feature
should not leave duplicate shutters, rails, porches or doors visible through it.

## Approval and remaining work

A complete placement packet would need independently identifiable exposed ground
corners/controls and held-out landmarks, full represented vertices and defensible
uncertainty. These sources do not provide those for the proposed beds/grille.
Maintain unfinished task status, preserve existing discrepancies and obtain final
source-versus-render diagnostics. Do not create a `placement-verified-by` edge
from this report, estimated camera views, or passing movement checks.

## Final render review

Final review performed 22 October 2026. Inspected actual
`IMG_2334-before.png`/`IMG_2334-after.png`,
`IMG_2189-before.png`/`IMG_2189-after.png` and
`lane-close-before.png`/`lane-close-after.png`, then compared with the full source
photographs. Also inspected `data/middle_pool_lane_frontages.json`,
`src/middle-pool-lane-frontages.ts`, ground-opening suppression in `src/slice.ts`,
shared map drawing in `src/blueprint.ts`, bed collision integration through
`middleSouthRings()`, the proposal overlay and `alignment.json`.

The new build is visible and materially addresses the requested observed details:

- A short, lower planted border appears on photo-left beyond the gate. It stops
  before the constrained east registry frontage rather than overlapping the
  house or protected route.
- A higher white rendered bed with hedge appears on photo-right, with an offset
  in its front face and a separately represented farther fragment. The declared
  doorway approach between the two stays empty; neither a wall nor a hinged
  gate is inserted in that gap.
- The close after view clearly shows two black projecting/bowed grille cages
  over brown shutter backing on the right model frontage. Their side returns,
  vertical bars and horizontal bands read as fixed window grilles, separate
  from the foreground gate leaf. No balcony platform is invented.
- Only the corresponding inferred ground openings are suppressed; upper
  openings remain. The prior generic ground doors no longer show underneath
  the two new window assemblies. The cage fronts face out from the retained
  building surfaces into the lane and remain above the beds/outside the route.
- Bed rings are shared between map, visible 3D shells and structural collision.
  Optional planting uses the existing full-footprint guard. The reviewed data
  do not alter the registry rings, route axes or terrain.

The original high third-person IMG_2334 pair hides much of the new grille fronts
at a steep side angle. The additional close view, reproducibly captured through
existing app camera controls, resolves that readability issue. It is a useful
build inspection, not an estimate of the source camera's calibration.

Remaining source/model discrepancies are substantial enough to retain draft
status:

- IMG_2334 shows a planted strip following the left house frontage farther down
  the lane. The build includes only the near 2.55 m fragment, because the
  unchanged model facade and protected corridor leave no room farther along.
  That is an intentionally unresolved layout disagreement; the missing
  continuation is not claimed to be a real gap.
- The near right bed begins before the actual registry facade starts, while
  its later portions follow attachment bounds with small setbacks. Its 7.2 m
  run, the farther 2.8 m run and 1.05 m doorway gap are explicit estimates.
  The photographs establish the ordering and interruption, not these stations
  or all concealed endpoints. The approach gap does not itself prove that an
  actual mapped doorway sits there.
- Grille positions are attached to model facade midpoints rather than
  independently identified photographed opening centres. The farther source
  opening is especially obscured. Cage dimensions, bow profile, bar counts,
  curls and brown shutters are schematic; IMG_2189 supports their construction
  style without proving a reverse-view or exact world placement.
- Repeated card-based hedges do not reproduce the source's mixed planting,
  climbers or fine coping variation. The surrounding procedural building
  openings and lane widths still differ from the actual photographed scene.
- The IMG_2189 after render shows new objects only in the distance. Because
  source correspondence is unresolved, it cannot certify that lane's new
  arrangement or establish a source-position match.

No new implementation error was found in the inspected bounded feature data,
facade orientation, localized inferred-opening suppression, shared bed outlines
or visible after renders. The author reports source checks, production build,
unit tests and both-direction route tests passing, including explicit checks
for bed collision, doorway approach, grille orientation/suppression and plant
footprints. Those software outcomes are separate from this source review and do
not resolve the photographic/registration limits above.

Recommendation: retain the concrete implementation as a reviewable bounded
**draft**, with its unfinished task, open source/layout reports and transparent
limits. No independent full-vertex measurement or `placement-verified-by`
attestation is supplied. The actual maps/photos still do not expose enough
independent controls and endpoints for the placement approval required before
merge.
