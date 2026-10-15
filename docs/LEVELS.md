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
- **The west side is 0.5 m higher.** The rise shows at the Cervantes ramp and
  steps at Elena, and all along the west side of the middle pool courtyard: three
  stone steps and a ramp up to Calle Eva at the south-west corner (IMG_2333), and
  a short rise with white steps at the planter's north end (IMG_2332, IMG_2331).
  The raised planter holds back the upper ground. Both rises are built in the
  terrain and the south-west steps are built. The north-end steps and pergola gate
  are still to do (task `middle-pool-north-entrance`).
- **No second rise at Dalí.** Cervantes meets Pintor Dalí flush, at a tiled apron
  with a slot drain. Upper Cervantes is level, or any grade is under about 2%.
- **The pools are not sunk.** Each deck is level with its lawn, apart from a
  5-10 cm coping. The middle pool courtyard meets Calle Eva at the east gateway and the south lane with
  no step.
- **Raised terraces at the north pool.** At the north-west corner of the lawn a
  six-riser tiled stair with a handrail and a curved retaining wall climb about 1 m
  to a terrace in front of the houses (task `raised-terraces`). The north-side
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

## Using it when building

1. Find your area's items in the brief, or in the issue under **Levels from the
   photos**.
2. Build to the middle of the range unless a better photo narrows it, and quote
   the range in the feature's `trust`.
3. Ground changes go through `data/terrain.json`, as in `docs/TERRAIN.md`. Patios
   and terraces go through the raised-terrace module from task `raised-terraces`.
   Houses keep their floor at the ground height under their middle.
4. When the model matches, set the item's `model` to `built`, add a `compare` pair
   if it is a terrain change, and run `scripts/check_levels.py`.
