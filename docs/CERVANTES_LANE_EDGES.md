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
| `cervantes-north-bed-west` | the bed in front of it, between the existing 0.65 m kerb wall and the wall | IMG_2274, IMG_2468, IMG_2264, IMG_2467 | estimated |
| `cervantes-north-bed-house-1`, `-2`, `-3` | narrow kerbed beds at the north house fronts, 71.4-76.4 and 79.8-89 m | IMG_2453, IMG_2796, IMG_2797, IMG_2450, IMG_2794, IMG_2449 | estimated |
| `cervantes-south-garden-wall-alberto` | south side, 78.2-94.6 m, 2.1 m high, one door | IMG_2795, IMG_2450, IMG_2794, IMG_2449, IMG_2448 | estimated |
| `cervantes-alberto-corner-planter` | north corner at the crossing, 91-94.5 m | IMG_2448 | estimated |
| `cervantes-east-north-planter` | north, 110.8-118.4 m | IMG_2443, IMG_2442 | estimated |
| `cervantes-east-north-brick-planter` | north, 120.2-123 m, brick-coped | IMG_2442, IMG_2443 | estimated |
| `cervantes-east-north-thuja-planter` | north, 123-135 m, to the end of the lane | IMG_2444, IMG_2443 | estimated |
| `cervantes-east-south-planter` | south, 110.6-123.4 m, up to the end house | IMG_2443, IMG_2442 | estimated |

- **West stretch.** The model had open paving from the lane's kerb wall to the houses 6 m back. The
  photos show a white garden wall with bougainvillea over it and banana behind, set back behind a
  planted bed. Its line, 2.0 m off the centreline, is where the three photographed patio partitions
  behind it already ended and the Elena garden door's wall stands; it meets that wall.
- **East of Elena to Alberto.** The south side is one tall white wall carrying the CALLE DE MIGUEL and
  ALBERTO plaques; the wall built east of Elena stopped at 78.2 m and this carries it on, on the same
  line, to the crossing. The north side is house fronts with grilles and lanterns, a narrow planted
  strip at their foot, broken by the arched porch at 76.5-79.6 m.
- **Alberto to the Picasso end.** White raised planters with clipped hedges line both sides, a
  brick-coped low wall beside the white seat pillar, and a tall thuja hedge on a planter wall to the
  end of the lane; the end house stands on the lane on the south side.
- The beds' kerbs and soil are structure: they show in Layout, are solid, and are on the map. The
  planting (dracaena and oleander, lantana, clipped box and thuja hedges) shows with **Show details**
  only, in 0.5-0.6 m pieces, each passing the route-clearance guard with its whole footprint.

## Not built, and open

- The white seat pillar with its azulejo panel and the two brick-edged steps up into the north garden
  at about 119 m (`gap:cervantes-east-seat-steps`): the garden behind and its level are not visible.
- A second door in the existing south wall at about 72.5 m (IMG_2795, IMG_2796;
  `gap:cervantes-south-wall-door-72`): that wall belongs to `data/cervantes_east_south_patios.json`,
  which has its own review.
- The existing 0.65 m lane-edge walls west of Elena (`data/cervantes_patio_walls.json`) look like
  0.15-0.2 m rounded kerbs in the November photos (discrepancy `cervantes-kerb-walls-height`).
- The gardens behind the south wall (78-95 m) and the patios behind the north wall are untraced; they
  stay as plain paving.
- The north lawn at 96-110 m and the corner between Alberto north and the lane were not changed.

## Limits

No camera is solved. Positions come from the photos read against the lane tiles (0.4 m), the registry
house fronts and the existing walls, good to about 1 m along the lane and 0.2 m across; heights are
by eye. The level profile is the survey's. This is a structure pass for review in Inspect, not
measured placement approval (`docs/PLACEMENT_VERIFICATION.md`).
