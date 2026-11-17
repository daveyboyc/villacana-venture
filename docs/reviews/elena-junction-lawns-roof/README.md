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

| Feature | Change |
| --- | --- |
| `lane_walls.json:elena-south-lawn-west-wall` | Moved 1.07 m along the Cervantes south wall line (0.919 m east, 0.548 m north): fitted to the wall-foot points. Its north end still meets `cervantes-patio-south-2`, its south end the cypress wall (registry 6265801UF1366N_part5 corner 42). Shape and height unchanged. |
| `door_sills.json:elena-lawn-door-sill`, `elena-bed-door-sill` and the wall's two doors | Moved with the wall. The lawn door is 0.19 m from the measured end of the cross path. |
| `frontage_divisions.json:cervantes-elena-lawn-1` | Lane edge on the measured kerb; cross-path edge on the path's kerb; west edge 0.35 m from the wall centreline (the shrub strip at the foot); north edge along the Cervantes south wall (inferred from the aerial, hidden in both roof views). |
| `frontage_divisions.json:cervantes-elena-lawn-2` | Lane edge on the measured kerb, west edge 0.35 m from the moved wall; cross-path and far edges unchanged. |
| `frontage_divisions.json:cervantes-lawn-door-path` | East end to the lane kerb, west end to the moved wall face at the lawn door. |
| Kerbs (`cervantes-elena-lawn-1-curb`, `-2-curb`) | Along the lane and the cross path only. No white kerb along the west wall foot in either photo. |
| `plain_fronts.json:elena-24-south-patio` | No generated porch on that bay of Elena 24's south face. |

## Measurements

`python3 scripts/measure_elena_junction_lawns.py` (after `node scripts/shoot_views.cjs ELENA-ROOF-2026-11-17 --pose` writes the model ground). Each pixel pick is cast through its solved camera onto the model ground and compared with the edge it belongs on in the current data.

| Group | Points | Residuals (m) |
| --- | --- | --- |
| Lane kerb (new photo 5, IMG_2358 2) | 7 | +0.07 -0.09 -0.10 -0.06 -0.02 / +0.08 +0.11 |
| Near lawn cross-path kerb | 3 | -0.10 +0.01 +0.16 |
| West wall foot (new photo 7, IMG_2358 3) | 10 | +0.15 +0.01 +0.03 +0.01 +0.06 -0.06 +0.13 / +0.47 +0.23 +0.55 |
| Cross-path end to the lawn door | 1 | 0.19 |
| **Used** | **21** | **rms 0.19, worst 0.55 (IMG_2358 wall foot)** |
| Held out: far lawn wall foot, 20 and 24.5 m out | 2 | +0.34 +0.28 (rms 0.31) |

Before the change the same wall-foot points were 1.01 m rms from the wall face, and the lane kerb 0.4-0.6 m from the lawns' lane edges. IMG_2358's wall-foot picks sit 0.2-0.55 m east of the moved face; its solve has the weaker controls (13.9 px rms), so the shift was fitted mainly to the new photo.

## Artifacts

- `ELENA-ROOF-2026-11-17-overlay.jpg`: render edges through the solved camera after the change, with control and check picks.
- `ELENA-ROOF-2026-11-17-traced-before.jpg`, `-traced-after.jpg`: lawn rings (green) and the west wall base and top (red) drawn on the photo through the solved camera.
- `IMG_2358-traced-after.jpg`, `IMG_2358-overlay.jpg`, `IMG_2358-after.png`: the same through IMG_2358.
- `aerial-plan-after.jpg`: Esri aerial, left plain, right with the old wall (pink) and lawns (grey), the new wall (red), lawns (green) and path (blue), and the projected picks (yellow: new photo wall foot, cyan: IMG_2358 wall foot, magenta: lane kerb, white: far lawn).
- `ELENA-ROOF-2026-11-17-{before,after}{,-details}.png`: Inspect renders through the solved camera, Layout and Show details.

## Still different (open)

- **Far end** (`elena-junction-far-end`, photo request `elena-south-cypress-wall-gate`): the photo's far wall with the cypresses runs from the west wall to the lane, with a framed gate to the middle pool lawn at its east end; the model ends the lawn at registry part5's face and leaves paving to the pool. Too far for this camera.
- **Cervantes end of the west wall** (`elena-junction-cervantes-door-wall`): a tall wall with a brown door and the CALLE ELENA tile sign, where the model has the 0.65 m Cervantes south wall.
- **East side of the lane** (`elena-south-east-beds`): planted beds with bougainvillea and the lamp post.
- **Detail** (`elena-junction-planting-detail`): clipped domes and standard, cypresses, wall-foot shrubs, bougainvillea.

These are photographic and aerial measurements; the measured approval needs a second agent's review (`data/placement_reviews.json`).
