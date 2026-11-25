# Picasso (main) car park: photo coverage and layout readings

Stage 1 (photo coverage) and the measurements for stage 2 (layout) of the structure-first order in
AGENTS.md, for the car park east of Calle de Miguel de Cervantes, which the repo calls the main car park.
Nothing in the 3D model is changed by this pass. It records what the 22 November photo batch shows, what
the cameras can and cannot fix, how the current model differs from the aerial, and which photos are
still needed.

## What the photos show

The 27 new photos are tagged in `data/reference_tags.json` (IMG_3097-3131, 3184-3203).

- **Long boundary wall.** A plain white rendered wall about 2.5-3 m high, with no openings, runs the
  whole east side of the car park. The Calle Pintor Picasso service road and a cypress hedge are outside
  it (IMG_3125 and IMG_3129 look north along it; IMG_3124 shows its south end at a white utility building).
- **Bays.** A west row of angled bays against a hedge, and a central nose-to-nose row with palms. These
  are seen on the aerial only. No new photo looks across the west side. The older IMG_2444 looks east along
  Cervantes towards the car park from about 15 m off. It shows the lane end, not the west bays or their hedge,
  so the gap stands.
- **Round island.** A hedge-ringed bed on a white kerb with tall palms, a candelabra euphorbia and a fan
  palm clump (IMG_3100). On the aerial its centre is about (-55.9, 10.8) and its radius about 5.3 m.
- **South end.** Two accessible bays face a low step with blue-and-white azulejo risers up to a terracotta
  walk between hedged palm beds, leading to the community office (IMG_3097, 3098, 3189, 3194). There is
  also a formal hedged garden with the resort directory sign and a solar lamp (IMG_3184).
- **Bin store, south-east corner.** A white building signed RUBBISH COLLECTION / DEPOSITO BASURA (IMG_3099,
  3101), a walled yard of yellow containers (IMG_3103), and recycling igloos at the hotel wall (IMG_3104).
- **Service road south-east.** The road runs between the hotel's ground floor (ramps, sliding gate,
  IMG_3121) and white utility buildings with maroon substation doors (IMG_3106, 3123), out to the sea.
- **North end.** A barrier arm, a CALLE DE PICASSO plinth and a ramp between white walls (IMG_3131), and a
  low wall with a sign post (IMG_3130). Both pins are uncertain, so which corner these stand on is still open.

IMG_3202 and IMG_3203 show the octagon-tiled east end of Cervantes. IMG_3203's pin is ±104 m.

## Camera coverage (stage 1)

No camera in this area is solved (`data/photo_poses.json`). Each phone pin gives a position to about
2-5 m (worse where noted) and a heading. One camera fixes a direction, not a depth.

| Camera(s) | Can fix once solved | Cannot fix |
| --- | --- | --- |
| IMG_3125, IMG_3129 (road, looking along the wall) | the wall's line and height, if the road edges are matched | the wall's position across the road from one view; its car-park face |
| IMG_3124, IMG_3123 | the wall's south end against the utility building | the north end |
| IMG_3100 (bin store, looking north-west) | direction to the round island and the palm row; the bin store corner as a registry control | the island's radius and the row's offset (depth) |
| IMG_3097, IMG_3098, IMG_3189, IMG_3194 (south end) | the step and walk against the office's registry corners; step height against a known riser | the bays further north |
| IMG_3099, IMG_3101, IMG_3103, IMG_3104 | bin store and hotel front against registry footprints | nothing in the car park itself |
| IMG_3120-3123, IMG_3104, IMG_3105, IMG_3106 | service road edges and hotel/utility fronts; with IMG_2345 (camera about -14.4, 48.2), a check of the already-built `picasso_service_road.json` utility front, boundary wall, plinth, ramp and bins | the car park, which is behind the wall |
| IMG_2345 (older, the evidence for the built service-road features) | those features against registry corners | anything north of the utility buildings |
| IMG_2444 (older, from Cervantes looking east) | the Cervantes lane end where it meets the car park | the west bays and hedge, which are out of frame or too far |
| IMG_3126-3128 | hedge line east of the road | the car park |
| IMG_3130, IMG_3131 (pins ±5-21 m) | the barrier and plinth, once the corner is identified | which corner it is, from these alone |
| none | | the west row, its hedge and anything behind it; the central row from inside the car park; the wall's inner face |

Best first solves: IMG_3100 together with IMG_3101 (one spot, two headings), with IMG_3099 (about 10 m
west) for the bin store's registry corners, then IMG_3125 against the road edges and the utility building.

**Photos requested** (`data/photo_requests.json`, linked from `data/evidence_requests.json`):
`picasso-car-park-centre-row` (priority 1: two opposed views along the central row with the wall in frame),
`picasso-car-park-west-side`, `picasso-car-park-wall-inner-face` and `picasso-car-park-north-entrance`.
The old `picasso-lane` request is answered by IMG_3105, 3106 and 3120-3129.

## Where photos are needed

[photo-spots.jpg](photo-spots.jpg) marks each photo spot on the aerial: a red dot shows where to stand and
an arrow shows which way to point, with what to photograph. Priority goes 1 and 1b (the central row from
both ends), then 2 (the south step), then 3 to 5. In the app, opening the area scorecard panel shows the
same spots as numbered red beacons in 3D and as pins on the map.

## Layout against the aerial (stage 2 readings)

Read by eye on 4-5x gridded zooms (the island by brightness profiles, in the independent review) of the Esri World Imagery zoom 19 mosaic (`public/map/ground.jpg`,
about 0.24 m per pixel). Readings are good to about ±0.5-1 m on the wall and ±1.5 m on bay rows, which are
read from car positions. Palm crowns are not used, because tall palms are displaced on the imagery. The
numbers are in [aerial-measures.json](aerial-measures.json), and the overlay is [plan.jpg](plan.jpg).

| Station z | Wall (aerial) | Ring east edge | Middle kerb | Centre row: aerial / model | Picasso road centre |
| --- | --- | --- | --- | --- | --- |
| -55.9 | -84.2 | -73.4 | -80.4 | -95.0 / -90.7 | |
| -60 | -86.7 | -75.4 | -82.4 | -97.5 / -92.7 (row ends at -55.9) | -79.7 |
| -45 | -77.6 | -68.1 | -75.1 | -88.5 / -85.4 | -71.1 |
| -30 | -68.4 | -60.8 | -67.8 | -79.5 / -78.0 | -62.5 |
| -15 | -59.3 | -53.5 | -60.5 | -70.5 / -70.7 | -53.8 |
| 0 | -50.2 | -46.2 | -53.2 | -61.5 / -63.4 | |
| 10 | -44.1 | -41.3 | -48.3 | -55.5 / -58.5 | |

The values are x in model metres. Recorded discrepancies in `data/discrepancies.json` (task `ground-plan-picasso`):

- `picasso-car-park-long-wall-missing`: the wall is not built. Inspect shows the car park and road as one surface.
- `picasso-car-park-ring-over-road`: the outline's east edge lies up to 11 m east of the wall, over the road and garden.
- `picasso-car-park-centre-row-rotated`: the central row is about 6° off the wall-parallel aerial row, by about 4.3 m at its north end and 3.4 m at its south end. The west row matches within 1-2 m.
- `picasso-car-park-island-and-palms`: the model's island centre is about 2 m south of the aerial's, its radius is 4.5 m against about 5.3 m, and it has no kerb, hedge or palms.
- `picasso-car-park-south-step`: the azulejo step, kerbs and tiled walk at the south end are missing.
- `picasso-access-off-aisle`: the mapped access line runs about 7 m west of the west bays, through gardens.
- `picasso-road-north-east-of-wall`: the road centreline sits 5.5-7 m east of the wall along its whole length, against about 3.5-4 m from the visible road edges. It is worst at the north end.

None of these is corrected here. Under the measured-approval rule, a correction needs a solved camera
plus the aerial (or two solved cameras) within 0.3 m rms and a second agent's review. The aerial alone is
not enough. The wall line is the obvious first correction once IMG_3125 or IMG_3100 is solved.

## Inspect now

| View | Layout and Show details |
| --- | --- |
| Overhead, north half | [cp-overhead-pair.jpg](cp-overhead-pair.jpg) |
| South end, looking towards the road | [cp-south-pair.jpg](cp-south-pair.jpg) |

Rendered with `scripts/shoot_inspect.cjs` (`cp-overhead -52,-45,95,70,0` and `cp-south -56,-10,40,35,180`).

## Review

An independent reviewer agent (24 November 2026) opened all 27 photos at full size, straightened the
aerial along the wall line (it holds to about 0.3 m over 107 m) and checked the readings and claims. It
approved stage 1 once these fixes were made: the island re-read, the centre-row and road offsets
restated, the same-spot camera pairing corrected, the older photos IMG_2345 and IMG_2444 added, the
inner-face photo request moved back to the central aisle, and tag wording corrected for IMG_3123,
3124, 3127, 3130 and 3203.

## Camera solves attempted (24 November 2026)

None of the four best candidates can be solved to measurement quality with what the model holds
today. The reasons are recorded on each photo in `data/photo_poses.json`:

- **IMG_3100.** The only registry building in view is the stepped terrace 6266801UF1366N_part3,
  46-68 m away and mostly behind palms. Its parapets and chimneys do not tie to the flat registry
  footprint's corners unambiguously. The pin pose is already close: the rooftops land within about
  15 px. A pose fitted from a single cluster of uncertain corners would fix direction but not position.
- **IMG_3099.** The bin store is not in the registry, and the hotel's registry part has 0 floors.
- **IMG_3125, IMG_3129.** These show the wall, road and hedge only, with no registry geometry. Once
  the wall is placed, they can check its direction and height.

A measured correction here therefore needs either the requested ground views from inside the car
park (`picasso-car-park-centre-row`), which add a second station seeing the same terrace from a
different angle, or new photos that frame closer registry corners.

## Built as estimates (24 November 2026)

These are built from `data/picasso_car_park.json` with `src/picasso-car-park.ts`, and graded `estimated`
in `data/confidence.json`. They are not measured placements, because no camera is solved.

- **Long east wall:** about 107 m on the aerial line (-91.4, -67.8) to (-35.7, 23.9), 0.25 m thick and
  solid. **Its top is level and its height falls going uphill** (Dave, 25 November). The PNOA-LiDAR
  2014–15 surface model catches the wall top at 7.53–7.63 m (median 7.57) at 6, 30, 54, 60, 72, 78 and
  96 m from the north end. Over the same stretch the ground falls from 6.09 to 4.51 m and is the same on
  both sides to within 0.1–0.2 m, so this is a free-standing wall, not a retaining wall. The wall is about
  1.4 m high at the north end, 2.0 m at 30 m, 2.3–2.5 m mid-way, 2.6–2.7 m at 72–78 m and 3.1 m at the
  south end. In model metres (zero at the middle pool deck, 5.00 m in that survey) the top is 2.57 m above
  the visible paving. Earlier versions are superseded: a constant 2.8 m height read from IMG_3125 near the
  south end, and before that flat boxes that put about 4.5 m at the south end. Inspect after the change: [after-wall-level-top.jpg](after-wall-level-top.jpg) (left: from above, the wall tapers going uphill; right: at the north end, under head height). The IMG_3129 pin now lands just east of the moved road, so its pin render ([pin-IMG_3129.jpg](pin-IMG_3129.jpg)) stands off the asphalt and is not a fair comparison.
- **Car-park outline (`mainParkingRing`):** the east edge is now on the wall's inner face, from where it
  meets the old north edge, at (-89.95, -65.17), to the wall's south end. The west and south edges are
  unchanged.
- **Central bay row:** now on the aerial midline, parallel to the wall, from (-95.0, -55.9) to (-59.1, 4.0).
- **Round island:** centre (-55.9, 10.8), radius 5.3 m, with a white kerb about 0.18 m high and an earth
  bed. The hedge and palms are left for the detail stage.

The island and the wall are measured from the paving level, 0.27 m above the terrain grid, as the car park
and road surfaces are drawn.

| View | Layout and Show details |
| --- | --- |
| Island and wall from the north | [after-island-pair.jpg](after-island-pair.jpg) |
| Wall from the road side | [after-wall-pair.jpg](after-wall-pair.jpg) |
| Overhead | [after-overhead-pair.jpg](after-overhead-pair.jpg) |

Still open:
- ~~The Picasso road centreline is 2–3 m east of the photographed road.~~ 24 November (later): the road along
  the whole car park, to the wall's south end, now sits 3.1 m east of the wall's centreline, 6 m wide, so its asphalt meets the wall foot
  ([after-road-layout.jpg](after-road-layout.jpg), [pin-IMG_3125.jpg](pin-IMG_3125.jpg)). Street width is one value per street, and at 7.5 m, the aerial's wall-to-hedge width, it would cut the
  photographed service-road ramp further south, so the 1-2 m strip towards the hedge is a known shortfall. The
  cypress hedge on the east side is not built yet (detail stage).
- The south-end step and walk are deliberately not built. The walk divides round a planted bed
  (IMG_3097 shows it passing on one side, IMG_3098 on the other), and neither the bed's position nor the
  step's ends are fixed by the pins and the aerial; see the note on `picasso-car-park-south-step` and the new photo request
  `picasso-car-park-south-end`.
- The `picasso-access` line still runs through gardens.
- The bin store is not built.
- The north end is not settled. The wall runs on about 3 m north of the outline's north edge, as the aerial
  suggests, but the barrier and plinth corner is unknown.
- The west bay row is about 4° off the aerial car line, up to about 5 m at the north end
  (`picasso-car-park-west-row-angle`).
- The outline's west edge covers house gardens at the north end, about 31 m from the wall where the bays
  end at 22–25 m (`picasso-car-park-west-edge-gardens`).

### Through the photo cameras (pin poses, unsolved)

Each pair shows the photo on the left and the model on the right, rendered through the phone pin and heading
(`shoot_views.cjs --pose --initial`). These are diagnostics, not measurements.

| Photo | Pair | What it shows |
| --- | --- | --- |
| IMG_3125 | [pin-IMG_3125.jpg](pin-IMG_3125.jpg) | The wall is on the correct side, plain and continuous to the north end. It sits further from the camera than in the photo, because the pin (±4.7 m) and the mapped road (2–3 m east) are both off. The model shows terracotta and lawn ground cover at the wall foot where the photo has asphalt, and lawn where it has the cypress hedge. |
| IMG_3129 | [pin-IMG_3129.jpg](pin-IMG_3129.jpg) | The same, further north. |
| IMG_3100 | [pin-IMG_3100.jpg](pin-IMG_3100.jpg) | The island's kerb ellipse lies in about the photographed place. The photo is pitched about 5° down, the render level. The bin store at the right edge is not built. |

The layout browser test (`npm run test:layout`) passes every street walk and collision check on this branch,
then stops at the coastal-gate button step (`test_layout_browser.cjs:795`). `main` stops at the same step.

## North-entrance security barriers (25 November 2026)

Task `picasso-car-park-barrier`. Dave asked for the car park's security barriers as an asset, placed. The first pass
built the one barrier in IMG_3131 from its phone pin. Dave then confirmed a second barrier and sent two Street View
frames and a Google 3D top-down view, now in `reference/google-maps/`:

| Reference | Source | Shows |
| --- | --- | --- |
| [03-street-view-loira-entry-barrier-2024-10.jpg](../../../reference/google-maps/03-street-view-loira-entry-barrier-2024-10.jpg) | Google Street View, Oct 2024 (Imagery © Google) | The west (entry) lane from Calle Loira, closed: white cabinet on the gatehouse island, boom, red rest post, red-white bollard |
| [04-street-view-bolivia-exit-barrier-2024-10.jpg](../../../reference/google-maps/04-street-view-bolivia-exit-barrier-2024-10.jpg) | Google Street View, Oct 2024 (Imagery © Google) | The east (exit) lane from Calle Bolivia, closed from a white cabinet under a no-entry sign to the long wall's north end |
| [05-3d-top-down-car-park-north-entrance.jpg](../../../reference/google-maps/05-3d-top-down-car-park-north-entrance.jpg) | Google Maps 3D, screenshot 25 Nov 2026 (Imagery © Google 2026) | Both booms as thin lines with their cabinets and post shadows |

**Layout.** The north entrance has two lanes either side of the gatehouse island. The west lane, between the island
and the narrow planter, is the entry: IMG_3131 has an inward lane arrow. The east lane, between the island and the
long wall's north end, is the exit: it has a no-entry sign facing Bolivia. Each lane has a boom from a white drive
cabinet about 1 m high on the island side to a rest post on the far side. The entry rest post has a red-white bollard
just beyond it. No bollard shows at the exit.

**What IMG_3131 shows of the entry barrier.** It is closed. A white aluminium boom with red top and bottom edges rests
at about 1 m in the V fork of a red square-section rest post on a bolted plate. The post carries a small black
photocell box on its face towards the pivot and is bent from a knock. The red-white bollard (red foot, white band,
red top, about 0.87 m) stands just beyond. At an assumed 1.5 m eye height and 15° down, the rest post foot is 2.6 m
ahead and 0.7 m right of the camera, the bollard 3.5 m ahead, and the boom lies along the view direction.

**Where they are.** The Google top-down view is north-up. It is registered to the Esri aerial at 0.0385 m per pixel,
taken from car lengths (0.040) and the island-to-wall distance (0.044). The long wall's north end is set on its aerial
position (-91.4, -67.8). The gatehouse island, narrow planter, brick-and-lawn strip and wall line then agree with the
aerial to about 1–2 m. Both booms' ends are read from it to about 1.5 m:

| Barrier | Rest post | Cabinet end of boom | Boom | Bollard |
| --- | --- | --- | --- | --- |
| Entry (west lane) | (-110.46, -62.02) | (-104.95, -62.87) | 5.6 m, 81° towards the cabinet | (-111.30, -61.87) |
| Exit (east lane) | (-90.36, -64.84), 0.8 m inside the wall line | (-95.21, -64.22) | 4.9 m | none seen |

The entry rest post is 5.5 m west of the first estimate from IMG_3131's phone pin (±4.7 m). The pin was off, so
IMG_3131's camera is corrected to (-107.8, -61.9) in `data/photo_positions.json` and the manifest, with the GPS kept.
The boom's direction in the Google view agrees with IMG_3131's compass heading to within 3°. So the photo's `looksAt`
now follows the compass, replacing the earlier reviewed point, which was 23° off.

**Built.** `src/car-park-barrier.ts` is the asset: `carParkBarrier({ armLength, side })` (white cabinet, hub, boom with
red edges, rest post with fork, plate and photocell) and `barrierBollard()`. Geometry and materials are shared.
`data/picasso_car_park.json` `barriers` holds both placements. `src/picasso-car-park.ts` places them closed on the
paving level, in Layout and with Show details. The rest posts, bollard and cabinets get collision; the booms lift, so
they have none. The map draws each boom line and its posts. Both are graded `estimated` in `data/confidence.json`. The
exit barrier's rest post is not seen close up and is drawn like the entry one.

| View | Image |
| --- | --- |
| IMG_3131 beside the model through its corrected camera (Layout) | [IMG_3131-pair.jpg](../picasso-car-park-barrier/IMG_3131-pair.jpg) |
| Through the same camera with Show details | [IMG_3131-after-details.png](../picasso-car-park-barrier/IMG_3131-after-details.png) |
| Inspect, both barriers from the north (Layout / Show details) | [inspect-both-pair.jpg](../picasso-car-park-barrier/inspect-both-pair.jpg) |
| Inspect, entry barrier close | [inspect-entry-pair.jpg](../picasso-car-park-barrier/inspect-entry-pair.jpg) |
| Inspect, exit barrier close | [inspect-exit-pair.jpg](../picasso-car-park-barrier/inspect-exit-pair.jpg) |

Still open (`picasso-car-park-north-entrance-apron`, task `picasso-car-park-north-entrance`): the barriers stand on
terracotta where the photos have asphalt. The gatehouse island's lawn and kerb, the narrow planter, the brick path,
lawn strip and CALLE DE PICASSO plinth, the ramp, the STOP and ACCESO PLAYA signs and the no-entry sign are not built.
The car-park outline stops short of the entrance.

**Review (25 November 2026, first pass).** An independent reviewer agent opened IMG_3131 at full size and re-derived the
readings at f = 1201.8 px and 15° pitch: rest post 2.68 m ahead and 0.68 m right (2.38–3.04 m for ±3° of pitch),
bollard 3.59 m ahead, and the boom's edges converging about 3° right of the view axis. It approved the pin-based
placement as an estimate after fixes: the boom's end cap removed, "read" not "measured" in the trust, and the
cabinet's collision sized to its box. It also flagged the aerial's reddish ground at the first position, which the
Google registration resolved by moving the barrier 5.5 m west. This is a photographic sign-off of an estimate, not
measured placement approval.

## North entrance ground and gatehouse (25 November 2026)

Task `picasso-car-park-north-entrance`, stage 2 (layout), traced from the same registered Google 3D top-down view
(about 1.5 m) and read against both Street View frames and IMG_3131. The model used to draw the whole entrance as
generic terracotta ground.

- **`data/ground_plan_picasso.json`.** This is the Picasso area's first ground plan, drawn by `src/ground-plan.ts`. It
  adds an `asphalt` finish at the street ribbons' height and four surfaces:
  - `picasso-north-entrance-asphalt`: both lanes and the strip west of the narrow planter. It runs from the Loira and
    Bolivia ribbons to the car-park outline, between the long wall and the brick strip.
  - `picasso-gatehouse-island`: a terracotta apron on a white kerb, where both barrier cabinets stand.
  - `picasso-gatehouse-lawn`: the round lawn bed north and west of the gatehouse, with a brick border facing the entry
    lane.
  - `picasso-entry-planter`: the narrow bed, about 5 m long, on a white kerb. Its tip is just north of the entry
    barrier's bollard (the white kerb nose in IMG_3131).
- **Gatehouse (`picasso_car_park.json` `gatehouse`).** About 3.4 m square and 2.9 m high, white and flat-roofed. It is
  not in the land registry. It is built as a plain block: the window grille, door and signs are left for the detail
  stage.
- **Framework.** The island and planter are cut out of the asphalt (`cut: surface:<id>`, new) and stand raised on
  their kerbs (`raise`, and the new edge `base` puts a kerb on the road asphalt). A raised lawn is drawn as a mesh.
- **Map.** The barriers are drawn thicker (0.6 m line, white posts), so they show at normal zoom. The photo request
  `picasso-car-park-north-entrance` is marked answered by the Google imagery, which removes its red badge from the
  entrance.
- All are graded `estimated`. `check_ground_plan.py` passes.

| View | Layout / Show details |
| --- | --- |
| From above | [ne-overhead-pair.jpg](../picasso-car-park-barrier/ne-overhead-pair.jpg) |
| From Calle Loira, as Street View 03 | [ne-loira-pair.jpg](../picasso-car-park-barrier/ne-loira-pair.jpg) |
| From Calle Bolivia, as Street View 04 | [ne-bolivia-pair.jpg](../picasso-car-park-barrier/ne-bolivia-pair.jpg) |
| The map (Map & photos), zoomed to the entrance | [map-north-entrance.png](../picasso-car-park-barrier/map-north-entrance.png) |

Still open, on `picasso-car-park-north-entrance-apron`:
- the brick path, lawn strip and CALLE DE PICASSO plinth west of the entry lane;
- the ramp between white walls;
- the island's trees and palms;
- the planter's bougainvillea and notice pillar;
- the STOP, ACCESO PLAYA and no-entry signs.

These are photographed in Street View and IMG_3131, but their outlines are partly hidden in the top-down view.
