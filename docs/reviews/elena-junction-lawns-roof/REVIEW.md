# Review: Elena junction lawns and west wall (task `elena-junction-lawns-roof`)

Reviewer: `reviewer-subagent-h7xsmr` (agent; did not make the change), 17 November 2026.
Record: `data/placement_reviews.json` → `measuredApprovals` → `measured-elena-junction-lawns-west-wall`.

**Verdict: rejected** for the west wall, its two doors and sills, and the lawn west edges that follow
the wall. The lawn lane-edge and cross-path retrace, the lane-and-path-only kerbs and the
`elena-24-south-patio` porch suppression are sound and could be approved on their own once the wall is refitted.

## What I inspected

- Full-size photos, with crops and colour profiles: `public/photos-ref/ELENA-ROOF-2026-11-17.jpg`,
  `IMG_2358.jpg`, `IMG_2367.jpg`, `IMG_2261.jpg`, `IMG_2330.jpg`.
- Packet artifacts: `ELENA-ROOF-2026-11-17-traced-before/after.jpg`, `IMG_2358-traced-after.jpg`,
  `aerial-plan-after.jpg`, the `-before`, `-after` and `-details` Inspect renders.
- `data/photo_poses.json` (both solves), `data/lane_walls.json`, `data/door_sills.json`,
  `data/frontage_divisions.json`, `data/plain_fronts.json`, `data/cervantes_patio_walls.json`,
  `public/map/skeleton.json` (registry 6265801UF1366N_part5), `public/photos-ref/manifest.json` (IMG_2330 pin).
- I ran `scripts/measure_elena_junction_lawns.py` and got the packet's numbers exactly: 21 points used,
  0.19 m rms, worst 0.55 m; held-out 0.31 m rms.
- I projected the model wall through both solved cameras myself and cast my own picks with the
  script's method (bilinear model ground, same pose), using a **signed** residual. The script's `face()`
  is unsigned, so it cannot tell a point on the lawn side from one behind or inside the wall.

## Findings

### 1. The script's near wall-foot picks sit on the wall face, not at its foot

In ELENA-ROOF the grass-to-white boundary along the main (northern) run of the wall is sharp
(zoomed 7x, plus column colour profiles). The script's picks (700,940) and (745,978) are 14 px and 22 px
**up the lit wall face** above that boundary. A pick that is too high casts too far along the ray, which
pulls the fitted face west. That is why they score +0.01 and +0.03 m.

My picks on the foot itself, through the same camera:

| Pick (px) | Plan (x, z) | Range | Signed residual (+ = foot is on the lawn side of the model face) |
| --- | --- | --- | --- |
| (700,954) | -156.21, 64.06 | 12.6 m | +0.27 |
| (720,975) | -156.47, 63.58 | 12.1 m | +0.28 |
| (740,995) | -156.72, 63.16 | 11.7 m | +0.28 |
| (860,1100) | -157.99, 61.37 | 10.0 m | +0.10 (bed edge by the north end) |

In IMG_2358, colour-detected foot points (1198,695), (1178,665) and (1145,620) give +0.42, +0.43 and +0.24 m.
Both cameras agree that the main run is still **0.27-0.47 m too far west** after the 1.07 m move.

### 2. The wall's shape is wrong: the photographed main run goes straight to the bed door

The model keeps the original polyline. The main run turns at (-156.5, 64.33), 3.3 m from the north end,
then a 2.65 m jog puts the next length 1.0-1.1 m further east. The photos show something else:

- In both roof photos the lit main-run foot goes straight on past that vertex for at least 5-6 m from the
  north end, to the pier and bed door. ELENA-ROOF (643,893) is 0.26 m off the extended line at 4.9 m;
  IMG_2358 (1113,560), (1100,545) and (1092,530) are 0.47-0.52 m off it at 5.0-5.7 m.
- Against the model these same foot points are **negative**: -0.22 (ELENA-ROOF), and -0.08, -0.20, -0.36
  (IMG_2358). The model's jog wall stands up to 0.36 m out on what the photos show as lawn and shrub bed.
- IMG_2367 (not used in the fit) shows the same thing. The wall runs nearly straight from the ELENA-sign end
  to the lawn door, with only a short projecting length at the bed door.
- The packet says IMG_2358's wall-foot picks sit "0.2-0.55 m east of the moved face". With signs, two of the
  three are **west of / inside** the model face: (1130,560) -0.23 and (1080,470) -0.55. Only (1190,690),
  +0.47, is east. The large IMG_2358 residuals come from the jog being in the wrong place, not from a weak
  solve. `IMG_2358-traced-after.jpg` shows the red base line crossing the photographed wall foot.

### 3. The bed door moved away from where the photos put it, and a check was relaxed to allow it

- The photographed bed door (brown leaf, red sill, beside a white pier) casts to about (-154.6, 67.0) in
  ELENA-ROOF and about (-153.9, 67.8) in IMG_2358. Along the ray they differ by 0.9 m. Across the wall
  they agree: both are about 0.4 m east of the current main-run line.
- The moved model door `elena-south-bed-door` at (-153.30, 67.43) is about 1.05 m east of that line,
  so it is **about 0.6-0.7 m too far east** (0.7-1.35 m in all). Before the move it was about 0.4 m too far west.
- IMG_2330's compass bearing to the bed door is 195°. To the photographed position it is 189-193°.
  To the moved door it is 185.8°, to the old door 190.1°. The old one fits better. The change raised
  `check_door_sills.py`'s tolerance from 8° to 10° to let the moved door pass at 9.2°. That relaxation
  hides a real misplacement and should be reverted.
- Lawn door: the photographed step and door base cast 0.5-0.7 m south along the wall from the model door,
  and within 0.1 m across it. At 19-20 m this is mostly along-ray depth, so it is inconclusive, not a failure.

### 4. Lawn rings, kerbs and the porch

- My lane-kerb picks (278,950), (314,1050), (351,1150) and (387,1250) fit lawn 1's lane edge to within
  0.00 to -0.04 m. They are not independent, because the lane kerb (`road:elena-south:right`) is a control
  in both camera solves. My cross-path kerb picks (330,802), (400,788) and (440,780) give -0.13, +0.01 and
  +0.08 m. Moving the lawn edges onto the kerb and the cross path is right.
- Kerbs only along the lane and the cross path: none of ELENA-ROOF, IMG_2358, IMG_2367 or IMG_2261 shows a
  white kerb at the west wall foot, where there is a shrub bed. The relaxed `check_junction_lawns.py` rule
  (the kerb may be a run of consecutive ring corners, or the whole ring) is reasonable and still ties the
  kerb to the ring.
- Lawn 1's west edge (0.35 m from the wall centreline) inherits the wrong jog. It follows the wall fix.
- `plain_fronts.json:elena-24-south-patio`: approved. ELENA-ROOF, IMG_2358 and IMG_2367 all look straight
  down from the parapet into an open, blue-patterned tiled patio with a tiled bench, planter, parasol and
  barbecue, and no roof over it. `ELENA-ROOF-2026-11-17-before-details.png` shows the generated tiled porch
  roof covering that patio.

### 5. Ends of the wall

The north end (-158.17, 61.51) lies 0.006 m off the `cervantes-patio-south-2` line. The south end
(-149.02, 76.58) lies on registry part5 edge 41, next to corner 42 (-148.99, 76.56). The move vector
(0.859, -0.512) is parallel to both of those lines and perpendicular to the main run, so both ends slide along
their walls. That is correct, and a further eastward shift along the same vector keeps both joints.

## My residuals on the changed wall

Ten independent wall-foot picks (ELENA-ROOF 5, IMG_2358 5): +0.27 +0.28 +0.28 +0.10 -0.22 / +0.42 +0.43
+0.24 -0.20 -0.36. That is **0.30 m rms, worst 0.43 m**, but systematic: the main run is too far west and the
jog too far east. With the bed door's cross-wall offset (about 0.65 m in both cameras): **0.38 m rms**.
The packet's own held-out points (+0.34, +0.28, both on the lawn side) also exceed 0.3 m. `residualsConfirmed`
is false: the script reproduces, but its 0.19 m rms depends on misplaced picks and an unsigned metric.

## Checks run

`check_lane_walls.py`, `check_door_sills.py`, `check_junction_lawns.py`, `check_ground_plan.py`: PASS.
`build_references.py --check`: 533 references, 0 problems. `check_door_sills.py` passes only because of the
8° to 10° relaxation; at 8° the moved bed door fails (9.2°).

## Required fixes before re-review

1. Re-pick the wall foot at the grass/white boundary in both roof photos (not on the face, not at shrub-bed
   edges), and use a signed residual in `measure_elena_junction_lawns.py`.
2. Refit the wall's shape, not just its position. The main run is a straight line about 0.3-0.45 m east of the
   current one (shift along the same Cervantes-wall vector keeps both end joints), running to the bed-door pier
   about 6 m from the north end. Remove or shorten the 1.1 m jog at (-156.5, 64.33) to (-154.3, 65.81). Model
   the bed door in a short projection at about (-154.3, 67.2) ±0.5 m along the wall, then the length on to the
   lawn door, and the far length, checked against the held-out far-foot points.
3. Move `elena-bed-door-sill` with the refitted door, and revert `check_door_sills.py` to 8°.
4. Carry lawn 1's and lawn 2's west edges to the refitted wall.
5. Correct the packet README and the `lane_walls.json` basis text. They give the IMG_2358 residuals as all
   east of the face, and the wall-foot figure as 0.23 rms / 0.51 worst; the script gives 0.25 / 0.55 for
   wall-foot points alone.
