# Calle Cervantes: levels, steps, and the walls, beds and planters along the lane

Task `cervantes-lane-edges` (Dave, 16 November 2026: start with the Cervantes/Elena junction and
Cervantes from end to end; get the levels right, where the steps and ramps are, and fill the areas
around the path with patio walls, small border walls and planters).

Data: `data/cervantes_lane_edges.json` (beds and planters, drawn by `src/cervantes-lane-edges.ts`),
`data/lane_walls.json` (the two garden walls, drawn by `src/lane-walls.ts`),
`data/cervantes_alberto_steps.json` (the new flight, drawn by `src/ramp-steps.ts`), and the flights
in `data/terrain.json`. Checks: `scripts/check_cervantes_lane_edges.py`, `scripts/check_lane_walls.py`,
`scripts/check_terrain.py`, `scripts/check_levels.py`. Renders and the survey profile:
`docs/reviews/cervantes-lane-edges/`.

Positions along the lane are metres from the Dalí end of the centreline (0 m) to the Picasso end
(138.5 m); offsets are metres off it, north negative. The lane runs straight, so one axis covers it.

## Levels: what the survey and the photos say

The laser survey (PNOA-LiDAR 2020-21, 1 m ground model) was sampled every 0.5 m along the centreline
and 0.4 m and 0.8 m either side of it (`docs/reviews/cervantes-lane-edges/survey-profile.txt`).
Heights are above the middle-pool deck, the model's zero.

| Along the lane | Survey | What is there |
| --- | --- | --- |
| 0-10 m | +1.5 falling to +1.1 | the Dalí apron and the tiled ramp down from the road (already built) |
| 12-42 m | +1.13-1.22, level | the west stretch, photographed level |
| 42.5-47.5 m | +1.13 to +0.53 | **the Elena steps and ramp: 0.6 m** |
| 48-91 m | +0.53-0.57, level | Elena to Alberto |
| 91-93.6 m | +0.54 to +0.27 | **two steps beside a ramp, just west of the Alberto crossing: 0.27 m** |
| 94-138 m | +0.2-0.25, level | Alberto to the Picasso end |

There are no other steps or ramps on the lane.

- **Elena steps and ramp.** The open item said photos 0.4-0.5 m, survey 0.21 m. The 0.21 m came from
  comparison points 3 m apart, both inside the drop. Across it the survey reads 0.6 m. Measured
  against the 0.4 m tread tiles in full-size IMG_2286, the three riser faces are about 0.2 m each
  (0.55-0.65 m), so the photos agree; the earlier figure was an eye estimate. The flight is now
  0.6 m (`data/terrain.json`, `data/levels_survey.json`); before, the model made up the last 0.1 m
  with a slope above the flight.
- **Still open:** the survey's drop is centred about 45 m along the lane, the photo-placed flight
  about 47.6 m (discrepancy `cervantes-elena-steps-position`). The flight, the garden door, its beds
  and the junction lawns all hang off the drain, and the camera pins there are 1.5-4.7 m, so the
  flight is not moved on the survey alone. A solved camera at the junction would settle it.
- **Alberto steps (new).** IMG_2448 and IMG_2449 show two white-faced risers with aggregate nosings on
  the north half of the lane and a smooth ramp on the south half, the same arrangement as at Elena.
  The survey places the drop (foot at 93.6 m, top at 91.2 m) and its height.

`scripts/lidar_check.py grid` now writes this flight. A full run of the grid also changes about 370
cells elsewhere (round the north pool and the south lanes, none on Cervantes) because the model has
changed since the grid was last written; only the flights were taken into `data/terrain.json` here.

## What is built along the lane

| Feature | Where | From | Level |
| --- | --- | --- | --- |
| `cervantes-north-garden-wall-west` | north side, 13.5-48.6 m, 2.0 m off, 1.7 m high | IMG_2274, IMG_2468, IMG_2275, IMG_2264 | estimated |
| `cervantes-north-bed-west` | the bed in front of it, at grade behind the lane kerb, which is lowered from 0.65 m to 0.15 m | IMG_2274, IMG_2468, IMG_2264, IMG_2467 | estimated |
| `cervantes-north-bed-house-1`, `-2`, `-3` | narrow kerbed beds at the north house fronts, 71.4-76.4 and 79.8-89.1 m | IMG_2453, IMG_2796, IMG_2797, IMG_2450, IMG_2794, IMG_2449 | estimated |
| `cervantes-south-garden-wall-alberto` | south side, 78.2-93.0 m (to the corner where it turns down Alberto), 2.1 m high, doors at about 83.5 and 90 m | IMG_2795, IMG_2450, IMG_2794, IMG_2449, IMG_2448 | estimated |
| `cervantes-south-wall-foot-bed-1`, `-2`, `-3` | narrow jade bed at the foot of that wall, broken at the doors | IMG_2449, IMG_2450, IMG_2794 | estimated |
| `cervantes-alberto-corner-bed` | north corner, 89.2-93.6 m: lantana, then a tall clipped hedge, at grade | IMG_2448, IMG_2794 | estimated |
| `cervantes-east-north-planter` | north, 110.8-113.8 m, raised, clipped hedge | IMG_2443, IMG_2442 | estimated |
| `cervantes-east-north-shrub-bed` | north, 115.4-118.4 m, between the second brick flight and the seat | IMG_2443 | estimated |
| `cervantes-east-north-brick-planter` | north, 120.2-123 m, brick-coped | IMG_2442, IMG_2443 | estimated |
| `cervantes-east-north-thuja-planter` | north, 123-135 m, to the end of the lane | IMG_2444, IMG_2443 | estimated |
| `cervantes-east-south-planter` | south, 110.6-119 m, raised, clipped hedge | IMG_2443, IMG_2442 | estimated |

- **West stretch.** The model had open paving from the lane's kerb wall to the houses 6 m back. The
  photos show a white garden wall with bougainvillea over it and banana behind, set back behind a
  planted bed. Its line, 2.0 m off the centreline, is where the three photographed patio partitions
  behind it already ended and the Elena garden door's wall stands; it meets that wall.
- **East of Elena to Alberto.** The south side is one tall white wall carrying the CALLE DE MIGUEL and
  ALBERTO plaques, with jade at its foot and two brown doors; the wall built east of Elena stopped at
  78.2 m and this carries it on, on the same line, to the corner at about 93 m where it turns down
  Calle Alberto. The north side is house fronts with grilles and lanterns, a narrow planted
  strip at their foot, broken by the arched porch at 76.5-79.6 m.
- **Alberto to the Picasso end.** Raised white planters with clipped hedges on both sides west of the
  seat, a second brick flight and a shrub bed on the north side, a brick-coped low wall beside the
  white seat pillar, and a tall thuja hedge on a planter wall to the end of the lane; the end house
  stands on the lane on the south side, with lawn behind a low kerb between it and the planter.
- The beds' kerbs and soil are structure: they show in Layout, are solid, and are on the map. The
  planting (dracaena and oleander, lantana, clipped box and thuja hedges) shows with **Show details**
  only, in 0.5-0.6 m pieces, each passing the route-clearance guard with its whole footprint.

## Not built, and open

- The white seat pillar with its azulejo panel and the two brick-edged flights up into the north
  garden, at about 119 m and 114-115 m (`gap:cervantes-east-seat-steps`): the garden behind and its
  level are not visible. The lawn and low kerb on the south side from 119 m to the end house
  (`gap:cervantes-east-south-lawn-kerb`), and the small raised box at the Alberto house corner.
- A second door in the existing south wall at about 72.5 m (IMG_2795, IMG_2796;
  `gap:cervantes-south-wall-door-72`): that wall belongs to `data/cervantes_east_south_patios.json`,
  which has its own review.
- The other four 0.65 m lane-edge walls of `data/cervantes_patio_walls.json` (south-1, -2, -3 and
  north-east) still look like 0.15-0.2 m kerbs or house plinths in the November photos (discrepancy
  `cervantes-kerb-walls-height`); only the north one along the new bed was lowered.
- The gardens behind the south wall (78-95 m) and the patios behind the north wall are untraced; they
  stay as plain paving.
- The north lawn at 96-110 m and the corner between Alberto north and the lane were not changed.

## Independent review (17 November 2026)

A second agent that did not make the change compared the full-size photos, the survey profile, the
Esri strips and Inspect renders (Layout and Show details), reading positions from pixel rows on the
ground plane against the 0.4 m tiles. First pass:

- Elena 0.6 m: approved with notes (the misfit at 46-47 m is up to about 0.4 m, not 0.3; ask for a
  solved camera before detail goes on the junction). Both are now in the discrepancy.
- Alberto steps: approved (risers at about 0.45 and 0.9 m from the crossing edge, 0.22-0.27 m in all).
- North garden wall: approved with notes. North bed: **rejected** as a 0.6 m raised box; the photos
  show an at-grade bed behind a low kerb. Fixed: bed 0.15 m, the 0.65 m kerb wall in front lowered.
- South wall: **rejected**; it ran 1.6 m past the Alberto corner, and IMG_2794 shows a second door.
  Fixed: ends at 93.0 m, doors at about 83.5 and 90 m, a jade bed at its foot.
- North house-front beds: approved (the misnamed one renamed; the bed now runs on to the corner).
- Alberto corner planter: **rejected**; it is an at-grade bed, not a raised box. Fixed.
- East-end planters: brick and thuja approved; the north and south hedge planters **rejected** as too
  long (one over a second brick flight and a shrub bed, the other over lawn). Fixed by depth against
  the seat in IMG_2443; the rest recorded as gaps.
- Planting stays inside its beds and off the lane and the steps.

## Limits

No camera is solved. Positions come from the photos read against the lane tiles (0.4 m), the registry
house fronts and the existing walls, good to about 1 m along the lane and 0.2 m across; heights are
by eye. The level profile is the survey's. This is a structure pass for review in Inspect, not
measured placement approval (`docs/PLACEMENT_VERIFICATION.md`).
