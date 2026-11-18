# Elena south from the Elena 24 roof: junction lawns and west wall

Task `elena-junction-lawns-roof`. Dave, 17 November 2026, sending a new roof photo
(`public/photos-ref/ELENA-ROOF-2026-11-17.jpg`): "This angle on Elena leading to the middle pool still needs work."

## Photo coverage

| Camera | Solve | Can fix | Cannot fix |
| --- | --- | --- | --- |
| `ELENA-ROOF-2026-11-17.jpg` (new) | x -156.40 ±0.51, z 51.48 ±0.55, y 8.78, yaw 173.1°, pitch -24.3°, 3.5 px rms. Controls: lane kerb (Elena south right edge), middle pool water edge, lamp post and two facade uprights, the near parapet of its own roof. | Ground lines within ~20 m: lane kerb, lawn kerbs, the west wall foot, the cross path. | Depth beyond ~20 m (a 1° pitch error moves a ground point ~1 m at 20 m): the far cypress wall, the gate, the middle pool end. North end of the near lawn (behind the foreground garden wall). |
| `IMG_2358.jpg` (re-solved) | x -156.74 ±0.25, z 51.87 ±0.25, yaw 147.3°, pitch -42.1°. The near parapet across the bottom of the photo was added as a control; before, the camera sat 2.5 m behind the parapet, inside its own roof's view. | Same lines, from a steeper angle. | Same far-end and north-end limits. Same spot on the roof, so not independent in position. |
| Esri aerial (`public/map/ground.jpg`, zoom 19) | Georeferenced. | The lawn's green extent and its west and north limits to about 0.5 m. | Kerbs and wall faces (blurred). |

Both cameras stand at the Elena 24 parapet within 0.5 m of each other.

## What the photo showed against the model (before)

`ELENA-ROOF-2026-11-17-before-details.png`, `-before.png`, `-traced-before.jpg`:

1. A generated tiled porch roof on the south face of Elena 24 covered the open patio below the camera and hid the lane and lawns from the roof (it is the bottom half of the before render).
2. Both lawns stopped 0.4-0.5 m short of the white kerb along the lane, leaving a paved strip.
3. The near lawn's west side was cut diagonally, with a wide paved band to the west wall; the photo and the aerial show lawn up to the wall foot, with shrubs in it.
4. The west wall stood about 1.1 m too far west (the measured wall-foot points were 1.01 m rms off its face).

## Changes

First fit (rejected in review, `REVIEW.md`): the wall was slid 1.07 m east keeping its traced shape, fitted
partly to picks that sat up the lit wall face, with an unsigned residual. The reviewer showed the photographed
foot runs straight past the old jog and the bed door had moved 0.65 m too far east. Refit:

| Feature | Change |
| --- | --- |
| `lane_walls.json:elena-south-lawn-west-wall` | Three points now: the north end on the Cervantes south wall line (-157.97, 61.40), a straight run along the photographed foot (direction 0.546, 0.838; ten foot points from both cameras on one line, 0.09 m rms) to where it meets the existing far length (-153.27, 68.61), then that far length to the cypress wall (registry 6265801UF1366N_part5 by corner 42). The 1.1 m jog is gone. Height unchanged. |
| `elena-south-bed-door` and `door_sills.json:elena-bed-door-sill` | On the straight run 7.06 m from the north end, at (-154.01, 67.24), where both cameras put the door; sill facing square to the run. IMG_2330's bearing to it is 189.6 deg (photo 195, the reviewer's reading 189-193); `check_door_sills.py` keeps its 8 deg tolerance. |
| `elena-south-lawn-door` and `door_sills.json:elena-lawn-door-sill` | 1.07 m along the Cervantes wall line from the first trace, on the far length, 0.19 m from the measured end of the cross path. |
| `frontage_divisions.json:cervantes-elena-lawn-1` | Lane edge on the measured kerb; cross-path edge on the path's kerb; west edge 0.35 m from the refitted run (the shrub strip at the foot); north edge along the Cervantes south wall (inferred from the aerial, hidden in both roof views). |
| `frontage_divisions.json:cervantes-elena-lawn-2` | Lane edge on the measured kerb, west edge 0.35 m from the far length; cross-path and far edges unchanged. |
| `frontage_divisions.json:cervantes-lawn-door-path` | East end to the lane kerb, west end to the far length's face at the lawn door. |
| Kerbs (`cervantes-elena-lawn-1-curb`, `-2-curb`) | Along the lane and the cross path only. No white kerb along the west wall foot in either photo. |
| `plain_fronts.json:elena-24-south-patio` | No generated porch on that bay of Elena 24's south face. |

## Measurements

`python3 scripts/measure_elena_junction_lawns.py` (after `node scripts/shoot_views.cjs ELENA-ROOF-2026-11-17 --pose` writes the model ground). Each pixel pick is cast through its solved camera onto the model ground and compared with the edge it belongs on in the current data. Wall residuals are signed: + means the photographed foot is on the lawn side of the model face.

| Group | Points | Residuals (m) |
| --- | --- | --- |
| Lane kerb (new photo 5, IMG_2358 2) | 7 | +0.07 -0.09 -0.10 -0.06 -0.02 / +0.08 +0.11 |
| Near lawn cross-path kerb | 3 | -0.10 +0.01 +0.16 |
| West wall foot at the grass line (new photo 4, IMG_2358 6) | 10 | -0.18 -0.10 -0.07 -0.05 / +0.03 +0.05 +0.03 +0.11 +0.08 +0.09 |
| Cross-path end to the lawn door | 1 | 0.19 |
| **Used** | **21** | **rms 0.10, worst 0.19** |
| Held out: far length's foot, 20 and 24.5 m out | 2 | +0.34 +0.28 (rms 0.31) |

The lane kerb is a control in both camera solves, so the kerb residuals are not independent. The wall-foot
picks set the straight run, so they are fit residuals; the reviewer's independent picks are the check. The far
length was not refitted: its south end is held at the registry corner, and its two held-out foot points sit
about 0.3 m on the lawn side, at a range where depth is good to about 1 m along the ray. Left open in
`elena-junction-west-wall-position`.

## Artifacts

- `ELENA-ROOF-2026-11-17-overlay.jpg`: render edges through the solved camera after the change, with control and check picks.
- `ELENA-ROOF-2026-11-17-traced-before.jpg`, `-traced-after.jpg`: lawn rings (green) and the west wall base and top (red) drawn on the photo through the solved camera.
- `IMG_2358-traced-after.jpg`, `IMG_2358-overlay.jpg`, `IMG_2358-after.png`: the same through IMG_2358.
- `aerial-plan-after.jpg`: Esri aerial, left plain, right with the old wall (pink) and lawns (grey), the new wall (red), lawns (green) and path (blue), and the projected picks (yellow: new photo wall foot at the grass line, cyan: IMG_2358 wall foot, magenta: lane kerb, white: far lawn).
- `ELENA-ROOF-2026-11-17-{before,after}{,-details}.png`: Inspect renders through the solved camera, Layout and Show details.

## Still different (open)

- **Far end** (`elena-junction-far-end`, photo request `elena-south-cypress-wall-gate`): the photo's far wall with the cypresses runs from the west wall to the lane, with a framed gate to the middle pool lawn at its east end; the model ends the lawn at registry part5's face and leaves paving to the pool. Too far for this camera.
- **Cervantes end of the west wall** (`elena-junction-cervantes-door-wall`): a tall wall with a brown door and the CALLE ELENA tile sign, where the model has the 0.65 m Cervantes south wall.
- **East side of the lane** (`elena-south-east-beds`): planted beds with bougainvillea and the lamp post.
- **Detail** (`elena-junction-planting-detail`): clipped domes and standard, cypresses, wall-foot shrubs, bougainvillea.

These are photographic and aerial measurements; the measured approval needs a second agent's review (`data/placement_reviews.json`).

## Follow-up, same day: Cervantes patio wall, kerb and lawn level

- **Patio wall with a brown door** (`lane_walls.json:cervantes-elena-patio-front-wall`): the roof photo shows a tall white
  wall facing Cervantes with a closed brown door between the house west of the lawns and the CALLE ELENA corner,
  closing the parasol patio; IMG_2467 and IMG_2264 show it from the lane. Built 2.2 m on the Cervantes south line from
  the house corner (registry part5 corner 32) to the west wall's north end. The door head, cast through the solved
  camera at 2.0 m, is 0.95 m wide, 6.35 m along from the west end, within about 0.2 m of the line. It replaces the
  0.65 m wall there. `check_lane_walls.py` lets a photographed Cervantes wall stand on the lane's edge line (face 0.7 m
  from the centreline, outside the 1.2 m paving) instead of 1.0 m.
- **Kerb between the ramp and the lawn**: 0.15 m, see `docs/reviews/cervantes-elena-steps-position`.
- **Lawn level**: the junction lawns were drawn 0.025 m above the ground, below the lane (0.06 m), with kerbs only
  0.06 m above the lane. The photos show a kerb face of about 0.15 m on the lane side and the grass just below its top.
  The lawns now have `lift` 0.16 m (0.10 m above the lane, `src/frontages.ts`) and their kerbs 0.2 m (0.14 m above the lane).

`cervantes-door-wall-before-after.jpg`: photo, before and after through the solved camera (Show details).

## Follow-up: east corner house

The generated timber balcony with a tiled roof on the north-west face of the house on the east corner of Elena south
and Cervantes (registry 6265601UF1366N_part1, corners 3-4) is switched off (`plain_fronts.json:elena-south-east-corner-house`).
IMG_2358 and IMG_2367 look straight at that face: a white moulded balcony ledge under an arched shuttered window and a
white porch round the brown door. `IMG_2358-east-corner-house-after.jpg`: photo beside the render through the solved camera.
Not built yet: the ledge and porch surround (detail), and the hedge bed with the lamp post between the lane and this
house's front patio (structure, next).

## 18 November: east beds, the far end, and the detail planting

**Structure.**
- **East hedge beds** (`data/elena_south_beds.json`): two kerbed beds between the lane tiles and the corner house's patio
  wall and front. The roof camera puts the tile edge 0.6-0.9 m and the hedge face 1.0-1.2 m east of the centreline.
  The beds use the Cervantes bed renderer, now with a frame per file. The hedge is planted at the back of each bed in
  0.36 m pieces so it clears the shared route guard. South of 9.9 m the house fronts come within 0.15-0.4 m of the
  lane, and nothing is built there.
- **Cypress wall** (`lane_walls.json:elena-south-cypress-wall`): a 2.0 m white wall 0.35 m beyond the far lawn's edge, from
  the west wall to just short of the lane kerb. Existing photos show it (IMG_2261 and IMG_2330 face-on, the roof photos
  from above), but none of their cameras fixes its depth, so its line is estimated to about 1 m. Photo request
  `elena-south-cypress-wall-gate` asks for the two ground views that would fix it. IMG_2681, IMG_2682 and IMG_2506 show
  the lane on to the middle-pool gate, which `data/middle_pool_north.json` already models.
- **Plain house face** (`plain_fronts.json:elena-south-far-blank-face`): no generated porches or openings on the plain
  north face of 6265801UF1366N_part5 behind the cypress wall.
- Structure review: `STRUCTURE-REVIEW.md`.

**Detail** (`data/elena_junction_details.json`, `src/elena-junction-details.ts`, Show details only):
- **Lawn trees** are now clipped domes and a clipped standard, re-placed through both roof cameras. The domes' crowns
  overhang the lane kerb as photographed, so only their trunks keep the route clearance.
- **Cypresses:** two at the foot of the cypress wall.
- **Climbers:** bougainvillea on the west wall (starting past the plaques) and over the corner patio wall; vines on the
  far part of the west wall and along the cypress wall.
- **Lamp post** in the east hedge bed, and the **CALLE ELENA** tile plaques on the west wall.
- `details-photo-vs-render.jpg` shows the photo beside the render.

**Still different.**
- The clipped standard stands about 1 m south of the photographed one. Both cameras put its trunk 0.5-1 m north of the
  modelled lawn edge, and the lane kerb shows to z 58.4. So the lawn's north edge (the Cervantes south kerb, hidden in
  both roof photos) is probably 0.6-0.8 m too far south: discrepancy `elena-lawn-north-edge`. A ground camera at the
  junction needs solving to fix it.
- Not drawn yet: the shrubs at the west wall's foot, the corner house's ledge and porch, and the small window in the
  blank face.

**Structure review (`STRUCTURE-REVIEW.md`) and fixes, 18 November.** The reviewer passed the kerb, the lawn level,
both plain fronts and the cypress wall (with limits), and failed two items, both now fixed as specified:
- **Patio wall with the brown door:** lowered from 2.2 m to 1.9 m, with the door 1.8 m. Through the solved roof camera
  the wall top casts at 1.84-1.95 m, and IMG_2467 and IMG_2264 agree. Its basis text now gives the door's true place,
  2.37 m from the wall's west end. The reviewer suspects the west wall's north end is too tall as well; that is open.
- **East hedge beds:** both now start at the photographed tile edge, 1.0 m east of the centreline (they started at
  0.65 m, over paving). The hedge fills the 0.25-0.3 m bed, so it is thinner than the photographed one, which bulges
  over it. The patio wall behind is probably further east than drawn; that is open.

These fixes were not re-reviewed. `IMG_2358-east-beds-after-review.jpg` shows them.

## 18 November, later: the open items

- **Patio wall behind the east hedge.** The two roof cameras disagree on where it stands: IMG_2358 puts it at 1.7-2.0 m
  east of the centreline, the new roof photo at 1.4 m. The model's 1.4 m lies between them, so it is not moved. A
  ground photo square to the lane would settle it.
- **The west wall's north end.** Its top is covered by bougainvillea and planting in both roof photos, so it can't be
  measured. The plaque proportions in IMG_2262 fit 2.1-2.2 m, so it is left at 2.2 m.
- **The lawn's north edge.** IMG_2286 shows the Cervantes cross-section at the drain: about 2.0 m from the lawn kerb
  to the north bed wall, against 1.73 m in the model. That points the other way from the roof readings, so it is not
  moved. A solved ground camera at the junction is still the way to settle it.
- **The cypress wall's line.** Still waiting on the photo request `elena-south-cypress-wall-gate`.
- **Detail added:**
  - shrubs at the west wall's foot;
  - the corner house's white balcony ledge on two piers, cast onto the registry face through IMG_2358 (the
    photographed porch front is solid with an arched doorway; approximate);
  - the small window high on the blank face behind the cypress wall, cast through the roof camera.
