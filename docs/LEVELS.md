# Levels: what the photos show

On 15 October the Cervantes, Elena junction, Dalí exit, pool and paseo photos were
read for ground and floor levels. Every observation is in `data/levels_survey.json`,
with its height range, confidence, map position (where one could be judged),
photos, how the model stands, and the build task that owns it. Heights are read by
eye against tiles, risers, doors, the glass pool fence and sandstone courses. None
of it is measured.

`scripts/check_levels.py` validates the file. For items with a `compare` pair it
also measures the terrain rule against the photo range: an item marked `built` must
match, and the others are listed as work. Each area brief in `refs/areas/` has a
**Levels** section, and each issue that owns a level change has **Levels from the
photos**.

## What the photos say

- **Houses sit at lane level.** On Cervantes, Elena south and the pool lanes the
  house floors are at lane level, or one sill (0.1-0.15 m) above it. No flights of
  steps lead up to front doors. What is raised is the ground in front of some houses:
  walled patios and terraces, reached by one to six steps.
- **The west side is higher.** The rise shows at the Cervantes ramp and
  steps at Elena (0.6 m) and the two steps at Calle Alberto (0.27 m), and all along the west side of the middle pool courtyard: three
  stone steps and a ramp up to Calle Eva at the south-west corner (IMG_2333), and
  a short rise with white steps at the planter's north end (IMG_2332, IMG_2331).
  The raised planter holds back the upper ground. Photos read about 0.5 m; the laser
  survey shows the whole block falling about 3 m from Dalí to the main pool and the
  paseo, and the ground now follows it (`docs/TERRAIN.md`). Each photographed flight
  keeps its own exact rise in `data/terrain.json` `ramps`.
- **No second rise at Dalí.** Cervantes meets Pintor Dalí flush, at a tiled apron
  with a slot drain. Upper Cervantes is level, or any grade is under about 2%.
- **The pools are not sunk.** Each deck is level with its lawn, apart from a
  5-10 cm coping. The middle pool courtyard meets Calle Eva at the east gateway and the south lane with
  no step.
- **Raised terraces at the north pool.** At the north-west corner of the lawn a
  six-riser tiled stair with a handrail and a curved retaining wall climb about 1 m
  to a terrace in front of the houses (built: `docs/RAISED_TERRACES.md`). The north-side
  patios are 0.25-0.4 m up, behind plinth walls with one or two steps (task
  `north-pool-garden-walls`).
- **Junction door.** At the foot of the Cervantes drop, a garden door on the north
  side has two steps (about 0.45 m) back up to a patio at the upper level (task
  `cervantes-door-steps`).
- **The fall to the sea is at the seafront.** The south lawn stands about 1 m above
  the paseo; the wall drops to 0.5-0.8 m towards Dalí (built). From the paseo's
  timber edge the beach falls 1-2 m to the water.

## Not visible yet (photos wanted)

`photosWanted` in the survey lists the shots that would settle these:
- whether the south pool lawn is lower than the middle and north pools (the
  pools can't be seen from each other, so this needs photos along the lane between
  them)
- Cervantes east of Elena, towards Pintor Picasso, which no photo covers
- the exact place of the north pool stair
- the patio floors on the north side of upper Cervantes and the south-side front
  patios
- side-on views of patio walls with steps along the lanes

## Checked against the laser survey

`scripts/lidar_check.py report` measures each item's rise between its `compare` points on the
survey's 1 m ground model (docs/reviews/lidar-levels/measurements.json, `levelsSurvey`). The
ground itself comes from the survey (task `terrain-from-lidar`), so the model matches the survey
wherever the photos do.
- **Cervantes ramp and steps at Elena (settled 16 November 2026):** the old comparison points were
  3 m apart and did not span the drop, so they read 0.21 m. Sampled every 0.5 m along the lane, the
  survey is level at +0.53 m below the flight and +1.13-1.17 m above it: 0.6 m. The three riser faces
  measured against the 0.4 m tread tiles in full-size IMG_2286 are about 0.2 m each, which agrees;
  the 0.4-0.5 m first read by eye was low. Built at 0.6 m. Still open: the survey's drop is centred
  about 2 m west of the photo-placed flight (discrepancy `cervantes-elena-steps-position`).
- **Cervantes at Calle Alberto (new, 16 November 2026):** two steps beside a ramp just west of the
  crossing (IMG_2448, IMG_2449), where the survey drops 0.27 m from +0.54 to +0.27 m. Built
  (`data/cervantes_alberto_steps.json`).
- **Elena south** reads level in the photos; the survey has it falling about 0.35 m over 15 m to
  the middle pool gate, too gentle to see. The survey is built.

Along Cervantes as a whole the survey reads: +1.15-1.2 m from the Dalí exit to Elena, the 0.6 m
Elena drop, level at +0.53-0.57 m to Alberto, the 0.27 m Alberto drop, then level at +0.2-0.25 m
to the Picasso end. There are no other steps on the lane.

## Using it when building

1. Find your area's items in the brief, or in the issue under **Levels from the
   photos**.
2. Build to the middle of the range unless a better photo narrows it, and quote
   the range in the feature's `trust`.
3. Ground changes go through `scripts/lidar_check.py grid`, which writes
   `data/terrain.json` (`docs/TERRAIN.md`); a photographed flight is a `ramps` entry. Patios
   and terraces go through the raised-terrace module from task `raised-terraces`.
   Houses keep their floor at the ground height under their middle.
4. When the model matches, set the item's `model` to `built`, add a `compare` pair
   if it is a terrain change, and run `scripts/check_levels.py`.
