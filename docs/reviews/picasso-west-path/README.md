# Calle de Picasso: the footpath on the main car park's west side

Task `picasso-west-path`, 25 November 2026. Dave asked for "the path and slope, including the steps and
ramps, for Calle Picasso on the side of the main car park", and confirmed it is the path on the car park's
**west** side: the footpath behind the hedge strip at the back of the west bays, named by the
CALLE DE PICASSO plinth at the north entrance (IMG_3131). Until now the model carried a 4 m asphalt
"Picasso car-park access" line from Google's standard map, about 2 m east of the path, inside the
car-park outline.

## Stage 1: what the sources can and cannot fix

| Source | Can fix | Cannot fix |
| --- | --- | --- |
| IMG_3131 (camera corrected to (-107.8, -61.9), unsolved) | the path's north end: terracotta strip between the lawn with the plinth and the hedged garden walls, joining the Juan Gris paving | anything south of the lawn strip |
| Google 3D top-down (reference/google-maps/05, registered to the aerial about 1.5 m) | the three strips at the north end: house-side path, lawn strip, brick path along the asphalt | south of about 10 m |
| Google standard map (reference/google-maps/01) | the path's name and that it runs from the north entrance to Calle Eva | its position to better than a few metres |
| Esri aerial z19 (0.24 m per pixel) | the path's line: a pale band under and between trees | its paving, edges, steps or ramps |
| Laser survey (PNOA-LiDAR 2020-21 1 m ground, 2014-15 2 m) | the path's levels and where they change, to about 0.5-1 m along it | whether a change is steps, a ramp or both |

No camera is solved here and no photo shows the path between the plinth and Calle Eva. Photo request
`picasso-west-path-drops` asks for views up the path at both drops and along the hedge strip.

## Stage 2: layout

The aerial was straightened along the west bay row's car line, (-110.2, -57.2) to (-61.5, 26.3)
(`aerial-measures.json` of the car-park review), and brightness and colour profiles were taken across it
every 3 m ([aerial-straightened.jpg](aerial-straightened.jpg)). From west to east there are house garden
walls, a pale tiled band, a green hedge strip with a thin white kerb line at about 4.3 m, and the bays.
The band's centre is straight at 8.41 - 0.01·s m west of the car line (s metres along it), 0.45 m rms
over 32 stations (8 stations where the window caught a bright house wall are left out). Its width is
about 1.5-2 m; 1.8 m is used.

- `street_layout.json picasso-access` is now **Calle de Picasso**, 1.8 m terracotta, from
  (-121.87, -60.35) on the Juan Gris paving line by the plinth's lantern, straight to (-61.1, 41.5),
  then the old line's last 9 m to the end of Calle Eva at (-55.38, 48.14). The old name stays as an
  alias, and the service road east of the wall loses its "Calle de Picasso" alias.
- Calle Cervantes crosses the path at (-78.2, 12.8) and runs on through the hedge strip into the car
  park (a pale band on the aerial at s 75-78). The street and boundary checks now require Cervantes to
  cross Calle de Picasso instead of ending on the old line.
- The car-park outline's west edge (`mainParkingRing`) overlay the path and hedge strip. It is moved to
  4.0 m west of the bays' car line, with a gap out to 6.2 m from s 74.5 to 78.5 where Cervantes comes
  through. The north and south edges are unchanged (discrepancy `picasso-car-park-west-edge-gardens`).

Two neighbouring estimates stood on the path and are moved, with the reason in each one's basis:

- `lane_walls.json juan-gris-east-screen` (1.78 m, estimated from unsolved IMG_3134) stood right across
  the path's mouth where it leaves Juan Gris, which IMG_3131 and the Google top-down view show open. It and
  the low hedge wall west of it are slid 3.1 m west along their line, so the screen ends at the path's west
  edge. IMG_3134 may show the two in the opposite order (discrepancy `juan-gris-east-walls-order`).
  `check_lane_walls.py` now keeps every lane wall off Calle de Picasso.
- `cervantes_lane_edges.json cervantes-east-north-thuja-planter` ran 0.4 m onto the path at the
  Cervantes crossing; it now stops 0.1 m short of the path's west edge (s 134.5 along Cervantes).

## Stage 3: levels

Sampled every 0.5 m along the new centreline ([survey-profile.png](survey-profile.png)): the path lies on
three level stretches while the car park beside it falls steadily.

| Along the path | Survey | Car park 8 m east |
| --- | --- | --- |
| 0-39 m | +1.16-1.20 m | +1.3 falling to +0.3 |
| 41.5-80 m | +0.71 falling gently to +0.62 m | +0.3 to 0.0 |
| 83.5-124 m | +0.15-0.22 m (Cervantes level) | about -0.1 |
| 124-126 m | drops 0.24 m to Calle Eva | |

The two drops, 0.45 m and 0.42 m over 2.4 and 2.8 m, are built as flights in
`data/picasso_path_steps.json`: three steps on the house half of the path beside a ramp on the hedge
half, the resort's form at Cervantes/Elena, Cervantes/Alberto and the middle pool's south-west corner.
`scripts/lidar_check.py grid` writes them into `data/terrain.json` `ramps` from the survey's rise between
each flight's comparison points; `src/ramp-steps.ts` draws the treads. `scripts/check_terrain.py` checks
each flight climbs the survey's rise, every tread stays above the ramp beside it, and the path is level
4-6 m either side. The model ground on the path matches the survey to a few centimetres (black line in
the profile).

The terrain grid itself is unchanged. Regenerating it from today's inputs would also change 375 cells
elsewhere in the resort (north lanes, Jorge, Guillermo, up to 0.18 m), because the committed grid predates
several later inputs. Those are not part of this task, so only the two new flight entries were taken from
the generator's output.

Not built, recorded in discrepancy `picasso-west-path-open-levels` with photo request
`picasso-west-path-drops`: the edge between the hedge strip and the bays, which the survey has 0.4-0.9 m
high (it stays the survey's slope), the 0.24 m dip before Calle Eva, and a probable side path where a pale
band crosses the hedge strip at the upper drop.

## Grades

The path and both flights are graded **inferred** in `data/confidence.json`: seen on the aerial and
the survey, photographed only at the north end. The car-park outline keeps **estimated**, with its why
updated for the new west edge. The form of each drop (steps
beside a ramp, the number and side of the risers) is a guess from the resort's other lanes.

## Inspect

Renders in this folder: `inspect-*.png` (Layout and Show details).
