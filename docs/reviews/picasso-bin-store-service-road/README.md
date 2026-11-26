# Bin store and Calle Pintor Picasso south of the car park

Task `picasso-bin-store-service-road`. On 26 November 2026 Dave circled, on the map and in the 3D view, the
area around the bin store (RUBBISH COLLECTION / DEPOSITO BASURA) at the main car park's south-east corner and the
service road that leads from it down to the beach. This pass does stages 1 (photo coverage) and 2 (layout) of the
structure-first order in AGENTS.md. Levels are taken from the laser survey as the layout is built. Detail is not
started.

Frame used below: **s** is metres south-east of the long car-park wall's south end (-35.7, 23.9) along the wall's
line, and **e** is metres east of the wall's centreline, on the road side. Map metres are +x east, +z south.

## Stage 1: photo coverage

No camera in this stretch is solved (`data/photo_poses.json`). The phone pins are good to 2-5 m and the compass to
10-20°. So the photos fix what stands where and in what order. They do not fix metres. Outlines come from the
registry, the Esri aerial (0.24 m a pixel, soft here) and the PNOA-LiDAR 2014-15 2 m surface model.

| Camera | Pin (x, z) ± m | Sees | Can fix once solved | Cannot fix |
| --- | --- | --- | --- | --- |
| IMG_3099 | (-50.7, 20.7) ± 3.1 | bin store front (signs, doorway), hotel above | the front's direction; the hotel block's registry corners as controls | the yard's depth and south end |
| IMG_3100, IMG_3101 | (-40.3, 22.9) ± 4.7 (one spot) | along the bin store front (3100); the front's south end with the arched green gate (3101) | the front's direction | its length |
| IMG_3103 | (-36.6, 21.3) ± 4.7 | inside the yard looking north-west: yellow containers, open sky | that the yard is open-topped, about 2.5-3 m wide | its length (the far wall's distance is judged) |
| IMG_3104 | (-36.8, 21.3) ± 4.7 | recycling igloos on asphalt against the hotel wing's foot | the apron's material | the wing face's distance |
| IMG_3105, IMG_3106 | (-36.1, 21.6), (-31.1, 27.2) ± 4.7 | south-east down the road to the sea: substation close on the right, hotel wing left, the far utility buildings and white tower | the row's order; the road's direction | anything beyond about 25 m |
| IMG_3120-3122 | about (-17, 47) ± 4-14 | north-west up the road: hotel wing with vent grilles, ramps, sliding gate; utility row left | the wing's face and its ramps against the registry ring | the west row's depth |
| IMG_3123, IMG_3124 | (-23.1, 33.1), (-25.6, 30.6) ± 4.8 | the substation, the set-back wall with its low box, the bin store's street face with its green door and the long wall going on north | the row's order, the kerb closing in on the street door | lengths along the road |
| IMG_2345 | (-14.4, 48.2) ± 5.5 | north-west: slatted gate, meter box, maroon doors, green door, long wall; hotel side with plinth and ramp | the row's order | where the slatted gate ends (out of frame) |
| none | | | | the bin store's front square-on; the west row square-on; the road south-east of the hotel's low block |

**Photos requested** (`data/photo_requests.json`): `picasso-bin-store-front` (priority 1),
`picasso-service-road-west-row` and `picasso-service-road-to-beach`.

## What the laser survey shows

[`lidar-heights.png`](lidar-heights.png) shows the surface model's height over the 2020-21 ground (colour) with ground
contours relative to the datum. It has the registry outlines: dashed magenta for parts with 0 storeys, black for
standing ones. The car-park wall is the thick black line and the mapped road the red line. Model metres are relative
to the middle pool deck, which is 5.00 m in the survey.

- **Hotel lower wing** (registry `6465301UF1366N_part3`). The registry gives it 0 storeys, so the model drew only its
  outline. The surface model has a flat top at 3.78 m (quartiles 3.77-4.06 m, 1396 samples inside the ring shrunk
  1.5 m). Its south-west face reads 3.75-3.82 m every 5 m. The road at its foot is -0.55 to -0.78 m, so the face
  stands about 4.4-4.5 m high. On the aerial its roof is red and flat, with a grid of lighter squares, and its edge
  follows the registry line to about 1 m.
- **Bin yard.** Tops of 2.5-2.9 m from 3 to 11.5 m north-west of the wall's end, up to about 3 m west of the wall.
  The car-park paving lies beyond.
- **West of the road.** A 2.3-2.9 m block straddles the wall's end, from s = -3 to s = 2.5 (the bin store's south bay with the green street door).
  Low readings come at s = 3-5, a 1.8-2.1 m top at s = 9-14 (the substation), and 1.3-2.6 m at s = 15-21 (the meter
  box and gate). The ground behind the row is a raised garden at +0.5 to +0.7 m, about 1.2-1.4 m above the road. The
  step runs along the row's line from s = 2 onwards, so the row retains it.
- **Road.** It falls from -0.5 m at the wall's end to -0.85 m at the hotel's low block.

## Stage 2: layout (built, estimated)

Data in `data/picasso_service_frontage.json`, drawn by `src/picasso-service-frontage.ts`. The pavement and apron
surfaces are in `data/ground_plan_picasso.json`. Checked by `scripts/check_picasso_service_frontage.py` and
`scripts/check_ground_plan.py`. All pieces are graded `estimated` in `data/confidence.json`.

| Piece | Where | Size and height | From |
| --- | --- | --- | --- |
| Hotel lower wing | registry ring, exactly | flat top 3.78 m + paving; white walls, red flat roof | aerial, survey, IMG_3104, 3105, 3120-3122 |
| Bin yard | s -11.5 to 2.5, front face 3 m west of the wall's line; the long wall is its east side north-west of its end, then a street face flush with the wall's | walls 2.6 m above the car-park paving, 0.25 m thick, open-topped; doorway 1.6 m in the front at s ≈ -2, green sliding street door 1.5 m in the street face at s 0-1.5 | survey, IMG_3099-3103, 3123, 3124 |
| Set-back wall | s 2.5 to 9.2, 2.6 m west of the wall's line | top 2.2 m | IMG_3123, 3124 |
| Substation | s 9.2 to 13.66, face at e = +0.6 | Ormazabal standard kiosk 4.46 × 2.38 m, top 1.95 m, brown cap 0.15 m proud | survey, IMG_3123, 3106, 3105 |
| Recessed gate | s 13.66 to 14.86, set back to e = -0.4 | grey panel, 2.0 m | IMG_3106, 3120, 2345 |
| Meter box | s 14.86 to 17.4, face at e = +0.5 | top 1.6 m | IMG_2345 |
| Slatted gate | (s 17.4, e -0.6) to (s 24.2, e -1.7), at registry part 6364501UF1366S_part1's north corner | 2.3 m, dark | IMG_2345 |
| Pavement | between the row's faces and the mapped road's west edge, s 0-24.2 | concrete 0.12 m above the asphalt, stone kerb | IMG_3123, 3124, 3105, 3106, 2345 |
| Hotel apron | between the mapped road's east edge and the wing's face, to registry part2 | asphalt, 2.5-4.6 m wide | IMG_3104, 3105, 3120-3122 |

**Superseded.** `picasso-boundary-wall` and `picasso-utility-front` in `data/picasso_service_road.json` were read from
IMG_2345 alone. They put a plain 2.1 m wall where the substation, meter box and slatted gate stand, and a brown-door
front further south-east, where IMG_2345 shows only the slatted fence. Neither is built any more. Both records
stay in that file, marked `superseded`, because the placement graph cannot yet retire a feature. The stone plinth, ramp and
bins on the hotel side are kept.

**Left out** (`data/confidence.json` gaps):
- the road from the hotel's low block to the beach (`gap:picasso-service-road-to-beach`);
- the frontage along registry part1 (`gap:picasso-utility-row-part1-face`);
- whether part of the bin store is roofed (`gap:picasso-bin-store-roofed-part`).

Also left for the detail stage: the signs, doors, louvres, igloos and containers, the bougainvillea, the ramps and
railings at the wing's foot, the plane trees and the cypress hedge.

## Independent review (26 November 2026)

A reviewer agent that did not make the change opened all 13 photos at full size. It also looked at the renders, the
survey plot and the aerial, and resampled the survey itself in the s/e frame.

- **Signed off:** the hotel lower wing (the face reads about 4.0-4.2 m against IMG_2345's igloos; the model has 4.4 m),
  the pavement and the apron. It also found removing the two IMG_2345-only features justified.
- **Fixed after review:**
  - IMG_3101 is taken from *inside* the bin store. Its wall is white over a grey plinth band on the yard's terrazzo
    floor, and its recycling sign sends people to the street on the other side of the wall. So the arched green door
    is the store's street door: the green sliding door of IMG_3124. It is not a gate in the car-park front.
  - The first pass had a separate roofed "green-door building" at the wall's end. That is the bin store's open south
    bay (IMG_3101 shows sky above the door). It is now part of the yard, with the doorway moved opposite the street
    door.
  - A narrow recessed grey gate between the substation and the meter box was missing (IMG_3106, 3120, 2345). It is
    added, and the meter box and slatted gate move 1.2 m south-east.
- **Second pass (same reviewer, after the fixes):** "SIGN-OFF: stage 2 layout satisfactory". The street door at s 0-1.5 is
  about 0.75 m from where IMG_3124 suggests, inside the ±1.5 m read.
- **Not blocking, recorded:** IMG_3103's far wall reads 6-7 m from its camera, so the open yard may end about
  s = -7 (discrepancy `picasso-bin-yard-far-wall`, `gap:picasso-bin-store-roofed-part`). The yard's terrazzo floor shows as generic
  ground (detail stage). The 2021 ground model dips to -2.0 m behind the low box at s ≈ 4,
  possibly a light well; this is for stage 3.

## Inspect

| View | Before (Layout) | After (Layout) | After (Show details) |
| --- | --- | --- | --- |
| Overhead | [before-over-layout.jpg](before-over-layout.jpg) | [after-over-layout.jpg](after-over-layout.jpg) | [after-over-details.jpg](after-over-details.jpg) |
| Down the road from the bin store | | [after-road-layout.jpg](after-road-layout.jpg) | [after-road-details.jpg](after-road-details.jpg) |
| Bin store from the car park | | [after-bins-layout.jpg](after-bins-layout.jpg) | [after-bins-details.jpg](after-bins-details.jpg) |

Rendered with `scripts/shoot_inspect.cjs`: `after-over -32,30,70,70,0`, `after-road -40,14,22,25,320` and
`after-bins -44,18,16,25,250`.

## Through the photo cameras (pin poses, unsolved)

Each `<photo>-pair.jpg` puts the photo on the left and an Inspect render in Layout on the right. The render's orbit
camera stands at the phone pin, 1.7 m up, facing the reviewed `looksAt`:
`shoot_inspect.cjs <photo> <target>,10,9.8,<360 - heading>`. These are diagnostics, not measurements. Pins are off
by 3-5 m, so frames do not line up. `scripts/shoot_views.cjs` was tried first, but on this branch and on `main` its
renders show the whole-resort overview instead of the photo camera, so it was not used.

| Photo | Pair | Reading |
| --- | --- | --- |
| IMG_3099 | [IMG_3099-pair.jpg](IMG_3099-pair.jpg) | The bin store front with its doorway. The pin stands closer than the photo's camera. |
| IMG_3101 | [IMG_3101-pair.jpg](IMG_3101-pair.jpg) | Taken from inside the bin store's doorway, looking at its street face and green door. The pin is outside the yard, so the render shows the front from the car park. |
| IMG_3103 | [IMG_3103-pair.jpg](IMG_3103-pair.jpg) | Looking along the yard. The pin is on the road side of the wall, so the yard is seen from outside. |
| IMG_3105 | [IMG_3105-pair.jpg](IMG_3105-pair.jpg) | The order is right: the hotel wing on the left, the utility row and pavement on the right. The road beyond the hotel's low block is not built (`gap:picasso-service-road-to-beach`). The pavement rises towards the row (`picasso-service-pavement-level`). |
| IMG_3106 | [IMG_3106-pair.jpg](IMG_3106-pair.jpg) | The substation, with its cap, on the right. |
| IMG_3120 | [IMG_3120-pair.jpg](IMG_3120-pair.jpg) | Up the road to the north-west. |
| IMG_3123 | [IMG_3123-pair.jpg](IMG_3123-pair.jpg) | The substation, the set-back wall and the bin store's street face are in order. The pavement rises into the recess (`picasso-service-pavement-level`). |
| IMG_3124 | [IMG_3124-pair.jpg](IMG_3124-pair.jpg) | The bin store's street face with the green sliding door continues the long wall's. |
| IMG_2345 | [IMG_2345-pair.jpg](IMG_2345-pair.jpg) | The slatted gate, meter box, recessed gate, substation and the bin store's street face are in order. The pin stands about 4 m south-east of the photo's camera. |

## Open

- `picasso-service-pavement-level` (`data/discrepancies.json`): the 2 m terrain grid smooths the 1.2 m step behind the
  row across the pavement. Stage 3 holds the grid at road level up to the row's faces.
- Stage 3 (levels) and stage 4 (generated filler: the lawn patches and generic trees on the raised garden west of
  the row) are not done. Stage 5 (detail) waits for the layout's sign-off.
- No camera is solved, so nothing here is a measured placement.

## Detail: the bin store's outside (26 November 2026)

Dave asked for detail on the outside, including the sign. The data is `binStoreDetails` in
`data/picasso_service_frontage.json` and the code is `src/picasso-bin-store-details.ts`. It is Show details only and
graded `estimated`. Positions are read along each wall at its own pixel scale: about 137 px a metre for the front in
IMG_3099, from the doorway's centre. That is good to about 0.3 m.

**Car-park front**, north to south (IMG_3099, IMG_3100):

| Item | Centre height |
| --- | --- |
| Red EXTINTOR sign | 2.06 m |
| Red fire-hose box | 1.28 m |
| Blue P sign with a motorbike | 1.69 m |
| RUBBISH COLLECTION / DEPOSITO BASURA board, 0.71 × 0.95 m | 1.93 m |
| Doorway: green boarded doors, north leaf open into the yard, south leaf shut | |
| Two prohibition roundels | |
| Glazed cabinet with a red fitting | |

Bougainvillea runs along the top. The doorway is narrowed to 1.2 × 2.15 m, as read against the 2.6 m front; the
first pass had it at 1.6 m.

**Street face** (IMG_3124, IMG_3123): the shut green sliding door, its rail and hood running on north-west over the
long wall, a yellow warning sign, a switch box and a lamp, and a concrete ramp down along the wall.

**Inside:** four yellow 1100 l containers stand side by side against the inner face of the car-park front, in the
yard's north half. They are at the standard 1.37 × 1.07 × 1.47 m size, 0.05 m off the wall, lids facing the long wall.
Dave marked four bins on an Inspect screenshot. They were first put against the long wall, which Dave said was the
wrong side, so they now stand on the front wall, as IMG_3103 shows the row (26 November 2026).
From above: [bins-top-details.jpg](bins-top-details.jpg). Over the front: [bins-oblique-details.jpg](bins-oblique-details.jpg).

| View | Image |
| --- | --- |
| IMG_3099 beside the model, Show details | [IMG_3099-details-pair.jpg](IMG_3099-details-pair.jpg) |
| The sign and doorway, close | [details-front-close.jpg](details-front-close.jpg) |
| IMG_3124 beside the model, Show details | [IMG_3124-details-pair.jpg](IMG_3124-details-pair.jpg) |

**Not built:**
- the BASURA / RUBBISH BINS sign and recycling sign inside (IMG_3101);
- the conduit and low white box on the set-back wall;
- the motorbike-bay markings;
- the shrub at the front's south end.

The bougainvillea is drawn as separate sprites; the photo shows one continuous green mass.
