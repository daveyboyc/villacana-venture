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
  are seen on the aerial only. No photo looks across the west side.
- **Round island.** A hedge-ringed bed on a white kerb with tall palms, a candelabra euphorbia and a fan
  palm clump (IMG_3100).
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
| IMG_3120-3122, IMG_3105, IMG_3106 | service road edges and hotel/utility fronts | the car park, which is behind the wall |
| IMG_3126-3128 | hedge line east of the road | the car park |
| IMG_3130, IMG_3131 (pins ±5-21 m) | the barrier and plinth, once the corner is identified | which corner it is, from these alone |
| none | | the west row, its hedge and anything behind it; the central row from inside the car park; the wall's inner face |

Best first solves: IMG_3100 together with IMG_3099 (same spot, two headings, registry corners in both),
then IMG_3125 against the road edges and the utility building.

**Photos requested** (`data/photo_requests.json`, linked from `data/evidence_requests.json`):
`picasso-car-park-centre-row` (priority 1: two opposed views along the central row with the wall in frame),
`picasso-car-park-west-side`, `picasso-car-park-wall-inner-face` and `picasso-car-park-north-entrance`.
The old `picasso-lane` request is answered by IMG_3105, 3106 and 3120-3129.

## Layout against the aerial (stage 2 readings)

Read by eye on 4-5x gridded zooms of the Esri World Imagery zoom 19 mosaic (`public/map/ground.jpg`,
about 0.24 m per pixel). Readings are good to about ±0.5-1 m on the wall and ±1.5 m on bay rows, which are
read from car positions. Palm crowns are not used, because tall palms are displaced on the imagery. The
numbers are in [aerial-measures.json](aerial-measures.json), and the overlay is [plan.jpg](plan.jpg).

| Station z | Wall (aerial) | Ring east edge | Middle kerb | Centre row: aerial / model | Picasso road centre |
| --- | --- | --- | --- | --- | --- |
| -60 | -86.7 | -75.4 | -82.4 | -97.5 / -92.7 | -79.7 |
| -45 | -77.6 | -68.1 | -75.1 | -88.5 / -85.4 | -71.1 |
| -30 | -68.4 | -60.8 | -67.8 | -79.5 / -78.0 | -62.5 |
| -15 | -59.3 | -53.5 | -60.5 | -70.5 / -70.7 | -53.8 |
| 0 | -50.2 | -46.2 | -53.2 | -61.5 / -63.4 | |
| 10 | -44.1 | -41.3 | -48.3 | -55.5 / -58.5 | |

The values are x in model metres. Recorded discrepancies in `data/discrepancies.json` (task `ground-plan-picasso`):

- `picasso-car-park-long-wall-missing`: the wall is not built. Inspect shows the car park and road as one surface.
- `picasso-car-park-ring-over-road`: the outline's east edge lies up to 11 m east of the wall, over the road and garden.
- `picasso-car-park-centre-row-rotated`: the central row is about 6° off the wall-parallel aerial row, by up to 3 m at its ends. The west row matches within 1-2 m.
- `picasso-car-park-island-and-palms`: the island is placed within 1 m, but its radius is 4.5 m against about 5.5 m, and it has no kerb, hedge or palms.
- `picasso-car-park-south-step`: the azulejo step, kerbs and tiled walk at the south end are missing.
- `picasso-access-off-aisle`: the mapped access line runs about 7 m west of the west bays, through gardens.
- `picasso-road-north-east-of-wall`: the road centreline drifts east of the wall-parallel line at the north end.

None of these is corrected here. Under the measured-approval rule, a correction needs a solved camera
plus the aerial (or two solved cameras) within 0.3 m rms and a second agent's review. The aerial alone is
not enough. The wall line is the obvious first correction once IMG_3125 or IMG_3100 is solved.

## Inspect now

| View | Layout and Show details |
| --- | --- |
| Overhead, north half | [cp-overhead-pair.jpg](cp-overhead-pair.jpg) |
| South end, looking towards the road | [cp-south-pair.jpg](cp-south-pair.jpg) |

Rendered with `scripts/shoot_inspect.cjs` (`cp-overhead -52,-45,95,70,0` and `cp-south -56,-10,40,35,180`).
