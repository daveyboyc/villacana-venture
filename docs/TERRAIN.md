# Ground heights

From Dave (2026-10-13): the Pintor Dalí side is about half a metre higher than
the middle of the resort, and the change is mostly at short ramps on the lanes.
The laser survey confirms the Dalí side is higher (0.6-1.9 m) and shows the whole
block falling about 3 m towards the main pool and the paseo; the ground now follows it.

## What is built

- `data/terrain.json` is a 2 m grid of ground heights from the national laser survey
  (PNOA-LiDAR 2020-21 ground model, 1 m, © IGN, CC BY 4.0, via REDIAM). Zero is the middle pool
  deck (5.05 m above sea level in the survey). `scripts/lidar_check.py grid` writes it from the
  cached survey tiles, which stay out of the repository; `siteY` in `src/terrain.ts` samples it
  on triangles (each 2 m cell split along its diagonal). Do not edit the grid by hand: change
  the generator and rerun it.
- **Under houses and pools** the survey cells are dropped and filled from the open ground
  around them, then smoothed; houses still stand at one floor datum (the height under
  their middle).
- **Pool decks are held level** at the surveyed deck, in whole centimetres: north +0.82,
  south +0.12, middle +0.02, main and toddler pool −2.83 (one shared deck) (the lowered area adds the 3 m drop to the grid, since the
  model draws that lawn `LOWER_POOL_Y` below the street).
- **Photographed flights stay exact.** The survey grid softens steps, so each flight in
  `ramps` (the Cervantes steps and the middle pool south-west and north white steps) is laid
  as level ground, a straight climb over the flight and level ground above, blending into the
  grid within 3 m (less below the north white steps, whose foot is 2.9 m from the middle pool).
  Their rise is the survey's where it falls inside the photo range; the Cervantes steps keep the
  photo-read 0.5 m, as the survey measures only 0.21 m there (open in `docs/LEVELS.md`).
- **Raised terraces and patios** are masked out of the survey (it reads the patio as ground)
  and held at the ground at their foot, so `src/raised-terraces.ts` does not lift them twice.
  The south Dalí approach is held at the survey level of its foot.
- **Kept on the old datum:** the strip 4 m behind the paseo wall stays at zero so the
  photographed 1 m wall keeps its height, and seaward of the fade line (turned-frame z
  150-158 m) the seafront heights take over as before. The survey puts the gardens behind the
  wall 0.1-0.6 m higher. The lowered main-pool area's south-west corner, where the survey
  climbs well above the lawn (the Guillermo cut), keeps the lawn level: task
  `guillermo-descent-recheck`.
- **Before this (until October 2026)** the rule was a single 0.5 m rise at a guessed foot line
  on the Dalí side. Over half the open ground was more than 0.5 m off the survey.

## Measured against the laser survey

`scripts/lidar_check.py report` compares the exported model with the survey
(docs/reviews/lidar-levels). Before and after numbers for this grid are in
`docs/reviews/terrain-from-lidar/README.md`.

## How it is applied

The scene is still built flat. Just before the first frame `drapeScene` lifts
it: houses move as a whole to the height at their middle (the Silvia passage
house at the middle of its passage floor), details fixed to a house move with it,
and long things (the ground sheet, roads, the car park), or anything else on sloping ground
away from a house, are bent to follow the ground. Bending cuts each triangle along the survey
grid's cell edges and diagonals, where the ground is flat, so stacked surfaces (sheet, car park,
lawn, lane) keep their few-centimetre separation everywhere; near a flight and in the seafront fade
they are split further where the ground bends. The player's ground height adds `siteY`. New code does not need
to know about heights unless it places things after the scene is built.

Cervantes no longer carries its own hump in `heights`; the ramp is in the ground.

## Not built yet

The photo survey of levels (`docs/LEVELS.md`, `data/levels_survey.json`) lists
every slope, step and raised patio seen so far and which task builds each.


- A ramp on Calle Eva towards the Picasso car park. Dave remembers one; no photo
  in the set shows it (IMG_2243 looks the other way, along a level lane to the
  middle pool gate).
- The master map does not show heights.

`scripts/check_terrain.py` samples the grid exactly as `siteY` does and checks the attribution,
level pools at their surveyed decks, the photographed flights and walkable lanes (no 2 m stretch
steeper than 15 % outside a flight). `scripts/check_levels.py` checks every built photo level
against it.
