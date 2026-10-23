# Independent location review: Silvia tunnel main-map candidate

23 October 2026. Reviewer: `/root/forecourt_source_review`, separate from the
implementation author. This is an independent photo/map investigation and bounded
candidate assessment, **not placement approval**. No source geometry was edited.

## Sources actually inspected

Reopened full 1200 × 1600 public copies of IMG_2190 and IMG_2191, the private
`villacana-reference/contact-sheets/seaward-lanes.jpg`, actual
`public/map/ground.jpg` (1792 × 1792), its `ground.json` bounds, and registry rings,
holes and streets in `public/map/skeleton.json`. Read the current area brief,
layout and placement workflow. Inspected the original aerial both alone and with
local debug overlays of the unchanged registry rings/holes and candidate axes.
The debug aerials stay in `/workspace/scratch`, outside the public repository.

The photos establish a covered, flat-ceilinged passage with an open garden exit,
side entrances, planting, patterned paving and a Silvia 1–15 plaque. The owner
has superseded earlier paired-door interpretation with single doors. The sources
do not show a uniquely identified exterior building corner, pool, street junction
or other landmark that registers this tunnel to a particular roof/courtyard in
the aerial. The sign identifies the street/address range, not an exact portal
coordinate. Contact-sheet ordering and stylistic similarity do not establish a
connection to the middle-pool gateway.

## Strongest bounded candidate: west host and courtyard

The strongest **registry-topology candidate** is the small part2 portal leading
southwest through the ground floor of `6264401UF1366S_part3` into its existing
courtyard hole. This is more specific than placing the whole study on the old
material-mask polygon:

- `6264401UF1366S_part2` is a shallow one-storey strip, about 3.17 m across the
  candidate passage and roughly 1.1–1.25 m thick along it. It can represent a
  portal/apron/canopy, not the entire 7.2 m tunnel. Its width is compatible with
  the existing 3.1 m clear study width.
- Take the shared/back-face midpoint `[-121.79, 118.12]` as an estimated study
  entry, with inward unit axis `[-0.854121, +0.520074]` in map east/south metres.
- At 7.2 m inward, the study exit is `[-127.9397, 121.8645]`. The midpoint of the
  courtyard's eastern edge from `[-128.68, 120.30]` to `[-127.01, 123.25]` is
  `[-127.845, 121.775]`: only 0.13 m away **in the existing model data**.
- A 3.1 m clear rectangle has entry corners approximately
  `[-120.9839,119.4439]`, `[-122.5961,116.7961]` and exit corners
  `[-128.7458,120.5406]`, `[-127.1336,123.1884]`. The exit spans nearly the
  courtyard's eastern end. The aerial shows roof over this intervening band
  and vegetation in the courtyard, compatible with a covered route to a garden.
- Extending the same axis outward meets the existing Silvia-north centreline
  around `[-118.8507,116.3303]`, 3.44 m outside the study entry, approximately
  2.3 m beyond the shallow part2 strip. A short open approach can connect to
  that street without moving its complete alignment.

These near coincidences make this a defensible **estimated integration candidate**.
The numerical agreement is model-to-model compatibility; it is not a measured
photo-to-map residual. The old floor citation is historical context and must not
be counted as independent confirmation of the photographed portal's identity.

## Required bounded carve; preserve the rest

For this candidate, affected hosts are part2 and the ground-floor corridor through
part3. Do not remove part3's full building footprint or its upper storey, alter
the courtyard hole, or remove the unrelated `6264501UF1366S_part1` across Silvia.

Open only the lower portal/corridor and the finite side-recess envelopes needed
by the actual tunnel geometry. Retain the upper-floor volume and roof over the
corridor. A clear-width rectangle alone does not accommodate the model's white
walls and recess returns: clear width is 3.1 m, ordinary wall envelope is about
3.66 m, and two 0.65 m recesses plus 0.28 m walls locally reach about 4.96 m
across. Clip the carve to the appropriate host and per-bay along intervals;
do not widen the whole tunnel or delete a broad unrelated strip. Preserve the
rest of each registry footprint and keep 2D opening representation, 3D mesh and
walk collision aligned. Keep the main axial passage open at both ends.

## Alternatives and unresolved location evidence

The northeast alternative cannot be ruled out from photo content alone:
`6264501UF1366S_part1` also has a central planted courtyard. A perpendicular line
near the recorded photo position would enter its west facade around
`[-118.89,114.98]` and reach its courtyard near `[-111.15,110.37]`, about 9 m
through the roofed band. That is also a plausible covered passage arrangement.

IMG_2190's recorded phone heading is about 56 degrees, toward this NE alternative,
whereas the selected west candidate points southwest (about 239 degrees).
IMG_2191 turns toward the side plaque and cannot by itself settle the axis.
GPS/compass values are not subject anchors, but the direction disagreement must
remain explicit rather than being silently discarded or called a match.

Aerial ground scale is approximately 0.24 m per pixel from the actual image and
bounds. Roof overhang/parallax, blur and hidden ground-level edges make a local
roughly 1–2 m working uncertainty appropriate for estimating the candidate's
exterior position; this is not a calibrated confidence interval or an approved
tolerance. The host/direction ambiguity is a discrete alternative roughly 20 m
away at the exit, much larger than that local uncertainty. No three independently
identified controls and two held-out landmarks link the tunnel photos to the
chosen host, and concealed passage boundaries are not traced from the aerial.

Therefore the candidate can be built and labelled approximate under the owner's
main-map integration request, but the world-registration discrepancy remains
open. Do not create a `placement-verified-by` edge or describe it as surveyed.
An owner identification of this specific portal/courtyard, or an exterior photo
that shows both the Silvia arch and a map-identifiable building/junction, would
resolve the principal identity/direction blocker. Actual integrated renders and
walk-through still require review after implementation.

## Integrated code and render review

Inspected `src/silvia-map.ts`, the current changes to `slice.ts`, `blueprint.ts`
and `geom.ts`, placement data and the actual canonical-app main entrance,
interior, courtyard and mobile captures refreshed approximately 07:23–07:24 UTC.
The world transform is consistent with Three.js rotation about y: local +z
follows southwest `forward`, and local +x (photo-left) follows
`[forward.z, -forward.x]`. The inverse is consistent to the precision of the
stored near-unit vector. The same source tunnel factory supplies the integrated
walls, arches, doors, plants and floor.

The carve is bounded to the declared hosts: part2's lower canopy is opened, and
part3 retains its full upper-storey outline while lower geometry/collision is
differenced by the finite corridor and individual recess envelopes. Ordinary
wall thickness and both deeper recesses are included. The host's original
courtyard remains a hole. Existing unrelated-building collision behavior is
preserved, and procedural facade suppression is now limited to the local
lower-level tunnel area rather than the entire large host. A shared transformed
floor/wall overlay is added to the main map without deleting registry outlines.

Initial review found an apron UV error that painted a dense micro-grid over the
entire tunnel floor, overly bright ceiling lights, whole-host facade suppression
and a broader courtyard-collision change. The author corrected these during
review: the apron is now confined to the outside approach with source-consistent
local UVs, lighting is reduced, and the latter two changes are locally scoped.
The refreshed images show the expected patterned tile scale and substantially
reduced light hotspots. The first three screenshots initially shared one camera;
refreshed interior/courtyard views are now distinct canonical `at`/`look` views,
with actual player-coordinate assertions in the capture script. These are render
comparisons, while movement requires the separate Player/Solids regression.

The visible courtyard beyond the exit is currently a bare, tall-walled registry
void with simple paving. It does not reproduce IMG_2190's dense planted garden,
path edges or facade details. Door/recess forms retain the owner-corrected simple
single leaves, but the forward captures do not expose every leaf face. Main-scene
lighting and the surrounding host also change the appearance despite reuse of
the same tunnel assets. The captures support successful scene integration, not
a calibrated photographic match or world-placement approval.

### Independent courtyard camera check and final outcome

Independently launched Chromium against the canonical app at local along=11 m,
world player `[-131.185,123.841]`, looking farther into the courtyard. The initial
close-camera cutoff switched to the orbit camera; an intervening white ceiling/
arch occupied the foreground. The author then extended first-person handling to
points inside this host's original courtyard holes. Repeated the same independent
capture: `data-close-camera` changed from `false` to `true`, and the foreground
obstruction disappeared. Public-safe before/after captures are saved as
`independent-courtyard-camera-before.png` and
`independent-courtyard-camera-after.png` beside this report. The corrected view
still faithfully exposes the currently bare courtyard rather than asserting a
finished garden.

No remaining blocking transform, host-carve or reviewed camera issue was found
for this approximate integration. This reviewer independently performed the
camera check above, but did not rerun the full software/layout suite. The
implementation author's route regressions remain separate validation. This
outcome does not close the location/direction discrepancy, approve placement,
or claim the surrounding garden and all resort photos are accounted for.
