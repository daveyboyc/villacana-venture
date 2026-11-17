# Cervantes/Elena ramp, steps and the Elena 24 garden door

Dave, 17 November 2026: "the ramp and steps in front of the Elena 24 door are not in the correct place".
Open discrepancy `cervantes-elena-steps-position`. Task `elena-junction-lawns-roof`.

## Evidence

| Source | What it says |
| --- | --- |
| IMG_2262 (ground, at the junction looking along Cervantes) | The foot drain's south end meets the near lawn's north-east kerb corner, where the Elena south lane kerb turns along Cervantes. The ramp runs up the lawn's north side; the lawn's north kerb from the corner to the measured west-wall corner (CALLE ELENA sign) is about 10-11 rows of 0.4 m tiles. |
| Near lawn kerb (measured, `docs/reviews/elena-junction-lawns-roof`) | The corner lies on the lane kerb measured through two solved roof cameras, 4.6 m from the measured wall corner, as the tile count. So the drain line belongs through that corner: **2.0 m west** of the old foot along the lane. |
| PNOA-LiDAR 2020-21 (1 m ground model) | Along the lane the ground is level to 2.0 m west of the old foot, then rises about 0.55 m over the next 3-4 m (smoothed by the 1 m grid): the flight starts 2.0-2.5 m west of the old foot. The 2014-15 2 m survey puts it about 0.7 m west; plan registration of either is about 1 m. |
| IMG_2196 (ground, facing the door) | The drain is 1.4-1.75 m west of the door's centre, read against the 0.4 m lane tiles; the model had 0.72 m. |
| ELENA-ROOF-2026-11-17, IMG_2358 (solved roof cameras) | The door, cast from its head and its foot on the patio side, is 0.6-0.9 m west of its old place (4-8 m from the cameras, so about 0.5 m either way). |

## Changes

- `data/cervantes_elena_steps.json` foot and direction point, `data/dali_cervantes.json` ramp and the two Cervantes lane vertices it shares (the lane is straight there, so its line is unchanged), `data/terrain.json` ramp entry and the grid cells round the junction (`scripts/lidar_check.py grid`, other cells kept), `public/map/skeleton.json` the same ramp and lane vertices, `data/levels_survey.json` item positions: **2.0 m west** along the lane. The new drain line passes 0.04 m from the lawn corner.
- `data/cervantes_garden_door.json` door, steps, patio and east planter: **1.0 m west**, between the roof cameras (0.6-0.9) and the drain-to-door spacing of IMG_2196 (1.2); both within about 0.3 m.
- The hedge bed between the door and the flight stretched with them; its west end stops 0.25 m short of where the rising ground would bury its 0.425 m top.
- `data/lane_walls.json` `cervantes-north-garden-wall-west`: east end follows the moved door wall.

`before-after.jpg`: IMG_2328, IMG_2196 and IMG_2286 beside renders from the same rough starting poses before and after (Show details). The drain now runs past the west side of the door's steps, with the flight beyond it, as in the photos.

## Limits

- Not a measured placement: no ground camera at the junction is solved (IMG_2262's lean and the corner geometry defeated a quick solve). The positions are good to about 0.3-0.5 m.
- Still different: the 0.65 m white wall between the ramp and the lawn is a low rounded kerb in IMG_2262, IMG_2286 and IMG_2328 (`cervantes-kerb-walls-height`, open).
- Checks: check_terrain, check_cervantes_garden_door, check_cervantes_lane_edges, check_lane_walls, check_levels, check_boundary_reference and the junction-lawn checks pass. check_cervantes_east_hedge, check_cervantes_north_patios, check_cervantes_patio_walls and check_dali_threshold fail on unchanged main as well.

## Review

Second agent (`REVIEW.md`): approved as an estimated correction, not a measured placement. Its own readings: drain
1.1 m from the door's bottom step and 1.65-1.7 m from the door centre in IMG_2196 (model 1.12 and 1.72); roof
cameras 0.6-0.75 m for the door (door 1.0 m accepted at about ±0.4 m); LiDAR 2021 puts the foot 2.0-2.5 m west, 2015
1.0-1.5 m. Open, not blocking: the lawn's north kerb counts 10-10.5 tile rows (4.0-4.3 m) against 4.6 m in the model;
the door looks 1.3-1.6 times too wide from the roof; the grid cell at (-152, 54) went from 0.59 to 0.87 m once the
moved patio no longer holds it. That cell is in Elena 24's patio east of the door (raised about 0.45 m above the
0.53 m lane), not on the lane.
