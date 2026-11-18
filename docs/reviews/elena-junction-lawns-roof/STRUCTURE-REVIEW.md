# Structure review: Calle Elena / Cervantes junction (18 November 2026)

Reviewer: an independent reviewer subagent that did not make these changes. Scope: the six structure
changes in the "Follow-up" sections of `README.md` and commits 83dd582, f21e816, 88a2f0b and a0cddcd. This
is the stage sign-off that AGENTS.md "Structure first" asks for before detail goes on. It is not a
`placement-verified-by` edge, and nothing was written to `data/placement_reviews.json`.

## What I did

- Rendered Inspect through the solved cameras of `ELENA-ROOF-2026-11-17.jpg` and `IMG_2358.jpg`, in Layout and
  with Show details (`shoot_views.cjs --pose [--details]`).
- Projected the data lines (wall feet and tops, doors, bed rings, lawn rings, kerb) through both solved cameras
  onto the full-size photos and onto the renders. The lines sit on the rendered geometry, so the projection
  is right. Heights are relative to the exported model ground (`layout-checks.local/model.json`). The ground
  here is not 0: it is 0.59 m at the junction and 1.18 m at the patio wall.
- Cast photo pixels back through the solved cameras, onto the model ground or onto a wall's vertical plane,
  to measure the lane edge, the hedge and the wall-top heights.
- Measured heights in the model export: kerb, lane and lawn.
- Looked at the full-size `IMG_2367`, `IMG_2261`, `IMG_2330`, `IMG_2467`, `IMG_2264`, `IMG_2262` and `IMG_2286`.
  These have no solved cameras. The pin renders for IMG_2262, IMG_2264 and IMG_2286 open the map overview, not
  a ground view, so they could not be compared.
- Checks: `check_lane_walls`, `check_elena_south_beds`, `check_cervantes_patio_walls`, `check_cervantes_lane_edges`
  and `check_ground_plan` PASS. `check_junction_lawns` fails in the working tree (`junction-pollarded-1 leaves lawn`),
  but only because of an uncommitted edit to `data/junction_lawns.json` by a concurrent session. At HEAD and at
  every commit reviewed here it passes, which I checked on clean `git archive` copies. The Show details renders
  include that session's uncommitted detail changes. The Layout renders and the structure are not affected.

Images saved here: `structure-review-patio-wall-height.jpg` (ELENA-ROOF photo | Layout render, with the
projected wall top (red), the west wall (orange) and the door (cyan)), `structure-review-east-beds.jpg`
(IMG_2358 photo | Layout | Show details, with the bed rings in blue and the lawn edge in green) and
`structure-review-cypress-wall.jpg` (ELENA-ROOF photo | Layout, with the cypress wall foot and top in magenta and
the far lawn in green).

## Verdicts

| # | Feature | Verdict |
| --- | --- | --- |
| 1 | `lane_walls.json:cervantes-elena-patio-front-wall` | **Pass on position and door; fail on height.** Fix: about 1.9 m, not 2.2 m. |
| 2 | `cervantes_patio_walls.json:cervantes-patio-south-2` kerb, and the `src/cervantes-walls.ts` height fix | **Pass with limits** |
| 3 | Junction lawn `lift` 0.16 m, kerbs 0.2 m | **Pass with limits** |
| 4 | `plain_fronts.json:elena-south-east-corner-house`, `elena-south-far-blank-face` | **Pass** (both) |
| 5 | `data/elena_south_beds.json` (two hedge beds) | **Fail. Required fix:** the beds' lane edge is drawn on photographed paving. |
| 6 | `lane_walls.json:elena-south-cypress-wall` | **Pass with limits** (estimated line; confidence `estimated` is right) |

### 1. Cervantes patio wall with the brown door: position and door pass, height fails

- Presence: right. ELENA-ROOF shows a tall white wall with a closed brown door on the Cervantes side, running
  from the CALLE ELENA corner to the house, and IMG_2262, IMG_2286, IMG_2264 and IMG_2467 show it from the lane.
  Before this change the model had a 0.65 m wall here.
- Position: the CALLE ELENA corner projects within about 3 px of the photographed corner. The door outline
  projects onto the photographed door leaf and head within about 10 px (about 0.1 m). From the ground, the door
  reads 2-3 m from the corner in IMG_2262 and IMG_2264; the model has 2.63 m to the door centre. The stretch
  west of the door to the house (about 1.9 m) fits IMG_2467 and IMG_2264. The wall foot along Cervantes is
  hidden by shrubs in the roof view, so its line is good only to about 0.2 m.
- **Height is too great.** I cast the photographed wall top through the solved roof camera onto the wall's north face:
  - 1.84 m at the CALLE ELENA corner;
  - 1.86, 1.90, 1.93 and 1.95 m going west to the door;
  - the door head and its frame at 2.02-2.13 m.

  The model draws 2.2 m, so the wall is drawn 0.25-0.36 m too tall. At the ground, IMG_2467 and IMG_2264 read
  the wall west of the door at about 1.8 m against a 2.0 m door, with a moulded hood over the door rising above
  the wall top. **Required fix:** set the height to about 1.9 m. The hood over the door is detail.
- Text error in the `basis`: the door is "6.35 m along the line from its west end". It is 2.37 m from this
  wall's west end. The 6.35 m is measured along the old `cervantes-patio-south-2` line, from x = -165.68.
- Related, outside this list: the lawns' west wall (`elena-south-lawn-west-wall`, 2.2 m) shares the corner
  where the photographed top casts at 1.84 m. Its north end is likely also too tall. Check its height through
  the same camera before detail goes on it.

### 2. Kerb between the Cervantes ramp and the near lawn: pass with limits

- IMG_2262, IMG_2286 and IMG_2264 show a low, rounded white kerb along the ramp, with the grass just below its top.
  In the model export the kerb stands 0.15-0.18 m above the ramp edge at five points along it, and it falls with
  the ramp from 1.34 m to 0.97 m. The 0.65 m length west of the wall now stands 0.68 m above the ground, so the
  `cervantes-walls.ts` fix (lane = road height - 0.27 + 0.06) draws walls at their recorded height.
- Limits:
  - The lawn's north edge is 0.25 m from the kerb centreline, which leaves a 0.15 m strip between the kerb's
    inner face and the grass. The photos show grass against the kerb.
  - The join between this kerb and the lawn's own lane kerb at the drain corner (0.29 m apart at their ends) is
    hidden from both solved cameras and was not rendered from the ground.

  Neither blocks detail. Close the strip when the lawn's north edge is next touched.

### 3. Lawn lift and kerbs: pass with limits

- Export: lawn 1 sits 0.07-0.19 m above the adjacent ramp and lane (0.10 m typical), its kerbs about 0.14 m
  above the lane, and the ramp kerb 0.15-0.18 m. That matches IMG_2262, IMG_2286 and IMG_2330: a kerb face of
  about 0.12-0.15 m with the grass just under its top. Both lawns now sit on the measured kerbs in the two roof
  cameras (`structure-review-cypress-wall.jpg`, green).
- Limit: lawn 1 follows the terrain, which rises about 0.5 m from its north-east corner (ground 0.66 m) to its
  north-west corner (1.18 m) with the Cervantes ramp. IMG_2262 is consistent with the grass rising along the
  ramp, but I did not check this tilt against the LiDAR (`scripts/lidar_check.py`). Do that in the levels stage.

### 4. Plain fronts: pass

- `elena-south-east-corner-house`: IMG_2358 and IMG_2367 show the north-west face of registry
  6265601UF1366N_part1 with a white moulded ledge under an arched shuttered window and a white porch round the
  door, with no timber balcony or porch roof. The Show details render now has no generated balcony there. The
  generated lower-floor window where the photos show the arched door is detail, as the record says.
- `elena-south-far-blank-face`: the box catches only registry part5 corners 41-42. Projected through the roof
  camera, that face is exactly the big plain white face with the single small arched window. The pilastered bays
  with tall windows (corners 43-45) and the window and balcony bay east of corner 41 stay outside the box, as
  photographed. Wording: the face rises behind the far end of the west wall and the parasol patio, beside
  rather than straight behind the cypress wall.

### 5. East hedge beds: fail, required fix

- Presence and extent along the lane (s 0.95-9.85 m) are right. IMG_2358, IMG_2367 and ELENA-ROOF show a clipped
  hedge with the lamp post between the lane tiles and the corner house's patio and front.
- **The beds' lane edge sits on photographed paving.** Through the steeper solved camera, IMG_2358, the tile
  edge on the east side of the lane casts at **o = -1.13, -1.09 and -1.01 m** at s = 2.9, 5.2 and 8.7 m. The hedge's
  lane-side face, cast at 1.2 m, is at -1.04 to -1.00 m. Through ELENA-ROOF, the boundary where the tiles
  disappear under the hedge casts at -1.10, -0.99, -0.89, -0.75 and -0.83 m at s = 2.5-12 m. The bed rings start
  at **o = -0.65 m**, so both bed kerbs and their soil strips cover 0.25-0.45 m of the tiles the photos show
  (`structure-review-east-beds.jpg`: the blue rings lie on the tile pattern, and the photographed hedge is east of
  them). As a control, the lawn kerb on the other side of the lane casts within 0.1 m of the model in the same
  camera (+0.41 to +0.58 m against +0.59 to +0.74 m). The photographed paving is therefore about 1.6 m from kerb
  to hedge, where the model draws a 1.2 m ribbon and puts the bed against it.
- The visible hedge face in Show details (-0.89 m, the hedge planted at the back of the bed) is within about
  0.1-0.2 m of the photographed face. Layout, though, shows a kerbed soil strip where the photos show tiles.
- **Required fix:** move each bed's lane edge to the photographed tile edge, o ≈ -1.0 m (about -1.1 m for
  s < 4 m), and pave between the lane ribbon and the bed (Elena south paving here is about 1.6 m, not 1.2 m).
  Keep the hedge face at the bed's lane edge.
- Open and not caused by this change: IMG_2358 puts the back of the hedge at o ≈ -1.65 to -1.7 m, beyond the
  modelled patio wall (`elena-south-mouth-patio-wall`, face at -1.26 m) and the registry house face (-1.4 m). The
  same camera puts the corner house's Cervantes-facing patio wall at s ≈ 2.0-2.7 m, depending on whether the
  wall is 1.1 or 0.7 m tall, against s ≈ 0.9 m for `cervantes-patio-south-3`. In the IMG_2358 render the corner
  house's patio is visibly deeper than in the photo. Both are layout questions for the corner house and its patio
  walls. Record them as discrepancies, and settle the bed's north end (s = 0.95 m) and its back line once they
  are traced. One solved position on the Elena 24 roof is not enough, so ask for a ground view from Cervantes
  looking east at the mouth.

### 6. Cypress wall at the far end: pass with limits

- Presence: right. IMG_2261 and IMG_2330 show it face-on, and ELENA-ROOF, IMG_2358 and IMG_2367 from above. It
  is a white wall with trained vines and two cypresses at its foot, running from the west wall to the lane.
- Through ELENA-ROOF the projected foot lies on the photographed foot under the cypresses (within about 3 px).
  The far lawn's green edge meets it as the grass does in the photo. IMG_2358 agrees. At 22-24 m a 1° pitch
  error moves a ground point about 1 m along the ray, so the author's 1 m depth uncertainty and the `estimated`
  confidence are right.
- Height 2.0 m: the projected top meets the photographed top at the west end. Along the run, the true top is
  hidden under the vines.
- The east end (1.0 m off the centreline) stops about 0.4-0.7 m short of the pier or gate frame the photos show
  at the lane. The gate is open under photo request `elena-south-cypress-wall-gate`. Leave it until the ground
  views arrive.
- Detail (cypresses, vines) can go on it. Do not put any detail on its gate end until the request is answered.

## Before detail goes on

1. Lower `cervantes-elena-patio-front-wall` to about 1.9 m and correct the text of its `basis`. Check the north
   end of the west wall's height.
2. Move both Elena south bed lane edges to the photographed tile edge, about o = -1.0 m, and pave up to them.
   Record the patio wall, hedge back and house face conflict as a discrepancy.
3. Everything else may take detail now, within the limits above.
