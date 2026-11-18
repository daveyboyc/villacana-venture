# Handover: Elena south junction lawns (17-18 November 2026)

Dave sent a morning photo from the Elena 24 roof down Calle Elena south to the middle pool
(`public/photos-ref/ELENA-ROOF-2026-11-17.jpg`): "this angle still needs work". Task `elena-junction-lawns-roof`.
This file is where a new chat should start. Read `AGENTS.md` first, then this, then
`docs/reviews/elena-junction-lawns-roof/README.md` (the full log, with the review files beside it).

## Where things stand

The view now matches the photo in layout and most planting. Merged to `main` in PRs #264-#270.

| What | State | Basis |
| --- | --- | --- |
| Roof cameras | ELENA-ROOF-2026-11-17 and IMG_2358 solved (±0.25-0.5 m) from the Elena 24 parapet | `data/photo_poses.json` |
| West wall with two doors, both lawns, cross path | Measured: 21 points 0.10 m rms; second-agent approval with limits | `data/placement_reviews.json` `measured-elena-junction-lawns-west-wall` |
| Cervantes ramp, steps, drain; Elena 24 garden door | Moved 2.0 m / 1.0 m west; estimated, reviewed | `docs/reviews/cervantes-elena-steps-position/` |
| Kerb between the ramp and the lawn (0.15 m); Cervantes patio walls drawn at their recorded height | Done | `src/cervantes-walls.ts` fix |
| Patio wall with a brown door at the CALLE ELENA corner | 1.9 m after review | `lane_walls.json:cervantes-elena-patio-front-wall` |
| East hedge beds, cypress wall, plain faces | Reviewed (`STRUCTURE-REVIEW.md`); cypress wall estimated to about 1 m | `data/elena_south_beds.json`, `lane_walls.json` |
| Detail (Show details): clipped trees, cypresses, climbers, lamp, CALLE ELENA plaques, shrubs, corner-house ledge, small window | Done | `data/elena_junction_details.json`, `src/elena-junction-details.ts` |

## Open, and what settles each

All are in `data/discrepancies.json` (area `elena` or `cervantes`). Each one waits on a photo now listed in
`data/photo_requests.json`, which shows as a red spot on the map.

| Discrepancy | Problem | Settled by |
| --- | --- | --- |
| `elena-lawn-north-edge` | The near lawn's north kerb (Cervantes south side) is hidden from both roof cameras. Roof readings say it is 0.6-0.8 m too far south; IMG_2286's tile count says the lane is 0.25 m wider than modelled. They conflict. | `cervantes-elena-junction-square`: solve a ground camera at the drain |
| `cervantes-elena-steps-position` | The flight moved 2.0 m west on IMG_2262 and the 2021 laser survey. It is estimated, not measured. | the same request |
| `elena-south-east-beds` | The two roof cameras disagree by 0.5 m on the patio wall behind the hedge, so the hedge is thin. | `elena-south-east-patio-wall-square` |
| `elena-junction-far-end` | The cypress wall's line is estimated to about 1 m. | `elena-south-cypress-wall-gate` |
| `elena-junction-cervantes-door-wall` | The west wall's north end may be too tall; its top is hidden by planting. | the same junction photos |

## How the work was done (reuse it)

- **Solve a camera.** Match pixels to model points in `data/photo_poses.json`, then
  `python3 scripts/photo_pose.py solve <photo> --write` (see `docs/PHOTO_ALIGNMENT.md`). The best controls were:
  - the near parapet of the camera's own roof (`building:<id>:<i>-<j>:top`);
  - upright edges;
  - a far pool edge;
  - a mapped lane edge.

  Without the parapet, IMG_2358 sat 2.5 m back inside its own roof.
- **Measure through it.** Cast a pixel onto the model ground (`scripts/measure_elena_junction_lawns.py` has `cast`),
  or onto a known vertical plane (a wall face) to read heights and positions along it. Report residuals signed.
  Pick at the grass line, not up the lit wall face: the first fit was rejected for exactly that.
- **Depth limits.** One roof camera fixes direction, not depth. At 20 m a 1° pitch error moves a ground point
  about 1 m along the ray. Hold far points out of fits.
- **Review.** A second agent reviews each stage (structure before detail) and records its verdict in the review
  folder and in `data/placement_reviews.json`. It rejected two things; both reviews were right.

## Gotchas

- **Rendering:** `node scripts/shoot_views.cjs` needs
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` in this container. Pin-mode
  renders time out under software GL, so use `--pose` (or `--pose --initial` with a rough starting pose).
- **Regenerating shared files drifts unrelated areas:**
  - `python3 scripts/lidar_check.py grid` and `scripts/build_skeleton.py` change cells, paseo points and so on far
    from your edit. Patch only what you changed (the junction cells, the ramp vertices).
  - `lidar_check.py` needs `rasterio`, `pyproj`, `scipy` and `matplotlib`, and `python3 scripts/lidar_check.py fetch`
    for the tiles.
- **Shared route guard:** decoration must keep its whole footprint 0.75 m + its radius from a lane centreline
  (half the 1.2 m lane plus 0.15 m). Beds right at a lane edge need small, back-set planting pieces. Photographed
  trees whose crowns overhang a kerb use `canopyOverhangs` (trunk 0.3 m only).
- **Before you blame your change:** `test:layout` ("South Dalí approach") fails on `main` too, and the placement
  gate is red for any measured change until `loop-measured-approval` lands.
