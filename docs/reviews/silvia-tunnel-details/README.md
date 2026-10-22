# Silvia tunnel detail draft

The owner identifies the partly hidden left/right spaces as recessed entrance
bays and explicitly authorizes guessed depth and generic brown wooden doors.
The build now distinguishes the two directly visible paired door sets from two
inner recesses with generic closed doors at their backs. It is a reusable 3D
component in `src/silvia-tunnel.ts`, with all dimensions in
`data/silvia_tunnel.json`.

Open the canonical app at `/?view=walk&study=silvia&details=1` for the built
photo-relative study. Entrance, Inside, Left/Right recess, Plan cutaway and source
photo controls make the proposed form reviewable. WASD/arrows/touch buttons walk
through both axial openings; side doors and walls are solid. The standard resort
scene remains available through its existing views. The new study is deliberately
not assigned an invented global map position.

## Represented observations

| Reference IDs | Representation |
| --- | --- |
| T01/T04 | Thick white arch heads, straight jambs, impost bands and open axial entrance/exit |
| T02/T03 | Flat ceiling; level floor; white walls, projections, skirting and belt moulding |
| T05 | Terracotta clipped-corner tiles with small blue/cream inserts; separate pebble rectangle |
| T06/T11 | Two visible brown paired door sets, panel/louvre details and shallow thresholds |
| T13/T14 | Owner-confirmed inner entrance recesses; white returns/soffits, estimated 0.65 m depth and generic brown back doors |
| T07/T08 | One hanging framed lantern; terracotta pots, saucers, soil, branches and varied broad leaves |
| T09/T10 | Source-right Silvia 1 15 plaque, high vent and low AGUA POTABLE hatch |
| T12 | Plaque-photo door provisionally reuses the right near set; no unsupported fifth entrance |

The floor, wall, doorway, arch and planting dimensions are estimates. The two
near door setbacks are 0.32 m; the owner-confirmed inner bays are 0.65 m deep.
These are illustrative choices, not photo measurements. No barrel vault, Jorge
fanlight gate, private rooms or four-column outdoor street floor is copied in.
The garden beyond the exit is a bounded simplified fragment, not a reconstructed
onward street layout. The style remains the game's procedural geometry/materials;
it is not a pixel-exact or calibrated photograph match.

## Actual comparisons and remaining blockers

- `IMG_2190-before.png` / `IMG_2191-before.png` are actual main-branch game
  renders from the current catalogue cameras, taken before the new component.
  Those GPS/heading-based cameras remain unregistered and do not resolve the
  pictured tunnel. They are **not** same-camera before/after pairs with the study.
- `source-study-after.png`, `entrance-after.png`, `interior-after.png`,
  `right-recess-after.png` and `plan-after.png` are actual new game-component
  renders from explicitly chosen study cameras. `photo-comparison.png` shows
  the original photograph beside the study without warping either image.
- The comparison checks component presence, source-side ordering and form. It
  does not claim measured dimensions, exact camera calibration, map placement or
  perfect materials/vegetation. Structured `photo_checks.json` matches are not
  fabricated for a study whose global camera/transform remains unknown.
- The existing `silvia-covered-passage-reference-audit` remains open to register
  the footprint, identify the pool/lane connection and resolve hidden boundaries.
  `silvia-study-world-registration` records that blocker in the placement history.
- Task stays in progress and the geometry PR stays draft. No global placement
  approval is supplied. Independent review concerns source fidelity only; see
  [review](independent-review.md).

## Verification

Run `python3 scripts/check_silvia_tunnel.py` and
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/test_silvia_tunnel.cjs`.
The browser check uses the actual component/collision and player movement,
exports the renders above, checks both walking directions, closed side doors,
planting visibility, canonical app routing, photo comparison and mobile controls.
The source check includes the full foliage footprint and centre-route margin.
Final commands/results are recorded in `validation.md`.
