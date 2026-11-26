# Calle Pintor Picasso from the hotel's low block to the beach

Task `picasso-service-road-levels-and-beach`. On 26 November 2026 Dave circled, in Inspect, the stretch from the end of
the mapped road (at the hotel's low block, registry `6465301UF1366N_part2`) down to the paseo. The model drew it as
generic terracotta and lawn. This pass lays it out (stages 1 and 2, with the survey's levels) and adds the first detail.

## Stage 1: photo coverage

No camera here is solved. Pins are good to 2.5-8 m.

| Camera | Pin (x, z) ± m | Sees |
| --- | --- | --- |
| IMG_3118 | (7.7, 73.9) ± 7.5 | North-west from the lane's north end: on the left, the white tower with an aerial, a two-storey building with a 90 MILES sign and white walls with doors; on the right, the hotel, plane trees and low white buildings |
| IMG_3119 | (6.5, 69.6) ± 4.2 | The forecourt: the tower's base and a blue lorry on the left; grey containers and small utility sheds on the right |
| IMG_3105, IMG_3106 | (-36, 22), (-31, 27) ± 4.7 | The whole road south-east to the sea from 40-70 m away: the tower and the white buildings on the west side |
| IMG_2613 | (31.1, 97.7) ± 4.7 | North up the lane from the paseo: white walls with doors on the left; on the right, the long building on a raised terrace behind a low wall with a red coping, with deep eaves |
| IMG_3065-3068 | (33-41, 90-95) ± 2.5 | The lane's mouth at the paseo: a blue-and-white bollard, a drain grate, the white pillar where the pool lawn's green-bar fence on sandstone begins, and chain-link on sandstone opposite |

**Gaps.** No photo shows the lane's middle stretch close up, the forecourt's sheds square-on, or the tower's base. The
photo request `picasso-service-road-to-beach` stays open.

## Layout and levels (built, estimated)

The registry outlines, the Esri aerial and the PNOA-LiDAR surface model are in
[lidar-heights.png](lidar-heights.png). It shows height over the ground in colour and ground contours relative to the
datum.

| Piece | Where | From |
| --- | --- | --- |
| Road (`picasso`) | Continues from (-13.66, 45.75) round the low block's corner, (-9.5, 53.5), (-2.0, 63.0), to (3.5, 70.0); 6 m | Aerial's pale road surface; IMG_3118, 3119 |
| Forecourt (ground plan, asphalt) | Between the low block, the pool building's north-east face and the plane-tree garden | Aerial; IMG_3118, 3119 |
| Lane (`picasso-beach-lane`, new street) | (3.5, 70) to the paseo at (27.6, 97.24), midway between the faces either side; 4 m | Aerial; IMG_2613, 3067 |
| Lane concrete (ground plan) | Wall to wall either side of the ribbon | IMG_2613, 3067 |
| Tower | 2.4 m square at (-6.5, 73.5), top 5.5 m over the datum, about 7 m above the road | Survey peak; IMG_3105, 3106, 3118, 3119 |
| East terrace | Low white wall, 0.9 m with a red coping, on the lane edge of registry strip `6465801UF1366N_part2`, which has 0 storeys; deep eaves over the strip at the long building's roofline in the model | IMG_2613; survey reads 2.33 m across the strip |
| Lane mouth (Show details) | Blue-and-white bollard and a drain grate across the lane | IMG_3066, 3067, 2613 |

**Widths.** The faces either side stand 9.5 m apart at the lane's north end and 5.4 m at its mouth, so the street
ribbon is 4 m and the concrete fills the rest.

**Levels.** The survey has the road at:

| Point | Level |
| --- | --- |
| Low block | -0.85 m |
| (-9.5, 53.5) | -1.00 m |
| (-2, 63) | -1.21 m |
| Forecourt | -1.44 m |
| Lane | -1.59 m, then -1.83 m |
| Paseo | -1.96 m |

The terrain grid is already the survey, so the ribbon follows it.

**Checks.**
- `scripts/check_picasso_beach_lane.py`, new. It checks that the lane:
  - joins the road and ends on the paseo;
  - stays clear of every standing house and the lawn wall;
  - and that the tower stays off the road, the terrace keeps the registry strip, and the confidence entries exist.
- `check_street_layout.py` now expects 19 streets and checks the lane's join to the road.

**Still open.**
- the forecourt's utility sheds and grey containers (IMG_3119);
- the 90 MILES building's own form (IMG_3118);
- the lane's darker strip at the mouth;
- the white pillar and chain-link corners at the paseo, if not already in the seafront fence;
- the pavement level by the utility row further up (`picasso-service-pavement-level`);
- no camera solved.
